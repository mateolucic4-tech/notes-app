# Notes App — Expo + Supabase

A small Expo Router screen that anonymously signs in, saves notes to Supabase, and reloads the current user's notes.

## 1. Add files to your Expo project

Copy `src/app/index.tsx` and `src/lib/supabase.ts` into the matching locations in your existing Expo project. Keep your existing `src/app/_layout.tsx` and `package.json`.

## 2. Install dependencies

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

## 3. Configure Supabase

- In Supabase Authentication settings, enable Anonymous Sign-Ins.
- In SQL Editor, run `supabase-notes.sql` once.
- Find the project URL and publishable key in the Supabase project settings.
- Copy `.env.example` to `.env` and fill in the actual values.
- Never use a `service_role` or secret key in a client app.

## 4. Run

```bash
npx expo start --web
```

If environment variables were changed while Expo was running, stop the server and restart it.

## 5. GitHub safety

Upload source files and configuration, but do not upload `.env`, `node_modules`, `.expo`, or `.git`. Include `.env.example` instead.

## Notes

Anonymous sessions are associated with the browser/device's local storage. Clearing browser storage or switching browsers/devices can create a different anonymous user, so those notes won't automatically follow the user to the new session. This version supports adding and reading notes only.
