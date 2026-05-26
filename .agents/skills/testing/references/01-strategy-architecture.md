# Strategy and Architecture

## Module Identity

Category prefix:
- `testing.strategy.*`

Naming pattern:
- `testing.strategy.<domain>.<capability>.<maturity>`
- Example: `testing.strategy.platform-quality-model.L2`

## SDLC Stage

Primary stages:
- discovery
- planning
- architecture and design

Secondary stage:
- release readiness review

## Problems Solved

- fragmented and inconsistent test approach across teams
- mismatch between business criticality and test depth
- weak mapping from requirements to test layers
- unclear ownership of quality decisions

## Integration Points

Depends on:
- `testing.risk.*` for prioritization logic

Enables:
- `testing.functional.*`
- `testing.nonfunctional.*`
- `testing.automation.*`
- `testing.governance.*`

## Expected Outputs

1. test architecture blueprint
2. quality gate policy by release type
3. traceability model from requirement to evidence
4. ownership matrix for QA and engineering roles

## Design Rules

1. Build strategy around risk and customer impact, not around tool preference.
2. Keep architecture layered: unit -> integration -> service/API -> end-to-end.
3. Tie all strategy decisions to measurable metrics from `07-metrics.md`.
4. Revisit strategy after every major incident or release trend shift.
