# Directorate Levels Promotion CBT Practice

An interactive CBT practice application for Nigerian civil service promotion exams at the directorate level.

## Features

- Multiple quiz topics
- Practice and timed modes
- Progress tracking
- Responsive design
- Instant feedback on answers
- Performance analysis

## How to Use

1. Select a topic from the available options
2. Choose your preferred quiz mode (Practice or Timed)
3. Answer the questions
4. Review your results and see detailed feedback

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- GitHub Pages (for hosting)

## Setup for Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   ```
2. Install test dependencies:
   ```bash
   npm install
   ```
3. Run a local server:
   ```bash
   python -m http.server 4173
   ```
4. Open:
   ```text
   http://127.0.0.1:4173/
   ```

## Smoke Tests (Playwright)

Run the automated smoke suite:

```bash
npm run test:smoke
```

## Supabase Cloud Auth Setup (Multi-Device Login)

The app supports two auth modes:

- `Local` (default): account is stored in browser storage on one device.
- `Cloud` (Supabase): same account works across desktop/mobile browsers.

To enable `Cloud` mode:

1. Create a Supabase project: https://supabase.com
2. In Supabase, open `Project Settings -> API` and copy:
   - `Project URL`
   - `anon public key`
3. Open `index.html` and set:
   ```html
   window.PROMOTION_CBT_AUTH = {
     supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
     supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
   };
   ```
4. In Supabase, open `Authentication -> Providers -> Email` and enable the Email provider.
5. Optional: disable email confirmation if you want immediate login after signup.
6. Refresh/redeploy the app.

If configured correctly, the auth modal shows:
- `Auth mode: Cloud (multi-device)`

Detailed setup guide:
- `docs/supabase-auth-setup.md`

Plan sync:
- The app reads user plan (`free`/`premium`) from Supabase metadata and optional `profiles.plan`.
- See SQL setup in `docs/supabase-auth-setup.md`.

## Sync Cloud Changes to Your Local Repository

If updates were made in the cloud (for example on GitHub) and you want them on your local machine:

1. Ensure a remote is configured:
   ```bash
   git remote -v
   ```
2. If no remote appears, add one:
   ```bash
   git remote add origin <your-repository-url>
   ```
3. Fetch latest updates from the cloud:
   ```bash
   git fetch origin
   ```
4. Switch to your branch (example uses `main`) and pull:
   ```bash
   git checkout main
   git pull origin main
   ```

If you have local uncommitted work, stash first:

```bash
git stash
git pull origin main
git stash pop
```

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## URL Shortener

For easier sharing, you can use a URL shortener to create a more user-friendly link to this application:
- Full URL: https://timdasa75.github.io/Promotion-cbt-app/
- Example shortened URLs:
  - https://bit.ly/promotion-quiz
  - https://tinyurl.com/nigerian-psr-quiz

## Troubleshooting

If the topics are not loading when you access the application:
1. Check browser console for errors (`F12 -> Console`)
2. Verify GitHub Pages is enabled in repository settings
3. Wait a few minutes after deployment for GitHub Pages to build the site
4. Ensure all data files are properly formatted JSON files in the `data/` directory

If login works on one device but fails on another:
1. Confirm auth modal shows `Cloud (multi-device)`, not `Local (single-device)`
2. Verify `supabaseUrl` and `supabaseAnonKey` in `index.html`
3. Confirm Email provider is enabled in Supabase
4. If email confirmation is enabled, confirm the email before login

## License

This project is open source and available under the [MIT License](LICENSE).

## Known Issues and Fixes

- Fixed JavaScript syntax error that was preventing topics from loading properly

## Refactor Roadmap

A working implementation roadmap for the 10-topic architecture is available at:

- `docs/refactor-implementation-plan.md`

Before data/model changes are merged, run:

```bash
python scripts/validate_taxonomy.py
```
