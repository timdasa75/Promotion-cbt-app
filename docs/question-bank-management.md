# Question Bank Management — Design Spec

Status: **Approved design, not yet implemented.**
Decisions locked with the project owner on 2026-09-12: D1 overlay architecture,
inspector + editor V1 scope, single-admin editors.

---

## Problem

There is no way to manage question content from the app. Correcting a flagged
question is a fully manual loop:

1. A user submits feedback flagging a question (admin inbox).
2. The admin verifies the claim against the source rules document.
3. The admin hand-edits a private static JSON bank (`data/*.json`).
4. The admin redeploys the entire Worker to publish a one-line fix.

This loop is slow, error-prone, and entirely on one person. The
2026-09-11/12 feedback triage session fixed 9 submissions this way, including
5 confirmed wrong-answer questions — and one hand-edit accident (an overwrite
of `psr_rules.json` that had to be recovered from the deployed Worker's asset
copy) demonstrated exactly how fragile step 3 is.

## Constraints (the forces that shaped this design)

| Constraint | Consequence for the design |
|---|---|
| `data/*.json` banks are **gitignored private content** served via the Worker's `PROTECTED_CONTENT` static assets binding | Runtime writes cannot go to the bank files; Workers assets are immutable per deploy |
| Publishing today = `wrangler deploy` | Any design wanting "fix goes live immediately" needs a runtime-editable store |
| **D1 free tier: 5M row reads/day** (exhausted 2026-09-11, blocked all logins) | Storage approaches that multiply row reads per topic serve are unacceptable |
| Existing serve path already has a per-isolate parse cache + entitlement-scoped edge cache | Any overlay must integrate with these caches, not fight them |
| `data/answer_order.json` records canonical option permutations recorded once per question | Runtime edits **must not change option count** or scramble-manifest replay assumptions break |
| Banks are private (paid/premium content, entitlement-filtered at serve) | Overlay rows must never leak; merge happens inside the authenticated serve path only |
| Single human admin (`ADMIN_EMAILS = timdasa75@gmail.com`) | No draft/review workflow needed in V1 |

## Chosen architecture: D1 overlay over static base

Banks stay exactly where they are (static files, git-adjacent, deployed as
Worker assets). Edits are stored as **one D1 row per changed question**, and
the Worker merges the overlay onto the freshly parsed static bank at serve
time.

```
static bank (deploy-time asset)          question_edits (D1, live)
  psr_rules.json  ── parse cache ──┐      ┌ (topic_id, question_id) → payload
                                   ├────→ merge ─→ entitlement edge cache ─→ user
                                   │      └ version bump on every save
```

Why this wins:

- **Near-zero read cost.** A topic serve reads exactly the rows for questions
  that were edited — typically single digits, not the ~1,500-row whole-bank
  reads that motivated rejecting full-D1 storage. With the existing edge cache
  in front, steady-state cost is effectively zero.
- **Instant publishing.** Saving an edit bumps the topic's content version;
  the entitlement edge-cache key includes the version, so the next topic load
  serves the fix. No deploy.
- **Git stays canonical.** Phase 3 adds export-to-repo so edited questions are
  eventually folded back into the static banks and the overlay cleared.
- **The deployed Worker remains a full backup** of bank content — the same
  property that rescued the accidental overwrite during triage.

Rejected alternatives:

- **KV/R2 whole-file store** — every save rewrites a ~2MB file; no
  per-question audit trail; simpler, but strictly worse on cost and history.
- **Full D1 migration** — banks-as-rows multiply reads per serve; fastest
  route back to a quota outage. Rejected on the free tier.
- **Generate-and-deploy only** — safe, but keeps the slow deploy loop that
  motivated this work.

## Data model — migration `0011_question_edits.sql`

