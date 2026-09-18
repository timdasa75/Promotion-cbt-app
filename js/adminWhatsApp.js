// Pure helpers for WhatsApp "click-to-chat" outreach (wa.me deep links).
//
// wa.me opens a WhatsApp chat with a pre-filled draft on the admin's own
// device — the admin sends it from their own number, so delivery costs
// nothing (no Cloud API, no template fees, no per-message charge). Keeping
// normalization + message text in a pure module makes both unit-testable and
// lets the phone-capture modal reuse the exact same formatting rules.

// Nigeria's international dialling code: numbers stored as local 0803…
// (or 10-digit without trunk 0) must gain the +234 prefix for wa.me.
const DEFAULT_COUNTRY_CODE = "234";

/**
 * Normalize a stored user phone number into wa.me's required international
 * format (digits only, country code, no leading "+", no trunk zero).
 *
 * Accepts: +2348031234567, 2348031234567, 08031234567, 8031234567,
 *          +234 803 123 4567, 0803-123-4567, etc.
 *
 * @param {string} value raw/stored phone number
 * @param {string} [countryCode] default "234" (Nigeria)
 * @returns {string|null} wa.me digits ("2348031234567") or null if unusable
 */
export function toWhatsAppNumber(value, countryCode = DEFAULT_COUNTRY_CODE) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;

  const cc = String(countryCode ?? DEFAULT_COUNTRY_CODE).replace(/\D/g, "") || DEFAULT_COUNTRY_CODE;

  // "+" or "00" means the sender already wrote an international number —
  // only apply the default country code to bare local formats.
  const explicitInternational = digits.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) {
    digits = digits.slice(2); // 00… international prefix → drop
  }
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }
  if (digits.startsWith(cc) && digits.length > cc.length + 7) {
    return digits; // already international (2348031234567)
  }
  if (explicitInternational) {
    // Another country's number: trust it as-is.
    if (digits.length < 7 || digits.length > 15) return null;
    return digits;
  }
  // Local formats: strip the trunk "0" then prepend the country code.
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length < 7 || digits.length > 15) return null;
  return cc + digits;
}

/**
 * Build the pre-filled WhatsApp message for a password-reset handoff.
 * Kept deliberately short: wa.me truncates the `text` param, so the link
 * plus one line of context is the safe envelope.
 *
 * @param {string} resetUrl single-use reset link from the Worker
 * @param {string} [name] display name (falls back to the email local-part)
 * @param {string} [email] user's account email
 * @returns {string}
 */
export function buildWhatsAppResetMessage(resetUrl, name = "", email = "") {
  const display = String(name || "").trim() || String(email || "").split("@")[0] || "there";
  const url = String(resetUrl || "").trim();
  if (!url) {
    throw new Error("resetUrl is required to build the WhatsApp message.");
  }
  return (
    `Hi ${display}, a password reset was requested for your Promotion CBT account (${String(email || "").trim()}). ` +
    `Open this single-use link within 24 hours to choose a new password: ${url}. ` +
    `If you didn't request it, you can ignore this message. — Promotion CBT`
  );
}

/**
 * Build the wa.me deep link. Returns null when the number is unusable so
 * callers can fall back to the copy-email flow instead of opening a broken
 * link.
 *
 * @param {string} phone stored phone number (any common format)
 * @param {string} resetUrl
 * @param {{ name?: string, email?: string, baseUrl?: string }} [opts]
 * @returns {string|null} https://wa.me/<digits>?text=… or null
 */
export function buildWhatsAppClickToChatUrl(phone, resetUrl, { name = "", email = "" } = {}) {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  const text = buildWhatsAppResetMessage(resetUrl, name, email);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
