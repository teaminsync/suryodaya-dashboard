# Testing: Dashboard

Last reviewed 4 November 2026 (dashboard `df6cb88`, 204 tests).

## 1. Automated

```powershell
npm test         # tsx --test "lib/**/*.test.ts"
npm run lint     # must be clean
npm run build    # run last; also type-checks the whole app
```

Only the pure `lib/` logic is unit-tested (labels, grouping, filtering, validation, time formatting, the Origin check). Components and route handlers have no automated tests; verify them manually as below. Tests use `node:test` and `node:assert/strict`, in files named `lib/<name>.test.ts`.

## 2. Manual checks

Start the backend (port 3000) and `npm run dev` (port 3001), signed in as the admin.

1. **Inbox and lead page:** open an enquiry; conversation, captures, Move Estimate, Survey and Admin alerts render. Button taps from templates appear as customer bubbles.
2. **Human takeover:** switch it on, send a message; the AI stops replying. Switch it off.
3. **Outreach:** the consent history matches the database; a customer STOP shows "Opted out" and the card says only the customer can turn follow-ups back on (record fresh consent when testing).
4. **Automated messages:** the badge reads Automation off / Dry run / Automation on. Cancel an item in Up next: it moves to History as Cancelled with "cancelled by <your email>". After a send, History shows Sent with the channel (WhatsApp message or Template: name).
5. **Delivery problems:** run `npx tsx src/delivery-simulate.ts <digits>` in the backend repo; a red card appears on that contact's lead page. Run with `--clear` and it goes away.
6. **Settings:** the badge says "Using .env defaults" or "Using saved settings" with who saved and when. An invalid value (survey length 5) is blocked in the form; saving a valid change shows "Saved"; Reset to defaults asks for confirmation.
7. **Instagram connection:** shows days left and an expiry date. A manual refresh within a day of a success shows the backend's "Refreshed less than 24 hours ago" message in red. Setting `expires_at` to five days ahead in `integration_tokens` shows the amber banner; clearing it hides the banner.
8. **Surveys page:** a survey with a failed calendar write shows the red "Calendar not updated" badge.
9. **Security spot checks:** a POST to any `/api/...` route without a session returns `401`; with a foreign `Origin` header returns `403`.

## 3. Before committing

`npm test` (0 failures), `npm run lint` (clean), `npm run build` (clean, last). Make sure `AGENTS.md` shows no accidental changes.
