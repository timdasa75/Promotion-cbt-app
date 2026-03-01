# Firebase Auth + Firestore Setup Guide (Web)

This guide is tuned for the current Firebase console flow and Promotion CBT cloud auth/profile sync.

## 1. Create Firebase Project

1. Open `https://console.firebase.google.com/`.
2. Create a project (or use an existing one).
3. In `Project settings`, note:
   - `Project ID`

## 2. Add a Web App

1. In the Firebase project, click `Add app` -> `Web`.
2. Register the app (Hosting can be skipped for now).
3. Copy these web config values:
   - `apiKey`
   - `authDomain`
   - `projectId`

Security:
- Treat leaked API keys as compromised and rotate them.
- Do not commit live keys into git-tracked files.
- Restrict key usage in Google Cloud Console (HTTP referrers + API restrictions).

## 3. Enable Email/Password Auth

1. Go to `Build -> Authentication -> Sign-in method`.
2. Enable `Email/Password`.
3. Go to `Authentication -> Settings -> Authorized domains`.
4. Ensure these domains are present:
   - `localhost` (dev only)
   - `127.0.0.1` (dev only)
   - production domain (for example `timdasa75.github.io`)

Important:
- For projects created after **April 28, 2025**, `localhost` is not auto-added.
- Avoid leaving `localhost` authorized in production-only projects.

## 4. Configure Auth Email Templates

Go to `Authentication -> Templates`:
1. Update verification and password-reset templates.
2. Set sender name and email content to your app branding.
3. Optionally configure a custom domain for auth emails.

## 5. Enable Firestore

1. Go to `Build -> Firestore Database`.
2. Create database in `Production mode`.
3. Choose the nearest region for users.

## 6. Create `profiles` Collection Model

Use Firestore collection: `profiles`  
Use document id: Firebase Auth `uid`

Recommended fields:
- `email` (string, lowercase)
- `name` (string)
- `plan` (string: `free` or `premium`)
- `role` (string: `user` or `admin`)
- `status` (string: `active` or `suspended`)
- `createdAt` (timestamp)
- `lastSeenAt` (timestamp)
- `upgradeRequestId` (string, latest request id)
- `upgradeRequestStatus` (string: `none` or `pending` or `approved` or `rejected`)
- `upgradePaymentReference` (string)
- `upgradeAmountPaid` (string)
- `upgradeRequestNote` (string)
- `upgradeRequestedAt` (string ISO datetime)
- `upgradeReviewedAt` (string ISO datetime)
- `upgradeReviewedBy` (string, lowercase email)
- `upgradeRequestReviewNote` (string)

For full record retention, also use collection: `upgradeRequests`  
Use document id: generated request id (for example `req_...`)

Recommended `upgradeRequests` fields:
- `requestId` (string)
- `userId` (string, Firebase Auth uid)
- `email` (string, lowercase)
- `status` (string: `pending` or `approved` or `rejected`)
- `paymentReference` (string)
- `amountPaid` (string)
- `note` (string)
- `submittedAt` (string ISO datetime)
- `reviewedAt` (string ISO datetime)
- `reviewedBy` (string, lowercase email)
- `reviewNote` (string)

## 7. Firestore Security Rules (Starter)

Set rules in `Firestore Database -> Rules`:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email != null
        && request.auth.token.email in [
          "timdasa75@gmail.com"
        ];
    }

    match /profiles/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());

      allow create: if isSignedIn()
        && request.auth.uid == userId
        && request.auth.token.email != null
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.plan in ["free", "premium"]
        && request.resource.data.role in ["user", "admin"]
        && request.resource.data.status in ["active", "suspended"];

      allow update: if isSignedIn() && (
        isAdmin() ||
        (
          request.auth.uid == userId
          && request.resource.data.email == resource.data.email
          && request.resource.data.plan == resource.data.plan
          && request.resource.data.role == resource.data.role
          && request.resource.data.status == resource.data.status
          && request.resource.data.createdAt == resource.data.createdAt
        )
      );

      allow delete: if isAdmin();
    }

    match /upgradeRequests/{requestId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);

      allow create: if isAdmin() || (
        isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && request.auth.token.email != null
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.status == "pending"
      );

      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

Note:
- This starter blocks normal users from self-upgrading `plan`/`role`/`status`.
- If you later move admin checks to custom claims, update `isAdmin()` accordingly.

