# Selar Monthly Launch Plan

This plan documents the current Selar-first launch path for Promotion CBT Premium. The goal is to get one monthly payment flow working reliably before revisiting annual, bi-annual, Flutterwave, coupons, automation, or advanced checkout options.

## Current Decision

- Launch with Selar hosted checkout.
- Offer only one product for now: **Promotion CBT Premium - Monthly Access**.
- Monthly price: **N2,500**.
- Keep Flutterwave code dormant until business registration and payment verification are ready.
- Automate premium grants via the **Zapier bridge** (confirmed path): Selar's
  "New Sale" trigger pushes to the Worker's `/payment/webhook/selar` behind
  `SELAR_WEBHOOK_SECRET`, and the Worker grants premium without admin action.
  The legacy `SELAR_API_KEY` polling path is **discontinued** — Selar support
  confirmed (2026-08) there is no order-lookup API and no direct webhook
  support. Submissions still fall back to manual admin review when a sale is
  unmatched.

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

After payment, return to the app and submit your Selar order reference from your profile page. Premium is activated automatically when the payment is confirmed; otherwise it is reviewed and activated by an admin.
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

## Selar API Key (SELAR_API_KEY) — Ops Note

`SELAR_API_KEY` is a Cloudflare Worker secret used by `/payment/selar/verify`. The
Worker calls Selar's merchant API (`api.selar.co/v2/orders`, canonical host
`api.selar.com/v2`) with `Authorization: Bearer <SELAR_API_KEY>` to confirm a
submitted order reference before auto-granting premium. **Without the key the
feature degrades gracefully** (submissions fall back to manual admin review), so
missing or broken keys never lose a payment — they only pause automation.

### Obtaining the key (probed 2026-08 — contract UNVERIFIED)

- **CONFIRMED — the key is official**: the `sat_...`-prefixed key comes from
  the seller dashboard **Integrations** settings page ("Third Party
  Integration API Key" — "Use this key to integrate Selar with external
  applications and services"), with a "Copy Key" and "Generate New Api Key"
  button, plus a regenerate warning banner. It was set as `SELAR_API_KEY`.
  The gate `npm run check:worker-routes:selar` reports `set`, and
  `/payment/selar/verify` answers `401` (route live, auth-gated).
- **NOT CONFIRMED — the endpoint accepts the key**: live probes found the
  contract our Worker uses (`GET https://api.selar.co/v2/orders` with
  `Authorization: Bearer <key>`, from the unofficial wrapper
  `Michael-kaku/selar-api`) does **not** currently validate:
  - `api.selar.co/v2/*` → `301` → `api.selar.com/v2/*` → `404` for every path
    (valid key, bogus key, and no key all return the same).
  - `selar.com/v2/orders` → `500 {"status":"error","message":"","data":[]}`
    for every request; a `POST` reveals the route exists and supports only
    `GET, HEAD`, but `GET` errors identically with/without the bearer token —
    the route does not read the `Authorization` header we send.
  - `selar.com/api/*` and `selar.com/v1/*` → structured `Resource not found`.
- **CONFIRMED mismatch with Selar's public docs**: Selar's knowledge base
  documents **webhook-based** integrations only (Dashboard → *Integrations* →
  Zapier/MailerLite/etc.). `developers.selar.co` and `docs.selar.co` exist
  but are login-gated (redirect to `selar.com/login`) — the real integration
  API docs live behind the merchant's own login.
- **Probes (2026-08, ~40 paths across 3 hosts)**: `api.selar.co/v2/*` →
  `301` → `api.selar.com/v2/*` → `404` (same for valid/bogus/no key);
  `selar.com/v2/orders` → `500 {"status":"error","message":"","data":[]}`
  invariant to every auth header (session-cookie dashboard route);
  `selar.com/api/*`, `/v1/*` → structured `Resource not found`.
- **Most likely reality**: the `sat_` key is a shared secret for Selar's
  **webhook / push integrations**, not a polling order-lookup API — matching
  how Selar's own Zapier/MailerLite integrations work (you give Selar a URL
  and it pushes order events). The `api.selar.co/v2/orders` contract was
  never validated by its source (the wrapper's test hits the author's own
  Render URL).
- **CONFIRMED BY SELAR SUPPORT (2026-08)**: direct webhooks / a webhook API to
  an arbitrary HTTPS endpoint are **not supported**, and the `sat_` key cannot
  receive order events via a direct webhook endpoint. Support explicitly
  recommends **Zapier** for purchase-based automations (Settings →
  Integrations). See the Zapier bridge section below.
