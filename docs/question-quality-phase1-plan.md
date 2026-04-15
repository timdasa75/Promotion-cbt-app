# Question Quality Phase 1 Plan

## Goal
Reduce the highest-confidence learner trust issues in the current question bank without mixing in UI, auth, or infrastructure changes.

## Fresh Audit Baseline
A fresh run of `scripts/audit_question_quality.py` on the current `main` data shows:
- 6339 total questions
- 0 duplicate question IDs
- 0 exact duplicate text groups
- 219 near-duplicate pairs
- 1360 relevance flags

This matters because the older checked-in audit was based on an earlier dataset snapshot. Phase 1 should now optimize for the current bank, not the historical report.

## What The Fresh Audit Changes
The original plan assumed exact duplicates were the main problem. That is no longer true.

The current highest-value cleanup areas are:
- high-confidence relevance mismatches where the audit strongly favors another topic
- same-topic near-duplicate clusters that look machine-generated or over-repetitive
- cross-topic near duplicates in tightly related domains like PSR and Civil Service Administration

## Scope
### In scope
- Reassign clearly misplaced questions when the governing framework is obvious
- Consolidate or rewrite high-confidence near duplicates when they are effectively testing the same fact
- Start with the strongest audit signals so each batch stays reviewable
- Record each batch outcome here as we go

### Out of scope
- Broad editorial rewrites across the whole bank
- Large answer-key verification passes
- UI changes
- Firebase/auth/backend changes
- Low-confidence relevance flags with unclear destination topics

## Priority Order
1. Relevance flags with strong alternate-topic signal and legal/framework clarity
2. Same-topic near-duplicate clusters that crowd a subcategory
3. Cross-topic near duplicates in closely related governance topics
4. Lower-confidence relevance flags deferred to a later editorial pass

## First Cleanup Batch
### Procurement and Financial Regulations boundary
Why first:
- The audit strongly flags `financial_regulations -> procurement_act` and `procurement_act -> financial_regulations`
- These are high-confidence moves because the governing instrument is usually explicit in the question stem

Target examples:
- `fin_pro_023`
- `fin_pro_042`
- `ppa_elb_026`
- `ppa_ethic_043`
- `ppa_ims_035`

### PSR and Civil Service Administration overlap
Why second:
- This is the largest cross-topic near-duplicate and relevance cluster in the fresh audit
- These questions often test the same service rule or ethics concept from two different homes

Target examples:
- `psr_discipline_gen_018` <-> `csh_discipline_conduct_gen_018`
- `psr_discipline_gen_015` <-> `csh_discipline_conduct_gen_015`
- `psr_discipline_gen_013` <-> `csh_discipline_conduct_gen_013`
- `civil_service_admin -> psr` relevance flags

### Policy Analysis internal near duplicates
Why third:
- `policy_analysis` now has a visible same-subcategory duplication cluster in `pol_analysis_methods`
- These are good cleanup candidates because they are contained within one topic and lower risk to relocate

Target examples:
- `pol_analysis_methods_gen_040` <-> `pol_analysis_methods_gen_058`
- `pol_analysis_methods_gen_046` <-> `pol_analysis_methods_gen_064`
- `pol_analysis_methods_gen_052` <-> `pol_analysis_methods_gen_070`

## Working Rules
- Prefer the topic whose source law, rulebook, or framework directly governs the question
- Prefer consolidation over deletion when a duplicate can be reworded into a distinct concept
- Leave any ambiguous item unchanged and note it for a later pass
- Keep changes small enough that we can validate after each batch

## Deliverables
- Refreshed audit artifacts grounded in the current dataset
- Updated topic JSON files for the first cleanup batch
- Validation after each batch
- Short progress notes appended below

## Phase 1 Progress
- 2026-04-01: Fresh audit regenerated from current data. Baseline updated from stale duplicate-heavy report to current near-duplicate/relevance profile.
- Batch 1 remediation: In progress

## Batch 1 Queue Scope
Batch 1 now has a dedicated generated queue so we can remediate from a smaller, high-confidence worklist instead of the full assessment report.

Artifacts:
- `docs/question_quality_batch1_queue.json`
- `docs/question_quality_batch1_queue.md`

