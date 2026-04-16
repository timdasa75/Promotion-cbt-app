# Promotion CBT App

Web-based CBT practice platform for Nigerian Federal Civil Service promotion preparation (directorate track).

## What This App Includes

- 10 core topic banks with subcategories
- Practice, Exam, and Review modes
- Cross-topic **Directorate Mock Exam** (premium)
- Dashboard insights (attempts, average score, streak, recommendations)
- Post-quiz analytics with traffic-light performance styling
- Keyboard shortcuts during quiz (A-D, arrows, Enter)
- Local and Firebase cloud authentication
- Profile sync status indicator with manual `Sync Now` action (when cloud progress sync is enabled)
- Admin panel (upgrade requests, overrides, user directory + user count)

## Quick Start (Local)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the runtime auth template:
   ```bash
   cp config/runtime-auth.example.js config/runtime-auth.js
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open:
   ```text
   http://127.0.0.1:5173/
   ```

## Build & Preview

```bash
npm run build
```

```bash
npm run preview
```

## Run Tests

```bash
npm run test:smoke
```

```bash
npm run test:unit
```

## Main User Flows

1. Login or register.
2. Open **Start Learning**.
3. Choose a topic or **Directorate Mock Exam**.
4. Select mode:
   - `Practice`: instant rationale/feedback.
   - `Exam`: timed session, no immediate reveal.
   - `Review`: pre-quiz study mode with answers visible.
5. Complete session and inspect results/insights.

Detailed user walkthrough:
- `docs/user-guide.md`
- `docs/admin-guide.md` (admin operations)

## Auth Modes

- `Local` mode:
  - Single-device storage in browser localStorage.
- `Cloud` mode (Firebase):
  - Multi-device login and profile-backed plan state.

Cloud setup guide:
- `docs/firebase-auth-setup.md`
- `workers/admin-bridge/README.md` (recommended free-tier admin bridge)

## Security Notes

- Never commit live Firebase credentials to git history.
- Inject `window.PROMOTION_CBT_AUTH` at runtime/deploy time, not in tracked source.
- Use `config/runtime-auth.js` for local/deploy-managed values (this file is git-ignored).
- Use `config/runtime-auth.example.js` as the template.
- If GitHub reports `Possible valid secrets detected`, rotate the key immediately and close the alert only after rotation.
- Restrict Firebase/Google API key usage by:
  - allowed referrers (your production domain only)
  - allowed APIs (Identity Toolkit + Secure Token + Firestore only, if used)
- The runtime config now includes a safeguards script that warns in the console when placeholder strings remain present; ensure deployment injects unique values before going live.
- A strict Content Security Policy meta tag now restricts scripts/connections to Firebase domains only. Keep the CSP in sync with any additional CDN domains you must allow.

## Plans and Access

- `Free`:
  - Limited topic/subtopic/question access.
- `Premium`:
  - Full topic access and mock exam access.
- `Admin`:
  - Premium-level access plus Admin panel controls.

## Admin Features

- Manual upgrade review queue
- Firestore-backed upgrade request history (`upgradeRequests` audit trail)
- Local plan overrides
- User directory with:
  - email, role, plan, status, created/last-seen
  - **live count** (`filtered/total`)

## Data and Maintenance

- Topic data lives in `data/*.json`
- Validation script:
  ```bash
  python scripts/validate_taxonomy.py
  ```
  Strict quality gate:
  ```bash
  python scripts/validate_taxonomy.py --strict-duplicates --strict-metadata
  ```
  Build SME metadata review queue:
  ```bash
  python scripts/build_metadata_review_queue.py
  ```
  Seed editable SME decisions from high-confidence queue:
  ```bash
  python scripts/seed_metadata_review_decisions.py
  ```
  Apply approved metadata decisions (dry-run):
  ```bash
  python scripts/apply_metadata_review_decisions.py --decisions-file docs/metadata_review_decisions.json
  ```
  Apply approved metadata decisions (write):
  ```bash
  python scripts/apply_metadata_review_decisions.py --decisions-file docs/metadata_review_decisions.json --apply
  ```
  Split decisions into topic packs and balanced reviewer bundles:
  ```bash
  python scripts/split_metadata_review_decisions.py --in-file docs/metadata_review_decisions.json --out-dir docs/metadata_review_batches --reviewers 4
  ```
  Optional: keep full topic blocks per reviewer:
  ```bash
  python scripts/split_metadata_review_decisions.py --in-file docs/metadata_review_decisions.json --out-dir docs/metadata_review_batches --reviewers 4 --keep-topic-blocks
  ```
  Merge reviewer packs and generate progress report:
  ```bash
  python scripts/merge_metadata_review_batches.py --batch-dir docs/metadata_review_batches/by_reviewer --out-file docs/metadata_review_decisions_merged.json --report-json docs/metadata_review_merge_report.json --report-md docs/metadata_review_merge_report.md
  ```
  Optional: overwrite master decisions file after conflict-free merge:
  ```bash
  python scripts/merge_metadata_review_batches.py --batch-dir docs/metadata_review_batches/by_reviewer --overwrite-master
  ```
- Refactor roadmap:
  - `docs/refactor-implementation-plan.md`

## Deployment Notes

- GitHub Pages-compatible static app
- Base path handling is included for `/Promotion-cbt-app`
- Deployment now uses GitHub Actions workflow: `.github/workflows/deploy-pages.yml`

### GitHub Pages Secret Injection (Required)

Set these repository secrets before deploying:
- `FIREBASE_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_AUTH_DOMAIN`
- `ADMIN_API_BASE_URL` (required for GitHub Pages without Blaze; set to your Cloudflare Worker URL)

Then in GitHub:
1. `Settings -> Pages -> Build and deployment -> Source: GitHub Actions`
2. Push to `main` (or run workflow manually).
3. Verify deployed site shows `Auth mode: Cloud (multi-device)`.

### Runtime Feature Flags (Rollout Controls)

Optional runtime keys in `window.PROMOTION_CBT_AUTH`:
- `enableCloudProgressSync`:
  - `false`: keep progress local-only.
  - `true`: allow cloud progress sync rollout (requires Firestore `progress/{uid}` rules). For GitHub Pages, this is now enabled by default.
- `adminApiBaseUrl`:
  - empty: use Firebase Cloud Functions endpoints.
  - set URL (recommended): route admin list/lookup/status/delete/verification actions to Cloudflare Worker admin bridge.

### Identity Toolkit admin operations (Recommendation)

- Preferred (free-tier): deploy `workers/admin-bridge/worker.js` on Cloudflare Workers and set `adminApiBaseUrl`.
- Keep Firebase function fallback available (`functions/index.js`) for `adminListUsers`, `adminLookupUsers`, `adminSetUserStatus`, `adminSendVerificationEmail`, `adminDeleteUserById`.
- Set `ADMIN_EMAILS` for Functions (comma-separated admin emails); admin access now fails closed if it is omitted.
- Set `ALLOWED_ORIGINS` for Functions (comma-separated browser origins) if you want the Firebase Functions fallback to reject unlisted or missing browser origins.
- Note: `adminSendVerificationEmail` no longer returns raw verification links. The Cloudflare Worker path requests Firebase Auth to send the email directly; the Firebase Functions fallback reports delivery as unavailable unless you add a server-side mail path.
- Keep `deleteAuthUserOnProfileDeletion` deployed too; it remains a safety net that cascades profile deletions to Firebase Auth.
- Run `cd functions && npm install` and `firebase deploy --only functions` only if you use the Firebase function fallback path.

If secrets are missing, deployment fails and the app shows:
- `Auth mode: Cloud required (runtime config missing)`

## License

MIT (see `LICENSE` if present in your distribution).
