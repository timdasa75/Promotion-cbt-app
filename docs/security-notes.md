# Security Notes

## Accepted Alerts

- Date: 2026-04-27
- Scope: `functions` package only (`d:\MyApps\promotion-cbt\Promotion-cbt-app\functions\package-lock.json`)
- Current direct dependency baseline:
  - `firebase-admin` `^13.8.0` resolved to `13.9.0`
  - `firebase-functions` `^7.2.5`
- Main app status:
  - root app dependency audit has been cleaned separately
  - remaining GitHub Dependabot alerts are limited to the Functions dependency tree

### Latest remediation pass

- Date: 2026-05-09
- Refreshed `functions/package-lock.json` with `npm audit fix`.
- Resolved the high-severity `fast-xml-builder` alert by moving the lockfile from `1.1.5` to `1.2.0`.
- Resolved the moderate `uuid` alert by moving the lockfile from `11.1.0` to `11.1.1`.
- Re-ran the Functions package audit and confirmed:
  - `high`: `0`
  - `moderate`: `0`
  - `low`: `9`

### Remaining reviewed alerts

1. `@tootallnate/once` - low

### Why they remain

- The remaining alerts are transitive dependencies pulled in by the Firebase / Google SDK chain used by the Functions package.
- We already applied the safe non-breaking updates available at this layer:
  - upgraded `firebase-admin`
  - upgraded `firebase-functions`
  - refreshed the lockfile with `npm audit fix`
- GitHub re-analysis confirmed that the previously higher-severity alerts tied to older resolved versions (for example `node-forge`, `protobufjs`, `fast-xml-parser`, `flatted`, and `path-to-regexp`) were cleared after the lockfile update.
- The remaining low-severity chain is still pinned under upstream dependency ranges, and `npm audit fix --force` proposes a major Firebase downgrade (`firebase-admin@10.3.0` / `firebase-functions@4.9.0`), so forcing that change would be higher risk than the benefit currently justifies.

### Review rationale

- We are intentionally keeping the current Firebase Functions stack for compatibility and support.
- The remaining alerts are:
  - lower severity than the issues already remediated
  - not introduced by application code directly
  - dependent on upstream SDK dependency movement
- Plan:
  - monitor the next `firebase-admin` / `firebase-functions` / Google SDK releases
  - re-run Functions package audit after each dependency bump
  - remove this note once upstream transitive fixes land cleanly

## Protected Content Delivery

- Date: 2026-04-28
- Goal: stop shipping the full premium question bank inside the public frontend build.

### What changed

- `vite.config.js` now copies only public-safe metadata:
  - `data/topics.json`
  - `data/exam_templates.json`
  - `data/gl_band_weights.json`
- The full topic banks are no longer copied into `dist/data`, and the private bank JSON files are now intentionally kept out of the public repo.
- `workers/admin-bridge/worker.js` now exposes a protected `POST /content/topic-data` route.
- `workers/admin-bridge/wrangler.toml` binds `../../data` as private Worker assets under `PROTECTED_CONTENT`.
- `js/topicSources.js` now loads topic banks through the Worker instead of direct public file fetches.

### Why the split matters

- `topics.json` is lightweight catalogue metadata and is safe to keep public.
- The large topic-bank JSON files are the sensitive assets, because they contain the full question corpus.
- By moving those files behind authenticated Worker requests, plan checks now happen before the browser receives topic-bank content.

### Current entitlement enforcement

- Free users:
  - first `3` study topics
  - first `5` subcategories per topic
  - first `20` questions per subcategory
- Premium/admin users:
  - full topic-bank access

### Important limitation

- This reduces browser-side scraping significantly, but it does not erase previously published source files from old git history.
- If source secrecy is also a goal, the repo itself should be made private only after hosting is moved away from GitHub Pages or upgraded to a plan that supports private-repo Pages.

## Private Topic-Bank Source Assets

- Date: 2026-04-29
- Goal: keep the full question-bank source files available for local Worker deployments without publishing them in the public repository.

### What changed

- The full topic-bank JSON files under `data/` are no longer tracked by git.
- They remain on disk locally and are still read by:
  - the Worker private asset binding in `workers/admin-bridge/wrangler.toml`
  - local maintenance/import scripts that operate on the question bank
- `.gitignore` now keeps these files private by default while allowing only the public-safe metadata files to remain tracked:
  - `data/topics.json`
  - `data/exam_templates.json`
  - `data/gl_band_weights.json`

### Operational note

- A fresh clone of the public repo will not include the private topic-bank JSON files.
- To deploy or maintain the protected content route locally, you must restore those bank files into `data/` from your private copy before running Worker deploys or content-maintenance scripts.

## Private Root-Level Source Artifacts

- Date: 2026-04-29
- Goal: stop publishing the original source PDF/DOCX materials in the public repository while preserving local maintenance workflows.

### What changed

