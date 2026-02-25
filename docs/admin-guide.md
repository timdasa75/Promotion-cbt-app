# Admin Guide

## Purpose

This guide covers how administrators operate Promotion CBT safely and effectively:

- access admin tools
- review upgrade requests
- apply plan overrides
- inspect user directory and counts
- troubleshoot common admin issues

## Admin Access

Admin access is controlled by configured admin email list.

Default admin:
- `timdasa75@gmail.com`

Additional admins can be configured in `index.html`:

```html
window.PROMOTION_CBT_ADMIN_EMAILS = ["admin1@example.com", "admin2@example.com"];
```

## Opening the Admin Panel

1. Login with an admin account.
2. Open account menu or `Admin` button from Topic Selection.
3. Enter the `Admin Panel` screen.

If non-admin users try to open admin features, access is blocked.

## Admin Panel Sections

## 1) Manual Upgrade Requests

Purpose:
- review payment evidence submitted by users

What you can do:
- `Approve`: marks request approved and applies premium plan override for that user email
- `Reject`: marks request rejected

Notes:
- requests are stored in local browser storage by default
- approval applies an immediate local override

## 2) Plan Override

Purpose:
- manually force a user plan (`free` or `premium`)

Steps:
1. Enter user email.
2. Choose plan.
3. Click `Apply Override`.

Override list:
- shows all active local overrides
- allows clearing individual overrides

## 3) Users and Account Status

Purpose:
- monitor user accounts and status at a glance

Includes:
- source label (`Cloud profiles` or `Local fallback`)
- user count label (`Users: filtered/total`)
- search by email
- status filter (`All`, `Active`, `Suspended`)
- refresh button

Directory columns:
- Email
- Role
- Plan
- Status
- Created
- Last Seen

## Data Source Behavior

## Cloud mode (Firebase configured)

Admin directory attempts to read from Firestore `profiles`.

Expected source label:
- `Source: Cloud profiles`

If cloud access/policy fails:
- app falls back to local directory
- if a previous cloud read succeeded, app shows cached cloud snapshot merged with local directory
- shows warning notice

## Local mode

Directory reads browser-local user/session data.

Expected source label:
- `Source: Local fallback`

## Recommended Operational Workflow

1. Open `Admin Panel`.
2. Review pending upgrade requests first.
3. Approve/reject based on evidence.
4. Confirm user appears with intended plan in directory.
5. Use search/filter to verify account state.
6. Refresh directory before closing admin session.

## Troubleshooting

## Admin button not visible

- confirm logged-in email is in admin list
- hard refresh (`Ctrl+F5`)
- verify admin email config in `index.html`

## Cloud source unavailable

- check Firebase API key/project id config
- confirm `profiles` collection exists
- confirm Firestore rules allow expected reads for admin flow
- use local fallback until cloud policy is corrected

## User count seems incorrect

- counts are shown as `filtered/total`
- clear search text and set status to `All` for full total
- click `Refresh` to pull latest directory data

## Plan change not reflected

- re-open dashboard/topic selection
- refresh admin users list
- verify override list entry

## Security Notes

- never place privileged server-only Firebase credentials in frontend code
- keep admin email list limited to trusted operators
- review and prune overrides periodically

## Related Docs

- `README.md`
- `docs/user-guide.md`
- `docs/firebase-auth-setup.md`
