# Stitch UI Extraction Brief

This brief turns the Stitch concepts into an implementation guide for the existing Promotion CBT app.

It is intentionally opinionated:
- adopt the strong visual ideas
- fix anything that conflicts with the real product
- reject anything that is fake, off-brand, or incompatible with the current architecture

Grounding:
- Current learner screens live in `index.html`
- Visual styling lives primarily in `css/styles.css`
- Dashboard, auth, profile, and analytics behavior lives in `js/app.js`
- Quiz and results behavior lives in `js/quiz.js`

## Global Guidance

### Adopt
- Stronger visual hierarchy with more premium section framing.
- Larger headline moments on splash, results, and analytics.
- Clearer recommendation emphasis on the dashboard and session setup screens.
- More deliberate card rhythm, spacing, and contrast between primary and secondary actions.
- Better use of progress visuals for topics, subcategories, and mastery states when backed by real data.
- Public Sans plus Inter as a design reference if we decide to refresh typography.

### Fix
- Keep the product name `Promotion CBT` everywhere.
- Preserve the current screen flow and JS hooks instead of replacing the app with standalone pages.
- Use only real product copy, real features, and real data.
- Keep the current learner actions: Resume Last Session, Best Next Step, Retry Missed, Spaced Practice, Review Mistakes, Analytics, Profile and Settings, Help and About.
- Keep Study Review aligned with the real behavior: answer-first review with explanations visible.
- Keep Directorate Mock Exam and current session tuning controls intact.
- Keep CSP-safe assets and self-hosted implementation patterns.

### Reject
- The `Sovereign Scholar` rename.
- Fake trust/compliance claims like `DHS compliant`, `AES-256 encrypted`, `10,000 professionals`, invented version labels, or made-up benchmark language.
- Remote Google-hosted stock images as required UI content.
- Tailwind CDN based implementation inside the live app.
- Bottom-tab navigation that changes the existing IA.
- Fake features not present in the product, such as new privacy settings suites, upload workflows, sound-effects settings, mark-for-review logic, or made-up exam facts.

## Screen-by-Screen Extraction

### 1. Splash / Welcome
Current surface:
- `#splashScreen` in `index.html`
- `.hero-panel` in `css/styles.css`

Adopt:
- A stronger hero composition with a more editorial headline.
- A more premium primary CTA treatment for `Start Learning`.
- A visually distinct secondary CTA for `Resume Last Session` when available.
- More intentional atmosphere in the background layer so the screen feels like a product landing moment, not a generic card.

Fix:
- Keep the current product framing for Nigerian Federal Civil Service promotion preparation.
- If we use imagery, it should be optional and self-hosted. A non-photographic background treatment is safer.
- Keep the real actions and avoid fake social proof.

Reject:
- `Official Portal`, `10k professionals`, and fake versioning.
- Any footer copy implying official government endorsement unless that is legally true.

Implementation notes:
- Rework `.hero-panel`, splash CTA styling, and supporting atmosphere in `css/styles.css`.
- Preserve `#startLearningBtn` and `#splashResumeBtn` wiring exactly as-is.

### 2. Dashboard + Topic Selection
Current surface:
- `#topicSelectionScreen` in `index.html`
- Recommendation and stat layouts in `css/styles.css`
- Actions and recommendation state in `js/app.js`

Adopt:
- Stronger asymmetry between stats and recommendation cards.
- More visual priority for `Continue Session` and `Best Next Step`.
- Cleaner quick-action styling for Retry Missed, Spaced Practice, Review Mistakes, Analytics, Profile and Settings, and Help.
- Topic cards that feel more premium and scannable, including progress or mastery cues when real data exists.

Fix:
- Preserve the search field and topic filter chips already in the product.
- Preserve free-plan and premium access messaging.
- Use real topic names and real progress values only.

Reject:
- Replacing the current header with a bottom-nav dashboard shell.
- Fake greeting copy such as `Good Morning, Officer` unless we deliberately want time-based personalization.

Implementation notes:
- Improve `#topicSelectionScreen .dashboard-grid`, `.recommendation-card`, `.topic-grid-shell`, and topic card styling in `css/styles.css`.
- Keep existing action bindings in `js/app.js`, especially `resumeSessionBtn`, `startRecommendationBtn`, `retryMissedBtn`, and `spacedPracticeBtn`.

