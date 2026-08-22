// Short-URL forwarder for the Flutterwave webhook.
//
// Flutterwave's dashboard webhook URL field has a max length (~48-50 chars),
// which is too short for:
//   https://promotion-cbt-admin-bridge.promotioncbtadmin.workers.dev/payment/webhook/flutterwave  (92 chars)
// This worker lives at https://flw.promotioncbtadmin.workers.dev/w  (43 chars)
// and relays the POST to the real webhook route on the admin-bridge Worker.
//
// Security is unchanged: the signature headers (verif-hash /
// flutterwave-signature) and the raw body are forwarded byte-for-byte, and the
// admin-bridge Worker still performs the HMAC/timing-safe verification and the
// premium grant. This forwarder holds no secrets and performs no checks.

const UPSTREAM_WEBHOOK_URL =
  "https://promotion-cbt-admin-bridge.promotioncbtadmin.workers.dev/payment/webhook/flutterwave";

const FORWARD_HEADERS = ["content-type", "verif-hash", "flutterwave-signature"];

export default {
  async fetch(request, _env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed." }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Preserve the exact bytes and signature headers so the upstream HMAC
    // verification still holds.
    const rawBody = await request.arrayBuffer();
    const headers = new Headers();
    for (const name of FORWARD_HEADERS) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    let upstream;
    try {
      upstream = await fetch(UPSTREAM_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: rawBody,
      });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: "Upstream relay failed." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const upstreamBody = await upstream.text();
    return new Response(upstreamBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
  },
};
