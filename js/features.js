const DEFAULT_FEATURE_FLAGS = Object.freeze({
  enableTemplateLoading: true,
  enableGlBandWeights: true,
  enableTemplateDrivenMocks: true,
  enableGlBandTemplateUi: true,
  enableStudyFilters: true,
  enablePersistentJsonCache: true,
});

/**
 * Produce the effective feature-flag map by combining defaults with any runtime overrides.
 *
 * In a non-browser environment returns a shallow copy of the default flags. In a browser,
 * `window.PROMOTION_CBT_FEATURES` is used to override matching keys from the defaults when it exists and is an object.
 * @returns {{enableTemplateLoading: boolean, enableGlBandWeights: boolean, enableTemplateDrivenMocks: boolean, enableGlBandTemplateUi: boolean, enableStudyFilters: boolean, enablePersistentJsonCache: boolean}} An object containing the effective feature flags; runtime overrides replace default values for matching keys.
 */
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

/**
 * Determine whether a named feature flag is enabled.
 * @param {string} flagName - The feature flag key to check.
 * @returns {boolean} `true` if the feature flag is enabled, `false` otherwise.
 */
export function isFeatureEnabled(flagName) {
  const flags = getFeatureFlags();
  return Boolean(flags?.[flagName]);
}



