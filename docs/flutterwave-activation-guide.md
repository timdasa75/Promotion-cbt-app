# Flutterwave Activation Guide (Requirements & Step-by-Step)

This guide walks you through **everything required to get Flutterwave working** for
Promotion CBT Premium payments — from the documents you need to gather, to the
dashboard setup, to the final live switch. The technical implementation is already
built and deployed; this guide is the *what you need to do* companion.

**Time to complete:** ~30–45 minutes for the sandbox path (no KYC needed).
**What you get:** users pay in-app with NGN cards, premium is granted automatically
via a signed webhook, zero admin action, no monthly platform fee (~2% per sale).

---

## Part 0 — Gather your documents first

Flutterwave requires KYC before you can take **live** payments. You do **not** need
any of this to start testing in sandbox mode — but gather it now so the live switch
is instant later.

### Requirements checklist (Nigeria, individual / unregistered business)

> Official source: Flutterwave Help Center — *"What are the requirements for using
> Flutterwave?"* and the Nigeria onboarding requirements (verified 2026-08).
> **No CAC / business registration needed** — choose "No" at signup and use the
> individual path.

| # | Item | Details | Needed for |
|---|------|---------|-----------|
| 1 | **Valid ID** (one of) | NIN Slip or Digital National ID, National ID Card, International Passport, or Driver's License (front **and** back) | Live KYC |
| 2 | **BVN** | Your Bank Verification Number — must match the name on your ID exactly | Live KYC |
| 3 | **NIN** | National Identification Number | Live KYC |
| 4 | **Proof of address** | Utility bill ≤ 3 months old, or a lease/rent agreement | Live KYC |
| 5 | **Personal bank account** | A Nigerian bank account in **your name** (this is where payouts settle) | Live KYC + payouts |
| 6 | **Website or social media** | A link to a website or active social profile (Instagram, X, TikTok, etc.) that shows what you sell | Live KYC |
| 7 | **Business details** | Legal business name, address, phone, terms & conditions, refund policy (even for the individual path — Flutterwave asks for these) | Live KYC |
| 8 | **TIN** (recommended) | Tax Identification Number | Compliance |

**Rules that cause verification rejections** (avoid these):
- ID is expired, damaged, or a photocopy/laminated copy — must be the **original**.
- Name on BVN ≠ name on ID ≠ name on bank account.
- Utility bill older than 3 months.

**Can't verify yet? No problem.** Your account stays in **test mode** and you can
build, test, and ship the entire flow with sandbox keys — see Parts 1–6.

---

## Part 1 — Create the Flutterwave account

1. Go to **https://dashboard.flutterwave.com** → **Sign up**.
2. Choose **Nigeria** as your country of operation.
3. When asked about business registration, select **"No"** (unregistered business /
   individual path — this is allowed for Nigeria).
4. Complete email verification.
5. You're now in the dashboard. Your account is in **test mode** by default —
   **this is exactly what we want** to start.

---

## Part 2 — Get your test API keys

1. In the dashboard, confirm **Test Mode** is ON (toggle at the top-right, next to
   the merchant name). Test keys are **only visible in test mode**.
2. Go to **Settings → API Keys** (under the *DEVELOPERS* section).
3. Copy **two** keys:
   - **Public key** — looks like `FLWPUBK_TEST-…` → goes in the app's runtime config.
   - **Secret key** — looks like `FLWSECK_TEST-…` → goes **only** into the Worker
     secret (never in the repo, never in client config).

> 🔐 The secret key signs nothing client-side in our app, but anyone who gets it can
> query and refund transactions. Keep it out of git entirely.

---

## Part 3 — Configure the webhook (URL + secret hash)

The webhook is what makes **automatic** premium grants possible: Flutterwave POSTs
each completed charge to your Worker, which verifies the signature and grants
premium — no admin action.

1. Go to **Settings → Webhooks** in the dashboard. Use the **Test webhooks** tab
   while you're on test keys (the Live tab only fires once you switch to live
   mode in Part 7).
2. **Webhook URL:** paste
   `https://flw.promotioncbtadmin.workers.dev/w`
