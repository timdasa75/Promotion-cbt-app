const VERIFICATION_RESEND_COOLDOWN_STORAGE_KEY = "cbt_verification_resend_cooldown_v1";
const PASSWORD_RESET_COOLDOWN_STORAGE_KEY = "cbt_password_reset_cooldown_v1";

export function readVerificationResendCooldowns(storage = localStorage) {
  try {
    const raw = storage.getItem(VERIFICATION_RESEND_COOLDOWN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function writeVerificationResendCooldowns(payload, storage = localStorage) {
  storage.setItem(
    VERIFICATION_RESEND_COOLDOWN_STORAGE_KEY,
    JSON.stringify(payload && typeof payload === "object" ? payload : {}),
  );
}

export function readPasswordResetCooldowns(storage = localStorage) {
  try {
    const raw = storage.getItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function writePasswordResetCooldowns(payload, storage = localStorage) {
  storage.setItem(
    PASSWORD_RESET_COOLDOWN_STORAGE_KEY,
    JSON.stringify(payload && typeof payload === "object" ? payload : {}),
  );
}
