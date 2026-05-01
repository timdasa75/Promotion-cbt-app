# Security Notes

## Accepted Alerts

- Date: 2026-04-27
- Scope: `functions` package only (`d:\MyApps\promotion-cbt\Promotion-cbt-app\functions\package-lock.json`)
- Current direct dependency baseline:
  - `firebase-admin` `^13.8.0`
  - `firebase-functions` `^7.2.5`
- Main app status:
  - root app dependency audit has been cleaned separately
  - remaining GitHub Dependabot alerts are limited to the Functions dependency tree

### Remaining reviewed alerts

1. `@tootallnate/once` - low
2. `uuid` - medium

### Why they remain

- Both alerts are transitive dependencies pulled in by the Firebase / Google SDK chain used by the Functions package.
- We already applied the safe non-breaking updates available at this layer:
  - upgraded `firebase-admin`
  - upgraded `firebase-functions`
  - refreshed the lockfile with `npm audit fix`
- GitHub re-analysis confirmed that the previously higher-severity alerts tied to older resolved versions (for example `node-forge`, `protobufjs`, `fast-xml-parser`, `flatted`, and `path-to-regexp`) were cleared after the lockfile update.
- The remaining two alerts are still pinned under upstream dependency ranges, so forcing overrides would be higher risk than the benefit currently justifies.

### Review rationale

- We are intentionally keeping the current Firebase Functions stack for compatibility and support.
- The remaining alerts are:
  - lower severity than the issues already remediated
  - not introduced by application code directly
  - dependent on upstream SDK dependency movement
- Plan:
  - monitor the next `firebase-admin` / `firebase-functions` / Google SDK releases
  - re-run Functions package audit after each dependency bump
  - remove this note once upstream transitive fixes land cleanly

## Protected Content Delivery

- Date: 2026-04-28
- Goal: stop shipping the full premium question bank inside the public frontend build.

### What changed

- `vite.config.js` now copies only public-safe metadata:
  - `data/topics.json`
  - `data/exam_templates.json`
  - `data/gl_band_weights.json`
- The full topic banks are no longer copied into `dist/data`, and the private bank JSON files are now intentionally kept out of the public repo.
- `workers/admin-bridge/worker.js` now exposes a protected `POST /content/topic-data` route.
- `workers/admin-bridge/wrangler.toml` binds `../../data` as private Worker assets under `PROTECTED_CONTENT`.
- `js/topicSources.js` now loads topic banks through the Worker instead of direct public file fetches.

### Why the split matters

- `topics.json` is lightweight catalogue metadata and is safe to keep public.
- The large topic-bank JSON files are the sensitive assets, because they contain the full question corpus.
- By moving those files behind authenticated Worker requests, plan checks now happen before the browser receives topic-bank content.

### Current entitlement enforcement

- Free users:
  - first `3` study topics
  - first `5` subcategories per topic
  - first `20` questions per subcategory
- Premium/admin users:
  - full topic-bank access

### Important limitation

- This reduces browser-side scraping significantly, but it does not erase previously published source files from old git history.
- If source secrecy is also a goal, the repo itself should be made private only after hosting is moved away from GitHub Pages or upgraded to a plan that supports private-repo Pages.

## Private Topic-Bank Source Assets

- Date: 2026-04-29
- Goal: keep the full question-bank source files available for local Worker deployments without publishing them in the public repository.

### What changed

- The full topic-bank JSON files under `data/` are no longer tracked by git.
- They remain on disk locally and are still read by:
  - the Worker private asset binding in `workers/admin-bridge/wrangler.toml`
  - local maintenance/import scripts that operate on the question bank
- `.gitignore` now keeps these files private by default while allowing only the public-safe metadata files to remain tracked:
  - `data/topics.json`
  - `data/exam_templates.json`
  - `data/gl_band_weights.json`

### Operational note

- A fresh clone of the public repo will not include the private topic-bank JSON files.
- To deploy or maintain the protected content route locally, you must restore those bank files into `data/` from your private copy before running Worker deploys or content-maintenance scripts.

## Private Root-Level Source Artifacts

- Date: 2026-04-29
- Goal: stop publishing the original source PDF/DOCX materials in the public repository while preserving local maintenance workflows.

### What changed

- The following root-level source artifacts are no longer tracked by git:
  - `Promotion  Exams CBT Questions.pdf`
  - `CONSOLIDATED QUESTION BANK REPORT.docx`
- They remain on disk locally and can still be used by maintenance/import scripts that reference them directly.
- `.gitignore` now keeps these files private by default.

### Operational note

- A fresh public clone will not include these root-level source artifacts.
- If you need to run the extraction/import scripts that depend on them, restore your private local copies into the repo root first.

