# Google Stitch Master Prompt

This document contains a single copy-paste prompt for Google Stitch.

The prompt is grounded in the current Promotion CBT learner experience defined in the repo, especially the learner-facing flows in `index.html`, `js/app.js`, `js/ui.js`, `js/quiz.js`, `README.md`, and `docs/user-guide.md`.

## Copy-Paste Prompt

```text
Design a polished learner-facing UI/UX redesign for "Promotion CBT", a browser-based exam preparation app for Nigerian Federal Civil Service promotion exams at the directorate track.

This is not a toy quiz app. It is a serious, high-trust study product for working professionals preparing for high-stakes promotion exams. The audience is adult learners who need clarity, confidence, momentum, and low cognitive friction on both mobile and desktop.

Your task is to redesign the UI while preserving the current product flows and core information architecture. Do not invent a different product. Do not remove important existing features. Improve hierarchy, spacing, scannability, navigation clarity, visual polish, and the feeling of guided progress.

Product context:
- The app currently supports 10 core topic banks spanning public service rules, financial regulations, procurement, constitutional/legal/FOI, civil service administration and ethics, leadership and management, ICT/digital, policy analysis, general current affairs, and core competencies.
- Learners can study by topic, go into subcategories, choose a session mode, take quizzes, review results, inspect analytics, review mistakes, manage profile/settings, and authenticate with email.
- There are free and premium access tiers, so the UI must gracefully communicate locked or premium-gated content without feeling cheap or cluttered.
- The product is government-adjacent and professional. It should feel credible, intelligent, modern, and premium, but still warm and motivating.

Current learner-facing screens and flows to preserve:
1. Splash / welcome screen
   - Clear product introduction
   - Start Learning CTA
   - Optional Resume Last Session CTA

2. Dashboard + topic selection screen
   - Summary stats such as attempts, average score, and streak
   - Recommendation cards such as Continue Session and Best Next Step
   - Search bar and filter chips
   - Topic browsing grid for 10 core topics
   - Utility actions like retry missed, spaced practice, review mistakes, analytics, profile/settings, help

3. Topic subcategory selection
   - Topic summary
   - Question count and confidence cues
   - List/grid of subcategories
   - Select all option

4. Session setup screen
   - Practice mode
   - Timed Topic Test mode
   - Study Review mode
   - Session tuning controls such as question count, difficulty, source, focus, GL emphasis
   - Directorate mock exam profile selection when relevant
   - Suggested setup guidance based on prior performance

5. Quiz screen
   - Topic title, timer, progress, and question count
   - Question prompt with answer options
   - Explanation panel
   - Previous, submit, next, and end exam actions
   - Review controls and question map when relevant
   - Keyboard-friendly and mobile-friendly interaction model

6. Results screen
   - Large score summary
   - Correct / wrong / unanswered stats
   - Session timing summary
   - Performance insight and category/topic breakdown
   - Clear next actions like retake, review answers, review missed questions, back to dashboard

7. Review mistakes screen
   - Filters by topic, subcategory, difficulty
   - Wrong answer review cards with explanation disclosure

8. Analytics screen
   - Score trend
   - Weekly consistency
   - Topic mastery heatmap
   - Strong next-step recommendation

9. Profile and settings screen
   - Learner identity block
   - Theme toggle
   - Privacy/data storage and sync status
   - Premium upgrade evidence submission form

10. Authentication modal
   - Login and register tabs
   - Email/password fields
   - Password visibility controls
   - Forgot password
   - Clear trust-building auth messaging

11. Empty/error states
   - No data yet
   - Network error
   - Partial content warning
   - These should feel productized, not like placeholders

Design direction:
- Create a hybrid visual language:
  - modern civic premium
  - bold exam-tech energy in controlled doses
  - minimal professional restraint
- The result should feel more elevated than the current interface but not flashy, juvenile, cartoonish, or generic startup SaaS.
- Keep it serious, focused, and premium.
- Use strong visual hierarchy and thoughtful grouping to reduce perceived complexity.
- Make dense content feel guided and calm rather than overwhelming.

Visual and brand cues:
- Reflect trust, credibility, discipline, progress, and achievement.
- The product should feel like a high-quality learning suite for public-service professionals.
- Avoid gimmicky gamification.
- Avoid overly playful illustrations.
- Avoid purple-heavy default AI aesthetics.
- Prefer a distinct, intentional design system with a confident palette, strong type hierarchy, and reusable components.
- Support both light and dark theme thinking.

UX priorities:
- Make the dashboard immediately useful for both first-time and returning learners.
- Make "what should I do next?" obvious everywhere.
- Improve the transition from topic selection to session setup so it feels intentional and confidence-building.
- Reduce visual noise in quiz-taking screens so focus stays on the question and progress.
- Make results and analytics feel motivating and actionable, not just numerical.
- Make auth and profile screens calmer and more trustworthy.
- Design for mobile-first responsiveness without sacrificing desktop efficiency.

Component and layout expectations:
- Create a cohesive design system across cards, section headers, filters, chips, stats, forms, modals, navigation, and feedback states.
- Improve spacing rhythm, typography scale, and CTA hierarchy.
- Use premium dashboard patterns, but tailored to a study product rather than finance or HR software.
- Treat topic cards and subcategory cards as highly scannable learning entry points.
- Give session setup clearer grouping so mode choice, filters, and recommended setup feel understandable at a glance.
- On quiz screens, prioritize focus, readability, answer confidence, progress awareness, and low-friction actions.
- On results and analytics screens, turn raw data into a narrative of progress and recommended action.

Accessibility and usability requirements:
- High readability for long study sessions
- Strong color contrast
- Clear tap targets on mobile
- Keyboard-friendly interaction patterns
- Do not rely on color alone for meaning
- Make state changes and progress cues obvious

Responsive behavior:
- Mobile should feel deliberate, not like a squeezed desktop layout.
- Desktop should use space well for comparison, analytics, and quiz context.
- Ensure cards, filters, forms, and quiz actions adapt cleanly across breakpoints.

Important constraints:
- Preserve the current learner flows and major feature set.
- Do not redesign this into a completely different IA.
- Do not add social features, chat, feeds, community areas, or gamified avatars.
- Do not remove free/premium distinctions.
- Keep the admin experience out of scope except as a very low-priority secondary consideration.
- The learner experience is the main focus.

Quality bar for the output:
- The redesign should feel like a strong next-generation version of the existing product.
- It should look intentional, premium, and implementation-ready.
- It should solve real UI/UX issues, not just apply a cosmetic style layer.
- It should make the app easier to understand, easier to navigate, and more motivating to use repeatedly.

Success scenarios the redesign must clearly support:
- A first-time visitor immediately understands what the app is and where to start.
- A returning learner can quickly resume or choose the next best study action.
- Topic browsing feels organized and scannable despite breadth and content density.
- Session setup feels clear and purposeful for Practice, Timed Topic Test, Study Review, and Directorate Mock Exam.
- The quiz experience supports concentration, confidence, and pace awareness on mobile and desktop.
- Results and analytics help learners understand performance and act on it.
- Profile/auth flows feel secure, serious, and uncluttered.
- Empty/error states feel designed as part of the product.

Please generate a cohesive UI/UX redesign concept for these learner-facing surfaces with strong visual hierarchy, premium product thinking, and realistic information density.
```
