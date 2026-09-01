# ClippNow Production Deployment

The web application is deployed from `main` to the Vercel project `clippnoww`.

## Web

- Production domain: `https://clippnoww.vercel.app`
- Production environment must contain the Supabase URL, publishable key, server secret, and payment secrets required by the existing web flows.
- For AI subtitle and viral editing, configure `OPENAI_API_KEY` as a **server-only** environment variable. Never expose it in `NEXT_PUBLIC_*` variables or client bundles.
- The AI endpoint requests speech transcription with word/segment timestamps for dynamic subtitle rendering.
- Never place `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, or payment secrets in client bundles.

## AI Viral Studio

The Creator Studio now supports an opt-in viral editing pass:

1. Upload a source video.
2. Create the project.
3. Run **Analisis & Subtitle AI**.
4. ClippNow transcribes speech, calculates a viral score, stores the edit plan, and generates timed ASS subtitles.
5. Render uses the stored plan to burn subtitles and apply the selected visual effects.

The existing private Supabase Storage bucket remains the source of truth for uploaded media. Large mobile uploads should continue using TUS/resumable uploads.

## Mobile

The mobile app lives in `mobile/` and uses Expo SDK 57. Production builds are intended to run through EAS Build with the production profile in `mobile/eas.json`.

Before submitting to stores, configure EAS project ownership, Apple/Google signing credentials, production environment variables, app icon assets, store metadata, privacy declarations, and native digital-purchase billing according to platform policy.
