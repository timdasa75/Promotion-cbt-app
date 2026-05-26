# Metrics

## Module Identity

Category prefix:
- `testing.metrics.*`

Naming pattern:
- `testing.metrics.<domain>.<signal>.<maturity>`
- Example: `testing.metrics.release.readiness-index.L2`

## SDLC Stage

Primary stage:
- continuous measurement through build, release, and production

Decision points:
- release readiness, incident review, quarterly quality planning

## Problems Solved

- subjective quality decisions
- low visibility into regression trends
- inability to track automation health and ROI
- weak link between defects and risk concentration

## Integration Points

Depends on signals from:
- `testing.functional.*`
- `testing.nonfunctional.*`
- `testing.automation.*`
- `testing.infrastructure.*`

Drives:
- `testing.risk.*` reprioritization
- `testing.governance.*` gate decisions
- `testing.strategy.*` roadmap adjustments

## Core Metric Families

1. release confidence and defect leakage
2. pass-rate trend by risk tier
3. flakiness and test reliability
4. cycle time and feedback latency
5. MTTR and incident recurrence

## Design Rules

1. Separate leading signals from lagging outcomes.
2. Report metrics by risk tier, not only global averages.
3. Use metrics for decisions, not for vanity dashboards.
4. Keep metric definitions stable and versioned.
