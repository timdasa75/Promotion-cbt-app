# Promotion‑CBT Design System

## The "National" Palette

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| Green Primary | `--green-primary` | `#008753` | Buttons, links, active states, icons |
| Green Deep | `--green-deep` / `--green-900` | `#0b6b3a` | Headers, logos, headings |
| Gold Federal | `--gold-federal` / `--gold` | `#d4af37` | Premium badges, official seals, emphasis |
| White | `--white` | `#ffffff` | Cards, surfaces |
| Ivory Surface | `--surface` | `#f7faf8` | Page background |
| Ink 900 | `--ink-900` | `#1f2937` | Primary text |
| Ink 700 | `--ink-700` | `#374151` | Secondary text |
| Ink 600 | `--ink-600` | `#4b5563` | Muted text |
| Ink 500 | `--ink-500` | `#6b7280` | Labels, placeholders |
| Line | `--line` | `#d0d9d4` | Borders, dividers |
| Danger | `--danger` | `#b42318` | Errors, destructive actions |
| Warning | `--warning` | `#b54708` | Warnings, timer urgency |
| OK | `--ok` | `#027a48` | Success states |

### Semantic Aliases

| Token | Value | Use |
|-------|-------|-----|
| `--card` | `#ffffff` | Card backgrounds |
| `--shadow` | `0 12px 32px rgba(0, 135, 83, 0.1)` | Default card shadow |
| `--radius` | `14px` | Component border-radius |
| `--radius-lg` | `16px` | Hero panels, modals |
| `--focus` | `0 0 0 3px rgba(0, 135, 83, 0.3)` | Focus ring |
| `--space-1` | `8px` | Spacing unit |
| `--space-2` | `12px` | Spacing unit |
| `--space-3` | `16px` | Spacing unit |
| `--space-4` | `20px` | Spacing unit |

---

## Typography

| Role | Font | Weight | Size | Use |
|------|------|--------|------|-----|
| Primary body | `Atkinson Hyperlegible` | 400-700 | `17px / 1.62` | All body text |
| Headings | `Inter` | 700-900 | `clamp(...)` | Titles, headings |
| UI text | `Inter` | 600-700 | `0.78-0.92rem` | Buttons, chips, badges |
| Monospaced | System | — | — | Code (minimal) |

Loading strategy:
- `Inter` Regular through Bold: self-hosted TTF with `font-display: swap`
- `Atkinson Hyperlegible`: Google Fonts with `preconnect` hints

---

## CSS Architecture

```
css/
├── normalize.css    CSS reset (third-party)
├── fonts.css        @font-face declarations + Google Fonts import
├── styles.css       All component, layout, and dark mode styles (7639 lines)
└── modules/
    ├── animations.css  Screen transitions, fade, slide, pulse, shimmer
    └── topics.css      Legacy topic card styles (being migrated into styles.css)
```

---

## Component Taxonomy

### 1. Shell
| Class | Purpose |
|-------|---------|
| `.app-container` | Max-width 1180px wrapper, centered |
| `.app-shell-header` | Sticky header (top: 12px, z-index: 100), glass effect |
| `.brand-block` | Logo + title flex container |
| `.brand-logo` | 52x52px logo with green shadow |
| `.header-actions` | Right-side toolbar buttons |
| `.auth-toolbar-summary` | Auth status display (max-width 340px) |
| `.account-menu` | Dropdown menu positioned below header |

### 2. Auth
| Class | Purpose |
|-------|---------|
| `.auth-modal` | Fullscreen overlay with centered card |
| `.auth-modal-card` | Max 460px card with shadow |
| `.auth-form` | Grid form layout |
| `.auth-field` | Label + input grid |
| `.auth-tabs` | Tab button row |
| `.auth-message` | Status message (error/success variants) |
| `.password-field` | Input with toggle button overlay |
| `.checkbox-field` | Checkbox + label row |