3. **Secret Hash:** create a long random string — **32+ characters**, mixed case,
   numbers and symbols. Example style: `pCbt2026!FlwH4sh-x9Qz7vLm2kWp8R`
   (generate one, don't reuse this example). This is a shared secret: Flutterwave
   signs every webhook with it, and the Worker checks it. **The exact same value
   must be set as the Worker secret `FLW_WEBHOOK_SECRET_HASH` (Part 4).**
4. Select the events to receive — include **charge.completed / successful payment**;
   also enable **Enable webhook retries** and **Add meta to webhook** (meta carries
   the buyer `userId`/`planCycle` used for the auto-grant). Meta is recommended
   but not required: the Worker now falls back to parsing the `tx_ref` (which
   embeds the user id and plan cycle) when meta is absent.
5. **Save.**

> **Why the short URL?** The dashboard's webhook URL field rejects URLs over
> ~48–50 characters (it silently clips longer values → "Validation error"). The
> admin-bridge Worker's own URL is 92 chars, so it can never fit. The `flw` URL
> above (43 chars) is a thin forwarder Worker (`workers/flw-webhook-proxy/`) that
> relays the raw body and the `verif-hash` / `flutterwave-signature` headers
> byte-for-byte to the real route — the signature check and premium grant still
> happen on the main Worker, so security is unchanged. It is already deployed.

> **Why the hash matters:** the Worker rejects any webhook that doesn't carry a
> matching signature (`403`), and refuses to run at all if the hash isn't configured
> (`503`). A silent misconfiguration is caught by `npm run check:worker-routes:flutterwave`.

---

## Part 4 — Set the Worker secrets

The Worker runs on Cloudflare and needs the two values from Parts 2 and 3. Run from
the repo root:

```bash
cd workers/admin-bridge
npx wrangler secret put FLW_SECRET_KEY          # paste FLWSECK_TEST-…
npx wrangler secret put FLW_WEBHOOK_SECRET_HASH # paste the Secret Hash from Part 3
```

Each command redeploys the Worker automatically. Verify both are set:

```bash
cd ../.. && npm run check:worker-routes:flutterwave
```

**Expect:** `29/29` routes present, `FLW_SECRET_KEY: set`, `FLW_WEBHOOK_SECRET_HASH: set`.

> Both secrets are **already set** on the deployed Worker as of 2026-08 — only
> re-run this when you rotate keys (see Part 7).

---

## Part 5 — Flip the app to Flutterwave

The app reads its runtime config from `config/runtime-auth.js` (gitignored). Edit it:

```js
paymentProvider: "flutterwave",
flutterwavePublicKey: "FLWPUBK_TEST-…",   // from Part 2 (public key)
flutterwaveWebhookUrl: "https://flw.promotioncbtadmin.workers.dev/w",
```

- The webhook URL here is **informational only** — the real destination lives in the
  dashboard (Part 3). The app never sends to it.
- The tracked template `config/runtime-auth.example.js` keeps placeholder keys only —
  never commit a real key.

---

## Part 6 — Sandbox test (prove the whole flow)

1. `npm run dev` → register and verify a throwaway user, e.g. `flw-sandbox+<timestamp>@example.com`.
2. Open the upgrade/pricing flow → choose **Monthly** → the app redirects to
   Flutterwave's **hosted payment page** (`checkout.flutterwave.com/v3/hosted/pay`,
   full page — no inline modal). The plan button label reflects the provider
   (`Pay Monthly via Flutterwave`).
3. Pay, and Flutterwave redirects the browser **back to the app** with
   `status`, `tx_ref` and `transaction_id` appended. The app's boot-time
   return handler calls `/payment/verify` and opens the receipt lightbox.
   (If the session was lost mid-payment, the return is stored and processed
   right after login.)
4. Enter a **test card** (Flutterwave test mode — current official list from
   `developer.flutterwave.com/v3.0/docs/testing`):
   - **5531 8866 5214 2950** — PIN-auth success card; expiry `09/32`, CVV `564`,
     PIN `3310`, OTP `12345`. (This is the one to use — it drives the PIN→OTP
     flow in the checkout.)
   - **4187 4274 1556 4246** — 3DS success card; expiry `09/32`, CVV `828`,
     PIN `3310`, OTP `12345` (shows a 3DS page instead of a PIN prompt).
   - **5258 5859 2266 6506** — failure card (insufficient funds; payment
     should be rejected).
   - ⚠️ Older guides list **4084 0840 8408 4081** — that card is deprecated
     (it is now a Paystack card) and the current checkout rejects it with
     "Invalid credentials / Invalid Card Number" before the PIN step.
5. On success, premium activates **immediately** (no admin action) and a receipt
   lightbox opens.
6. Confirm all of:
   - Profile shows **Premium** with the right billing cycle.
   - Admin panel → **payment history** lists the `flw_…` record.
   - Firestore has `payments/flw_<txid>`.