## 8. Spark Limits Relevant To This App

Common Firebase Auth Spark limits (check live docs before launch):
- Verification emails: `1000/day`
- Password reset emails: `150/day`
- New account creation: `100/hour/IP`
- DAU for most providers on Spark: `3000/day`

## 9. App Config Snippet (`index.html`)

Use Firebase config keys in `window.PROMOTION_CBT_AUTH`:

```html
window.PROMOTION_CBT_AUTH = {
  firebaseApiKey: "YOUR_FIREBASE_API_KEY",
  firebaseProjectId: "YOUR_FIREBASE_PROJECT_ID",
  firebaseAuthDomain: "YOUR_FIREBASE_AUTH_DOMAIN"
};
```

Recommended for this repo:
- Put live values in `config/runtime-auth.js` (git-ignored).
- Start from `config/runtime-auth.example.js`.
- Keep tracked files free of live keys.
- For GitHub Pages, use repo secrets and deployment-time generation (see section 11).

Admin note:
- Admin access in this app is email-based (`window.PROMOTION_CBT_ADMIN_EMAILS` + Firestore `isAdmin()` rule list).
- The admin email must exist in Firebase Authentication users; Firestore `profiles` document alone is not enough.
- If you don't want to register via the app UI, create the admin user in `Authentication -> Users -> Add user`, then mark email as verified.

Operational recommendation:
- Keep real Firebase config in a deployment-managed script or environment injection step, not directly in repo source.

### Identity Toolkit admin operations

- Deleting a Firestore `profiles` document requires the same session to delete the Firebase Auth account via the Identity Toolkit `accounts:delete` endpoint. That API must be called with an OAuth token scoped to `https://www.googleapis.com/auth/identitytoolkit`.
- Mint a short-lived service account token during your GitHub Actions deployment (e.g., `gcloud auth print-access-token --scope=https://www.googleapis.com/auth/identitytoolkit`) and wire it into `config/runtime-auth.js` or an equivalent runtime-injected script.

### Content Security Policy guidance

- Keep the CSP meta tag aligned with the domains mentioned above; if you add any new CDN domains, update the policy accordingly. Example header (already present in `index.html`):
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' https://www.gstatic.com https://www.googleapis.com https://identitytoolkit.googleapis.com; connect-src 'self' https://www.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self';
  ```

### Deployment hardening checklist

- Rotate Firebase API keys/project credentials before each production deploy and document the rotations.  
- Restrict API key usage to the production domain and just the necessary APIs (Identity Toolkit, Secure Token, Firestore).  
- Publish and emulate the security rules above so admin operations still succeed in CI.  
- Confirm the placeholder detector (see `index.html`) logs a warning before a release if any `REPLACE`, `PROMOTION`, or `ADMIN` substrings remain.  
- Validate the CSP meta tag any time you add external domains (fonts, analytics, etc.) and re-run the `npx csp-evaluator` if you extend the policy.

## 10. What To Send Back For Migration

Share these values:
- `firebaseApiKey`
- `firebaseProjectId`
- `firebaseAuthDomain`

Then the app can run cloud auth directly on Firebase.

## 11. GitHub Pages Secure Deployment (No Keys In Git)

This repo includes workflow: `.github/workflows/deploy-pages.yml`

1. In GitHub repo, open `Settings -> Secrets and variables -> Actions`.
2. Add repository secrets:
   - `FIREBASE_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_AUTH_DOMAIN`
3. Open `Settings -> Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Push to `main` (or run workflow manually).
6. Confirm deployed app auth label reads `Auth mode: Cloud (multi-device)`.

Safety behavior:
- If any required secret is missing, deploy workflow fails fast.
- On production host, app blocks auth and shows `Cloud required (runtime config missing)` instead of silently using local auth.

## References (Official Docs)

- Firebase Auth web start: `https://firebase.google.com/docs/auth/web/start`
- Firebase Auth limits: `https://firebase.google.com/docs/auth/limits`
- Passing state in email actions (authorized domains + localhost note): `https://firebase.google.com/docs/auth/web/passing-state-in-email-actions`
- Custom auth email domain: `https://firebase.google.com/docs/auth/email-custom-domain`
- Firestore rules conditions: `https://firebase.google.com/docs/firestore/security/rules-conditions`
- Security Rules + Auth claims: `https://firebase.google.com/docs/rules/rules-and-auth`
