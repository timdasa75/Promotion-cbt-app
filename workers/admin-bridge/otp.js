/**
 * OTP (One-Time Password) Module
 * 
 * Generates and verifies 6-digit OTP codes for email-based login verification.
 */

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends
const OTP_RATE_LIMIT_MAX = 3; // Max OTP requests per email in rate limit window
const OTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} - 6-digit OTP code
 */
export function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
}

/**
 * Simple hash function for OTP (no bcrypt needed for short-lived codes)
 * @param {string} otp - The OTP to hash
 * @returns {string} - Hashed OTP
 */
export function hashOTP(otp) {
  // Simple but sufficient hash for OTPs
  let hash = 0;
  const str = String(otp);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verify OTP against stored hash
 * @param {string} otp - The OTP to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {boolean} - True if OTP matches
 */
export function verifyOTP(otp, storedHash) {
  const inputHash = hashOTP(otp);
  return inputHash === storedHash;
}

/**
 * Check if OTP is expired
 * @param {string} expiresAt - ISO date string of expiry
 * @returns {boolean} - True if expired
 */
export function isOTPExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiryDate = new Date(expiresAt);
  return expiryDate.getTime() < Date.now();
}

/**
 * Check if OTP can be resent (cooldown period)
 * @param {string} lastSentAt - ISO date string of last send
 * @returns {object} - { canResend: boolean, waitSeconds: number }
 */
export function canResendOTP(lastSentAt) {
  if (!lastSentAt) return { canResend: true, waitSeconds: 0 };
  
  const lastSent = new Date(lastSentAt);
  const elapsed = Date.now() - lastSent.getTime();
  const remaining = OTP_RESEND_COOLDOWN_MS - elapsed;
  
  if (remaining <= 0) {
    return { canResend: true, waitSeconds: 0 };
  }
  
  return { canResend: false, waitSeconds: Math.ceil(remaining / 1000) };
}

/**
 * Get OTP expiry time in ISO format
 * @returns {string} - ISO date string
 */
export function getOTPExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
}

/**
 * Mask email for display (user@email.com → u***@email.com)
 * @param {string} email - Email to mask
 * @returns {string} - Masked email
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}@${domain}`;
}

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} - True if valid format
 */
export function isValidOTPFormat(otp) {
  return /^\d{6}$/.test(String(otp || ''));
}

// Export configuration for testing
export const OTP_CONFIG = {
  LENGTH: OTP_LENGTH,
  EXPIRY_MS: OTP_EXPIRY_MS,
  MAX_ATTEMPTS: OTP_MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS: OTP_RESEND_COOLDOWN_MS,
  RATE_LIMIT_MAX: OTP_RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: OTP_RATE_LIMIT_WINDOW_MS,
};
