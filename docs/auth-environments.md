# Authentication environments

Production uses Cloudflare Worker authentication as its only login authority.
`allowFirebaseFallback` must remain `false` in the generated runtime config.
Firebase values may still be present for legacy document reads; they must not
enable Firebase sign-in as a silent fallback.

| Environment | Auth provider | Firebase sign-in fallback | Purpose |
| --- | --- | --- | --- |
| Local demo | local/demo | None | UI development without a remote account |
| Automated smoke test | Firebase fixture or Cloudflare fixture | None | Deterministic browser coverage |
| Production | Cloudflare | Disabled | Real registration, login, admin, and device recovery |

Legacy Firebase users must be migrated through the explicit password setup or
support workflow. Do not re-enable a broad fallback to resolve an individual
login problem; use the audited, one-time device-auth recovery grant instead.

## Production configuration requirements

- `CLOUDFLARE_AUTH_BASE_URL` is required by the Pages deployment workflow.
- `ALLOWED_ORIGINS` must contain exact browser origins. Wildcards and missing
  values fail closed in the Worker.
- Admin recovery requires a valid Cloudflare session and an allowlisted admin
  email. It expires after 15 minutes, is consumed once, and does not bypass a
  password login.
