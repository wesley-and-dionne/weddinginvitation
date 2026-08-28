# Wedding RSVP backend

This script connects the RSVP page to one private Google Sheets file containing `Bride Guests`, `Groom Guests`, and an automatically maintained `Confirmed Guests` compilation sheet.

## Columns

'token', 'partyNameEnglish', 'partyNameChinese', 'preferredLanguage', 'seats', 'teaInvited', 'invitationUrl', 'response', 'attendeeCount', 'guestOne', 'guestTwo', 'guestThree', 'guestFour', 'guestFive', 'teaAttendance', 'dietary', 'notes', 'responseLanguage', 'submittedAt', 'lastUpdated'

The website stores response as only 'Yes' or 'No'. Chinese characters are supported in party names, guest names, dietary requirements, and notes.

## First setup

1. Open the private wedding guest-list Google Sheets file.
2. Open **Extensions → Apps Script**.
3. Paste 'Code.gs' into the Apps Script editor and save.
4. Return to the Sheet, refresh it, then choose **Wedding RSVP → Set up bride and groom sheets**.
5. The script creates and formats separate `Bride Guests` and `Groom Guests` sheets inside the same file.
6. Add each invitation party to the appropriate sheet. Use a different row for each family or guest group.
7. Type `zh` in `preferredLanguage` for Chinese and `en` for English. Set `seats` from 1 to 5, and tick `teaInvited` where applicable.
8. Copy the generated `invitationUrl` from each row when sending invitations.

Running setup installs an authorized edit trigger. Tokens and invitation links then generate automatically when either guest sheet is updated.

When a party submits `Yes`, `Confirmed Guests` receives one row per attending guest with the bride/groom side, party names, guest name, tea ceremony response, dietary requirements, notes, and submission time. A resubmission replaces that party's compiled rows. Changing the RSVP to `No` removes those rows from the compilation while preserving the original RSVP record.

## Deploy

In Apps Script choose **Deploy → New deployment → Web app**. Set it to execute as you and allow anyone with the link to access it. Copy the '/exec' URL into 'APPS_SCRIPT_URL' in the website's 'rsvp.js'.

Keep the Sheet private. Only the deployed web-app URL belongs in the website.
