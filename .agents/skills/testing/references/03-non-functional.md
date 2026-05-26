# Non-Functional Testing

## Module Identity

Category prefix:
- `testing.nonfunctional.*`

Naming pattern:
- `testing.nonfunctional.<attribute>.<capability>.<maturity>`
- Example: `testing.nonfunctional.performance.profile-baseline.L1`

## SDLC Stage

Primary stages:
- architecture and design
- hardening
- pre-release

Continuous stages:
- production operations and feedback

## Problems Solved

- performance and scalability regressions
- reliability and resilience gaps
- security and compliance exposure
- accessibility and compatibility failures

## Integration Points

Depends on:
- `testing.strategy.*`
- `testing.infrastructure.*`

Works with:
- `testing.automation.*` for repeatable checks
- `testing.metrics.*` for trend monitoring

Feeds into:
- `testing.governance.*` for release approvals
- `testing.risk.*` for risk reclassification

## Quality Attributes

1. performance and capacity
2. reliability and fault tolerance
3. security and abuse resistance
4. accessibility and usability constraints
5. compatibility across browser/device/runtime targets

## Design Rules

1. Define acceptance thresholds before running tests.
2. Include baseline checks in CI; keep deep profiling scheduled.
3. Route major degradations into risk reprioritization.
4. Couple non-functional findings with business impact narratives.
