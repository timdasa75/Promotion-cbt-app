// analyticsBundle.js - aggregator for the lazy "analytics" chunk.
// app.js dynamically imports this one module and reads the named exports off
// the module namespace, which keeps the chunk out of the boot graph (see
// loadAnalyticsApi in app.js). All files re-exported here live in the same
// "analytics" manual chunk.
export { buildAnalyticsSnapshot } from "./appAnalytics.js";
export {
  buildAnalyticsConsistencyHtml,
  buildAnalyticsHeatmapHtml,
  buildAnalyticsOverviewModel,
  buildAnalyticsRecommendationModel,
  buildAnalyticsTrendHtml,
  buildDashboardStatsModel,
} from "./appAnalyticsView.js";
export {
  buildDashboardSetupSuggestion,
  buildDashboardSuggestionSignature,
  buildRecommendation,
  getPreferredRecommendedTopic,
} from "./appRecommendations.js";
export {
  readDismissedDashboardRecommendationSignature,
  writeDismissedDashboardRecommendationSignature,
} from "./appRecommendationDismissals.js";