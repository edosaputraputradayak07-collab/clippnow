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
- Server authority: never grant credits from the client alone. The mobile client submits store purchase evidence to a server endpoint; the server verifies the transaction and performs an idempotent credit/entitlement grant.
- Idempotency key: platform + store transaction/purchase identifier.
- Restore/reconciliation: subscriptions and durable entitlements are restored from the store and reconciled against the server ledger; consumables are reconciled from the verified transaction ledger.
- Web payments remain separate: Midtrans can continue serving Indonesian web checkout, while native apps use the store billing path.

## Release sequence

1. Configure the product IDs above in App Store Connect and Google Play Console.
2. Configure localized prices and recurring billing terms for Indonesia first, then additional storefronts.
3. Add the purchase UI and purchase listeners to the native app.
4. Add server-side receipt/purchase verification and idempotent credit/entitlement granting.
5. Test with Apple Sandbox/TestFlight and Google Play internal testing.
6. Only then enable paid products in production.

`expo-iap` requires a development/production native build; Expo Go is not sufficient for IAP testing.