### 3. Navigation
| Class | Purpose |
|-------|---------|
| `.screen` | Page wrapper with fade-up entrance animation |
| `.screen-header` | Title + description grid |
| `.screen-nav-row` | Navigation button row |
| `.toolbar-row` | Generic toolbar flex row |

### 4. Dashboard
| Class | Purpose |
|-------|---------|
| `.dashboard-grid` | Auto-fit grid (min 240px cols) |
| `.dashboard-grid.two-col` | Wider columns (min 400px) |
| `.stat-card` | Metric display card |
| `.recommendation-card` | Full-width recommendation |
| `.badge-streak` | Streak count pill |
| `.loading-skeleton-grid` | Skeleton loading placeholder |

### 5. Hero
| Class | Purpose |
|-------|---------|
| `.hero-panel` | Green gradient hero section |
| `.hero-copy` | Body text in hero |
| `.hero-meta` | Metadata text |
| `.hero-meta-box` | Boxed metadata group |
| `.hero-features` | Feature tag row |
| `.feature-tag` | Round-pill feature label |
| `.official-seal` | Seal image container |
| `.section-head` | Section header (h2 + description) |
| `.eyebrow` | Small uppercase label |

### 6. Topics
| Class | Purpose |
|-------|---------|
| `.topic-card` | Topic selection card |
| `.topic-card.locked` | Dashed-border locked state |
| `.mock-exam-card` | Premium gold-accented card |
| `.topic-filter-row` | Horizontal filter chip bar |
| `.topic-search-wrap` | Search input with icon |
| `.topic-highlight-row` | Highlight pill row |
| `.topic-icon-wrap` | 48x48 icon container |
| `.topic-title` | Topic heading |
| `.topic-description` | Topic summary |

### 7. Quiz Shell
| Class | Purpose |
|-------|---------|
| `.quiz-shell` | Main quiz container |
| `.quiz-topbar` | Sticky top bar with timer + progress |
| `.quiz-palette` | Answer palette (question number buttons) |
| `.quiz-content-grid` | Question + options layout |
| `.quiz-actions` | Sticky bottom action buttons |
| `.sticky-summary` | Sidebar summary panel |

### 8. Timer
| Class | Purpose |
|-------|---------|
| `.timer-wrap` | Timer display pill |
| `.timer-wrap.warning` | Warning state (yellow) |
| `.timer-wrap.critical` | Critical state (red, pulse animation) |
| `.timer-badge` | "TIME" label |
| `#timeLeft` | Time display with tabular-nums |

### 9. Progress
| Class | Purpose |
|-------|---------|
| `.progress-track` | Progress bar track (10px height) |
| `.progress-fill` | Animated fill bar (green gradient) |

### 10. Questions
| Class | Purpose |
|-------|---------|
| `.question-card` | Question display card |
| `.question-number` | Round number badge |
| `.options-grid` | Option button grid |
| `.option-btn` | Answer option button |
| `.option-btn.selected` | Selected state (green border) |
| `.option-btn.correct` | Correct answer (green bg) |
| `.option-btn.incorrect` | Wrong answer (red bg) |
| `.option-letter` | A/B/C/D letter circle |
| `.option-text` | Option content |
| `.option-feedback-label` | Correct/incorrect label |
| `.diff-badge` | Difficulty badge (easy/medium/hard) |
| `.prev-answer-badge` | Previous attempt indicator |

### 11. Feedback
| Class | Purpose |
|-------|---------|
| `.feedback-status` | Answer verdict container |
| `.feedback-status-correct` | Green verdict |
| `.feedback-status-incorrect` | Red verdict |
| `.explanation` | Rationale explanation box |
| `.practice-pacing-notice` | Pacing warning |

### 12. Results
| Class | Purpose |
|-------|---------|
| `.result-hero` | Results header section |
| `.traffic-green` | Green performance tier |
| `.traffic-amber` | Amber performance tier |
| `.traffic-red` | Red performance tier |
| `.result-tag` | Performance tag |

