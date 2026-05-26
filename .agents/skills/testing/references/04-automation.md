# Automation

## Module Identity

Category prefix:
- `testing.automation.*`

Naming pattern:
- `testing.automation.<scope>.<capability>.<maturity>`
- Example: `testing.automation.regression.impact-selection.L2`

## SDLC Stage

Primary stages:
- build
- CI
- CD

Secondary stage:
- production incident reproduction support

## Problems Solved

- slow and inconsistent manual validation
- flaky or redundant suites
- weak change-to-test selection
- high cost to maintain growing test inventory

## Integration Points

Depends on:
- `testing.functional.*`
- `testing.nonfunctional.*`
- `testing.risk.*`

Works with:
- `testing.infrastructure.*` for environment consistency
- CI and pipeline orchestrators

Feeds into:
- `testing.metrics.*` for flake rate and cycle-time signals
- `testing.governance.*` for automated gate evidence

## Core Capability Track

1. deterministic test execution and retry policy
2. risk-based suite selection
3. regression impact analysis
4. test case generation support
5. auto-refactoring support for maintainability

## Design Rules

1. Stabilize test architecture before scaling automation volume.
2. Prefer impact-based execution over full-suite execution on every change.
3. Treat flakiness as a quality defect, not a minor nuisance.
4. Keep automation outcomes observable and auditable.