### 3. Topic Subcategory Selection
Current surface:
- `#categorySelectionScreen` in `index.html`
- Category card rendering in `js/ui.js`
- Category styling in `css/styles.css`

Adopt:
- A more premium summary header for the selected topic.
- Better prominence for total questions and confidence/mastery cues.
- Cleaner, more scannable category cards.

Fix:
- Only show metrics we can actually compute.
- Keep `Select All` and locked/free behavior intact.
- Keep real subcategory names and question counts from the topic files.

Reject:
- Invented subcategories, counts, or mastery percentages.

Implementation notes:
- Improve `.category-summary-card` and `#categorySelectionScreen #categoryList .topic-card`.
- Keep `displayCategories()` output structure compatible with the current click handling in `js/ui.js`.

### 4. Session Setup
Current surface:
- `#modeSelectionScreen` in `index.html`
- Mode cards and filter panels in `css/styles.css`
- Setup orchestration in `js/app.js` and `js/app/mockSetup.js`

Adopt:
- Cleaner mode card hierarchy.
- Better framing of `Session Tuning` so filters feel grouped and easy to scan.
- A more premium recommendation block for suggested setup.
- Stronger visual separation between standard topic sessions and Directorate Mock setup.

Fix:
- Preserve all current session types and their real meanings.
- Preserve mock profile selection and current study-filter controls.
- Keep the current progressive disclosure for mock setup and study filters.

Reject:
- Rewriting Study Review as missed-only mode.
- Replacing working select controls with decorative widgets that add complexity without product value.

Implementation notes:
- Rework `#modeSelectionScreen .screen-header`, `#sessionModeGrid`, `.study-filter-panel`, `.mock-setup-panel`, and `.setup-suggestion-strip` in `css/styles.css`.
- Keep behavior untouched in `js/app.js` and `js/app/mockSetup.js`.

### 5. Quiz Experience
Current surface:
- `#quizScreen` in `index.html`
- Quiz rendering and state in `js/quiz.js`
- Quiz styling in `css/styles.css`

Adopt:
- Cleaner question framing with stronger contrast between question, answers, and explanation.
- A more intentional progress strip and top bar.
- A better desktop treatment for the question map and explanation panel.
- More polished option states for default, selected, correct, incorrect, and review contexts.

Fix:
- Preserve keyboard shortcuts, timer logic, progress logic, review controls, and question map behavior.
- Preserve the current action model: Previous, Submit, Next, End Exam.
- Keep explanation visibility tied to the real mode behavior.

Reject:
- Bottom navigation on quiz screens.
- Fake `Did you know?` sidebars or invented exam tips.
- New mark-for-review functionality unless we explicitly build it later.
- Avatar-heavy chrome that distracts from the question.

Implementation notes:
- Rework `#quizScreen .quiz-topbar`, `.question-card`, `.options-grid`, `.explanation`, and `.quiz-actions` in `css/styles.css`.
- Keep DOM ids like `progressFill`, `timeLeft`, `questionMap`, and `reviewControls` stable for `js/quiz.js`.

### 6. Results
Current surface:
- `#resultsScreen` in `index.html`
- Result calculations and CTA logic in `js/quiz.js`
- Results styling in `css/styles.css`

Adopt:
- A more dramatic score hero.
- A tighter layout that groups score, insight, and stat cards more clearly.
- Better visual separation for the category or topic breakdown.
- More premium styling for next-step actions.

Fix:
- Keep the real pass threshold, timing summary, and follow-up CTA logic.
- Preserve `Retake Session`, `Review Last Session`, `Use Suggested Next Step`, and `Review Missed Questions` behaviors.

Reject:
- Generic motivational copy that is not backed by actual results.
- Hard-coded insight text or hard-coded topic strengths.

Implementation notes:
- Rework `.result-hero`, `#resultsStats`, and `.results-breakdown-shell` in `css/styles.css`.
- Keep button ids and visibility logic intact in `js/quiz.js`.

### 7. Review Mistakes
Current surface:
- `#reviewMistakesScreen` in `index.html`
- Styling in `css/styles.css`

