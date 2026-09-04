# Promotion CBT — Colour System

This document is the inventory and contract for the app's light/dark colour
system. It exists so new components don't reintroduce the inherited-colour
failures documented in the 4 September 2026 colour-scheme review.

## Core rule

> **Every component that owns a non-default background surface must also own
> the foreground tokens used on that surface.**

A component on a dark green gradient must never inherit a page-level text
token (`--ink-*`) — it must use the `--on-hero*` pair owned by that surface.
A solid action button must use `--action-*` foreground/background pairs, never
raw palette tokens that flip meaning between themes (e.g. `--green-900` is a
deep green in light mode but a bright accent green in dark mode).

## Semantic tokens

| Token | Light | Dark | Contract |
|---|---|---|---|
| `--surface-hero` | `#064e3b` | `#123d31` | Dark green hero / recommendation surfaces |
| `--on-hero` | `#ffffff` | `#f0f6fc` | Headings on hero surfaces |
| `--on-hero-muted` | `#e8f5ee` | `#c9d1d9` | Supporting text on hero surfaces |
| `--action-primary-bg` | `#064e3b` | `#157a49` | Solid primary button background |
| `--action-primary-fg` | `#ffffff` | `#ffffff` | Solid primary button label |
| `--action-primary-hover` | `#065f46` | `#1b8f57` | Primary button hover |
| `--action-secondary-bg` | `#e7f0ec` | `rgba(126,231,135,0.08)` | Tinted secondary button background |
| `--action-secondary-fg` | `#064e3b` | `#7ee787` | Secondary button label |
| `--action-secondary-border` | `#064e3b` | `#2ea865` | Secondary button border |
| `--action-danger-bg` | `#dc2626` | `#c63b3b` | Destructive button background |
| `--action-danger-fg` | `#ffffff` | `#ffffff` | Destructive button label |
| `--action-danger-hover` | `#b91c1c` | `#a93232` | Destructive button hover |
| `--surface-success` | `#ecfdf5` | `#123524` | Success panel background |
| `--text-success` | `#065f46` | `#7ee787` | Success text on `--surface-success` |
| `--surface-warning` | `#fffbeb` | `#3a2f16` | Warning panel background |
| `--text-warning` | `#92400e` | `#f2cc60` | Warning text on `--surface-warning` |
| `--surface-danger` | `#fef2f2` | `#3d1f22` | Danger panel background |
| `--text-danger` | `#991b1b` | `#ff7b72` | Danger text on `--surface-danger` |
| `--focus-ring` | `#0f7a44` | `#7ee787` | Outer focus-ring accent |
| `--focus` | two-layer box-shadow | two-layer box-shadow | `0 0 0 2px <surface>, 0 0 0 4px <ring>` |

Text tiers on the default card/page surfaces (`--card`, `--surface`):

| Tier | Token | Light | Dark | Use |
|---|---|---|---|---|
| Primary | `--ink-900` | `#0f172a` | `#f0f6fc` | Headings, strong text |
| Secondary | `--ink-700` | `#334155` | `#8b949e` | Body text |
| Secondary | `--ink-600` | `#475569` | `#8b949e` | Section captions, less prominent body |
| Muted | `--ink-500` | `#64748b` | `#7d8590` | Metadata, placeholders — do not apply extra opacity |

## Component inventory

| Component family | Surface | Foreground | Notes |
|---|---|---|---|
| Page shell | `--surface` | `--ink-900` | Body text `--ink-700` |
| Header | `--card` gradient | `--ink-900` | Icon buttons need visible `--focus` |
| Landing hero | `--card` gradient | `--ink-900` | CTA uses `--action-primary-*` |
| Recommendation card | `--surface-hero` (light) / card gradient (dark) | `--on-hero`, `--on-hero-muted` | Helper copy must stay in real DOM (`#recommendedTopicHelper`) |
| Topic cards | `--card` | `--ink-900` / `--green-900` (dark headings) | Locked states use state copy, not opacity alone |
| Filters / search | `--card` / `--surface-container` | `--ink-700` | Active chip uses `--primary` accent |
| Quick actions | `--card` | `--ink-700` | Disabled uses `opacity` + cursor only |
| Result / analytics cards | `--card` | `--ink-900` | Status text uses `--text-success/warning/danger` |
| Modals / forms | `--card` | `--ink-900` | Inputs `--ink-900` on `--surface`, borders `--line` |
| Toasts / status messages | `--surface-*` pairs | `--text-*` pairs | `.success-message`, `.inline-warning`, `.error-message` |
| Admin tables / badges | `--surface` / `--card` | `--ink-900` | Badge states use `--ok`/`--warning`/`--danger` pairs |

## Button contracts

| Variant | Light bg / fg | Dark bg / fg | Hover |
|---|---|---|---|
| Primary (`--action-primary-*`) | `#064e3b` / `#ffffff` | `#157a49` / `#ffffff` | `--action-primary-hover` |
| Secondary | `#e7f0ec` / `#064e3b` + border | transparent / `#7ee787` + `#2ea865` border | fills primary |
| Ghost | transparent / `--ink-700` | transparent / `--green-900` | `--primary-light` bg |
| Destructive | `#dc2626` / `#ffffff` | `#c63b3b` / `#ffffff` | `--action-danger-hover` |
| Disabled | `opacity: 0.5` + `not-allowed` | same | — |

## Enforcement

`npm run test:colour` resolves colour pairs in `css/styles.css` for both
themes and fails the release when a required pair is below WCAG AA
(normal text 4.5:1, UI boundaries 3:1). It runs in CI on every Pages deploy.

Two layers are checked:

1. **Token pairs** — semantic foreground/background tokens (hero, action
   buttons, body/muted text on card, success/warning/danger states, focus ring).
2. **Component surfaces** — real selectors resolved against the cascade:
   topic cards (title/description/count/badge), quiz question card, quiz
   options (text/selected/correct/incorrect), quiz feedback labels, admin
   status badges (approved/pending/rejected/neutral), and analytics tiles
   (traffic green/amber/red values + labels). The recommendation and overview
   hero surfaces are covered by the token-level `--surface-hero`/`--on-hero`
   pairs (the analytics recommendation card owns that surface itself).

The resolver understands `var()` chains, `rgba()` composited over a surface,
and `color-mix()` with var()/rgba() stops (both theme palettes rely on it), so
most tinted surfaces audit automatically. Only genuinely uncomposable
surfaces — layered gradients/images — are reported as "manual review"; keep
them on the manual checklist when changing theme surfaces.