- **Recommendation (revised)**: stop relying on `/payment/selar/verify`
  polling. Automate via the **Zapier bridge** — Selar's "New Sale" trigger
  pushes to the worker's existing `/payment/webhook/selar` route (which
  currently fails closed behind `SELAR_WEBHOOK_SECRET` and is the correct
  destination). The `sat_` key is NOT used for this; authentication is the
  shared `SELAR_WEBHOOK_SECRET` sent as `x-selar-signature` by the Zapier
  webhook action. Manual-review fallback stays for unmatched events.
- **Do not** store the key in `wrangler.toml`, `.dev.vars`, git, or client-side
  config — it must only ever live as a Worker secret or CI secret.

### Setting the key

```bash
cd workers/admin-bridge
npx wrangler secret put SELAR_API_KEY   # paste the key when prompted
# Optional override (defaults to https://api.selar.co/v2):
# npx wrangler secret put SELAR_API_BASE_URL
```

`wrangler secret put` automatically redeploys the Worker with the new secret.

### Rotating the key safely

1. Generate the new key in the Selar dashboard (or from support).
2. Push the new value: `npx wrangler secret put SELAR_API_KEY` (this deploys).
3. Verify the new key works before revoking the old one:
   `node scripts/check_worker_routes.mjs` (expect 29/29 routes, 0 missing) and
   probe `/payment/selar/verify` with the deployed origin — expect `401` (route
   live) rather than `404`.
4. Only after verification, revoke/delete the old key in the Selar dashboard.

### Verifying the key end-to-end

After setting the key, run a focused check: submit a real recent Selar order
reference through the app's payment confirmation form and confirm premium
activates without admin approval, and that the order row appears in the Worker's
payment records. If verification reports `api_not_configured`, the secret did
not reach the Worker (check `wrangler secret list` in `workers/admin-bridge`).

> **Status (2026-08)**: the polling endpoint `api.selar.co/v2/orders` does not
> exist (404 invariant to auth), and support confirmed there is no order-lookup
> API. Keep the key configured (it is harmless and the route degrades to manual
> review), but the real automation path is the **Zapier bridge** below.

## Selar → Zapier → Worker Webhook Bridge (CONFIRMED path)

Selar support confirmed the only purchase-automation surface is Zapier. The
worker already implements the receiving end; this section wires them together.

```
Selar "New Sale" (instant trigger)  →  Zapier  →  Webhook by Zapier (POST)
     →  https://<worker-domain>/payment/webhook/selar
```

### Worker-side (already implemented, one secret to set)

- `/payment/webhook/selar` exists in `workers/admin-bridge/worker.js`. It fails
  closed: reads `SELAR_WEBHOOK_SECRET`, requires `x-selar-signature` (or
  `x-selar-hash` / `x-webhook-signature`) to match via `timingSafeEqual`.
- It reads the sale payload with many aliases (`customer_email`/`email`/
  `buyer_email`, `product_name`/`product`, `order_reference`/`reference`/
  `transaction_id`, `amount`/`price`/`total`, plus `plan_cycle` with product-
  name fallbacks for monthly/quarterly/bi-annual/annual), looks up the buyer
  by email via Firebase `accounts:lookup`, and calls `grantSelarPremium`.
  Unmatched emails / unknown cycles are ignored (manual review handles them).
- Set the secret (this deploys the Worker):

  ```bash
  cd workers/admin-bridge
  npx wrangler secret put SELAR_WEBHOOK_SECRET  # any strong random string
  ```

- The secret is only ever a Worker secret — never in `wrangler.toml`, git, or
  client config. The `sat_` key is NOT involved in this path.

### Zapier-side (manual, ~20 minutes)

> **Verified on the live account (2026-08)**: the Integrations page shows NO
> Zapier option — only the "Third Party Integration API Key" (`sat_…`). Two
> gates confirmed from Selar's own sources:
> 1. **Zapier is a Selar Pro plan feature** — the live pricing page's embedded
>    data contains `pro_plan_zapier_benefit: "Zapier"`. The free Starter plan
>    only offers Mailchimp, Facebook Pixel and Google Tag Manager
>    integrations. (Current prices: Pro ≈ ₦33k/mo, Turbo ≈ ₦63k/mo.)
> 2. **A connected bank account is also required** — Selar's official guide
>    (help.selar.com, "Guide to Connecting Your Selar Store to Zapier"):
>    *"Your Selar account must have a connected bank account before the Zapier
>    integration option becomes available."*
> There is no webhook-URL field anywhere else; the URL field lives **inside**
> the Zapier integration page, which needs BOTH the Pro plan and a connected
> bank account. **Unblock**: upgrade to Pro, and connect bank/payout details at
> `https://selar.co/me/settings/store/payout`, then reload Integrations.

