# Promotion CBT User Guide

## Overview

Promotion CBT is a browser-based exam preparation app for directorate-level civil service promotion exams. It supports guided topic study, timed sessions, mock exams, and performance tracking.

## Feature Summary

- Topic-based learning across 10 core domains
- Subcategory drill-down
- Practice, Exam, and Review modes
- Directorate Mock Exam (cross-topic)
- Progress tracking and recommendation cards
- Result analytics with traffic-light performance cues
- Keyboard-driven quiz navigation
- Admin operations for user management and plan controls

## Getting Started

1. Open the app.
2. Click `Start Learning`.
3. Register a new account or login.
4. Select a topic and mode to begin.

## Topic Selection Screen

### Search and Filters

- Use search to find topics by keywords.
- Filter chips:
  - `All`
  - `Document-based`
  - `Competency-based`
  - `Recent`

### Recommendation Cards

- `Continue Last Session`: resumes your most recent topic path.
- `Recommended Next Topic`: selects your weakest area based on prior attempts.

## Quiz Modes

### Practice Mode

- Immediate answer feedback and rationale.
- Elapsed-time counter.
- Best for learning and correction.

### Exam Mode

- Timed session (`45 seconds x number of questions`).
- No immediate correctness reveal.
- Results shown at end of session.

### Review Mode

- Pre-quiz study mode.
- Correct answers and rationale are visible.
- Useful for concept preview before attempting timed or practice runs.

## Directorate Mock Exam

Mock exam is a cross-topic session built from all major domains.

- Access level: Premium/Admin
- Entry point: Topic list card `Directorate Mock Exam`
- Flow: skips subcategory selection and goes directly to mode selection
- Results include per-topic breakdown (accuracy and coverage)

## Keyboard Shortcuts (Quiz Screen)

- `A/B/C/D` or `1/2/3/4`: choose option
- `Arrow Up / Arrow Down`: move option selection
- `Arrow Left`: previous question
- `Arrow Right`: next question
- `Enter`:
  - Practice: submit, then move next when available
  - Exam: move next

## Results and Insights

### Standard Metrics

- Overall score
- Correct, Wrong, Unanswered
- Time spent

### Traffic-Light Colors

- `Green`: strong performance
- `Amber`: moderate performance
- `Red`: needs attention

Applied across result hero/stat cards and analytics items.

### Mock Exam Breakdown

For mock sessions, results include:

- Accuracy per source topic
- Coverage per source topic
- Traffic-light grading per topic card

## Account and Plan Behavior

### Free Plan

- Limited topic/subtopic/question access

### Premium Plan

- Full content access
- Mock exam enabled

### Admin

- Premium-level access plus Admin panel

## Admin Panel Guide

Admin panel supports:

- Manual upgrade request review
- Plan overrides by email
- User directory with filters and search
- User count display (`Users: filtered/total`)

User directory columns:

- Email
- Role
- Plan
- Status
- Created
- Last Seen

## Authentication Modes

### Local Mode

- Account/session stored in browser localStorage
- Best for single-device testing

### Cloud Mode (Supabase)

- Multi-device login
- Shared account access across devices
- Optional plan profile sync from Supabase

Setup reference:
- `docs/supabase-auth-setup.md`

## Troubleshooting

### Topics not showing

1. Hard refresh (`Ctrl+F5`)
2. Check browser console for fetch or JSON errors
3. Confirm topic files exist in `data/`

### Cloud login issues

1. Confirm auth mode in modal (`Cloud`)
2. Verify Supabase URL and anon key in `index.html`
3. Ensure Supabase Email provider is enabled

### Mock exam not visible

1. Confirm Premium/Admin account
2. Clear search and use `All` filter
3. Hard refresh to clear cached assets
