// Pure resolution logic for the admin "Password Reset Requests" card.
//
// The auth audit log records two families of rows:
//   • "Password recovery requested"  — a user asked for a reset link
//   • "Password reset email sent"    — an admin sent one (status: success|failed)
//
// A user is UNRESOLVED when their latest request is newer than their latest
// successful send — i.e. nobody has delivered them a working link since they
// asked. A failed send does not resolve anyone (but is surfaced as a flag);
// re-requesting after a resolved send reopens the item.
//
// Counting users rather than events keeps the headline number honest: one
// person mashing "forgot password" five times is still one thing to do.

const REQUEST_ACTION = "password recovery requested";
const SEND_ACTION = "password reset email sent";
// WhatsApp handoffs resolve too: the Worker audits them as their own action
// when the admin opens the wa.me draft (status success = link delivered to
// the user's chat by the admin's own send).
const WHATSAPP_SEND_ACTION = "password reset link sent via whatsapp";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function isResetRequestRow(entry) {
  return normalizeText(entry?.action) === REQUEST_ACTION && normalizeText(entry?.target).includes("@");
}

export function isResetSendRow(entry) {
  const action = normalizeText(entry?.action);
  return (action === SEND_ACTION || action === WHATSAPP_SEND_ACTION) && normalizeText(entry?.target).includes("@");
}

/**
 * @param {Array<{action?:string,target?:string,createdAt?:string,status?:string,message?:string}>} entries
 * @returns {{unresolved: Array<{email:string,requestedAt:string|null,requestCount:number,lastSendFailed:boolean}>, resolvedCount:number, totalRequests:number}}
 */
export function summarizePasswordResetRequests(entries) {
  const rows = Array.isArray(entries) ? entries : [];
  const byEmail = new Map();

  for (const entry of rows) {
    const email = normalizeText(entry?.target);
    if (!email.includes("@")) continue;
    const when = normalizeTimestamp(entry?.createdAt) ?? 0;
    const action = normalizeText(entry?.action);
    if (action !== REQUEST_ACTION && action !== SEND_ACTION && action !== WHATSAPP_SEND_ACTION) continue;

    let state = byEmail.get(email);
    if (!state) {
      // lastSuccessAt starts at -1 so an untimed request (when = 0) still
      // counts as pending rather than tying with the success default.
      state = { email, requestCount: 0, lastRequestAt: 0, lastSuccessAt: -1, failedAfterLastSuccess: false };
      byEmail.set(email, state);
    }
    if (action === REQUEST_ACTION) {
      state.requestCount += 1;
      if (when >= state.lastRequestAt) state.lastRequestAt = when;
    } else if (normalizeText(entry?.status) === "failed") {
      // Only a failed send at-or-after the latest request flags the item;
      // stale failures from a previous cycle must not taint a new request.
      if (when >= state.lastSuccessAt && when >= state.lastRequestAt) {
        state.failedAfterLastSuccess = true;
      }
    } else if (when >= state.lastSuccessAt) {
      state.lastSuccessAt = when;
      if (when >= state.lastRequestAt) state.failedAfterLastSuccess = false;
    }
  }

  const unresolved = [];
  let resolvedCount = 0;
  for (const state of byEmail.values()) {
    if (!state.requestCount) continue; // send-only row for an address that never requested here
    const pending = state.lastRequestAt > state.lastSuccessAt;
    if (pending) {
      unresolved.push({
        email: state.email,
        requestedAt: state.lastRequestAt ? new Date(state.lastRequestAt).toISOString() : null,
        requestCount: state.requestCount,
        lastSendFailed: state.failedAfterLastSuccess && state.lastRequestAt > state.lastSuccessAt,
      });
    } else {
      resolvedCount += 1;
    }
  }

  unresolved.sort((a, b) => Date.parse(b.requestedAt || 0) - Date.parse(a.requestedAt || 0));

  return {
    unresolved,
    resolvedCount,
    totalRequests: rows.filter((entry) => isResetRequestRow(entry)).length,
  };
}
