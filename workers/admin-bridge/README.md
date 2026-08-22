# Cloudflare Worker Admin Bridge

This worker provides free-tier-friendly admin operations for Promotion CBT without exposing privileged admin tokens in the browser. Use it to avoid Firebase Blaze requirements.

## Endpoints

The frontend calls these POST routes (all require Firebase ID token in `Authorization: Bearer <idToken>`):

- `/adminListUsers`
- `/adminLookupUsers`
- `/adminSendVerificationEmail`
- `/adminSetUserStatus`
- `/adminDeleteUserById`

## Required Secrets

Set in Worker secrets:

- `FIREBASE_API_KEY`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_SERVICE_ACCOUNT_PRIVATE_KEY`
- `ADMIN_EMAILS`

## Required Vars

Set as Worker vars:

- `FIREBASE_PROJECT_ID`

Optional vars:

- `ALLOWED_ORIGINS` (comma-separated)
- `FIREBASE_QUOTA_PROJECT_ID`
- `SYNC_AUTH_DISABLED` (`true` or `false`)

## Hybrid auth groundwork

These endpoints are now scaffolded for the Cloudflare-first migration path:

- `/auth/register`
- `/auth/login`
- `/auth/session`
- `/auth/logout`

Important:
- they require a future `AUTH_DB` D1 binding before they can serve live traffic
- they are not wired into the frontend yet
- Firebase remains the active auth provider until the hybrid rollout is switched on

## Legacy user bootstrap helper

If an existing Firebase user is blocked by Firebase login quotas during migration, you can seed a Cloudflare login for that known account directly into D1:

- `node ./scripts/bootstrap-legacy-user.mjs --email admin@example.com --password "<temporary-password>" --plan premium --role admin --verified true`

Notes:
- this runs `wrangler d1 execute AUTH_DB --remote` under the hood
- it marks the D1 user as `legacy_provider = firebase`
- use it only for accounts you intentionally control or have verified administratively

## Deploy

1. Copy `wrangler.toml.example` to `wrangler.toml` and update values.
2. Set secrets:
   - `wrangler secret put FIREBASE_API_KEY`
   - `wrangler secret put GCP_SERVICE_ACCOUNT_EMAIL`
   - `wrangler secret put GCP_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `wrangler secret put ADMIN_EMAILS`
3. Apply pending D1 migrations **before** deploying (new `feedback_submissions` columns
   like `question_preview`, `difficulty`, `client_info` are added via migrations):
   - `npx wrangler d1 migrations apply AUTH_DB --remote`
   - or apply a specific file: `npx wrangler d1 execute AUTH_DB --remote --file=migrations/0002_feedback_context_columns.sql`
   - Skipping this step causes every feedback submit to 500 (`no such column`) while
     the route health check still reports the route as healthy.
4. Deploy:
   - `wrangler deploy`
5. Set `adminApiBaseUrl` in Promotion CBT runtime config to your worker URL.

## Notes

- Configure `ALLOWED_ORIGINS` for production. Non-listed browser origins are blocked, and missing production origins no longer fall back to wildcard CORS.
- The worker verifies caller ID tokens and enforces an email-based admin allowlist from `ADMIN_EMAILS`.
- If `ADMIN_EMAILS` is empty or missing, admin routes fail closed.
- `/adminSendVerificationEmail` asks Firebase Auth to send the verification email and does not return raw links to the browser.
- FIREBASE_QUOTA_PROJECT_ID should only be set when you intentionally need x-goog-user-project billing semantics (and the service account has `serviceUsage.services.use` permission).
- Keep service account scope minimal and rotate key material regularly.

