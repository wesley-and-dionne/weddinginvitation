const RSVP_CONFIG = {
  SHEET_NAME: "Guests",
  WEBSITE_URL: "https://wesley-and-dionne.github.io/weddinginvitation/",
  PROPERTY_NAME: "WEDDING_RSVP_SPREADSHEET_ID",
  MAX_SEATS: 10,
  MAX_NOTE_LENGTH: 500,
  HEADERS: [
    "token",
    "partyNameEnglish",
    "partyNameChinese",
    "preferredLanguage",
    "seats",
    "teaInvited",
    "invitationUrl",
    "response",
    "attendeeCount",
    "guestOne",
    "guestTwo",
    "teaAttendance",
    "dietary",
    "notes",
    "responseLanguage",
    "submittedAt",
    "lastUpdated",
  ],
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Wedding RSVP")
    .addItem("Set up guest list", "setupWeddingRsvp")
    .addItem("Generate missing links", "generateMissingTokensAndLinks")
    .addToUi();
}

function setupWeddingRsvp() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open this script from the guest-list spreadsheet.");

  PropertiesService.getScriptProperties().setProperty(
    RSVP_CONFIG.PROPERTY_NAME,
    spreadsheet.getId(),
  );

  const sheet = spreadsheet.getSheetByName(RSVP_CONFIG.SHEET_NAME)
    || spreadsheet.insertSheet(RSVP_CONFIG.SHEET_NAME);
  ensureHeaders_(sheet);
  formatGuestSheet_(sheet);
  generateMissingTokensAndLinks();
  spreadsheet.toast("Guest list ready. Add one invitation party per row.", "Wedding RSVP", 6);
}

function generateMissingTokensAndLinks() {
  const sheet = getGuestSheet_();
  const columns = getHeaderMap_(sheet);
  if (sheet.getLastRow() < 2) return;

  const width = sheet.getLastColumn();
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  let changed = false;

  rows.forEach((row) => {
    if (!clean_(row[columns.partyNameEnglish - 1], 120)
      && !clean_(row[columns.partyNameChinese - 1], 120)) return;

    let token = clean_(row[columns.token - 1], 100);
    if (!token) {
      token = createUniqueToken_(sheet, columns.token);
      row[columns.token - 1] = token;
      changed = true;
    }

    let language = clean_(row[columns.preferredLanguage - 1], 2).toLowerCase();
    if (language !== "zh") language = "en";
    if (row[columns.preferredLanguage - 1] !== language) {
      row[columns.preferredLanguage - 1] = language;
      changed = true;
    }

    const seats = boundedSeats_(row[columns.seats - 1]);
    if (row[columns.seats - 1] !== seats) {
      row[columns.seats - 1] = seats;
      changed = true;
    }

    const url = invitationUrl_(token, language);
    if (row[columns.invitationUrl - 1] !== url) {
      row[columns.invitationUrl - 1] = url;
      changed = true;
    }
  });

  if (changed) sheet.getRange(2, 1, rows.length, width).setValues(rows);
}

function onEdit(event) {
  if (!event || !event.range || event.range.getRow() < 2) return;
  const sheet = event.range.getSheet();
  if (sheet.getName() !== RSVP_CONFIG.SHEET_NAME) return;

  const columns = getHeaderMap_(sheet);
  const watched = [
    columns.partyNameEnglish,
    columns.partyNameChinese,
    columns.preferredLanguage,
    columns.seats,
  ];
  const first = event.range.getColumn();
  const last = event.range.getLastColumn();
  if (!watched.some((column) => column >= first && column <= last)) return;

  const row = event.range.getRow();
  const english = clean_(sheet.getRange(row, columns.partyNameEnglish).getValue(), 120);
  const chinese = clean_(sheet.getRange(row, columns.partyNameChinese).getValue(), 120);
  if (!english && !chinese) return;

  let token = clean_(sheet.getRange(row, columns.token).getValue(), 100);
  if (!token) {
    token = createUniqueToken_(sheet, columns.token);
    sheet.getRange(row, columns.token).setValue(token);
  }

  let language = clean_(sheet.getRange(row, columns.preferredLanguage).getValue(), 2).toLowerCase();
  if (language !== "zh") language = "en";
  sheet.getRange(row, columns.preferredLanguage).setValue(language);
  sheet.getRange(row, columns.seats).setValue(boundedSeats_(sheet.getRange(row, columns.seats).getValue()));
  sheet.getRange(row, columns.invitationUrl).setValue(invitationUrl_(token, language));
}