1. **Connect Selar to Zapier** — Settings → Integrations → **Zapier** (only
   appears once a bank account is connected — see above).
2. **Create a Zap** — Trigger: **Selar → New Sale** (instant, push-based).
3. **Action: Webhook by Zapier → POST**. Configure:
   - **URL**: `https://<worker-domain>/payment/webhook/selar`
     (live value: `https://promotion-cbt-admin-bridge.promotioncbtadmin.workers.dev/payment/webhook/selar`)
   - **Method**: POST, **Data type**: JSON.
   - **Headers**: add exactly one header:
     - `x-selar-signature` = the `SELAR_WEBHOOK_SECRET` value.
       (The worker also accepts `x-selar-hash` / `x-webhook-signature`, but
       the Zap should use `x-selar-signature`.)
   - **Payload**: build a JSON object with the field mapping below. Zapier
     exposes the trigger's fields after the Selar connection is live; map
     each trigger field to the key the worker reads. The worker's accepted
     aliases (from `handleSelarWebhook` in `worker.js`) are:

     | Worker key (send this) | Selar trigger field (Zapier variable) | Worker aliases it also accepts | Notes |
     |---|---|---|---|
     | `customer_email` | Buyer email | `customerEmail`, `email`, `buyer_email`, `buyerEmail` | **Required** — matched against Firebase `accounts:lookup`. Must be the email the buyer used to register in the app, or the event is ignored (manual review). |
     | `product_name` | Product name | `productName`, `product`, `item_name`, `itemName`, `title` | Used to derive the cycle if `plan_cycle` is absent (checks for "monthly", "quarter", "bi-annual", "annual"). |
     | `order_reference` | Order ID / reference | `orderReference`, `order_ref`, `orderRef`, `reference`, `transaction_id`, `transactionId`, `id` | Stored on the payment record for admin reconciliation. |
     | `amount` | Amount paid | `price`, `total`, `order_amount`, `orderAmount` | Only informational; if absent the worker uses the plan price. |
     | `currency` | Currency | — (only `currency`) | Defaults to `NGN`. |
     | `plan_cycle` | (optional) | `planCycle`, `billing_cycle`, `billingCycle` | Optional — omitted if the product name carries the cycle. |

     Example payload the Zap should POST:

     ```json
     {
       "customer_email": "{{buyer_email}}",
       "product_name": "{{product_name}}",
       "order_reference": "{{order_id}}",
       "amount": "{{amount_paid}}",
       "currency": "NGN"
     }
     ```

     (The trigger's exact variable names become visible when the Zap is
     connected; map them to the keys above.)
4. **Test**: Zapier's test step sends a real POST and you should see a `200`
   with `{"ok":true,"processed":true}` in the Zap's response. The worker
   validates the signature synchronously and returns immediately (sub-second,
   so it fits the free "Code by Zapier" ~1s execution limit), then runs the
   grant in the background via `ctx.waitUntil`. A `200` means **accepted**,
   not "already granted" — confirm the grant by checking the buyer's plan or
   the payment record a moment later. Then do one real test sale through the
   Selar checkout and confirm premium activates on the buyer account without
   any admin action.
5. **Fallback**: any event that doesn't match a Firebase user or cycle is
   ignored by the webhook and remains covered by the manual-review queue — no
   silent loss.

### Free alternative: Pipedream instead of Zapier (recommended)

Zapier's free plan cannot POST to the Worker (Webhooks by Zapier / HTTP by
Zapier are premium apps, and the free "Code by Zapier" step has a ~1s execution
limit that its sandbox startup alone consumes — verified live 2026-08, two
timeouts). The free path replaces Zapier with **Pipedream** (30s runtime,
custom headers). Note: this still requires **Selar Pro** — the Selar Zapier
integration page (where the Pipedream URL is pasted) is itself Pro-gated; only
Pipedream itself is free:

1. Create a Pipedream workflow with an **HTTP / Webhook** trigger → copy the
   `https://e….m.pipedream.net` URL.
2. In Selar, open the (now visible) **Zapier** integration page and paste the
   **Pipedream URL** into its webhook field — Selar pushes every sale there.
   It is a plain URL field; if it rejects a non-Zapier domain, screenshot the
   error (not yet seen — bank account not yet connected).