7. **Webhook path:** Flutterwave also POSTs `charge.completed` to the Worker URL —
   watch it live with `npx wrangler tail` (in `workers/admin-bridge`) or check the
   payments table. It grants idempotently, so duplicate deliveries are harmless.

> **Test-mode email substitution:** Flutterwave test mode replaces the buyer
> email with a sandbox customer (`ravesb_<id>_<merchant-email>`). The Worker
> tolerates this in `/payment/verify` (the unique `tx_ref` — which embeds the
> user id — is the real security control), so sandbox payments activate
> premium normally. In live mode the real email is preserved and checked.

---

## Part 7 — Go live (KYC + live keys)

1. **Complete KYC** in the dashboard with the documents from Part 0 (BVN, NIN, ID,
   proof of address, bank account, website/social link). Test mode works the whole
   time until approval.
2. After approval: switch **Test Mode OFF**, copy the **live** keys:
   - Public: `FLWPUBK-…` (no `_TEST_`) → runtime config `flutterwavePublicKey`
     **and** the `FLUTTERWAVE_PUBLIC_KEY` GitHub repo secret (used by CI to generate
     `config/runtime-auth.js`).
   - Secret: `FLWSECK-…` → `npx wrangler secret put FLW_SECRET_KEY`.
3. Put the live secret hash → `npx wrangler secret put FLW_WEBHOOK_SECRET_HASH`
   (set the same hash in Settings → Webhooks in live mode).
4. Keep `paymentProvider: "flutterwave"`.
5. Re-run `npm run check:worker-routes:flutterwave`, then do **one real ₦2,500 card
   payment** end-to-end.

**Note:** Flutterwave is the only payment provider — no rollback path exists or is needed.

### Key rotation (do this any time a key leaks or you want fresh ones)

1. Generate the new value in the dashboard.
2. `npx wrangler secret put <NAME>` with the new value.
3. Run `npm run check:worker-routes:flutterwave` → expect `set`.
4. Only then revoke/regenerate the old value in the dashboard.

---

## Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| Route check reports a FLW secret `unset` | Worker was redeployed without secrets → re-run `wrangler secret put` (Part 4) |
| Hosted checkout shows a Cloudflare **"Sorry, you have been blocked"** page | The checkout URL embeds `localhost` (Flutterwave's Cloudflare WAF blocks `localhost` in query params — SSRF protection). The app rewrites it to `127.0.0.1` automatically; in a browser open the app via `http://127.0.0.1:5500` (or the preview pane, which uses `[::1]`) rather than `localhost:5500` |
| Checkout modal doesn't open | `flutterwavePublicKey` empty or still `REPLACE_WITH_…` in `config/runtime-auth.js` → set it (Part 5) |
| Payment succeeds but no premium | Test mode substitutes the buyer email (`ravesb_...`); the Worker tolerates it now. Otherwise check `npx wrangler tail` — likely the webhook URL or secret hash in the dashboard doesn't match the Worker's `FLW_WEBHOOK_SECRET_HASH` (Part 3/4) |
| Webhook answers `403` | Signature mismatch — dashboard secret hash ≠ Worker secret (Part 3/4) |
| Webhook answers `503` | `FLW_WEBHOOK_SECRET_HASH` unset on the Worker (Part 4) |
| Webhook answers `200` but `ignored: true` | Event isn't `charge.completed`/`successful`, or `meta.planCycle` is missing — check the payload with `wrangler tail` |
| KYC rejected | Name mismatch (BVN vs ID vs bank), expired/photocopied ID, old utility bill → fix per Part 0 |

---

## Cost summary (verified 2026-08)

- **Local NGN card fee:** ~2.0% (1.4% transaction + 0.6% platform fee).
- **₦50 stamp duty** only on transactions above ₦10,000.
- **No monthly platform fee, no Pro tier, no Zapier.**
- On a ₦2,500 monthly sale: **≈ ₦50** in total fees.

## Final checklist

- [ ] Documents gathered (ID, BVN, NIN, proof of address, bank, website/social)
- [ ] Flutterwave account created (individual path)
- [ ] Test API keys copied (public + secret)
- [ ] Webhook URL + secret hash configured in dashboard
- [ ] Worker secrets set + route check green
- [ ] Runtime config flipped to `flutterwave`
- [ ] Sandbox test passed with test card 4081
- [ ] KYC approved → live keys swapped → one real payment passed
