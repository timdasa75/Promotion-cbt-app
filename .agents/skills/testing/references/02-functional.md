# Functional Testing

## Module Identity

Category prefix:
- `testing.functional.*`

Naming pattern:
- `testing.functional.<layer>.<capability>.<maturity>`
- Example: `testing.functional.api-contract.coverage.L2`

## SDLC Stage

Primary stages:
- build
- integration
- pre-release

Secondary stage:
- hotfix validation in production support windows

## Problems Solved

- business flow regressions
- broken contracts between services
- missed edge cases in critical workflows
- unstable acceptance outcomes before release

## Integration Points

Inputs from:
- `testing.strategy.*`
- `testing.risk.*`

Works with:
- `testing.automation.*` for suite orchestration
- `testing.infrastructure.*` for stable test environments

Feeds into:
- `testing.governance.*` release gates
- `testing.metrics.*` defect and pass/fail signals

## Coverage Layers

1. unit and component behavior
2. integration and service interactions
3. API contract and schema stability
4. UI flow and end-to-end business journeys
5. acceptance criteria evidence

## Design Rules

1. Do not treat E2E as the first line of confidence.
2. Keep contract tests mandatory for service boundaries.
3. Select functional depth by risk level from `08-risk-management.md`.
4. Require traceability from each critical requirement to at least one reliable check.