### 13. Buttons
| Class | Purpose |
|-------|---------|
| `.btn` | Base button (48px min-height, 12px radius) |
| `.btn-primary` | Green filled button |
| `.btn-secondary` | Outlined green button |
| `.btn-ghost` | Border-only button |
| `.btn-destructive` | Red filled button |
| `.btn-compact` | Small variant (34px height) |
| `.icon-button` | Toolbar icon button |
| `.icon-button.icon-only` | Square icon button |

### 14. Loading
| Class | Purpose |
|-------|---------|
| `.app-loading-overlay` | Fullscreen initial load overlay |
| `.spinner-ring` | Multi-ring spinner animation |
| `.spinner-ring div` | 4 animated ring segments |
| `.skeleton-card` | Shimmer loading placeholder |
| `.loading` | Text loading indicator |

### 15. Admin
| Class | Purpose |
|-------|---------|
| `.admin-stack` | Vertical admin panel layout |
| `.admin-section-card` | Admin section card |
| `.admin-request-toolbar` | Request filter/search toolbar |
| `.admin-user-toolbar` | User directory toolbar |
| `.admin-history-list` | History entry list |
| `.admin-history-entry` | Individual history entry |
| `.admin-history-meta-grid` | Metadata grid (auto-fit, 160px) |
| `.plan-override-row` | Override form row |
| `.plan-override-item` | Individual override display |

### 16. Utilities
| Class | Purpose |
|-------|---------|
| `.hidden` | `display: none !important` |
| `.icon-nudge-left` / `.icon-nudge-right` | Icon spacing helpers |
| `.premium-eyebrow` | Gold-colored label |
| `.pause-overlay` | Fullscreen pause screen |
| `.pill` | Small info tag |
| `.chip` | Selectable filter chip |
| `.chip.active` | Active filter state |

---

## Responsive Breakpoints

The app uses CSS grids with `auto-fit` and `minmax()` rather than fixed breakpoints:

| Pattern | Rule | Behavior |
|---------|------|----------|
| App container | `max-width: 1180px` | Centered, capped on wide screens |
| Dashboard grid | `auto-fit, minmax(240px, 1fr)` | 1 col < 480px, 2 col < 720px, 3 col+ |
| Dashboard two-col | `auto-fit, minmax(400px, 1fr)` | 1 col < 800px, 2 col+ |
| Topic cards | `auto-fit, minmax(280px, 1fr)` | 1 col < 560px, 2 col < 840px, 3 col+ |
| Auth modal card | `width: min(100%, 460px)` | Full-width on mobile, capped on desktop |
| Brand heading | `clamp(1.4rem, 2.4vw, 2rem)` | Scales fluidly |
| Hero heading | `clamp(2rem, 4.8vw, 2.9rem)` | Scales fluidly |

---

## Animation System

All animations defined in `css/modules/animations.css` with additional transitions in `styles.css`.

### Screen Transitions
| Class | Animation | Duration | Use |
|-------|-----------|----------|-----|
| `.fade-enter` → `.fade-enter-active` | `opacity 0→1, translateY 10→0` | `0.3s ease-out` | Screen entries |
| `.fade-exit` → `.fade-exit-active` | `opacity 1→0, translateY 0→-10` | `0.3s ease-in` | Screen exits |
| `.slide-in` | `translateX 100%→0` | `0.3s ease-out` | Panel slides |
| `.slide-out` | `translateX 0→-100%` | `0.4s ease-in` | Panel slides |

### Micro-interactions
| Class/Selector | Effect | Duration | Trigger |
|----------------|--------|----------|---------|
| `.screen` | `fade-up` keyframe | `0.26s ease` | New screen mount |
| `.topic-card:hover` | translateY(-4px), shadow boost | `0.3s cubic-bezier(...)` | Hover |
| `.btn:hover` | translateY(-2px), shadow boost | `0.2s cubic-bezier(...)` | Hover |
| `.btn:active` | Immediate press | — | Click |
| `.spinner-ring div` | `spin` keyframe | `1.2s linear infinite` | Loading |
| `.skeleton-card` | `shimmer` keyframe | `1.1s linear infinite` | Skeleton loading |
| `.timer-wrap.critical` | `pulse` keyframe | `0.8s ease infinite` | Time critical |
| `.ripple:active:after` | Radial expand | `0.5s` | Click |
| `.progress-fill` | Width tween | `0.3s ease` | Progress update |

