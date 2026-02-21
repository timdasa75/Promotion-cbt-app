# Promotion CBT App

Web-based CBT practice platform for Nigerian Federal Civil Service promotion preparation (directorate track).

## What This App Includes

- 10 core topic banks with subcategories
- Practice, Exam, and Review modes
- Cross-topic **Directorate Mock Exam** (premium)
- Dashboard insights (attempts, average score, streak, recommendations)
- Post-quiz analytics with traffic-light performance styling
- Keyboard shortcuts during quiz (A-D, arrows, Enter)
- Local and Supabase cloud authentication
- Admin panel (upgrade requests, overrides, user directory + user count)

## Quick Start (Local)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start a static server:
   ```bash
   python -m http.server 4173
   ```
3. Open:
   ```text
   http://127.0.0.1:4173/
   ```

## Run Tests

```bash
npm run test:smoke
```

## Main User Flows

1. Login or register.
2. Open **Start Learning**.
3. Choose a topic or **Directorate Mock Exam**.
4. Select mode:
   - `Practice`: instant rationale/feedback.
   - `Exam`: timed session, no immediate reveal.
   - `Review`: pre-quiz study mode with answers visible.
5. Complete session and inspect results/insights.

Detailed user walkthrough:
- `docs/user-guide.md`
- `docs/admin-guide.md` (admin operations)

## Auth Modes

- `Local` mode:
  - Single-device storage in browser localStorage.
- `Cloud` mode (Supabase):
  - Multi-device login and profile-backed plan state.

Cloud setup guide:
- `docs/supabase-auth-setup.md`

## Plans and Access

- `Free`:
  - Limited topic/subtopic/question access.
- `Premium`:
  - Full topic access and mock exam access.
- `Admin`:
  - Premium-level access plus Admin panel controls.

## Admin Features

- Manual upgrade review queue
- Local plan overrides
- User directory with:
  - email, role, plan, status, created/last-seen
  - **live count** (`filtered/total`)

## Data and Maintenance

- Topic data lives in `data/*.json`
- Validation script:
  ```bash
  python scripts/validate_taxonomy.py
  ```
- Refactor roadmap:
  - `docs/refactor-implementation-plan.md`

## Deployment Notes

- GitHub Pages-compatible static app
- Base path handling is included for `/Promotion-cbt-app`

## License

MIT (see `LICENSE` if present in your distribution).
