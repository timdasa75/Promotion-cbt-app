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

## Required Vars

Set as Worker vars:

- `FIREBASE_PROJECT_ID`

Optional vars:

- `ALLOWED_ORIGINS` (comma-separated)
- `FIREBASE_QUOTA_PROJECT_ID`
- `ADMIN_EMAILS` (comma-separated)
- `SYNC_AUTH_DISABLED` (`true` or `false`)

## Deploy

1. Copy `wrangler.toml.example` to `wrangler.toml` and update values.
2. Set secrets:
   - `wrangler secret put FIREBASE_API_KEY`
   - `wrangler secret put GCP_SERVICE_ACCOUNT_EMAIL`
   - `wrangler secret put GCP_SERVICE_ACCOUNT_PRIVATE_KEY`
3. Deploy:
   - `wrangler deploy`
4. Set `adminApiBaseUrl` in Promotion CBT runtime config to your worker URL.

## Notes

- If `ALLOWED_ORIGINS` is set, non-listed browser origins are blocked.
- The worker verifies caller ID tokens and enforces email-based admin allowlist.
- FIREBASE_QUOTA_PROJECT_ID should only be set when you intentionally need x-goog-user-project billing semantics (and the service account has serviceUsage.services.use permission).`r`n- Keep service account scope minimal and rotate key material regularly.


