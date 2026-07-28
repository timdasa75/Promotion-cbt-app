# Selar Monthly Launch Plan

This plan documents the current Selar-first launch path for Promotion CBT Premium. The goal is to get one monthly payment flow working reliably before revisiting annual, bi-annual, Flutterwave, coupons, automation, or advanced checkout options.

## Current Decision

- Launch with Selar hosted checkout.
- Offer only one product for now: **Promotion CBT Premium - Monthly Access**.
- Monthly price: **N2,500**.
- Keep Flutterwave code dormant until business registration and payment verification are ready.
- Use manual admin approval after the buyer submits their Selar order reference in the app.

## Team Outcomes

By the end of this work, the team should have:

1. A published Selar monthly product.
2. The real Selar checkout/product URL configured in local runtime config and deployment runtime config.
3. A tested app flow where a signed-in user clicks monthly upgrade, opens Selar, returns to the app, submits the Selar reference, and an admin approves the account.
4. Google login verified on the deployment domain.
5. Admin access verified for configured admin emails.
6. A clean commit that does not include secrets or local-only runtime config.

## Roles

**Product/Admin Owner**

- Create and publish the Selar product.
- Confirm product copy, price, and access promise.
- Provide the final Selar monthly URL to the developer.
- Review test purchase evidence and approve/reject upgrade requests in the admin panel.

**Frontend Developer**

- Maintain the monthly-only UI.
- Configure runtime auth/payment values locally for testing.
- Verify Selar checkout opens from the pricing modal.
- Verify submitted Selar references appear in the admin queue.

**Auth/Backend Developer**

- Verify Google login client ID and authorized origins.
- Verify Worker/admin bridge settings.
- Confirm configured admin emails can see admin buttons and open the admin panel.
- Confirm no secret keys are committed.

**QA/Release Owner**

- Run verification commands.
- Perform browser smoke tests.
- Confirm deployment behavior after push.
- Document any launch blockers before release.

## Selar Product Setup

Create one Selar digital product with these values:

- Product name: `Promotion CBT Premium - Monthly Access`
- Product URL: `https://selar.com/wf55518829`
- Price: `N2,500`
- Product type: digital product, course, or hosted product page, depending on what Selar exposes in the dashboard.
- Product image: use `assets/selar/sized-exports/selar-product-image-1000x1000.png`
- Short description: `Monthly access to full Promotion CBT practice for Federal Civil Service promotion preparation.`
- Long description:

```text
Promotion CBT Premium gives serious candidates monthly access to the full practice experience: all core topics, mock exams, analytics, cloud sync, and focused revision tools.

Use it to prepare consistently for Federal Civil Service promotion exams with structured CBT practice and progress tracking.

After payment, return to the app and submit your Selar order reference from your profile page. Admin activation is reviewed manually.
```

- Custom checkout field, if Selar allows it: `Promotion CBT account email`
- Redirect URL, if Selar allows it: the deployed app URL, ideally opening the profile page or main app.
- Support note: `Use the same email you use in Promotion CBT so your premium access can be activated quickly.`

Do not imply official government affiliation. Avoid government crest, coat of arms, official seals, or claims that the app is endorsed by a government body.

## Branding Assets

Use these generated files:

- Main Selar product image: `assets/selar/sized-exports/selar-product-image-1000x1000.png`
- High-quality backup: `assets/selar/sized-exports/selar-product-image-1200x1200.png`
- Lightweight fallback: `assets/selar/sized-exports/selar-product-image-1000x1000.jpg`
- Social promo: `assets/selar/sized-exports/promo-social-square-1080x1080.png`
- WhatsApp promo: `assets/selar/sized-exports/promo-whatsapp-square-800x800.jpg`
- Wide promo banner: `assets/selar/sized-exports/promo-wide-banner-1600x600.png`

Selar guidance found during setup: product images should be at least `300 x 300`, preferably square to avoid cropping, and product image formats include PNG/JPG/JPEG/GIF.

## Runtime Configuration

The tracked template is `config/runtime-auth.example.js`. It should keep placeholder values only:

```js
paymentProvider: "selar",
selarCheckoutLinks: {
  default: "REPLACE_WITH_SELAR_MONTHLY_CHECKOUT_URL",
  monthly: "REPLACE_WITH_SELAR_MONTHLY_CHECKOUT_URL",
},
```

The real URL belongs in gitignored runtime config:

```js
paymentProvider: "selar",
selarCheckoutLinks: {
  default: "https://selar.com/wf55518829",
  monthly: "https://selar.com/wf55518829",
},
```

Never commit `config/runtime-auth.js` if it contains live Google, Firebase, admin, Worker, or payment values.

## App Flow To Verify

1. Start the app with `npm run dev`.
2. Sign in with Google or email/password.
3. Open a locked premium topic or click the upgrade button.
4. Open the pricing modal.
5. Confirm the modal shows only **Monthly Premium Access**.
6. Click **Pay Monthly on Selar**.
7. Confirm the Selar monthly URL opens in a new tab.
8. Return to the app profile screen.
9. Confirm billing cycle is set to **Monthly**.
10. Enter the Selar order reference and amount paid.
11. Submit the confirmation.
12. Log in as admin.
13. Confirm the request appears under **Selar Upgrade Requests**.
14. Approve the request.
15. Confirm the user receives premium access.

## Admin Access Checklist

- Runtime config includes the correct admin email in `adminEmails`.
- The admin email matches the signed-in Google/email account exactly after normalization.
- The admin button is visible after login.
- The admin panel opens without `Session is unavailable`.
- Feedback inbox failure does not block payment request review.
- Admin request status updates persist after refresh.

## Google Login Checklist

- Google OAuth client ID is configured in runtime auth config.
- Google Cloud Console includes the deployed origin in authorized JavaScript origins.
- Local origin is configured for testing if needed: `http://127.0.0.1:5500`.
- The browser console does not show `Google sign-in is not configured`.
- The login/register modal renders the Google sign-in button.
- Successful Google login creates or hydrates the user profile.

## Verification Commands

Run from repo root:

```powershell
node --check js\app.js
node --check js\auth.js
node --check js\authRuntime.js
node --check js\authGoogle.js
node --check js\validation.js
node --check tests\smoke.spec.js
npm run test:unit
npm run build
git diff --check
```

Focused browser smoke for the Selar flow:

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:PLAYWRIGHT_REUSE_SERVER = '1'
$env:PLAYWRIGHT_PORT = '5500'
.\node_modules\.bin\playwright.cmd test smoke.spec.js:89 --reporter=line --max-failures=1
```

If Playwright browser installation is missing, either install Chromium or use the local Chrome executable path above.

## Security Review Before Commit

Check for secrets before staging:

```powershell
rg -n "FLWSECK|sk_live|sk_test|PRIVATE KEY|BEGIN PRIVATE|TURNSTILE_SECRET|client_secret|AIza[0-9A-Za-z_-]{20,}|[0-9]{12}-[0-9a-z]+\.apps\.googleusercontent\.com" --glob "!config/runtime-auth.js" --glob "!dist/**" --glob "!node_modules/**"
```

Expected notes:

- Google OAuth client IDs are public identifiers, but still review where they are committed.
- Worker secret values must not be committed.
- Flutterwave secret keys must never be committed.
- `config/runtime-auth.js` must remain gitignored.

## Commit Scope

Before committing, review the dirty worktree carefully. Do not stage unrelated deletions or local tool changes without confirming they belong to this release.

Recommended commit scope:

- Selar monthly runtime helpers.
- Monthly-only pricing UI.
- Selar payment confirmation/profile/admin UI.
- Google login support.
- Validation fix for local browser modules.
- Tests covering monthly Selar checkout and admin access.
- Selar branding assets if the team wants them versioned.
- This launch plan.

Avoid staging:

- Live runtime credentials.
- Accidental local config changes.
- Unrelated tool settings deletion.
- Generated `dist/` unless the deployment process requires it.

Suggested commit message:

```text
Add Google login and Selar monthly upgrade flow
```

## Launch Blockers

Do not push/release until these are true:

- Real Selar monthly URL is configured outside tracked source.
- Google login works on the intended deployment domain.
- Admin account can approve a submitted Selar reference.
- Unit tests pass.
- Production build passes.
- Focused Selar browser smoke passes.
- Secret scan has no live secret findings.

## Later Enhancements

Revisit these after the monthly launch is stable:

- Annual and bi-annual Selar products.
- Automated Selar webhook or callback validation, if available and practical.
- Flutterwave activation after business registration.
- In-app receipt upload.
- Admin notifications for new Selar confirmations.
- Better deployment-domain redirect into the profile/payment confirmation section.
