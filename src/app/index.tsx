import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

type Note = { id: string; content: string; created_at?: string };

export default function NotesScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('id, content, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setMessage(`Ne mogu učitati bilješke: ${error.message}`);
      return;
    }
    setNotes((data ?? []) as Note[]);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthMessage(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setNotes([]);
      setMessage('');
      setLoading(!!next);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoading(true);
    loadNotes().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.user.id, loadNotes]);

  // Supabase password auth requires an email identity. This deterministic,
  // app-specific alias lets users sign in using only a username.
  // Email confirmation must be disabled for this prototype (see README).
  const loginEmail = (name: string) => `${name.toLowerCase()}@notes-app.example.com`;

  const submitAuth = async () => {
    const name = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(name)) {
      setAuthMessage('Username mora imati 3–24 znaka (a-z, 0-9, _).');
      return;
    }
    if (password.length < 8) {
      setAuthMessage('Password mora imati barem 8 znakova.');
      return;
    }
    setAuthBusy(true);
    setAuthMessage('');
    const email = loginEmail(name);
    const { data, error } = register
      ? await supabase.auth.signUp({ email, password, options: { data: { username: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMessage(error.message);
    else if (register && !data.session) setAuthMessage('Račun je kreiran, ali nije aktivan. Provjeri Supabase Email confirmation postavku.');
    setPassword('');
    setAuthBusy(false);
  };

  const saveNote = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setMessage('Prvo upiši tekst bilješke.');
      return;
    }
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('notes').insert({ content: trimmed });
    if (error) {
      setMessage(`Spremanje nije uspjelo: ${error.message}`);
    } else {
      setContent('');
      setMessage('Bilješka je spremljena.');
      await loadNotes();
    }
    setSaving(false);
  };

  if (authLoading) return <SafeAreaView style={styles.safe}><ActivityIndicator style={{ flex: 1 }} size="large" /></SafeAreaView>;

  if (!session) return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.title}>Notes App</Text>
        <Text style={styles.subtitle}>{register ? 'Napravi račun' : 'Prijavi se'} za pristup svojim bilješkama.</Text>
        <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" autoCorrect={false}
          value={username} onChangeText={setUsername} accessibilityLabel="Username" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry
          value={password} onChangeText={setPassword} accessibilityLabel="Password" />
        {!!authMessage && <Text style={styles.message}>{authMessage}</Text>}
        <Pressable style={[styles.button, authBusy && styles.disabled]} onPress={submitAuth} disabled={authBusy}>
          <Text style={styles.buttonText}>{authBusy ? 'Pričekaj...' : register ? 'Registriraj se' : 'Login'}</Text>
        </Pressable>
        <Pressable onPress={() => { setRegister(!register); setAuthMessage(''); }}>
          <Text style={[styles.subtitle, { textAlign: 'center', color: '#3157d5' }]}>
            {register ? 'Već imaš račun? Login' : 'Nemaš račun? Register'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={styles.title}>Moje bilješke</Text><Pressable onPress={() => supabase.auth.signOut()}><Text style={{ color: '#3157d5', fontWeight: '700' }}>Logout</Text></Pressable></View>
        <Text style={styles.subtitle}>Bilješke se spremaju u Supabase i ponovno učitavaju pri otvaranju aplikacije.</Text>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Upiši novu bilješku..."
          multiline
          textAlignVertical="top"
          accessibilityLabel="Tekst nove bilješke"
        />
        <Pressable style={[styles.button, saving && styles.disabled]} onPress={saveNote} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Spremanje...' : 'Spremi bilješku'}</Text>
        </Pressable>
        {!!message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.sectionTitle}>Spremljene bilješke</Text>
        {loading ? <ActivityIndicator size="large" /> : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={notes.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Još nema bilješki.</Text>}
            renderItem={({ item }) => <View style={styles.note}><Text style={styles.noteText}>{item.content}</Text></View>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7fb' },
  container: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, gap: 12 },
  title: { fontSize: 30, fontWeight: '700', color: '#172033' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#5b6475' },
  input: { minHeight: 110, borderWidth: 1, borderColor: '#cbd2df', borderRadius: 12, backgroundColor: '#fff', padding: 14, fontSize: 16 },
  button: { backgroundColor: '#3157d5', padding: 14, borderRadius: 12, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  message: { color: '#374151', lineHeight: 21 },
  sectionTitle: { marginTop: 12, fontSize: 21, fontWeight: '700', color: '#172033' },
  list: { gap: 10, paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#687386', padding: 20 },
  note: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e5ee', borderRadius: 12, padding: 15 },
  noteText: { fontSize: 16, lineHeight: 23, color: '#172033' },
});
