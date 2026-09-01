# ClippNow Store Readiness

## Implemented in the repository

- Native Expo/React Native app shell for iOS/iPadOS and Android.
- Supabase Auth with SecureStore-backed session persistence.
- Bearer-authenticated mobile API contract.
- Private video storage under the authenticated user's ID.
- TUS resumable video uploads with 6 MB chunks.
- Project creation, render start, progress refresh, and signed output sharing.
- In-app permanent account deletion.
- Public privacy policy at `/privacy`.
- Public account deletion instructions at `/account-deletion`.
- Android target/compile SDK 36 configuration.
- EAS production build profiles.

## Still required before store submission

1. Add final 1024x1024 app icon PNG and platform store artwork. Expo production builds require a square PNG icon for the standard path.
2. Set production `EXPO_PUBLIC_SUPABASE_URL`, publishable key, and API base URL in EAS environment variables.
3. Configure EAS project ownership and Apple/Google signing credentials.
4. Configure App Store Connect and Google Play Console metadata, screenshots, age rating/content declarations, privacy declarations, and support/contact details.
5. For Apple, create the required App Store Connect app record and provide review credentials if the app requires login.
6. For Google Play, complete developer verification and the applicable Data Safety / account deletion declarations.
7. Decide the production billing model for native digital credits. Native purchases of digital goods must follow Apple and Google billing rules; the existing web Midtrans flow should not be copied into native purchase UI without policy review.
8. Run physical-device smoke tests on a recent iPhone/iPad and Android device, including large video upload, interrupted upload recovery, render polling, signed output sharing, logout, and account deletion.

## Build commands

```bash
cd mobile
npm install
npm run typecheck
npx expo start
npx eas build --platform all --profile production
```

Do not claim store-ready status until the remaining credential, asset, billing-policy, and physical-device checks above are completed.
