# Governance

## Module Identity

Category prefix:
- `testing.governance.*`

Naming pattern:
- `testing.governance.<control>.<capability>.<maturity>`
- Example: `testing.governance.release.evidence-policy.L2`

## SDLC Stage

Primary stage:
- end-to-end across the full SDLC

Critical checkpoints:
- pre-release and post-incident reviews

## Problems Solved

- inconsistent release quality decisions
- missing evidence and traceability
- policy non-compliance across teams
- unclear approval boundaries

## Integration Points

Depends on:
- `testing.strategy.*`
- `testing.risk.*`
- `testing.metrics.*`

Consumes signals from:
- `testing.functional.*`
- `testing.nonfunctional.*`
- `testing.automation.*`
- `testing.infrastructure.*`

Partners with:
- business owners and engineering leadership

## Governance Controls

1. definition of done and release gate policy
2. evidence completeness and auditability rules
3. approval model by risk tier
4. exception and waiver process
5. incident-to-policy feedback process

## Design Rules

1. No release recommendation without verifiable evidence.
2. Keep gate criteria explicit, measurable, and versioned.
3. Tie policy exceptions to time-bound risk acceptance.
4. Feed governance outcomes back into strategy updates.