function doGet(event) {
  try {
    const action = clean_(event && event.parameter && event.parameter.action, 20);
    if (action === "health") return json_({ success: true, service: "wedding-rsvp" });
    if (action !== "lookup") return json_({ success: false, message: "Unsupported request." });

    const token = validToken_(event.parameter.token);
    const sheet = getGuestSheet_();
    const columns = getHeaderMap_(sheet);
    const rowNumber = findRow_(sheet, columns.token, token);
    if (!rowNumber) return json_({ success: false, message: "Invitation not found." });

    const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    return json_({
      success: true,
      invitation: {
        token: token,
        partyNameEnglish: clean_(row[columns.partyNameEnglish - 1], 120),
        partyNameChinese: clean_(row[columns.partyNameChinese - 1], 120),
        preferredLanguage: clean_(row[columns.preferredLanguage - 1], 2).toLowerCase() === "zh" ? "zh" : "en",
        seats: boundedSeats_(row[columns.seats - 1]),
        teaInvited: boolean_(row[columns.teaInvited - 1]),
      },
    });
  } catch (error) {
    console.error(error);
    return json_({ success: false, message: safeMessage_(error) });
  }
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const payload = JSON.parse((event && event.postData && event.postData.contents) || "{}");
    if (payload.action !== "submit") throw new Error("Unsupported request.");

    const token = validToken_(payload.token);
    const response = payload.response === "Yes" || payload.response === "No" ? payload.response : "";
    if (!response) throw new Error("Please select Yes or No.");

    const sheet = getGuestSheet_();
    const columns = getHeaderMap_(sheet);
    const rowNumber = findRow_(sheet, columns.token, token);
    if (!rowNumber) throw new Error("Invitation not found.");

    const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    const reservedSeats = boundedSeats_(row[columns.seats - 1]);
    const attending = response === "Yes";
    const attendeeCount = attending ? Number(payload.attendeeCount) : 0;
    if (attending && (!Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > reservedSeats)) {
      throw new Error("The number attending exceeds the seats reserved for this invitation.");
    }

    const guestOne = attending ? clean_(payload.guestOne, 120) : "";
    const guestTwo = attending && attendeeCount > 1 ? clean_(payload.guestTwo, 120) : "";
    if (attending && !guestOne) throw new Error("Please enter the first guest's name.");
    if (attending && attendeeCount > 1 && !guestTwo) throw new Error("Please enter the second guest's name.");

    const teaInvited = boolean_(row[columns.teaInvited - 1]);
    const teaAttendance = attending && teaInvited
      ? payload.teaAttendance === "yes" ? "Yes" : "No"
      : "";
    const now = new Date();

    set_(sheet, rowNumber, columns, "response", response);
    set_(sheet, rowNumber, columns, "attendeeCount", attendeeCount);
    set_(sheet, rowNumber, columns, "guestOne", guestOne);
    set_(sheet, rowNumber, columns, "guestTwo", guestTwo);
    set_(sheet, rowNumber, columns, "teaAttendance", teaAttendance);
    set_(sheet, rowNumber, columns, "dietary", attending ? clean_(payload.dietary, RSVP_CONFIG.MAX_NOTE_LENGTH) : "");
    set_(sheet, rowNumber, columns, "notes", attending ? clean_(payload.notes, RSVP_CONFIG.MAX_NOTE_LENGTH) : "");
    set_(sheet, rowNumber, columns, "responseLanguage", payload.responseLanguage === "zh" ? "zh" : "en");
    set_(sheet, rowNumber, columns, "submittedAt", now);
    set_(sheet, rowNumber, columns, "lastUpdated", now);
    SpreadsheetApp.flush();
    return json_({ success: true });
  } catch (error) {
    console.error(error);
    return json_({ success: false, message: safeMessage_(error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function getGuestSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(RSVP_CONFIG.PROPERTY_NAME);
  if (!id) throw new Error("Run Set up guest list before deploying the backend.");
  const sheet = SpreadsheetApp.openById(id).getSheetByName(RSVP_CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("The Guests sheet is missing.");
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  if (!existing.some((value) => value)) {
    sheet.getRange(1, 1, 1, RSVP_CONFIG.HEADERS.length).setValues([RSVP_CONFIG.HEADERS]);
    return;
  }

  const missing = RSVP_CONFIG.HEADERS.filter((header) => !existing.includes(header));
  if (missing.length) sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
}

function getHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    if (header) map[String(header).trim()] = index + 1;
  });
  RSVP_CONFIG.HEADERS.forEach((header) => {
    if (!map[header]) throw new Error("Missing guest-list column: " + header);
  });
  return map;
}

function formatGuestSheet_(sheet) {
  const columns = getHeaderMap_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setBackground("#b61b21")
    .setFontColor("#fff8f1")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.getRange(1, columns.submittedAt, sheet.getMaxRows(), 2)
    .setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.setColumnWidth(columns.partyNameEnglish, 180);
  sheet.setColumnWidth(columns.partyNameChinese, 160);
  sheet.setColumnWidth(columns.invitationUrl, 430);
  sheet.setColumnWidth(columns.dietary, 180);
  sheet.setColumnWidth(columns.notes, 240);
}

function createUniqueToken_(sheet, tokenColumn) {
  let token;
  do {
    token = Utilities.getUuid().replace(/-/g, "");
  } while (findRow_(sheet, tokenColumn, token));
  return token;
}

function findRow_(sheet, tokenColumn, token) {
  if (sheet.getLastRow() < 2) return 0;
  const match = sheet.getRange(2, tokenColumn, sheet.getLastRow() - 1, 1)
    .createTextFinder(token)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function invitationUrl_(token, language) {
  return RSVP_CONFIG.WEBSITE_URL + "?invite=" + encodeURIComponent(token)
    + (language === "zh" ? "&lang=zh" : "");
}

function boundedSeats_(value) {
  let seats = Number(value);
  if (!Number.isInteger(seats) || seats < 1) seats = 1;
  return Math.min(seats, RSVP_CONFIG.MAX_SEATS);
}

function validToken_(value) {
  const token = clean_(value, 100);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(token)) throw new Error("Invalid invitation link.");
  return token;
}

function clean_(value, maxLength) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function boolean_(value) {
  return value === true || String(value).toLowerCase() === "true";
}

function set_(sheet, row, columns, header, value) {
  sheet.getRange(row, columns[header]).setValue(value);
}

function safeMessage_(error) {
  return clean_(error && error.message, 180) || "Unable to process this request.";
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
