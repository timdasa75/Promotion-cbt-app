# Refactor Implementation Plan (10-Topic Design)

## Objective
Deliver a faster, cleaner, and more maintainable CBT app aligned to the merged 10-topic curriculum model and the new directorate-first mock exam rollout.

## Phase 1: Data Integrity and Governance
- [x] Consolidate to a single JSON file per topic (10 files total) and retire auxiliary files.
- [x] Backfill missing subcategory IDs in key source files.
- [x] Add taxonomy validator script: `scripts/validate_taxonomy.py`.
- [x] Add separate mock exam config files:
  - `data/exam_templates.json`
  - `data/gl_band_weights.json`
- [x] Begin metadata pilot on:
  - `data/psr_rules.json`
  - `data/policy_analysis.json`
  - `data/leadership_negotiation.json`
- Scope: policy_analysis, leadership_negotiation, civil_service_ethics, psr_rules, financial_regulations, public_procurement, constitutional_foi, ict_digital, and general_current_affairs are now fully tagged for GL-band metadata coverage.

## Phase 2: Performance and Reliability
- [x] Add lightweight persistent cache for fetched topic files.
- [x] Use in-memory JSON caching for loaded topic/config payloads.
- [x] Simplify source loading for single-file topics.
- [x] Reduce debug logging in production mode.
- [x] Ensure template/GL-band config failures fall back to current mock behavior.

## Phase 3: UX Modernization
- [x] Add dashboard cards (recent score, weak areas, suggested next topic).
  - Dashboard now reflects total attempts, average score, streak, latest session context, and adaptive recommendation state from saved progress.
- [x] Add study filters: difficulty, source document, question count, session focus, and directorate emphasis.
  - Topic Session Setup now supports question-count, difficulty, source-document, Session Focus, and Directorate Emphasis controls before Practice, Timed Topic Test, and Study Review sessions begin.
- [x] Improve result insights (weakest subcategories + recommended next setup).
  - Results now surface the weakest session subcategory, the best next step, and a direct return to Session Setup when weak-area or directorate-emphasis tuning is the better follow-up.
- [x] Add persistent progress summary enhancements for template and GL-band analytics.
  - Saved attempts now retain `templateId`, `templateName`, `glBand`, `timeTakenSec`, `correctCount`, `wrongCount`, `unansweredCount`, `subcategoryBreakdown`, `difficultyBreakdown`, and `sourceTopicBreakdown`.
  - Dashboard and analytics screens now render live score trend, weekly consistency, topic mastery, and recommendation data from those saved fields.

## Phase 4: Assessment Features
- [x] Build curated mock templates mapped across all 10 topics.
- [x] Expose directorate-first mock templates:
  - General Mock
  - GL 14-15 Mock
  - GL 15-16 Mock
  - GL 16-17 Mock
- [x] Add GL-band topic weighting with normalized 40-question allocation.
- [x] Keep the balanced mock blueprint as the compatibility fallback.
- [x] Add retry-missed mode spanning sessions.
- [x] Add spaced-practice queue for weak questions.

## Next Focus
1. Use the complete metadata base to refine weak-area and directorate-emphasis recommendations further across more topic-session outcomes.
2. Refine scenario weighting further with subtopic-specific signals now that procurement, constitutional, ICT, and current affairs metadata are fully in place.
3. Extend loader resilience coverage beyond `fetchJsonFile(...)` into multi-file topic loading and cache-disabled fallbacks.

## Delivery cadence
- Integrity checks first (`scripts/validate_taxonomy.py`)
- Static syntax checks (`node --check` for touched modules)
- Unit tests (`npm run test:unit`)
- Smoke test of topic/category/mode/quiz/results flow (`npm run test:smoke`)
- Deploy and observe

## Definition of Done per PR
1. Taxonomy validation passes.
2. Existing topic/category/mode flows still work.
3. Mock exam start and completion still work with fallback behavior available.
4. Updated docs for behavior/schema changes.










