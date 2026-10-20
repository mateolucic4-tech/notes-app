import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

type Note = { id: string; content: string; created_at?: string };

export default function NotesScreen() {
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
    async function initialize() {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (active) setMessage(`Greška sesije: ${error.message}`);
        if (active) setLoading(false);
        return;
      }
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          if (active) setMessage(`Anonimna prijava nije uspjela: ${signInError.message}. Provjeri je li Anonymous Sign-Ins uključen u Supabaseu.`);
          if (active) setLoading(false);
          return;
        }
      }
      if (active) await loadNotes();
      if (active) setLoading(false);
    }
    initialize();
    return () => { active = false; };
  }, [loadNotes]);

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Moje bilješke</Text>
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
