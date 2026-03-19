export function mapFirebaseAuthError(message) {
  const code = String(message || "").trim().toUpperCase();
  const compactCode = code.split(/[\s:,(]/)[0];
  const mapped = {
    EMAIL_EXISTS: "An account with this email already exists.",
    EMAIL_NOT_FOUND:
      "No account exists for this email yet. Register first, or create the user in Firebase Authentication.",
    INVALID_PASSWORD: "Invalid email or password.",
    INVALID_LOGIN_CREDENTIALS: "Invalid email or password.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please try again later.",
    USER_DISABLED: "This account has been disabled.",
    OPERATION_NOT_ALLOWED: "Email/password sign-in is not enabled for this Firebase project.",
    INVALID_EMAIL: "Enter a valid email address.",
    WEAK_PASSWORD: "Password must be at least 6 characters.",
    INVALID_ID_TOKEN: "Session expired. Please login again.",
    TOKEN_EXPIRED: "Session expired. Please login again.",
    QUOTA_EXCEEDED:
      "Quota exceeded. Firebase Auth is rate-limiting this operation. Try again later or check Firebase Auth usage/quota.",
  };
  if (mapped[code]) return mapped[code];
  if (mapped[compactCode]) return mapped[compactCode];
  if (code.includes("QUOTA_EXCEEDED")) return mapped.QUOTA_EXCEEDED;
  return message || "Authentication request failed.";
}
