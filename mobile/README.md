# ClippNow Mobile

Expo/React Native client for iOS, iPadOS, and Android.

## Configuration

Create `mobile/.env` from the following values:

```text
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
EXPO_PUBLIC_API_BASE_URL=https://clippnoww.vercel.app
```

Only the Supabase publishable key belongs in the app. Never put `SUPABASE_SECRET_KEY`, Midtrans secrets, database passwords, or other server credentials in the mobile bundle.

## Development

```bash
cd mobile
npm install
npm run typecheck
npx expo start
```

For native development builds:

```bash
npx expo run:android
npx expo run:ios
```

For EAS builds:

```bash
eas build --platform all --profile production
```

## Authentication

Supabase Auth manages sign-in, refresh, and logout. Session data is persisted through a SecureStore-backed chunked adapter so individual secure-storage values remain small enough for platform limits. Native API requests send the current access token only through `Authorization: Bearer ...`.

## Video workflow

1. Pick a video from the device library.
2. Upload it into the private `clippnow-videos` bucket under the authenticated user's ID using Supabase TUS resumable upload with 6 MB chunks.
3. Create a project through `/api/projects`.
4. Start rendering through `/api/projects/:id/render`.
5. Refresh `/api/mobile/projects` for render progress.
6. Request a short-lived signed output URL when rendering completes.

## Account deletion

The app exposes a permanent account deletion action. The server authenticates the bearer session, removes the user's Storage objects through the Storage API, deletes the Auth user with the server-only admin client, and relies on database foreign-key cascades for user-owned application data. Payment records are retained with the user link nulled for transaction-history purposes.