Adopt:
- Better card hierarchy for question, user answer, correct answer, and explanation.
- Clearer filter styling.
- A more deliberate editorial tone for review content.

Fix:
- Keep the current product meaning: review mistakes, not an entirely new `Mistake Bank` feature set.
- Use only real metadata and existing filtering capabilities.

Reject:
- Fake dates, fake grade levels, and fake source citations.
- Expanded explanation patterns that imply data not currently stored.

Implementation notes:
- Rework `.review-mistakes-toolbar`, `.review-mistake-card`, and details styling in `css/styles.css`.

### 8. Analytics
Current surface:
- `#analyticsScreen` in `index.html`
- Rendering in `renderAnalyticsScreen()` inside `js/app.js`
- Styling in `css/styles.css`

Adopt:
- A more premium `Directorate Insights` feel for analytics.
- Stronger emphasis on overall readiness, trend, and priority focus.
- Better visual storytelling for heatmap and recommendation cards.

Fix:
- Only show readiness or mastery statements when supported by real thresholds in the app.
- Use the real analytics structures the app already computes.
- Preserve the current cards: score trend, weekly consistency, topic mastery heatmap, and recommendation.

Reject:
- Fabricated benchmark statements like `Ready for Exam` unless we explicitly define that rule in-product.
- Fake topic names or metrics.

Implementation notes:
- Rework `#analyticsScreen .analytics-history-grid`, `.analytics-grid`, `.heatmap-grid`, and recommendation card styling.
- Keep the data contract in `renderAnalyticsScreen()` stable.

### 9. Profile and Settings
Current surface:
- `#profileScreen` in `index.html`
- Profile and sync rendering in `js/app.js`
- Styling in `css/styles.css`

Adopt:
- Stronger identity card treatment.
- Better grouping between account actions, privacy/data, sync state, and premium upgrade submission.
- More premium layout for upgrade evidence and status.

Fix:
- Preserve the current product reality: cloud sync status, retry sync, password change, logout, and manual premium evidence submission.
- Preserve the actual upgrade fields already present in the form.

Reject:
- New settings categories that do not exist yet, such as sound effects, exam alerts, and export workflows.
- Fake subscription labels, storage values, or sync timestamps.

Implementation notes:
- Rework `.profile-account-card`, `.profile-data-card`, `.profile-upgrade-shell`, and action rows in `css/styles.css`.
- Keep ids and submission flow intact in `js/app.js`.

### 10. Authentication Modal
Current surface:
- `#authModal` in `index.html`
- Modal behavior in `openAuthModal()` in `js/app.js`
- Auth styling in `css/styles.css`

Adopt:
- Cleaner, more premium auth card styling.
- Better tab styling for Login and Register.
- Stronger field hierarchy and clearer trust cues.

Fix:
- Keep the app name `Promotion CBT`.
- Keep login/register fields and forgot-password behavior intact.
- Use truthful trust messaging tied to the actual auth mode hint already shown in the app.

Reject:
- `Sovereign Scholar`, `Secure Access Gateway`, `DHS compliant`, and other fabricated security or institutional claims.
- Guest or free-module flows that do not match the current app rules.

Implementation notes:
- Rework `.auth-modal-card`, `.auth-tabs`, `.auth-form`, `.auth-field`, and `.auth-message` in `css/styles.css`.
- Keep `openAuthModal()` and tab switching in `js/app.js` unchanged.

## Implementation Priority

### Phase 1: Highest-value visible wins
- Splash / Welcome
- Dashboard + Topic Selection
- Session Setup
- Results

### Phase 2: Core study flow polish
- Quiz Experience
- Topic Subcategory Selection
- Review Mistakes

### Phase 3: Supporting surfaces
- Analytics
- Profile and Settings
- Authentication Modal

## Definition of Done
- The updated UI still uses the current DOM ids and screen flow.
- No fake compliance, usage, or benchmark claims are introduced.
- No CSP-breaking dependencies are required.
- The app feels more premium and structured without becoming a different product.
- The strongest Stitch ideas are visible in hierarchy, spacing, recommendation emphasis, and study-flow clarity.