### Easing
```css
cubic-bezier(0.25, 0.8, 0.25, 1)  /* Cards, interactive elements */
cubic-bezier(0.4, 0, 0.2, 1)      /* Buttons */
cubic-bezier(0.34, 1.56, 0.64, 1) /* Logo bounce */
```

---

## Dark Mode

Activated by `body.dark-mode`. The system swaps the ivory surface for a deep slate palette while using the Nigerian Green as the primary anchor.

### Token Overrides

| Token | Light | Dark |
|-------|-------|------|
| `--surface` | `#f7faf8` | `#0a0f0d` |
| `--card` | `#ffffff` | `#121a16` |
| `--line` | `#d0d9d4` | `#223028` |
| `--ink-900` | `#1f2937` | `#f0f4f2` |
| `--ink-700` | `#374151` | `#c8d4ce` |
| `--ink-600` | `#4b5563` | `#a0b5ab` |
| `--ink-500` | `#6b7280` | `#7d9588` |
| `--green-900` | `#0b6b3a` | `#c4eedb` |
| `--green-700` | `#008753` | `#3acc8e` |
| `--shadow` | green glow | `0 12px 40px rgba(0,0,0,0.8)` |

### Component Overrides
- Cards get `border: 1px solid #242c2c` and darker hover `#1c2323`
- Buttons: `.btn-secondary` gets dark bg `#242c2c`
- Timer warning/critical states invert: danger bg `#3d1b1c`, warning bg `#3b2a0e`
- Premium gold accents remain but on darker surfaces
- Hero panels use `linear-gradient(145deg, #151a1a, #0e1111)` instead of green gradient

---

## Accessibility Patterns

### Focus Management
- All interactive elements use `:focus-visible` with `--focus` ring
- Focus ring: `3px` green outline at `0.3` opacity
- `auth-toolbar-summary` uses `aria-live="polite"` for screen reader updates

### Keyboard Navigation
- Quiz: A/B/C/D keys select options, arrows navigate, Enter confirms
- All buttons are `<button>` elements (not divs) with proper types
- `brand-logo-btn` has `aria-label="Go to dashboard"`
- Tab order follows visual layout via DOM order

### Color & Contrast
- Primary text `#1f2937` on `#f7faf8` → ~10:1 contrast ratio
- Green primary `#008753` on white → ~3.5:1 (used for decorative elements, not critical text)
- Dark mode ink `#f0f4f2` on `#0a0f0d` → ~15:1

### Reduced Motion
- Animations use CSS transitions that can be disabled via `prefers-reduced-motion` (browser-level)
- Shimmer, pulse, and spin animations are decorative — no critical information conveyed through animation alone

---

## Content Security Policy

From `index.html`:

```
default-src 'self'
script-src  'self' https://www.gstatic.com https://www.googleapis.com
            https://identitytoolkit.googleapis.com https://accounts.google.com
connect-src 'self' https://www.googleapis.com https://identitytoolkit.googleapis.com
            https://firestore.googleapis.com https://securetoken.googleapis.com
            https://promotion-cbt-admin-bridge.promotioncbtadmin.workers.dev
            https://accounts.google.com
style-src   'self' https://fonts.googleapis.com https://accounts.google.com 'unsafe-inline'
font-src    'self' https://fonts.gstatic.com
img-src     'self' data: https://www.gstatic.com
frame-src   'self' https://accounts.google.com
```

Keep CSP in sync when adding new Firebase features, Cloudflare Worker endpoints, or third-party CDNs.
