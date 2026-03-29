const DEFAULT_FEATURE_FLAGS = Object.freeze({
  enableTemplateLoading: true,
  enableGlBandWeights: true,
  enableTemplateDrivenMocks: true,
  enableGlBandTemplateUi: true,
  enableStudyFilters: true,
  enablePersistentJsonCache: true,
});

export function getFeatureFlags() {
  if (typeof window === "undefined") {
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  const runtimeFlags =
    window.PROMOTION_CBT_FEATURES && typeof window.PROMOTION_CBT_FEATURES === "object"
      ? window.PROMOTION_CBT_FEATURES
      : {};

  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...runtimeFlags,
  };
}

export function isFeatureEnabled(flagName) {
  const flags = getFeatureFlags();
  return Boolean(flags?.[flagName]);
}



