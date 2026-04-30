(() => {
  window.BASE_URL =
    window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
      ? ""
      : "/Promotion-cbt-app";

  window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH =
    typeof window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH === "boolean"
      ? window.PROMOTION_CBT_REQUIRE_CLOUD_AUTH
      : !(window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");

  window.PROMOTION_CBT_AUTH = window.PROMOTION_CBT_AUTH || {};
  window.PROMOTION_CBT_ADMIN_EMAILS =
    (window.PROMOTION_CBT_AUTH && Array.isArray(window.PROMOTION_CBT_AUTH.adminEmails))
      ? window.PROMOTION_CBT_AUTH.adminEmails
      : window.PROMOTION_CBT_ADMIN_EMAILS || [];

  const cfg = window.PROMOTION_CBT_AUTH || {};
  const fields = [cfg.firebaseApiKey, cfg.firebaseProjectId, cfg.firebaseAuthDomain];
  const suspects = ["PROMOTION", "REPLACE", "ADMIN", "YOUR_FIREBASE"];
  const hasPlaceholder = fields.some((value) => {
    if (!value) return false;
    return suspects.some((needle) => String(value).toUpperCase().includes(needle));
  });
  if (hasPlaceholder) {
    console.warn(
      "Promotion CBT: runtime Firebase config contains placeholder strings. " +
        "Inject live keys via config/runtime-auth.js or the deployment workflow.",
    );
  }
})();
