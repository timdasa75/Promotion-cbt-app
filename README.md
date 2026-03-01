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
- Admin panel (upgrade requests, overrides, user directory + user count)

## Quick Start (Local)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a static server:
   ```bash
   python -m http.server 4173
   ```
3. Open:
   ```text
   http://127.0.0.1:4173/
   ```

## Run Tests

```bash
npm run test:smoke
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

Then in GitHub:
1. `Settings -> Pages -> Build and deployment -> Source: GitHub Actions`
2. Push to `main` (or run workflow manually).
3. Verify deployed site shows `Auth mode: Cloud (multi-device)`.

### Identity Toolkit admin operations (Recommendation)

- Deleting Firestore profiles now calls the Identity Toolkit `accounts:delete` API. That requires the Firebase project to expose an OAuth token with `https://www.googleapis.com/auth/identitytoolkit`.
- Provide the token via `config/runtime-auth.js` (or a workflow secret) by using a short-lived Google OAuth 2.0 token obtained from a service account with the `Cloud Identity` role. Store it outside the repo and rotate it regularly.
 - Deployments that use GitHub Actions can mint the token during the workflow (using `gcloud auth print-access-token --scope=https://www.googleapis.com/auth/identitytoolkit`) and place it in `config/runtime-auth.js` before publishing.

If secrets are missing, deployment fails and the app shows:
- `Auth mode: Cloud required (runtime config missing)`

## License

MIT (see `LICENSE` if present in your distribution).
