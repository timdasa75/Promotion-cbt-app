# Testing Navigation

## Purpose

This file is the entry point for the `testing` master skill. It routes requests to the correct section with minimal context load.

## Routing Matrix

| If user asks about | Open this file first |
|---|---|
| test strategy, quality model, architecture | `01-strategy-architecture.md` |
| unit, integration, API, UI, E2E scope | `02-functional.md` |
| performance, reliability, security, accessibility | `03-non-functional.md` |
| test generation, orchestration, CI test flow | `04-automation.md` |
| test environments, data, virtualization, infra readiness | `05-infrastructure.md` |
| policies, quality gates, evidence, approvals | `06-governance.md` |
| KPIs, release signals, quality trends | `07-metrics.md` |
| risk scoring, risk-based prioritization, release risk | `08-risk-management.md` |
| capability set, maturity levels, roadmap | `09-capability-model.md` |

## Default Order

1. Start with strategy context (`01`) and risk context (`08`).
2. Select execution scope (`02`, `03`).
3. Add acceleration and platform controls (`04`, `05`).
4. Close with business controls (`06`, `07`).
5. Validate capability maturity (`09`).

## Response Pattern

For every substantial QA answer, keep this shape:
1. Scope and assumptions.
2. Risk and priority view.
3. Test architecture and coverage proposal.
4. Pipeline and governance gates.
5. Metrics and decision signals.
6. Ordered next actions.

## Dependency Reminder

Foundation:
- `01-strategy-architecture.md`
- `08-risk-management.md`

Execution:
- `02-functional.md`
- `03-non-functional.md`

Acceleration and platform:
- `04-automation.md`
- `05-infrastructure.md`

Business controls:
- `06-governance.md`
- `07-metrics.md`
