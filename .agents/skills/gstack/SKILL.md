---
name: gstack
description: Curated methodology index from garrytan/gstack (MIT). Use when running a CEO/eng/security/QA/release pass on a branch. Covers /cso security audit, /review pre-landing review, /qa browser QA, /ship release workflow. Distilled for tool-agnostic use; native gstack binary steps are marked DEGRADED.
origin: gstack
---

# gstack Methodology (Curated Index)

This skill distills four skills from [garrytan/gstack](https://github.com/garrytan/gstack) (MIT License) into checklists any AI coding tool can follow. gstack is designed for Claude Code; this index makes its methodology usable in ZCode, Codex, Cursor, etc.

> **Provenance:** Curated, not verbatim. Each section links to the canonical upstream SKILL.md. The full native install (Bun-compiled Chromium binary, slash-command registration, `~/.gstack/` runtime) is NOT required to follow the methodology here — but steps that depend on it are marked **[DEGRADED without native install]**.

## When to Activate

- A branch with security-sensitive changes (auth, payment, secrets, API endpoints) is ready for review
- Before landing/PR: you want a structured pre-landing review, not a vibes check
- Releasing: you want a ship-readiness gate before commit/push/PR
- You want to mimic a virtual engineering team (CEO, eng manager, reviewer, QA, release engineer) on demand

## Run Order

`/cso` → `/review` → `/qa` → `/ship`. Each phase's findings inform the next. `/cso` and `/review` are read-only; `/qa` and `/ship` may propose changes.

---

## /cso — Chief Security Officer Audit (read-only)

**Upstream:** https://raw.githubusercontent.com/garrytan/gstack/main/cso/SKILL.md
**Mode:** read-only, no code changes. Confidence gate: ≥8/10 (daily) or ≥2/10 (comprehensive).

### Phases

0. **Stack/framework detection** — build a mental model of the architecture (frontend, Worker, DB, third-parties).
1. **Attack surface census** — list every code + infra entry point (routes, webhooks, OAuth callbacks, payment endpoints, storage keys).
2. **Secrets archaeology** — scan `git log -p` history + working tree for `AKIA…`, `sk-`, `ghp_`, `xoxb-`, `Bearer `, `secret`, `password`, `FLW`, `flutterwave`, service keys. Check tracked `.env*`, inline CI secrets, committed `runtime-auth.js`.
3. **Dependency supply chain** — new deps in `package.json`; `postinstall` install scripts; lockfile integrity (`npm ci` clean); unpinned GitHub-action deps.
4. **CI/CD pipeline security** — `.github/workflows/*`: `pull_request_target`, `${{ github.event.* }}` injection into `run:` blocks, unpinned third-party actions, secrets exposed in logs.
5. **Infrastructure shadow surface** — Dockerfiles, IaC, wrangler configs, prod credentials in checked-in configs.
6. **Webhook & integration audit** — signature verification (Flutterwave webhook HMAC?), TLS verification disabled (`rejectUnauthorized: false`), over-broad OAuth scopes.
7. **LLM & AI security** — prompt injection, unsanitized model output, tool-calling validation. (Often N/A in this repo.)
8. **Skill supply chain** — scan installed `SKILL.md` files for exfil/prompt-injection patterns.
9. **OWASP Top 10 (A01–A10)** — targeted grep per category against the diff.
10. **STRIDE** — threat model per component (Spoofing, Tampering, Repudiation, Info disclosure, DoS, Elevation).
11. **Data classification** — RESTRICTED / CONFIDENTIAL / INTERNAL / PUBLIC per data field touched.
12. **False-positive filtering** — apply hard exclusions; require confidence ≥ gate; active verification (cite the motivating code line); variant analysis.
13. **Findings report** — every finding MUST include a concrete exploit scenario, confidence, fix. Track trends; produce remediation roadmap.
14. **Save JSON report** — `.gstack/security-reports/<YYYYMMDD>-<HHMMSS>.json`.

### Output shape (per finding)

```
SEVERITY: CRITICAL | HIGH | MEDIUM | LOW
CATEGORY: <OWASP / STRIDE / phase>
CONFIDENCE: 1–10
LOCATION: file:line
EXPLOIT: <concrete steps an attacker would take>
FIX: <specific code change>
```

---

## /review — Pre-Landing PR Review

**Upstream:** https://raw.githubusercontent.com/garrytan/gstack/main/review/SKILL.md
**Mode:** read-only analysis; may auto-fix mechanical issues, batch judgment calls.

### Steps

0. **Detect platform + base branch** (GitHub → `main`).
1. **Branch check** — abort if on base branch.
1.5. **Scope drift detection** — compare diff vs. stated intent (commit messages, PR description, TODOS.md). Flag unrelated changes.
2. **Read checklist** — critical categories below.
3. **`git diff` against merge-base** with the base branch (or working-tree diff if pre-commit).
4. **Critical pass** — each category; finding requires confidence 1–10 + pre-emit gate quoting the code line:
   - **SQL & Data Safety** — parameterized queries, no string concat in DB calls.
   - **Race Conditions** — TOCTOU, verify→save→history ordering, idempotency keys.
   - **LLM Output Trust Boundary** — model output validated before use. (Often N/A here.)
   - **Shell Injection** — no user input in shell args.
   - **Enum & Value Completeness** — switch/if over a finite set must handle every value (e.g. `PLAN_PRICES`, plan-cycle mapping).
4.5. **Review Army** — dispatch parallel subagents: testing, maintainability, security, performance, data-migration, api-contract, design. Adaptive gating by hit rate.
4.6. **Merge + dedupe + PR Quality Score.**
5. **Fix-first** — AUTO-FIX mechanical issues directly; batch ASK items into ONE AskUserQuestion.

### PR Quality Score

Weighted blend of: critical-category pass rate, specialist-subagent hit rate, scope-drift penalty, coverage gap count.

---

## /qa — QA Lead: Test → Fix → Verify  **[DEGRADED without native install]**

**Upstream:** https://raw.githubusercontent.com/garrytan/gstack/main/qa/SKILL.md
**Native-only:** gstack's Bun-compiled Chromium controller (`browse/dist/browse`) for interactive exploration. **Unavailable in ZCode.**

### Degraded mode (ZCode fallback)

Substitute the Playwright smoke harness (`npm run test:smoke`) for the browse binary. Limit to:

1. **Initialize** — confirm dev server boots (`npm run dev`).
2. **Authenticate** — use existing test fixtures; do NOT create real accounts.
3. **Orient + Explore (per page)** — visual scan, interactive elements census, form validation, navigation, console errors, responsiveness via Playwright.
4. **Document** — two evidence tiers: screenshot + reproduction steps.
5. **Triage** — health-score rubric (Console 15%, Links 10%, Visual 10%, Functional 20%, UX 15%, Performance 10%, Content 5%, A11y 15%).
6. **Fix loop** — minimal fix → atomic classification (verified / best-effort / reverted). Hard cap 50 fixes.

Output: `.gstack/qa-reports/qa-report-<domain>-<date>.md`. Label clearly as **QA-LITE** when the native binary was unavailable.

---

## /ship — Release Engineer (readiness review mode)

**Upstream:** https://raw.githubusercontent.com/garrytan/gstack/main/ship/SKILL.md
**Constraint:** under a "no commits" policy, run only Steps 1–3.8 as a readiness review. Do NOT execute Steps 4–8 (version bump, commit, push, PR).

### Readiness-only steps

1. **Pre-flight** — abort if on base branch; check Review Readiness (Eng Review is the only blocking gate).
1.5. **Distribution pipeline** — new binary/tool needs a release workflow?
2. **Merge base branch before tests** — simulate, don't execute.
2.5. **Test framework bootstrap** — detect runtime; if none, propose install (do NOT modify package.json under "no commits").
3. **Run tests** — `npm run test:unit`, `npm run test:smoke`. Triage failures as in-branch vs pre-existing (use `git blame`/`main` baseline).
3.4. **Test coverage audit** — trace every codepath in the diff; produce ASCII coverage diagram with ★/★★/★★★ ratings; flag GAPs; propose regression tests. **Iron rule: every regression gets a test.**
3.5. **Pre-landing review** — read `review/checklist.md` equivalent (see /review above).
3.8. **Adversarial review** — scale by diff size: <50 skip, 50–199 medium, 200+ large (all passes).

### Output

"Ship readiness" verdict (READY / NOT READY / BLOCKED) + the literal commit/PR commands the user would run themselves later. **Not executed by this skill.**

---

## Honest Limitations in ZCode

| Capability | Native gstack | ZCode (this skill) |
|---|---|---|
| Slash-command invocation (`/cso` etc.) | ✅ | ❌ — load skill, follow checklist |
| Bun Chromium controller for /qa | ✅ | ❌ — Playwright fallback, QA-LITE |
| gstack global runtime (`~/.gstack/`) | ✅ | ❌ — in-repo `.gstack/` reports only |
| Parallel "Review Army" subagents | ✅ (Claude) | ✅ via Agent tool |
| Auto-fix mechanical issues | ✅ | ✅ |
| Commit / push / `gh pr create` | ✅ | Manual / opt-in only |

---

## Resources

- Upstream: https://github.com/garrytan/gstack
- License: MIT (Free forever)
- Adding a host: `docs/ADDING_A_HOST.md` upstream
- Companion skills in this repo: `security-review` (ECC), `backend-patterns`, `verification-loop`, `e2e-testing`

---

**Ethos (from upstream `ETHOS.md`):** think → plan → build → review → test → ship. Boil the lake: complete the whole task, surface every gap, no drive-by suggestions.