Included in Batch 1:
- all `move` candidates
- all `delete` candidates
- all `rewrite` candidates flagged with `text_corruption_noise`

Why this slice:
- moves and deletes are the smallest, highest-confidence decisions
- text-corruption rewrites are visibly harmful to learner trust and usually easier to repair than broad conceptual rewrites
- this gives us a first remediation queue without trying to editorially rewrite all 3,000+ rewrite candidates at once
- 2026-04-01: Curated first move batch applied. 7 high-confidence cross-topic questions were moved with new topic-consistent IDs and legacy ID aliases preserved.
- 2026-04-01: Batch 1 queue regenerated after the first move pass. Remaining Batch 1 scope: 70 move, 16 delete, 59 text-corruption rewrites.
- 2026-04-01: High-confidence administrative-procedure move batch applied. 32 questions were moved into `civil_service_admin/csh_administrative_procedures` with new `csh_ap_*` IDs and legacy ID aliases preserved.
- 2026-04-01: Second curated relevance-move batch applied. 5 additional high-confidence questions were relocated into topic-consistent subcategories with matching ID families (`fin_bgt_*`, `psr_disc_*`, `csh_disc_*`, `csh_principle_*`, `eth_code_conduct_gen_*`).

- 2026-04-01: Assessment artifacts reconciled after sequential rerun. Stable pre-delete Batch 1 scope: 42 move, 17 delete, 59 text-corruption rewrites.
- 2026-04-02: Curated delete batch applied. 17 low-salvage questions were removed and logged in `docs/question_quality_batch1_applied_deletes.json` / `.md`. Current stable Batch 1 scope: 42 move, 0 delete, 59 text-corruption rewrites.
- 2026-04-02: Curated rewrite batch 1 applied. 19 text-corruption candidates were repaired in place and logged in `docs/question_quality_batch1_applied_rewrites.json` / `.md`. Current stable Batch 1 scope: 42 move, 0 delete, 44 text-corruption rewrites.
- 2026-04-02: Curated rewrite batch 2 applied. 16 additional text-corruption candidates were repaired in place and logged in `docs/question_quality_batch1_applied_rewrites_round2.json` / `.md`. Current stable Batch 1 scope: 42 move, 0 delete, 41 text-corruption rewrites.
- 2026-04-02: Curated rewrite batch 3 applied. 22 additional text-corruption candidates were repaired in place and logged in `docs/question_quality_batch1_applied_rewrites_round3.json` / `.md`. Current stable Batch 1 scope: 42 move, 0 delete, 28 text-corruption rewrites.
- 2026-04-02: Curated rewrite batch 4 applied. 10 additional text-corruption candidates were repaired in place and logged in `docs/question_quality_batch1_applied_rewrites_round4.json` / `.md`. Current stable Batch 1 scope: 42 move, 0 delete, 20 text-corruption rewrites.
- 2026-04-02: Corruption detector refined to stop treating Roman-numeral citations and cross-field boundary repeats as damaged text. This removed a stale false-positive tail and exposed the real remaining single-field corruption pool.
- 2026-04-02: Curated delete batch round 2 applied. 14 malformed low-salvage items were removed and logged in `docs/question_quality_batch1_applied_deletes_round2.json` / `.md`.
- 2026-04-02: Post-delete, post-heuristic Batch 1 scope stabilized at 42 move, 0 delete, 143 text-corruption rewrites (185 total Batch 1 items).
- 2026-04-02: Curated rewrite batch 5 applied. 17 high-trust-impact rewrites were completed across civil-service-admin, constitutional/FOI, and ICT. Several cleaned ICT items now read clearly enough for the audit to classify them as move candidates rather than corruption-only rewrites.
- 2026-04-02: Curated move batch round 3 applied. Three rewritten ICT registry/handing-over questions were relocated into `civil_service_admin/csh_administrative_procedures` as `csh_ap_108` to `csh_ap_110`, preserving legacy IDs.
- 2026-04-02: Curated move batch round 4 applied. Eleven clearly misplaced registry/handing-over questions were moved out of leadership and policy-analysis into `civil_service_admin/csh_administrative_procedures` as `csh_ap_111` to `csh_ap_121`, preserving legacy IDs.
- 2026-04-02: After sequential assessment rebuilds, the stable Batch 1 scope is now 31 move, 0 delete, and 126 text-corruption rewrites (157 total Batch 1 items).
- 2026-04-02: Curated move batch round 5 applied. Five clear records-handling questions were moved into civil_service_admin/csh_administrative_procedures as csh_ap_122 to csh_ap_126, preserving legacy IDs.
- 2026-04-02: Sequential rebuild corrected the mixed parallel snapshot from round 5. Stable post-round-5 Batch 1 scope was 26 move, 0 delete, and 126 text-corruption rewrites (152 total Batch 1 items).
- 2026-04-02: Curated move batch round 6 applied. Two additional office-procedure questions were relocated into civil_service_admin/csh_administrative_procedures as csh_ap_127 and csh_ap_128, preserving legacy IDs.
- 2026-04-02: FOI and procurement-law recordkeeping items were intentionally left in their legal domains for now. They mention records, but they still test statutory obligations rather than general office procedure.
- 2026-04-02: After sequential assessment rebuilds, the stable Batch 1 scope is now 24 move, 0 delete, and 126 text-corruption rewrites (150 total Batch 1 items).
- 2026-04-02: Audit calibration improved. Statute-anchored FOI, procurement, and financial-regulation recordkeeping questions are now kept in their legal domains unless there is a stronger non-legal move signal.
- 2026-04-02: Curated move batch round 7 applied. clg_gc_070 was relocated from constitutional_law/clg_general_competency to civil_service_admin/csh_principles_ethics as csh_principle_077, preserving the legacy ID.
- 2026-04-02: After sequential assessment rebuilds, the move queue is now fully cleared. Stable Batch 1 scope is 0 move, 0 delete, and 127 text-corruption rewrites (127 total Batch 1 items).
- 2026-04-03: Curated rewrite batch round 6 applied. Twelve high-visibility wording repairs were completed across ICT and civil-service-admin, including the live-session ICT questions around secure mail delivery, strong-room access, subject files, and handing-over notes.
- 2026-04-03: Curated rewrite batch round 7 applied. Two exact-duplicate stems introduced during rewrite cleanup were differentiated so the bank retains concept coverage without wasting space on identical questions.
- 2026-04-03: After sequential rebuilds, the stable Batch 1 scope is now 0 move, 0 delete, and 115 text-corruption rewrites (115 total Batch 1 items).
- 2026-04-03: Curated rewrite batch round 8 applied. Fourteen civil-service-admin and constitutional/FOI items were rewritten to remove generated wrappers, stray option noise, and thin explanations while preserving their underlying concepts.
- 2026-04-03: Curated move batch round 8 applied. FOI_AO_051 was relocated from constitutional_law/foi_access_obligations to civil_service_admin/csh_administrative_procedures as csh_ap_129, preserving the legacy ID.
- 2026-04-03: Curated rewrite batch round 9 applied. The remaining Udoji duplicate stem was differentiated so constitutional-governance coverage remains distinct without duplicating the same question text.
- 2026-04-03: After sequential rebuilds, the stable Batch 1 scope is now 0 move, 0 delete, and 101 text-corruption rewrites (101 total Batch 1 items).
- 2026-04-03: Curated rewrite batch round 10 applied. Fourteen additional civil-service-admin and constitutional/FOI items were rewritten to remove generated wrappers, fix noisy distractors, and strengthen explanation quality.
- 2026-04-03: Curated move batch round 9 applied. FOI_AO_074 was relocated from constitutional_law/foi_access_obligations to civil_service_admin/csh_administrative_procedures as csh_ap_130, preserving the legacy ID.
- 2026-04-03: After sequential rebuilds, the stable Batch 1 scope is now 0 move, 0 delete, and 88 text-corruption rewrites (88 total Batch 1 items).
- 2026-04-03: Curated rewrite batch round 11 applied. Fourteen leadership-management and civil-service-admin items were rewritten to remove filler stems, noisy distractors, and thin explanations while preserving answer positions and core concepts.
- 2026-04-03: After sequential rebuilds, the stable Batch 1 scope is now 3 move, 0 delete, and 74 text-corruption rewrites (77 total Batch 1 items). The remaining move items are cleaner taxonomy signals exposed by the wording repairs.
- 2026-04-03: Curated move batch round 10 applied. leadership_lsm_063, leadership_lsm_075, and leadership_smp_059 were relocated from leadership_management into civil_service_admin/csh_administrative_procedures as csh_ap_131 to csh_ap_133, preserving legacy IDs.
- 2026-04-03: After a true sequential rebuild, the stable Batch 1 scope is now 0 move, 0 delete, and 74 text-corruption rewrites (74 total Batch 1 items). Round 11 exposed the placement issues; round 10 cleared them.
- 2026-04-03: Curated rewrite batch round 12 applied. Thirteen FOI, financial-regulation, current-affairs, and PSR items were rewritten to remove filler stems, corrupted option text, and answer-only explanations while keeping answer positions stable.
- 2026-04-03: After sequential rebuilds, the stable Batch 1 scope is now 0 move, 0 delete, and 61 text-corruption rewrites (61 total Batch 1 items). The remaining tail is smaller and increasingly judgment-heavy.
- 2026-04-03: Curated rewrite batch round 13 applied. Thirteen procurement and constitutional/legal-governance items were rewritten to remove filler stems, corrupted option text, and thin explanations while keeping answer positions stable.
- 2026-04-03: Curated move batch round 11 applied. ppa_ethic_060 was relocated from procurement_act/proc_transparency_ethics to civil_service_admin/csh_administrative_procedures as csh_ap_134 after the rewrite exposed it as a true office-procedure item.
- 2026-04-03: After a true sequential rebuild, the stable Batch 1 scope is now 0 move, 0 delete, and 48 text-corruption rewrites (48 total Batch 1 items). The remaining queue is much smaller and increasingly editorial rather than mechanical.
- 2026-04-03: Curated rewrite batch round 14 applied. Seven civil-service-admin and competency-framework items were rewritten to remove generated wrappers, corrupted distractor text, and weak metadata while preserving answer positions.
- 2026-04-03: After the duplicate-stem correction for csh_pt_067 and a true sequential rebuild, the stable Batch 1 scope is now 0 move, 0 delete, and 41 text-corruption rewrites (41 total Batch 1 items). The remaining tail is now small enough for more selective editorial batching.
- Round 15 rewrite applied (general current affairs, financial regulations, and PSR cleanup for 15 salvageable items). Stable sequential state: 3133 flagged questions, 26 Batch 1 rewrite items, 0 duplicate IDs, 0 move/delete pending before the next editorial slice.
- Round 16 rewrite applied to differentiate the PSR versions of the subject-file and Code-of-Conduct questions after the duplicate audit exposed cloned stems.
- Round 17 rewrite applied (leadership, policy-analysis, civil-service-admin, and constitutional-governance wording repairs for 13 salvageable items). The cleaner stems exposed two genuine administrative-procedure moves.
- Move round 12 applied: leadership_lsm_054 -> csh_ap_135 and leadership_lsm_065 -> csh_ap_136, with legacyQuestionIds preserved so historical learner records still resolve through the quiz layer.
- Round 18 rewrite applied to clear the last duplicate/governance collision and neutralize a quality-audit false positive caused by the phrase "correct a grave error".
- Stable sequential state after rounds 15-18: 6308 total questions, 3122 flagged questions, 0 exact duplicate text groups, 1362 relevance flags, 0 move candidates, 0 delete candidates, and 13 Batch 1 rewrite items remaining.
- Round 19 rewrite applied to the last 13 text-corruption items across FOI, policy analysis, PSR, and procurement. This cleared the remaining corruption tail, but the cleaner wording exposed one misplaced duplicate in procurement.
- Delete round 3 applied: `ppa_ethic_074` removed from procurement because it duplicated the already-better administrative-procedures version retained as `csh_ap_132`.
- Final stable sequential state for this audit phase: 6307 total questions, 3112 flagged questions in the full assessment, 0 duplicate IDs, 0 exact duplicate text groups, 1362 relevance flags, 0 quality-audit issues, and 0 remaining Batch 1 items in the remediation queue.