```sql
CREATE TABLE IF NOT EXISTS question_edits (
  topic_id     TEXT NOT NULL,
  question_id  TEXT NOT NULL,
  payload      TEXT NOT NULL,        -- full merged question JSON
  origin       TEXT NOT NULL DEFAULT 'manual',   -- manual | feedback
  feedback_id  TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'active',   -- active | reverted
  edited_by    TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (topic_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_question_edits_topic ON question_edits(topic_id);

CREATE TABLE IF NOT EXISTS content_meta (
  topic_id   TEXT PRIMARY KEY,
  version    INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
```

Notes:

- `status = 'reverted'` rows are retained for audit instead of being deleted;
  revert deletes the *active* row effect by flipping status and bumping the
  version.
- `content_meta.version` starts at 1 and increments on every successful save
  or revert for that topic.

## Serve-time merge

In `buildProtectedTopicDataPayload` (`workers/admin-bridge/worker.js`), after
`fetchProtectedAssetJson` returns the parsed static bank:

1. `SELECT question_id, payload FROM question_edits WHERE topic_id = ? AND status = 'active'`
2. For each row, replace the matching question inside the bank's
   subcategory structure (questions are located by `id`; unmatched rows are
   skipped and counted).
3. The response stays shape-identical to today's; add `editCount` and
   `contentVersion` fields for observability.

Cache integration:

- Per-isolate `protectedAssetDataCache` **unchanged** — it caches only the
  static base, which edits never mutate.
- Edge-cache key becomes `entitlement:topic:v{contentVersion}`. `content_meta`
  is read once per serve (1 row read); the version read is acceptable on the
  free tier and only occurs on cache misses.

## Admin API (all `verifyAdminCaller`; single admin = existing `ADMIN_EMAILS`)

| Route | Body | Behavior |
|---|---|---|
| `GET /adminQuestionEdits` | `{ topicId }` | Active overlay rows for the topic + static question count |
| `POST /adminSaveQuestionEdit` | `{ topicId, questionId, payload, origin?, feedbackId? }` | Validate → upsert → bump version |
| `POST /adminRevertQuestionEdit` | `{ topicId, questionId }` | Mark row `reverted` → bump version (serves static again) |

### Save validation (guardrails from the 2026-09-12 incident)

- Question must exist in the static bank (V1 edits in place; no add/delete).
- **Option count must not change** — protects `answer_order.json` semantics.
- `correct` must be an integer index within bounds.
- Stem and explanation must be non-empty, with length caps (stem ≤ 600 chars,
  explanation ≤ 2,000).
- `difficulty` normalized to `easy|medium|hard`; `reviewStatus` to
  `approved|needs_review`; `lastReviewed` stamped server-side on save.

## Admin UI — "Question Bank" tab

- Topic picker → search (by question id or stem text) → question list with
  **overlay badges** (edited questions marked) and **feedback flags** (open
  `question_issue` feedback referencing the question).
- Editor: stem, options + correct-answer radio, explanation, difficulty,
  status. Save/Revert.
- **Feedback-to-fix flow:** the admin feedback inbox gains a "Fix question"
  action on `question_issue` items that opens the editor pre-loaded with the
  flagged question and, on save, auto-resolves the feedback with the reply
  text. This collapses the triage session's manual loop into two clicks.

## Out of scope for V1

Adding/deleting questions, new banks, draft/published states, multi-admin
roles, scramble re-runs, option add/remove, and the git-export canonization
flow (Phase 3 follow-up).

## Verification plan

- Unit tests: merge logic (replace/skip/count), validation acceptance and
  rejection cases, route auth (401 unauthenticated; non-admin forbidden),
  cache-key versioning behavior, migration 0011 columns exist.
- `node --check` on touched JS; full `npm run test:unit`;
  `npm run audit:topic-banks` (data untouched, but asserts no drift);
  `npm run check:worker-routes` for the three new routes.
- Deploy: `wrangler d1 migrations apply AUTH_DB --remote` then
  `npx wrangler deploy`; Pages deploy only if UI changed (it does).