3. Add a **Node.js code step** after the trigger that forwards the raw body to
   the Worker with the signature header (the Worker's alias reading tolerates
   Selar's real field names; the first real push reveals them):

   ```js
   export default defineComponent({
     async run({ steps, $ }) {
       const res = await fetch(
         "https://promotion-cbt-admin-bridge.promotioncbtadmin.workers.dev/payment/webhook/selar",
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             "x-selar-signature": "…SELAR_WEBHOOK_SECRET…",
           },
           body: JSON.stringify(steps.trigger.event.body), // raw sale payload
         }
       );
       return { status: res.status, body: await res.text() };
     },
   });
   ```

   Deploy the workflow, then test in two gates: **Send Test Event** in
   Pipedream (expect `200` from the Worker), then one real small sale (expect
   premium granted with zero admin action).

### Health check

`npm run check:worker-routes:selar` verifies routes and **both** secrets. It
already reports `SELAR_WEBHOOK_SECRET: set|missing` (via the single `wrangler
secret list` call in `scripts/check_worker_routes.mjs`) and fails the check
when the secret is unset, since an unset secret makes `/payment/webhook/selar`
answer 503 and the bridge silently stops. Expected live output (2026-08,
after setup): `29/29 routes present`, `SELAR_API_KEY: set`,
`SELAR_WEBHOOK_SECRET: set`.

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

## Flutterwave Sandbox (Test-Mode) Activation Plan

**Status (2026-08):** code complete and worker-hardened. The inline checkout,
server-side verification, webhook auto-grant, receipts, and admin payment list
are all implemented; `FLW_SECRET_KEY` and `FLW_WEBHOOK_SECRET_HASH` are
**already set** on the deployed Worker. What remains to *activate* the provider
is: (1) a Flutterwave dashboard account in test mode, (2) the runtime config
flip to `paymentProvider: "flutterwave"`, and (3) the sandbox test below.

Flutterwave is the recommended replacement for Selar: NGN-native (no USD
friction), no monthly platform fee (~2.0% local NGN, 1.4% + 0.6% platform fee
as of 2026), a real signed webhook, individual-account KYC (no CAC), and the
whole flow already half-built in this repo (dormant client code + Worker
routes). It removes every Selar blocker: no Pro plan, no Zapier/Pipedream, no
bank-account gate, no manual steps.

### Already built (verified)

- **Client** `js/paymentFlutterwave.js` — **hosted redirect checkout**: the app
  redirects to `checkout.flutterwave.com/v3/hosted/pay` with `tx_ref`, the NGN
  amount per plan (`2500/5500/7500/12000`), `redirect_url` back into the app,
  and `meta: { userId, planCycle }`. Flutterwave redirects back with
  `status`/`tx_ref`/`transaction_id`; the app's boot-time return handler calls
  `/payment/verify`, shows a receipt lightbox, and flips to premium immediately.
  (The earlier inline `FlutterwaveCheckout` modal was dropped: its close/callback
  handshake proved unreliable in embedded contexts, e.g. the Freebuff preview
  pane, leaving users stuck on the success screen.)
- **Worker routes** (`workers/admin-bridge/worker.js`):
  - `/payment/verify` — authenticates the caller, then re-verifies the
    transaction server-side via `GET api.flutterwave.com/v3/transactions/{id}/verify`
    with `FLW_SECRET_KEY` (never trusts the client or the webhook payload),
    enforces `status == "successful"`, exact amount, `NGN`, `tx_ref` and email
    match, then patches the profile + D1 plan and writes the payment record.
  - `/payment/webhook/flutterwave` — fail-closed auto-grant: requires a valid
    signature (see below), accepts `charge.completed` with
    `data.status == "successful"`, re-verifies with the secret key, and grants
    via `meta.userId` or an email lookup. Idempotent — the payment record id
    `flw_<transactionId>` makes duplicate deliveries harmless.
  - `/payment/history` and `/adminListPayments` — profile and admin payment lists.
- **CSP** (`index.html`) already allows `checkout.flutterwave.com` and
  `api.flutterwave.com` (script/connect/frame/img).
- **Prices match** the client `PLAN_PRICES` and the Worker `PAYMENT_PLAN_PRICES`
  exactly.
- **Worker secrets** `FLW_SECRET_KEY` / `FLW_WEBHOOK_SECRET_HASH` are set
  (verified by `npm run check:worker-routes:flutterwave` — 29/29 routes,
  both secrets `set`).

### Webhook signature contract (important)

Flutterwave has shipped two signature schemes; the Worker accepts **both**:

| Scheme | Header | Value | Worker check |
|---|---|---|---|
| Legacy (v2/v3) | `verif-hash` | the plain Secret Hash from the dashboard | `timingSafeEqual(header, FLW_WEBHOOK_SECRET_HASH)` |
| Current (v4) | `flutterwave-signature` | base64(HMAC-SHA256(rawBody, Secret Hash)) | HMAC recomputed and compared |

Any request carrying neither a valid signature is rejected `403`; a missing
`FLW_WEBHOOK_SECRET_HASH` secret makes the route answer `503` (fail-closed,
same pattern as the Selar bridge) — so an unkeyed webhook is caught by the
route health check instead of silently stopping automation.

### Dashboard steps (exact)

1. Sign up / log in at **`https://dashboard.flutterwave.com`**.
2. Switch to **Test Mode** using the toggle (top-right, next to the merchant
   name). Test keys are only shown in test mode.
3. **Settings → API Keys** (under *DEVELOPERS*). Copy the two test keys:
   - Public key: `FLWPUBK_TEST-…` (goes in runtime config — it is public).
   - Secret key: `FLWSECK_TEST-…` (goes only into the Worker secret
     `FLW_SECRET_KEY`).
4. **Settings → Webhooks** (use the **Test webhooks** tab while on test
   keys): set the **Webhook URL** to
   `https://flw.promotioncbtadmin.workers.dev/w`,
   set a **Secret Hash** (long random string — 32+ characters, mixed case and
   digits), select the events to receive (include the charge-completed
   / successful-payment event, enable **webhook retries** and **Add meta to
   webhook**), and **Save**. This hash becomes the Worker secret
   `FLW_WEBHOOK_SECRET_HASH`.

   **URL length constraint (verified live):** the dashboard's webhook URL
   field rejects URLs over ~48–50 characters. The admin-bridge Worker's own
   URL (`https://promotion-cbt-admin-bridge.promotioncbtadmin.workers.dev/...`)
   is 92 chars and cannot fit. The short `flw` Worker at
   `https://flw.promotioncbtadmin.workers.dev/w` (43 chars) is a thin
   forwarder (`workers/flw-webhook-proxy/`) that relays the raw body plus the
   `verif-hash` / `flutterwave-signature` headers byte-for-byte to the real
   route; verification and the premium grant still happen on the main Worker.
   Deploy/update it with `cd workers/flw-webhook-proxy && npx wrangler deploy`.
5. (Optional) Configure the Payment Page/storefront appearance — the inline
   checkout does not need it.

### Worker secrets (set / rotate)

```bash
cd workers/admin-bridge
npx wrangler secret put FLW_SECRET_KEY          # paste FLWSECK_TEST-…
npx wrangler secret put FLW_WEBHOOK_SECRET_HASH # paste the Secret Hash from step 4
```

Each `wrangler secret put` redeploys the Worker automatically. Both are
currently set; re-put only when rotating. Rotation: generate the new value in
the dashboard → `wrangler secret put` → run
`npm run check:worker-routes:flutterwave` (expect 29/29 and `set`) → then
revoke the old value in the dashboard. Never put these in `wrangler.toml`,
`.dev.vars`, git, or client config.

### Runtime config changes (local, gitignored `config/runtime-auth.js`)

```js
paymentProvider: "flutterwave",
flutterwavePublicKey: "FLWPUBK_TEST-…",            // from Settings → API Keys (test mode)
flutterwaveWebhookUrl: "https://flw.promotioncbtadmin.workers.dev/w",
```

- `flutterwaveWebhookUrl` is informational only — the real webhook destination
  lives in the Flutterwave dashboard (step 4). The app never sends to it.
- `selarCheckoutLinks` can stay (harmless) or be removed.
- The tracked template `config/runtime-auth.example.js` already carries the
  placeholder keys; keep them placeholder-only.

### Runtime config changes (production / GitHub Actions)

- The deploy workflow's "Generate runtime auth config from secrets" step now
  emits `flutterwavePublicKey` (from a new `FLUTTERWAVE_PUBLIC_KEY` repo
  secret) and `flutterwaveWebhookUrl` (derived from `CLOUDFLARE_AUTH_BASE_URL`)
  into the generated `config/runtime-auth.js`.
- To go live: set the `FLUTTERWAVE_PUBLIC_KEY` repository secret and flip the
  `PAYMENT_PROVIDER` repository variable to `flutterwave`. The Worker `FLW_*`
  secrets are set via wrangler, never as CI secrets.

### Sandbox test flow (test cards)

1. `npm run dev`, then register and verify a throwaway user
   (e.g. `flw-sandbox+<timestamp>@example.com`).
2. Open a locked premium topic or the upgrade button → pricing modal →
   **Monthly** → the app redirects to Flutterwave's **hosted payment page**
   (full page). After paying, Flutterwave redirects back to the app with
   `status`/`tx_ref`/`transaction_id`; the boot-time return handler verifies
   and activates premium.
3. Enter a test card (Flutterwave test mode — current official list from
   `developer.flutterwave.com/v3.0/docs/testing`):
   - **5531 8866 5214 2950** — PIN-auth success card; expiry `09/32`, CVV `564`,
     PIN `3310`, OTP `12345` (drives the PIN→OTP flow in the checkout).
   - **4187 4274 1556 4246** — 3DS success card; expiry `09/32`, CVV `828`,
     PIN `3310`, OTP `12345`.
   - **5258 5859 2266 6506** — failure card (insufficient funds; should be
     rejected).
   - ⚠️ The old **4084 0840 8408 4081** card is deprecated (now a Paystack
     card) and fails with "Invalid credentials" in the current checkout.
4. On success the app calls `/payment/verify` → the Worker re-verifies with
   `FLW_SECRET_KEY` → premium activates immediately and the receipt lightbox
   opens. **Test-mode note:** Flutterwave substitutes the buyer with a sandbox
   email (`ravesb_...`); the Worker tolerates it in `/payment/verify` and the
   webhook (`tx_ref` fallback), so sandbox purchases activate premium.
5. Confirm all of: profile shows **Premium** with the right billing cycle;
   the admin panel **payment history** lists the `flw_…` record; the Firestore
   `payments/flw_<txid>` document exists.
6. **Webhook path**: Flutterwave also POSTs `charge.completed` to
   `/payment/webhook/flutterwave` (public URL, same as live). The Worker
   validates the signature, re-verifies, and grants idempotently. Inspect via
   `npx wrangler tail` in `workers/admin-bridge` or the payments table.

### Verification commands

```bash
node --check workers/admin-bridge/worker.js
npm run test:unit                  # includes tests/unit/flutterwaveWebhookSecurity.test.js
npm run check:worker-routes:flutterwave   # expect 29/29 routes, both FLW secrets set
npm run build
```

### Going live (after the sandbox passes)

1. Complete Flutterwave KYC (individual / unregistered business path — no CAC):
   **BVN + NIN**, a valid ID (NIN slip, passport, or driver's license), proof of
   address (utility bill ≤ 3 months or lease), and a personal bank account in
   your name (Nigeria onboarding requirements, 2026-08). Test mode works before
   any of this.
2. Dashboard: switch **Test Mode off** (Live mode) and copy the **live** keys.
3. `npx wrangler secret put FLW_SECRET_KEY` (live `FLWSECK-…`) and
   `npx wrangler secret put FLW_WEBHOOK_SECRET_HASH` (live secret hash).
4. Set `flutterwavePublicKey` to the live `FLWPUBK-…` in runtime config (and
   the `FLUTTERWAVE_PUBLIC_KEY` CI secret); keep `paymentProvider: "flutterwave"`.
5. Re-run the route check and one real ₦2,500 card payment end-to-end.
6. **Rollback at any time**: flip `paymentProvider` back to `"selar"` — the
   Selar path remains fully intact.

### Risks / notes

- Local NGN fees ~2.0% (1.4% transaction + 0.6% platform, 2026); +₦50 stamp
  duty only above ₦10,000.
- Test-mode webhooks are delivered to the public Worker URL exactly like live
  ones, so the sandbox test exercises the real grant path.
- The Worker accepts both legacy `verif-hash` and v4 `flutterwave-signature`;
  if Flutterwave ever stops sending one scheme, the other still works.

## Later Enhancements

Revisit these after the monthly launch is stable:

- Annual and bi-annual Selar products.
- Native Selar webhook or callback validation — **not expected**: support
  (2026-08) confirmed Selar does not offer direct webhooks to arbitrary HTTPS
  endpoints; revisit only if Selar publishes a webhook contract later.
- Flutterwave activation — see the **Flutterwave Sandbox (Test-Mode) Activation
  Plan** above; only KYC and the live-key swap remain.
- In-app receipt upload.
- Admin notifications for new Selar confirmations.
- Better deployment-domain redirect into the profile/payment confirmation section.
