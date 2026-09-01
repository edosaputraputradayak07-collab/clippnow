# ClippNow mobile billing

ClippNow's mobile app must use Apple In-App Purchase and Google Play Billing for digital credits/premium editing features sold inside the native apps. Apple requires IAP for unlocking digital functionality, and Google Play requires its billing system for digital goods/services.

## Implementation target

- Native library: `expo-iap` 5.4.1.
- Product model: consumable credit packs plus optional non-consumable/pro entitlement where appropriate.
- Server authority: never grant credits from the client alone. The mobile client submits the store purchase evidence to a server endpoint; the server verifies the transaction and performs an idempotent credit grant.
- Idempotency key: platform + store transaction/purchase identifier.
- Restore: implement restore/reconciliation for non-consumables and subscriptions; consumable purchases are reconciled from the server ledger.
- Web payments remain separate: Midtrans can continue serving web checkout, while native apps use store billing.

## Release sequence

1. Configure products in App Store Connect and Google Play Console.
2. Add the purchase UI and purchase listeners to the native app.
3. Add server-side receipt/purchase verification and idempotent credit granting.
4. Test with Apple Sandbox/TestFlight and Google Play internal testing.
5. Only then enable paid packs in production.

`expo-iap` requires a development/production native build; Expo Go is not sufficient for IAP testing.
