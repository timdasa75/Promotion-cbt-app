# Risk Management

## Module Identity

Category prefix:
- `testing.risk.*`

Naming pattern:
- `testing.risk.<scope>.<capability>.<maturity>`
- Example: `testing.risk.release.prioritization-engine.L2`

## SDLC Stage

Primary stages:
- planning
- change assessment
- release readiness

Continuous stage:
- production feedback and reprioritization

## Problems Solved

- equal test effort across unequal risk areas
- delayed focus on critical change zones
- lack of transparent release risk posture
- weak mapping between incidents and test prioritization

## Integration Points

Depends on:
- `testing.strategy.*`
- `testing.metrics.*`

Prioritizes work for:
- `testing.functional.*`
- `testing.nonfunctional.*`
- `testing.automation.*`

Informs:
- `testing.governance.*` release verdicts

## Risk Capability Areas

1. risk scoring model by business and technical impact
2. change impact and regression radius analysis
3. risk-based test selection and sequencing
4. release risk profile and recommendation logic
5. incident learning integration

## Design Rules

1. Make risk scoring explicit and explainable.
2. Keep prioritization dynamic after every significant change.
3. Link each high-risk area to specific evidence requirements.
4. Treat unknown risk as elevated risk until clarified.
