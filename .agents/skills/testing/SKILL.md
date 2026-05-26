---
name: testing
description: Unified QA testing architecture for strategy, risk-based planning, functional and non-functional coverage, automation, infrastructure, governance, and metrics across the SDLC.
---

# Testing Platform

> One master QA skill with modular sections for enterprise-grade testing decisions.

## Scope

Use this skill as the single control plane for testing work:
- test strategy and architecture
- functional and non-functional planning
- test automation and CI gating
- test infrastructure and environment readiness
- QA governance and evidence quality
- quality metrics and release risk decisions

## Navigation Rule

Do not load every reference file by default. Start with `references/00-navigation.md`, then open only the section that matches the user request.

## Section Map

1. Navigation and routing:
- `references/00-navigation.md`

2. Strategy and architecture:
- `references/01-strategy-architecture.md`

3. Functional testing:
- `references/02-functional.md`

4. Non-functional testing:
- `references/03-non-functional.md`

5. Automation architecture:
- `references/04-automation.md`

6. Infrastructure and environments:
- `references/05-infrastructure.md`

7. Governance and controls:
- `references/06-governance.md`

8. Metrics and quality signals:
- `references/07-metrics.md`

9. Risk management:
- `references/08-risk-management.md`

10. Capability model and maturity:
- `references/09-capability-model.md`

## SDLC Execution Flow

1. Discovery:
- define quality goals, critical business flows, and constraints

2. Planning:
- build risk model, select test scope by risk and change impact

3. Build and integration:
- apply functional and non-functional plans, wire automation into CI gates

4. Pre-release:
- evaluate governance gates, readiness evidence, and release risk

5. Production feedback:
- monitor metrics, defect leakage, and incident patterns
- feed findings back into risk and strategy modules

## Dependency Model

Layer 0 (fundamental):
- strategy and architecture
- risk management

Layer 1 (execution core):
- functional testing
- non-functional testing

Layer 2 (platform and acceleration):
- automation
- infrastructure

Layer 3 (business control):
- governance
- metrics

Feedback loop:
- metrics -> risk reprioritization -> strategy update -> coverage and gate updates

## Capability Policy

Must-have core capabilities:
- test case generation
- risk-based prioritization
- regression impact analysis
- CI and CD integration logic
- baseline non-functional checks
- defect triage and release recommendation

Next maturity capabilities:
- observability feedback loop
- performance profiling
- security scanning orchestration
- auto-refactoring support for test suite health

## Output Contract

When responding on testing work, return:
1. Scope and assumptions.
2. Risk profile and prioritization.
3. Proposed test architecture and coverage.
4. Gate plan for CI and release.
5. Metrics and decision signals.
6. Next actions in order.

## Non-Negotiable Rules

1. Do not propose 100 percent exhaustive testing; prioritize by risk and impact.
2. Do not separate test strategy from release and observability feedback loops.
3. Do not approve release decisions without evidence-backed metrics.
4. Do not add advanced automation before stabilizing fundamental strategy and risk controls.

## References

1. [Navigation](references/00-navigation.md)
2. [Strategy and Architecture](references/01-strategy-architecture.md)
3. [Functional Testing](references/02-functional.md)
4. [Non-Functional Testing](references/03-non-functional.md)
5. [Automation](references/04-automation.md)
6. [Infrastructure](references/05-infrastructure.md)
7. [Governance](references/06-governance.md)
8. [Metrics](references/07-metrics.md)
9. [Risk Management](references/08-risk-management.md)
10. [Capability Model](references/09-capability-model.md)
