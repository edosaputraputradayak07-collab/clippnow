# ClippNow mobile billing

ClippNow's mobile app must use the store billing systems applicable to the user's storefront for digital subscriptions, credits, and premium editing features. Google Play requires Play Billing for digital goods/services unless a policy exception applies; Apple App Store review likewise requires the applicable Apple purchase mechanism for digital functionality.

## Implementation target

- Native library: `expo-iap` 5.4.1.
- Product IDs are centralized in `lib/billing/catalog.ts` so the web, backend, and native clients share one contract.
- Recurring plans:
  - `clippnow_creator_monthly` — Creator, 30 monthly credits + Creator features.
  - `clippnow_pro_monthly` — Pro, 100 monthly credits + Pro features.
- Optional consumables:
  - `clippnow_credits_30` — 30 credits.
  - `clippnow_credits_100` — 100 credits.
- These IDs are the intended contract only; they must be created, priced, localized, and activated in App Store Connect and Google Play Console before production purchases are enabled.
- Server authority: never grant credits from the client alone. The mobile client submits store purchase evidence to `/api/mobile/billing/verify`; the server verifies the transaction with IAPKit and performs an idempotent credit grant.
- The production server requires `IAPKIT_PUBLISHABLE_KEY` as a Vercel/Supabase server environment variable. Never put an IAPKit secret key in the mobile app.
- Idempotency key: server-derived SHA-256 of platform + verified purchase proof, stored in `native_purchase_transactions`.
- Restore/reconciliation: subscriptions and durable entitlements are restored from the store and reconciled against the server ledger; consumables are reconciled from the verified transaction ledger.
- Web payments remain separate: Midtrans can continue serving Indonesian web checkout, while native apps use the store billing path.

## Current implementation

1. Native purchase UI is present in `mobile/App.tsx`.
2. Store products are fetched from App Store / Google Play through `expo-iap`.
3. Purchase evidence is sent to the authenticated backend.
4. Backend verification is fail-closed when `IAPKIT_PUBLISHABLE_KEY` is missing.
5. Verified products are granted through a security-definer Supabase RPC with a unique purchase ledger, preventing double-crediting.
6. The app calls `finishTransaction` only after backend verification and credit fulfillment succeeds.
7. A restore flow replays available purchases through the same verification path.

## Release sequence

1. Configure the product IDs above in App Store Connect and Google Play Console.
2. Configure localized prices and recurring billing terms for Indonesia first, then additional storefronts.
3. Configure `IAPKIT_PUBLISHABLE_KEY` in production server environments and configure Apple/Google credentials in the IAPKit project.
4. Test with Apple Sandbox/TestFlight and Google Play internal testing on physical devices.
5. Add subscription lifecycle reconciliation/webhooks before enabling recurring plans at scale.
6. Only then enable paid products in production.

`expo-iap` requires a development/production native build; Expo Go is not sufficient for IAP testing.
