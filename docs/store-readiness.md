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
- `expo-iap` 5.4.1 dependency for native digital-goods billing preparation.
- Native billing architecture documented in `docs/mobile-billing.md`.

## Still required before store submission

1. Add final 1024x1024 app icon PNG and platform store artwork. Expo production builds require a square PNG icon for the standard path.
2. Set production `EXPO_PUBLIC_SUPABASE_URL`, publishable key, and API base URL in EAS environment variables.
3. Configure EAS project ownership and Apple/Google signing credentials.
4. Configure App Store Connect and Google Play Console metadata, screenshots, age rating/content declarations, privacy declarations, and support/contact details.
5. For Apple, create the required App Store Connect app record and provide review credentials if the app requires login.
6. For Google Play, complete developer verification and the applicable Data Safety / account deletion declarations.
7. Finish native purchase UI, store product IDs, server-side purchase verification, and idempotent credit granting. Apple requires IAP for digital functionality/content, while Google Play requires Play Billing for digital goods/services. The web Midtrans flow must remain separate from native digital-goods checkout.
8. Run physical-device smoke tests on a recent iPhone/iPad and Android device, including large video upload, interrupted upload recovery, render polling, signed output sharing, logout, native purchase reconciliation, and account deletion.
9. Create production `.aab` and `.ipa` builds through EAS, test them through Google Play internal testing and TestFlight, then submit for review.

## Build commands

```bash
cd mobile
npm install
npm run typecheck
npx expo start
npx eas build --platform all --profile production
```

Do not claim store-ready status until the remaining credential, asset, billing-policy, native purchase, and physical-device checks above are completed.
