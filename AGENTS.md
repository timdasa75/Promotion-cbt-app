# Promotion CBT App — Agent Instructions

This is the **single source of truth** consumed by OpenCode, Codex, Claude Code, Antigravity, Cursor, Copilot, Gemini Code Assist, and any other AI coding tool. Tool-specific configs are thin adapters in their respective dot-directories (`.opencode/`, `.codex/`, `.claude/`, `.cursor/`, `.gemini/`).

---

## Project Context

Vite-based static JavaScript CBT practice app for Nigerian Federal Civil Service promotion preparation (directorate level). The frontend is deployed as static assets via GitHub Pages, while authentication/admin capabilities are split across Firebase and a Cloudflare Worker migration path.

### Architecture Map

```
index.html              ← Single-page app shell with CSP, preconnects, shell header
  ├── css/
  │   ├── normalize.css   CSS reset
  │   ├── fonts.css       @font-face: Atkinson Hyperlegible + Inter
  │   ├── styles.css      7639 lines — all components, layout, dark mode
  │   └── modules/
  │       ├── animations.css  Animation system (fade, slide, pulse, ripple, shimmer)
  │       └── topics.css      Legacy topic card styles
  ├── js/
  │   ├── boot.js          App entry point
  │   ├── app.js           Main app orchestration + topic screens
  │   ├── app/             Sub-modules
  │   │   ├── theme.js     Dark/light mode
  │   │   ├── toolbar.js   Header toolbar (auth, nav)
  │   │   └── mockSetup.js Mock exam config
  │   ├── quiz.js          Quiz engine (exam/practice/review modes)
  │   ├── quiz/            Quiz sub-modules
  │   ├── ui/              UI primitives
  │   │   ├── screen.js    Screen management
  │   │   └── notifications.js Toast/notification system
  │   ├── auth*.js         (16+ files) Auth system: Firebase, Cloudflare, hybrid
  │   ├── appAnalytics*.js Dashboard analytics, recommendations, feedback
  │   ├── data.js          Data layer
  │   └── ...              Constants, logger, metrics, features, study filters
  ├── data/
  │   ├── topics.json      Public metadata
  │   ├── exam_templates.json
  │   └── gl_band_weights.json
  ├── workers/admin-bridge/  Cloudflare Worker (D1 DB, admin API, auth)
  ├── functions/             Firebase Cloud Functions fallback
  ├── tests/
  │   ├── smoke.spec.js       Playwright smoke tests
  │   ├── protected-content.smoke.spec.js  Auth-gated content tests
  │   └── unit/               Node native unit tests
  └── config/
      ├── runtime-auth.example.js  Template (tracked)
      └── runtime-auth.js          Live credentials (gitignored)
```

---

## Tool-Agnostic Ecosystem

This repo follows a **universal core + thin adapters** pattern:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Universal core** | `AGENTS.md`, `Design.md`, `.agents/skills/`, `docs/` | Shared across all tools |
| **OpenCode** | `.opencode/opencode.json` | MCP servers, permissions, agent roles |
| **Codex CLI** | `.codex/` | Codex config, sub-agents |
| **Claude Code** | `CLAUDE.md`, `.claude/` | Anthropic adapter (thin stub referencing this file) |
| **Gemini Assist** | `GEMINI.md` | Thin stub referencing this file |
| **Cursor** | `.cursor/rules/` | Glob-matched project rules |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Agent instructions |
| **Antigravity** | `.antigravity/` (future) | When adopted |

All tools read this `AGENTS.md` at project root — that's the universal contract.

---

## Standard CLI Commands

Run from project root:

| Purpose | Command |
|---------|---------|
| Development server | `npm run dev` (port 5500) |
| Production build | `npm run build` (outputs `dist/`) |
| Preview build | `npm run preview` |
| Unit tests | `npm run test:unit` |
| Smoke tests | `npm run test:smoke` (quits on first failure) |
| Full smoke tests | `npm run test:smoke:full` (runs all) |
| Topic contamination audit | `npm run audit:topic-banks` |
| Strict audit (fails on warnings) | `npm run audit:topic-banks:strict` |
| CI audit | `npm run audit:topic-banks:ci` |
| Static syntax check | `node --check <file>` |

