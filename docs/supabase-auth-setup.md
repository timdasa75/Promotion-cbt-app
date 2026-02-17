# Supabase Auth Setup Guide

This guide configures Promotion CBT to use Supabase for cloud authentication so users can login across devices.

## 1. Create Supabase Project

1. Go to https://supabase.com and create/sign in to your account.
2. Create a new project.
3. Wait for provisioning to complete.

## 2. Get API Credentials

1. Open your project dashboard.
2. Go to `Project Settings -> API`.
3. Copy:
   - `Project URL` (looks like `https://xxxx.supabase.co`)
   - `anon public key`

## 3. Configure the App

In `index.html`, find this block:

```html
window.PROMOTION_CBT_AUTH = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};
```

Replace with your values:

```html
window.PROMOTION_CBT_AUTH = {
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

Important:
- Keep this as the public `anon` key only.
- Do not use the Supabase `service_role` key in frontend code.

## 4. Enable Email Authentication

1. Go to `Authentication -> Providers`.
2. Enable `Email`.
3. Choose your signup behavior:
   - `Confirm email ON`: users must confirm before first login.
   - `Confirm email OFF`: users can login immediately after signup.

## 5. URL Settings (Recommended)

In `Authentication -> URL Configuration`:

1. Set your Site URL:
   - Local: `http://127.0.0.1:4173`
   - Production: your GitHub Pages URL, for example:
     `https://timdasa75.github.io/Promotion-cbt-app/`
2. Add additional redirect URLs if needed.

## 6. Subscription Plan Sync (`free` / `premium`)

The app reads plan in this order:
1. `user_metadata.plan` / `app_metadata.plan`
2. `profiles.plan` table (if available)

Create `profiles` table in Supabase SQL Editor:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','premium')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);
```

Required upsert policy (needed so each logged-in user can create/update their own profile row, which powers admin user listing):

```sql
create policy "Users can upsert own profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

Set a user to premium (example):

```sql
insert into public.profiles (id, plan)
values ('USER_UUID_HERE', 'premium')
on conflict (id) do update set
  plan = excluded.plan,
  updated_at = now();
```

## 6b. Admin Role + User Directory (Recommended)

To power the in-app admin directory (`Users and Account Status`) in Cloud mode, extend `profiles`:

```sql
alter table public.profiles
add column if not exists email text,
add column if not exists role text not null default 'user' check (role in ('user','admin')),
add column if not exists status text not null default 'active' check (status in ('active','suspended')),
add column if not exists created_at timestamptz not null default now(),
add column if not exists last_seen_at timestamptz;
```

Backfill email from `auth.users`:

```sql
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');
```

Create admin-read policy for directory view:

```sql
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.role = 'admin'
  )
);
```

Assign main administrator:

```sql
update public.profiles
set role = 'admin'
where email = 'timdasa75@gmail.com';
```

Optional: ensure `status` defaults to active for existing rows:

```sql
update public.profiles
set status = 'active'
where status is null;
```

Note:
- The app now includes `timdasa75@gmail.com` as a default frontend admin allow-list email.
- On signup/login, the app now auto-upserts a user's `profiles` row (`id`, `email`, `plan`, `role`, `status`, `last_seen_at`).
- Cloud directory still depends on Supabase RLS policy above; otherwise app falls back to local directory view.

## 7. Password Reset

The app's `Forgot password?` button uses Supabase recovery email.

Ensure your redirect URL is allowed in Supabase:
- `Authentication -> URL Configuration`

When user clicks reset link from email, Supabase returns to your app URL.

## 8. Test End-to-End

1. Run app locally:
   ```bash
   python -m http.server 4173
   ```
2. Open `http://127.0.0.1:4173/`.
3. Open auth modal and confirm it shows:
   - `Auth mode: Cloud (multi-device)`
4. Register a user on desktop.
5. Login with same email/password on mobile.

## 9. Expected Behavior

- Same credentials work on any device/browser.
- Plan defaults to `free` unless changed in user metadata later.
- Progress remains per logged-in user id.

## Troubleshooting

If auth still behaves as local-only:
1. Confirm `supabaseUrl` and `supabaseAnonKey` are not empty in `index.html`.
2. Check browser console for network/auth errors.
3. Verify Email provider is enabled in Supabase.
4. Verify project URL and key are from the same Supabase project.

If signup succeeds but login fails:
1. Confirm email if confirmation is enabled.
2. Ensure password is at least 8 characters.
3. Check for typo in email (login is case-insensitive in app).

If CORS or redirect issues appear:
1. Re-check `Authentication -> URL Configuration`.
2. Ensure current app URL is allowed.
