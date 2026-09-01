# ClippNow Security

ClippNow treats authentication, payments, private video storage, and credit accounting as server-controlled boundaries.

## Security rules

- Never commit Supabase secret keys, Midtrans server keys, JWT signing secrets, or other credentials.
- Browser code may use only the Supabase publishable key.
- Privileged Supabase operations stay in server-only code and protected database functions.
- User-owned records and storage paths must remain protected by RLS/storage policies.
- Payment webhooks must be signature-verified and idempotent before granting credits.
- State-changing browser APIs must enforce same-origin requests.
- Production responses must not expose provider error payloads or internal secrets.
- Keep GitHub account MFA enabled and protect the `main` branch with required reviews/checks before allowing direct pushes.
- Keep Vercel and Supabase team access limited to the minimum people required.
- Rotate credentials immediately if compromise is suspected.

## Incident response

If a credential may have leaked, revoke/rotate it first, then inspect deployment and database audit logs. Do not paste secrets into issues, chat, commits, or support requests.

For a suspected vulnerability, report it privately to the project owner rather than publishing exploit details.
