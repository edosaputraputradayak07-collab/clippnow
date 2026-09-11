# ClippNow social login setup

The login page now uses Supabase OAuth for Google and Facebook and a Supabase Custom OAuth2 provider for TikTok.

## 1. Supabase URL configuration

In Supabase Auth URL Configuration, set:

- Site URL: `https://clippnoww.vercel.app`
- Redirect URL: `https://clippnoww.vercel.app/auth/callback`

For local development, also add `http://localhost:3000/auth/callback`.

## 2. Google

Enable Google under Supabase Auth Providers.

Google's authorized redirect URI must be:

`https://hwsoqzdqdqsgeswtsjih.supabase.co/auth/v1/callback`

Add the production site as an authorized JavaScript origin where Google requires it:

`https://clippnoww.vercel.app`

## 3. Facebook

Enable Facebook under Supabase Auth Providers.

Facebook's OAuth redirect/callback URL must be:

`https://hwsoqzdqdqsgeswtsjih.supabase.co/auth/v1/callback`

Use the Facebook App ID and App Secret from the Meta developer app.

## 4. TikTok

TikTok Login Kit uses OAuth 2.0. Create/enable a TikTok Login Kit web app and register this redirect URI in TikTok:

`https://hwsoqzdqdqsgeswtsjih.supabase.co/auth/v1/callback`

In Supabase Auth Providers, create a **Custom OAuth2** provider with:

- Identifier: `custom:tiktok`
- Name: `TikTok`
- Client ID: TikTok Client Key
- Client Secret: TikTok Client Secret
- Authorization URL: `https://www.tiktok.com/v2/auth/authorize/`
- Token URL: `https://open.tiktokapis.com/v2/oauth/token/`
- UserInfo URL: `https://clippnoww.vercel.app/api/auth/tiktok/userinfo`
- Scopes: `user.info.basic`
- Email optional: enabled
- PKCE: disabled for the web provider
- Provider: enabled

Supabase's custom OAuth provider callback URL is shown in its provider setup screen; it should match the TikTok redirect URI above.

The app's `/api/auth/tiktok/userinfo` route converts TikTok's `{ data: { user: ... } }` response into standard OAuth userinfo claims (`sub`, `name`, `picture`) so Supabase can create the identity without requiring TikTok to provide an email address.

## 5. Test order

1. Google button -> Google consent -> `/auth/callback` -> `/dashboard`
2. Facebook button -> Facebook consent -> `/auth/callback` -> `/dashboard`
3. TikTok button -> TikTok consent -> `/auth/callback` -> `/dashboard`
4. Email/password remains unchanged.

Do not put the TikTok client secret in frontend code or `NEXT_PUBLIC_*` environment variables.
