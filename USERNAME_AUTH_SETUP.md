# Username login setup (prototype)

This branch adds username + password registration, login, logout, and per-user notes.

## Supabase setup
1. In Supabase Dashboard > Authentication > Providers > Email, enable email/password sign-in.
2. **Disable Confirm email** for this prototype. The app maps each lowercase username to a synthetic email alias ending in `@notes-app.example.com`, so no confirmation emails can be received.
3. In SQL Editor, run `notes-app-starter/supabase-notes.sql` to enable notes row-level security.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your local `.env` (never commit secret/service-role keys).
5. Run `npm install` then `npm start`.

## Important limitations
- This username-only approach is suitable for a **prototype**, not production: there is no verified email address, password reset or account recovery.
- For a real public app, use verified email + password with username as a profile field, or build a secure server-side username-to-identity flow.
- Supabase Auth stores password hashes, not plaintext passwords in your app's database.
- Existing anonymous notes are not automatically migrated to newly registered accounts.
- Make sure Supabase Authentication rate limits and anti-abuse protections are configured before public launch.
