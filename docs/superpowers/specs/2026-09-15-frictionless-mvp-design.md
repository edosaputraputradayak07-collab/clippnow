# Frictionless MVP Design

**Date:** 2026-09-15

## Goal
Build a mobile-first MVP whose primary conversion path is: **Buka → Coba Gratis → Hasil → Simpan/Download → Login saat diperlukan → Upgrade/Beli**.

## Product principles
- No login wall on first visit.
- One core action is the product; avoid secondary features in MVP.
- User experiences useful output before being asked to register or pay.
- Registration is triggered by a meaningful need such as saving history or continuing after the free allowance.
- The interface must be fast, obvious, and usable on a phone.

## User flow
1. Visitor opens the app.
2. Landing screen explains the single core benefit and exposes **Coba Gratis** as the primary CTA.
3. Visitor uses the core function without an account, subject to a small anonymous free allowance (target 1–3 uses).
4. App processes the request and shows the result.
5. Result screen offers the next value action (save/download) and a clear upgrade CTA.
6. If persistent storage/history is required, prompt the visitor to sign in with Google; email/password is not required for the first MVP.
7. When the free allowance is exhausted, show pricing/upgrade rather than forcing an account before the user has seen value.

## MVP boundaries
### In scope
- Landing/home screen.
- One core tool/action.
- Anonymous free-use tracking.
- Result state.
- Save/download affordance where technically supported by the core tool.
- Google sign-in as the low-friction persistent identity option.
- Simple upgrade/pricing state, with payment integration kept behind a clear interface until the payment provider is selected.
- Responsive/mobile-first styling.
- Basic error, loading, empty, and rate-limit states.

### Out of scope
- Multiple tools.
- Social login through TikTok/Facebook in the first release.
- Full profile management.
- Complex dashboard.
- Subscription management beyond the minimum upgrade entry point.
- Rebuilding the old ClippNow/Vidklipral functionality.

## Architecture
Use the existing Next.js app as a clean shell. Keep the product UI in small components and isolate anonymous usage, authentication, and future billing behind simple server/client interfaces so the first release does not depend on a payment provider. Supabase remains the persistence/auth option already provisioned for the project, but the initial anonymous experience must work without auth.

## UX requirements
- Primary CTA copy: **Coba Gratis**.
- Avoid login/register buttons as the dominant first-screen action.
- Show progress during processing.
- Show the result before monetization pressure.
- Use one primary CTA per state.
- Keep copy in Indonesian.
- Design for narrow mobile screens first, then scale up.

## Success criteria
A new visitor can open the site, understand what it does, start the core action without registering, reach a meaningful result, and understand the next action. A visitor who wants persistence can authenticate without being forced through an email/password flow.

## Technical acceptance criteria
- `npm run build` succeeds.
- `npm test` succeeds once tests are added.
- No legacy ClippNow/Vidklipral application code is reintroduced.
- No secrets are committed.
- Anonymous users are not blocked by Supabase authentication.
- Auth/persistence failures degrade gracefully instead of breaking the core trial flow.
