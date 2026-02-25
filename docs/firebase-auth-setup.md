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

Admin note:
- Admin access in this app is email-based (`window.PROMOTION_CBT_ADMIN_EMAILS` + Firestore `isAdmin()` rule list).
- The admin email must exist in Firebase Authentication users; Firestore `profiles` document alone is not enough.
- If you don't want to register via the app UI, create the admin user in `Authentication -> Users -> Add user`, then mark email as verified.

## 10. What To Send Back For Migration

Share these values:
- `firebaseApiKey`
- `firebaseProjectId`
- `firebaseAuthDomain`

Then the app can run cloud auth directly on Firebase.

## References (Official Docs)

- Firebase Auth web start: `https://firebase.google.com/docs/auth/web/start`
- Firebase Auth limits: `https://firebase.google.com/docs/auth/limits`
- Passing state in email actions (authorized domains + localhost note): `https://firebase.google.com/docs/auth/web/passing-state-in-email-actions`
- Custom auth email domain: `https://firebase.google.com/docs/auth/email-custom-domain`
- Firestore rules conditions: `https://firebase.google.com/docs/firestore/security/rules-conditions`
- Security Rules + Auth claims: `https://firebase.google.com/docs/rules/rules-and-auth`
