# Codex Adapter for Promotion CBT App

Read the single source of truth: [`AGENTS.md`](../AGENTS.md) (project context, CLI commands, skills, MCPs, verification).

## Codex Notes

- Codex doesn't use Claude Code hooks; ECC hook-based enforcement is instruction-based here.
- Keep external tools read-only unless the user explicitly asks to publish, push, deploy, or modify third-party resources.
- This app is plain vanilla JS (Vite), not React/Next.js.
- Skills in `.agents/skills/` — see AGENTS.md for the full list (18 total).

## Multi-Agent Roles (`.codex/agents/`)

- `explorer`: read-only evidence gathering
- `reviewer`: correctness, security, test coverage review
- `docs-researcher`: API and documentation verification

Use these only when the user explicitly requests sub-agents or parallel work.