---

## Skills Registry

Installed skills in `.agents/skills/` provide domain-specific guidance. Load them when the task matches their scope.

### From ECC (Everything-Claude-Code)
- **security-review** — Auth, Workers, secrets, data persistence
- **frontend-patterns** — UI architecture, state management, rendering
- **vite-patterns** — Vite config, build, plugins, HMR
- **backend-patterns** — Worker API routes, DB optimization, handlers
- **coding-standards** — Naming, error handling, clean code
- **e2e-testing** — Playwright patterns, POM, CI integration
- **git-workflow** — Branching, commits, PR workflow
- **verification-loop** — Post-change quality gates
- **documentation-lookup** — Context7 MCP for live docs
- **strategic-compact** — Context preservation in long sessions
- **ai-regression-testing** — Sandboxed pattern checks
- **code-tour** — Onboarding `.tour` files

### From skills.sh
- **web-design-guidelines** — Modern web design patterns
- **composition-patterns** — UI composition strategies
- **testing** — Unit + integration test patterns
- **planning** — Structured task breakdown
- **deep-research** — Multi-step research (for exam content)

### From gstack (garrytan/gstack, MIT — curated index)
- **gstack** — Virtual engineering team methodology: /cso security audit, /review pre-landing review, /qa browser QA, /ship release workflow. Curated for tool-agnostic use; native gstack binary steps marked [DEGRADED]. Load this skill when running a structured security/review/QA/ship pass on a branch.

---

## MCP Servers

These MCP servers make external capabilities available to your AI coding tool:

| Server | Package | Purpose | Configured In |
|--------|---------|---------|---------------|
| **Playwright** | `@playwright/mcp` | Test debugging, authoring, running | `.opencode/opencode.json` |
| **GitHub** | `@modelcontextprotocol/server-github` | PRs, issues, repo management | `.opencode/opencode.json` |
| **Stitch** | `@keeponfirst/kof-stitch-mcp` | UI generation, design system extraction, DESIGN.md export | `.opencode/opencode.json` |
| **Context7** | `@context7/server` | Live library/framework documentation | `.opencode/opencode.json` |
| **Web Fetch** | `@anthropic/server-web-fetch` | Web scraping, content research | `.opencode/opencode.json` |

For tools other than OpenCode, configure these servers in the tool's own MCP config (e.g., `.mcp.json` for Claude Code, `~/.cursor/mcp.json` for Cursor).

---

## Working Rules

- Explain the code paths you inspect and why they matter.
- Keep changes tightly scoped to the requested behavior.
- Preserve user or existing worktree changes; do not revert unrelated edits.
- For frontend changes, verify with unit/smoke tests when practical.
- For auth, admin, Worker, Firebase, or runtime config changes, check security implications before finishing.
- Never commit secrets or live runtime credentials. Use `config/runtime-auth.example.js` as the tracked template and keep live config outside tracked source.
- Session management: for long-running tasks (data import, auth migration), use `strategic-compact` skill to suggest manual context compaction at logical intervals.

---

## Verification

Choose the smallest useful verification set for the change:
1. **Static check**: `node --check <file>`
2. **Unit tests**: `npm run test:unit` or `node --test tests/unit/<file>.test.js`
3. **Smoke tests**: `npm run test:smoke`
4. **Full smoke**: `npm run test:smoke:full`
5. **Build**: `npm run build`
6. **Topic audit** (if data changes): `npm run audit:topic-banks`

If a verification step cannot be run, say exactly why.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Auth mode: Cloud required (runtime config missing)` | `config/runtime-auth.js` missing or has placeholder values | Copy `config/runtime-auth.example.js` → `runtime-auth.js`, fill in real values |
| Build fails | Missing data files or static copy target | `npm install`, check `data/` has required `.json` files |
| Playwright tests fail locally | Missing browsers | `npx playwright install chromium` |
| `🔥` wrangler errors | Wrangler not configured | `cp workers/admin-bridge/wrangler.toml.example workers/admin-bridge/wrangler.toml` |
| "Possible secrets detected" on GitHub | API key committed to history | Rotate key immediately, use `.gitignore` + `git filter-branch` |
