# ClippNow Production Deployment

The web application is deployed from `main` to the Vercel project `clippnoww`.

## Web

- Production domain: `https://clippnoww.vercel.app`
- Production environment must contain the Supabase URL, publishable key, server secret, and payment secrets required by the existing web flows.
- Never place `SUPABASE_SECRET_KEY` or payment secrets in client bundles.

## Mobile

The mobile app lives in `mobile/` and uses Expo SDK 57. Production builds are intended to run through EAS Build with the production profile in `mobile/eas.json`.

Before submitting to stores, configure EAS project ownership, Apple/Google signing credentials, production environment variables, app icon assets, store metadata, privacy declarations, and native digital-purchase billing according to platform policy.
