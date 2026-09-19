# Admin Guide

## Purpose

This guide covers how administrators operate Promotion CBT safely and effectively:

- access admin tools
- review upgrade requests
- apply plan overrides
- inspect user directory and counts
- triage user feedback
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
- in Cloud mode, latest request state is synced on Firestore `profiles`
- each submission is also archived in Firestore `upgradeRequests` for record retention
- local browser storage is still used as a fallback when cloud sync is unavailable
- approval applies an immediate local override (and cloud override when available)

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

## 4) Feedback Inbox

Purpose:
- review product feedback and question reports submitted by cloud-signed-in users

Includes:
- feedback count label (`Feedback: filtered/total`)
- search by email, message, topic, question id, or session id
- filters for `Status`, `Category`, and `Source`
- refresh button
- full feedback cards with message and captured context

Feedback fields you will see:
- user email
- category badge
- status badge
- source (`Help`, `Quiz`, `Results`)
- created time and review time
- message body
- optional context such as topic, question id, session id, and mode

Feedback statuses:
- `New`: waiting for first review
- `In Review`: actively being checked
- `Resolved`: issue handled or accepted
- `Dismissed`: closed without further action

Admin actions:
- `Mark In Review`
- `Resolve`
- `Dismiss`
- `Send Reply` (text box on each card)
- `Fix question` (question reports: opens the Question Bank editor)

Every feedback status change is also written into the admin operation history.

### Response protocol

Every submission must end in a user-visible response. Users do not get
notification emails on the free tier — they see admin responses only in the
**My Feedback** card on their profile page (with a "New reply" badge on the
next visit). That card shows the `admin_reply` text.

1. **Acknowledge** — set `In Review` when you start looking (optional but
   good practice).
2. **Resolve with a message** — clicking `Resolve` prompts for a message to
   the user. The prompt is mandatory: an empty message cancels the resolve.
   The message is stored as both `resolution` (internal record) and
   `admin_reply` (the channel the user actually sees), so a resolve on its
   own always reaches the user.
3. **Or reply without resolving** — for an ongoing conversation, use the
   reply box. Replying promotes `New` to `In Review` but never demotes a
   closed item; resolved submissions keep their status while you follow up.
4. **Dismiss** closes without a user-facing response. Use it for spam or
   no-action-required items; the user sees the `Dismissed` badge only.
5. **Question reports** — use `Fix question`, correct the bank, then resolve
   with a short note of what was changed (e.g. "Re-keyed to OHCSF per PSR
   030102 — thanks for catching this").

The admin feedback card shows both the reply and the resolution note so you
can see exactly what the user was told.

## Data Source Behavior

## Cloud mode (Firebase configured)

Admin directory and feedback inbox read from Firestore.

Expected source behavior:
- users: `Source: Cloud profiles`
- feedback: live `feedbackSubmissions` collection query

If cloud access or rules fail:
- user directory falls back to local data or cached cloud snapshot when available
- feedback inbox shows an error notice until Firestore access is restored

## Local mode

Directory reads browser-local user/session data.

Expected source label:
- `Source: Local fallback`

Feedback inbox is not available in local mode because feedback submission is cloud-only.

## Recommended Operational Workflow

1. Open `Admin Panel`.
2. Review pending upgrade requests first.
3. Review new feedback items and move active ones to `In Review`.
4. Resolve or dismiss feedback after checking the reported issue.
5. Confirm the user directory still reflects the intended plan and status.
6. Refresh before closing the admin session.

## Troubleshooting

## Admin button not visible

- confirm logged-in email is in admin list
- hard refresh (`Ctrl+F5`)
- verify admin email config in `index.html`

## Cloud source unavailable

- check Firebase API key/project id config
- confirm `profiles`, `upgradeRequests`, and `feedbackSubmissions` collections exist
- confirm Firestore rules allow expected reads for admin flow
- use local fallback for user directory until cloud policy is corrected

## User count seems incorrect

- counts are shown as `filtered/total`
- clear search text and set status to `All` for full total
- click `Refresh` to pull latest directory data

## Feedback inbox looks empty

- confirm users are signed in with Cloud accounts before sending feedback
- clear feedback filters and search text
- click `Refresh` to query Firestore again
- confirm Firestore rules permit admin reads on `feedbackSubmissions`

## Plan change not reflected

- re-open dashboard/topic selection
- refresh admin users list
- verify override list entry

## Security Notes

- never place privileged server-only Firebase credentials in frontend code
- keep admin email list limited to trusted operators
- review and prune overrides periodically
- review dismissed/resolved feedback periodically so the inbox stays actionable

## Related Docs

- `README.md`
- `docs/user-guide.md`
- `docs/firebase-auth-setup.md`