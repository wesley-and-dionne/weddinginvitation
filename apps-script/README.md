# Wedding RSVP backend

This script connects the RSVP page to a private Google Sheet. Each row is one invitation party.

## Columns

'token', 'partyNameEnglish', 'partyNameChinese', 'preferredLanguage', 'seats', 'teaInvited', 'invitationUrl', 'response', 'attendeeCount', 'guestOne', 'guestTwo', 'teaAttendance', 'dietary', 'notes', 'responseLanguage', 'submittedAt', 'lastUpdated'

The website stores response as only 'Yes' or 'No'. Chinese characters are supported in party names, guest names, dietary requirements, and notes.

## First setup

1. Create a private Google Sheet.
2. Open **Extensions → Apps Script**.
3. Paste 'Code.gs' into the Apps Script editor and save.
4. Return to the Sheet, refresh it, then choose **Wedding RSVP → Set up guest list**.
5. Add one invitation party per row. Use a different row for each family or guest group.
6. Use 'preferredLanguage' as 'en' or 'zh', set the reserved 'seats', and tick 'teaInvited' where applicable.
7. Copy the generated 'invitationUrl' from each row when sending invitations.

## Deploy

In Apps Script choose **Deploy → New deployment → Web app**. Set it to execute as you and allow anyone with the link to access it. Copy the '/exec' URL into 'APPS_SCRIPT_URL' in the website's 'rsvp.js'.

Keep the Sheet private. Only the deployed web-app URL belongs in the website.