- The following root-level source artifacts are no longer tracked by git:
  - `Promotion  Exams CBT Questions.pdf`
  - `CONSOLIDATED QUESTION BANK REPORT.docx`
- They remain on disk locally and can still be used by maintenance/import scripts that reference them directly.
- `.gitignore` now keeps these files private by default.

### Operational note

- A fresh public clone will not include these root-level source artifacts.
- If you need to run the extraction/import scripts that depend on them, restore your private local copies into the repo root first.


## Auth System Assessment (2026-08-08)

A full audit of the auth surface (client `js/auth*.js` + Cloudflare Worker `workers/admin-bridge/`) was run. Findings and resolutions:

### Resolved in this pass

1. **Client-side plan override no longer applies to cloud sessions** (`js/auth.js`).
   - Before: `applyPlanOverrideForEmail` was applied to Firebase and Cloudflare sessions, so a free user editing `cbt_plan_overrides_v1` in localStorage could claim premium client-side (bypassing client-gated limits such as the weekly free mock exam).
   - After: cloud sessions return the server-authoritative plan directly. Local overrides still work for `local` demo sessions only, preserving the admin testing affordance.
   - Server-side protected content was already enforced in the Worker; this closes the client-side bypass.

2. **Admin delete / suspend now mirrors into Cloudflare auth** (`workers/admin-bridge/worker.js`).
   - Before: `adminDeleteUserById` only removed the Firebase account and profile; the Cloudflare `auth_users` row and its sessions stayed valid, so a "deleted" user kept working with a Cloudflare session. `adminSetUserStatus` never updated `auth_users.status`, so a suspended user's Cloudflare sessions stayed active.
   - After: delete purges the Cloudflare user, sessions, and email tokens (matched by id or `legacy_user_id`); status change updates `auth_users.status` (id or `legacy_user_id`) so Cloudflare sessions are rejected too.

3. **Password recovery is no longer a silent no-op** (`workers/admin-bridge/worker.js`).
   - Before: the recovery route only wrote an audit log and returned "recovery instructions will follow shortly" — but the Worker has **no email sender integration**, so Cloudflare-mode users were told instructions were on the way that never came.
   - After: when `AUTH_PASSWORD_RECOVERY_SENDER=true` is not set, the route returns an honest "contact an administrator" message. A real sender can be wired later behind that flag.

4. **Recovery endpoint is now rate-limited** (`workers/admin-bridge/worker.js` + `auth-hybrid.js`).
   - The `RECOVERY_IP` bucket (3 attempts / 15 min) was defined but never applied. `handleAuthPasswordRecoveryRequest` now enforces it per `CF-Connecting-IP` (429), and `checkRateLimit` is exported for reuse.

5. **Google login honors `email_verified`** (`workers/admin-bridge/auth-hybrid.js`).
   - Before: any successful Google login force-marked the account `email_verified = 1`.
   - After: only a Google ID token with `email_verified: true` auto-verifies the account; unverified Google emails stay unverified (and new accounts are stored accordingly).

6. **Feedback upsert no longer accepts a client-controlled id** (`workers/admin-bridge/worker.js`).
   - Before: `feedbackId` came from the request body and the `ON CONFLICT` upsert could overwrite another user's row content.
   - After: the id is always generated server-side, and the upsert is guarded with `WHERE feedback_submissions.user_id = excluded.user_id` so a row can only ever be updated by its owner.

7. **Password minimum aligned to 8** (`js/authCloudLifecycle.js`).
   - The client Firebase path allowed 6-char passwords while the Worker (`hashPassword`) enforces 8. A Firebase user with a 6-char password could never complete Cloudflare migration. Both paths now require 8+.

### Known remaining gaps (accepted / tracked)

- **No email sender in the Worker**: Cloudflare-mode email verification and password recovery both depend on a sender that does not exist yet. Until `AUTH_PASSWORD_RECOVERY_SENDER` is backed by a real integration (Resend / SendGrid / Workers Email), Cloudflare-only deployments must rely on admin-issued migration/reset links for account recovery.
- **Unreachable client-direct Identity Toolkit helpers**: `deleteFirebaseAuthUserById`, `listProjectAccountsByAccessToken`, `lookupProjectAccountsByEmails`, `sendProjectScopedOobCode` in `js/auth.js` are dead code (no callers). They send the *user's* idToken to Identity Toolkit admin endpoints and must not be wired up; admin operations should continue to go through the Worker (`verifyAdminCaller`). Remove them in a future cleanup pass.
- **CORS default**: `resolveAllowedOrigin` falls back to `*` when `ALLOWED_ORIGINS` is unset. Bearer-token auth limits the practical risk, but production should set `ALLOWED_ORIGINS` to the site origin(s).
- **Turnstile is optional**: `validateTurnstile` skips verification when `TURNSTILE_SECRET_KEY` is unset. Rate limits partially compensate; enable Turnstile for public registration in production.
