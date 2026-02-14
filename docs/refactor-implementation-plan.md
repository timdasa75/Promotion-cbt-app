# Refactor Implementation Plan (10-Topic Design)

## Objective
Deliver a faster, cleaner, and more maintainable CBT app aligned to the merged 10-topic curriculum model.

## Phase 1: Data Integrity and Governance (Current)
- [x] Consolidate to a single JSON file per topic (10 files total) and retire auxiliary files.
- [x] Backfill missing subcategory IDs in key source files.
- [x] Add taxonomy validator script: `scripts/validate_taxonomy.py`.
- [ ] Add question metadata standard (`sourceDocument`, `sourceSection`, `year`, `lastReviewed`) into all question pools.
- [ ] Run duplicate-question-ID cleanup.

## Phase 2: Performance and Reliability
- [ ] Add lightweight in-memory cache for fetched topic files.
- [ ] Add lazy loading with user feedback for large topic payloads.
- [x] Simplify source loading for single-file topics.
- [x] Reduce debug logging in production mode.

## Phase 3: UX Modernization
- [ ] Add dashboard cards (recent score, weak areas, suggested next topic).
- [ ] Add study filters: difficulty, source document, question count.
- [ ] Improve result insights (weakest subcategories + recommended retry path).
- [ ] Add persistent progress summary (localStorage baseline).

## Phase 4: Assessment Features
- [ ] Build curated mock exams mapped across all 10 topics.
- [ ] Add retry-missed mode spanning sessions.
- [ ] Add spaced-practice queue for weak questions.

## Delivery cadence
- Weekly release cycle with:
  - Integrity checks first (`scripts/validate_taxonomy.py`)
  - Feature implementation
  - Smoke test of topic/category/mode/quiz/results flow
  - Deploy and observe

## Definition of Done per PR
1. Taxonomy validation passes.
2. No broken category selections.
3. Quiz starts successfully for every top-level topic.
4. Updated docs for behavior/schema changes.
