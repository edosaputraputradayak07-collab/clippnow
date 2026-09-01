# ClippNow Mobile API Contract

## Authentication

Native iOS/iPadOS and Android clients use Supabase Auth directly with the public publishable key. The mobile client owns the Supabase session and must keep session material in platform-secure storage.

For ClippNow API requests, send the current access token as:

```http
Authorization: Bearer <access-token>
```

Do not send access tokens, refresh tokens, Supabase secret keys, service-role keys, or payment credentials in query parameters or URLs.

The server validates the bearer token with Supabase Auth. Browser cookie sessions remain supported separately; browser state-changing routes continue to enforce same-origin checks, while authenticated bearer requests are intended for native clients.

## Session lifecycle

1. Native client signs in/signs up through the Supabase Auth SDK.
2. Supabase Auth refreshes the session through its normal refresh-token lifecycle.
3. Native API calls use the current access token in the `Authorization` header.
4. `GET /api/mobile/session` can be used to verify the authenticated API session.
5. Logout is performed through the native Supabase Auth SDK and local secure-session storage is cleared.
6. Access tokens are never accepted through query parameters.
7. Account deletion is not exposed by the mobile API yet. A production store release must add and verify an authenticated deletion flow that removes the user's projects, private media, credits/payment records according to retention policy, and Auth identity without exposing an admin credential to the client.

## Endpoints

| Method | Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| GET | `/api/mobile/session` | Validate the current bearer session and return minimal user identity | Bearer |
| GET | `/api/mobile/projects` | List the authenticated user's projects and safe render-job status | Bearer |
| POST | `/api/projects` | Create a project and reserve one credit; accepts browser cookie or bearer auth | Cookie or Bearer |
| GET | `/api/projects/:id` | Read one owned project and render-job status | Cookie or Bearer |
| POST | `/api/projects/:id/render` | Start/restart an owned render job | Cookie or Bearer |
| GET | `/api/projects/:id/signed-output` | Return a 5-minute signed URL for an owned completed output | Cookie or Bearer |

## Upload contract

Mobile clients should upload source video directly to the private `clippnow-videos` Supabase Storage bucket using the authenticated Supabase client. The object path must be scoped to the authenticated user's ID. The project API verifies that `source_path` starts with the authenticated user's ID before creating a render job.

The mobile client must not use the service-role/secret key for uploads or downloads.

## Project creation request

```json
{
  "name": "Podcast clip",
  "original_filename": "podcast.mp4",
  "source_path": "<user-id>/source/podcast.mp4",
  "format": "9:16",
  "start_seconds": 12.5,
  "end_seconds": 47.0
}
```

Response:

```json
{
  "project_id": "<uuid>",
  "job_id": "<uuid>",
  "credits_remaining": 2
}
```

## Status response

`GET /api/projects/:id` returns the owned project and safe job fields such as `status`, `progress`, `attempts`, timestamps, and diagnostic error codes/messages. Private storage paths are not intended to be displayed by mobile UI.

## Output authorization

`GET /api/projects/:id/signed-output` only succeeds for an authenticated owner when the project is completed and has a rendered output. The returned URL expires after 300 seconds. Mobile clients should not persist the signed URL as a permanent asset reference.

## Error conventions

- `401`: missing or invalid authentication.
- `403`: invalid browser origin for browser-only state-changing requests.
- `404`: resource is not owned by the authenticated user or does not exist.
- `409`: project state does not permit the requested operation.
- `402`: insufficient render credits.
- `429`: reserved for future rate-limit responses.
- `500`: unexpected server/provider failure; the client should show a safe retry message and never surface provider credentials or internal storage paths.
