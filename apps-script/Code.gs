var RSVP_CONFIG = {
  SHEET_NAMES: ["Bride Guests", "Groom Guests"],
  CONFIRMED_SHEET_NAME: "Confirmed Guests",
  HOTEL_SHEET_NAME: "Hotel Interest",
  WEBSITE_URL: "https://wesley-and-dionne.github.io/weddinginvitation/",
  PROPERTY_NAME: "WEDDING_RSVP_SPREADSHEET_ID",
  MAX_SEATS: 5,
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
    "guestThree",
    "guestFour",
    "guestFive",
    "teaAttendance",
    "dietary",
    "notes",
    "responseLanguage",
    "submittedAt",
    "lastUpdated"
  ],
  CONFIRMED_HEADERS: [
    "token",
    "guestSide",
    "partyNameEnglish",
    "partyNameChinese",
    "guestName",
    "teaAttendance",
    "dietary",
    "notes",
    "submittedAt"
  ],
  HOTEL_HEADERS: [
    "token",
    "guestSide",
    "partyNameEnglish",
    "partyNameChinese",
    "contactName",
    "checkInDate",
    "checkOutDate",
    "phone",
    "email",
    "numberOfPax",
    "numberOfRooms",
    "bedPreference",
    "specialRequests",
    "responseLanguage",
    "submittedAt",
    "lastUpdated"
  ]
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Wedding RSVP")
    .addItem("Set up wedding sheets", "setupWeddingRsvp")
    .addItem("Generate missing links", "generateMissingTokensAndLinks")
    .addToUi();
}

function setupWeddingRsvp() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open this script from the guest-list spreadsheet.");

  PropertiesService.getScriptProperties().setProperty(
    RSVP_CONFIG.PROPERTY_NAME,
    spreadsheet.getId()
  );

  RSVP_CONFIG.SHEET_NAMES.forEach(function (name) {
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    ensureHeaders_(sheet);
    formatGuestSheet_(sheet);
  });
  var confirmedSheet = spreadsheet.getSheetByName(RSVP_CONFIG.CONFIRMED_SHEET_NAME)
    || spreadsheet.insertSheet(RSVP_CONFIG.CONFIRMED_SHEET_NAME);
  ensureConfirmedHeaders_(confirmedSheet);
  formatConfirmedSheet_(confirmedSheet);
  var hotelSheet = spreadsheet.getSheetByName(RSVP_CONFIG.HOTEL_SHEET_NAME)
    || spreadsheet.insertSheet(RSVP_CONFIG.HOTEL_SHEET_NAME);
  ensureHotelHeaders_(hotelSheet);
  formatHotelSheet_(hotelSheet);
  installGuestEditTrigger_(spreadsheet);
  generateMissingTokensAndLinks();
  spreadsheet.toast("Wedding RSVP and hotel-interest sheets are ready.", "Wedding RSVP", 6);
}

function generateMissingTokensAndLinks() {
  var sheets = getGuestSheets_();
  var sheetIndex;
  for (sheetIndex = 0; sheetIndex < sheets.length; sheetIndex += 1) {
    generateMissingTokensAndLinksForSheet_(sheets[sheetIndex], sheets);
  }
}

function generateMissingTokensAndLinksForSheet_(sheet, allSheets) {
  var columns = getHeaderMap_(sheet);
  if (sheet.getLastRow() < 2) return;

  var width = sheet.getLastColumn();
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  var changed = false;

  rows.forEach(function (row) {
    if (!clean_(row[columns.partyNameEnglish - 1], 120)
      && !clean_(row[columns.partyNameChinese - 1], 120)) return;

    var token = clean_(row[columns.token - 1], 100);
    if (!token) {
      token = createUniqueToken_(allSheets);
      row[columns.token - 1] = token;
      changed = true;
    }

    var language = clean_(row[columns.preferredLanguage - 1], 2).toLowerCase();
    if (language !== "zh") language = "en";
    if (row[columns.preferredLanguage - 1] !== language) {
      row[columns.preferredLanguage - 1] = language;
      changed = true;
    }

    var seats = boundedSeats_(row[columns.seats - 1]);
    if (row[columns.seats - 1] !== seats) {
      row[columns.seats - 1] = seats;
      changed = true;
    }

    var url = invitationUrl_(token, language);
    if (row[columns.invitationUrl - 1] !== url) {
      row[columns.invitationUrl - 1] = url;
      changed = true;
    }
  });

  if (changed) sheet.getRange(2, 1, rows.length, width).setValues(rows);
}

function handleGuestEdit_(event) {
  if (!event || !event.range || event.range.getRow() < 2) return;
  var sheet = event.range.getSheet();
  if (RSVP_CONFIG.SHEET_NAMES.indexOf(sheet.getName()) === -1) return;

  var columns = getHeaderMap_(sheet);
  var watched = [
    columns.partyNameEnglish,
    columns.partyNameChinese,
    columns.preferredLanguage,
    columns.seats
  ];
  var first = event.range.getColumn();
  var last = event.range.getLastColumn();
  if (!watched.some(function (column) {
    return column >= first && column <= last;
  })) return;

  var row = event.range.getRow();
  var english = clean_(sheet.getRange(row, columns.partyNameEnglish).getValue(), 120);
  var chinese = clean_(sheet.getRange(row, columns.partyNameChinese).getValue(), 120);
  if (!english && !chinese) return;

  var token = clean_(sheet.getRange(row, columns.token).getValue(), 100);
  if (!token) {
    token = createUniqueToken_(getGuestSheetsFromSpreadsheet_(sheet.getParent()));
    sheet.getRange(row, columns.token).setValue(token);
  }

  var language = clean_(sheet.getRange(row, columns.preferredLanguage).getValue(), 2).toLowerCase();
  if (language !== "zh") language = "en";
  sheet.getRange(row, columns.preferredLanguage).setValue(language);
  sheet.getRange(row, columns.seats).setValue(boundedSeats_(sheet.getRange(row, columns.seats).getValue()));
  sheet.getRange(row, columns.invitationUrl).setValue(invitationUrl_(token, language));
}

function installGuestEditTrigger_(spreadsheet) {
  var triggers = ScriptApp.getProjectTriggers();
  var triggerIndex;
  for (triggerIndex = 0; triggerIndex < triggers.length; triggerIndex += 1) {
    if (triggers[triggerIndex].getHandlerFunction() === "handleGuestEdit_") {
      ScriptApp.deleteTrigger(triggers[triggerIndex]);
    }
  }

  ScriptApp.newTrigger("handleGuestEdit_")
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

function doGet(event) {
  try {
    var action = clean_(event && event.parameter && event.parameter.action, 20);
    if (action === "health") return json_({ success: true, service: "wedding-rsvp" });
    if (action !== "lookup") return json_({ success: false, message: "Unsupported request." });

    var token = validToken_(event.parameter.token);
    var guest = findGuestByToken_(token);
    if (!guest) return json_({ success: false, message: "Invitation not found." });

    var sheet = guest.sheet;
    var columns = guest.columns;
    var row = guest.row;
    return json_({
      success: true,
      invitation: {
        token: token,
        partyNameEnglish: clean_(row[columns.partyNameEnglish - 1], 120),
        partyNameChinese: clean_(row[columns.partyNameChinese - 1], 120),
        preferredLanguage: clean_(row[columns.preferredLanguage - 1], 2).toLowerCase() === "zh" ? "zh" : "en",
        seats: boundedSeats_(row[columns.seats - 1]),
        teaInvited: boolean_(row[columns.teaInvited - 1])
      }
    });
  } catch (error) {
    console.error(error);
    return json_({ success: false, message: safeMessage_(error) });
  }
}

function doPost(event) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var payload = JSON.parse((event && event.postData && event.postData.contents) || "{}");
    if (payload.action === "hotelInterest") {
      submitHotelInterest_(payload);
      SpreadsheetApp.flush();
      return json_({ success: true });
    }
    if (payload.action !== "submit") throw new Error("Unsupported request.");

    var token = validToken_(payload.token);
    var response = payload.response === "Yes" || payload.response === "No" ? payload.response : "";
    if (!response) throw new Error("Please select Yes or No.");

    var guest = findGuestByToken_(token);
    if (!guest) throw new Error("Invitation not found.");

    var sheet = guest.sheet;
    var columns = guest.columns;
    var rowNumber = guest.rowNumber;
    var row = guest.row;
    var reservedSeats = boundedSeats_(row[columns.seats - 1]);
    var attending = response === "Yes";
    var attendeeCount = attending ? Number(payload.attendeeCount) : 0;
    if (attending && (attendeeCount % 1 !== 0 || attendeeCount < 1 || attendeeCount > reservedSeats)) {
      throw new Error("The number attending exceeds the seats reserved for this invitation.");
    }

    var guestHeaders = ["guestOne", "guestTwo", "guestThree", "guestFour", "guestFive"];
    var guestNames = [];
    var guestIndex;
    for (guestIndex = 0; guestIndex < attendeeCount; guestIndex += 1) {
      var guestName = clean_(payload[guestHeaders[guestIndex]], 120);
      if (!guestName) throw new Error("Please enter every attending guest's full name.");
      guestNames.push(guestName);
    }

    var teaInvited = boolean_(row[columns.teaInvited - 1]);
    var teaAttendance = attending && teaInvited
      ? payload.teaAttendance === "yes" ? "Yes" : "No"
      : "";
    var dietary = attending ? clean_(payload.dietary, RSVP_CONFIG.MAX_NOTE_LENGTH) : "";
    var notes = attending ? clean_(payload.notes, RSVP_CONFIG.MAX_NOTE_LENGTH) : "";
    var now = new Date();

    set_(sheet, rowNumber, columns, "response", response);
    set_(sheet, rowNumber, columns, "attendeeCount", attendeeCount);
    for (guestIndex = 0; guestIndex < guestHeaders.length; guestIndex += 1) {
      set_(sheet, rowNumber, columns, guestHeaders[guestIndex], guestNames[guestIndex] || "");
    }
    set_(sheet, rowNumber, columns, "teaAttendance", teaAttendance);
    set_(sheet, rowNumber, columns, "dietary", dietary);
    set_(sheet, rowNumber, columns, "notes", notes);
    set_(sheet, rowNumber, columns, "responseLanguage", payload.responseLanguage === "zh" ? "zh" : "en");
    set_(sheet, rowNumber, columns, "submittedAt", now);
    set_(sheet, rowNumber, columns, "lastUpdated", now);
    syncConfirmedGuests_(
      sheet.getParent(),
      sheet.getName(),
      token,
      row,
      columns,
      attending,
      guestNames,
      teaAttendance,
      dietary,
      notes,
      now
    );
    SpreadsheetApp.flush();
    return json_({ success: true });
  } catch (error) {
    console.error(error);
    return json_({ success: false, message: safeMessage_(error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function getGuestSheets_() {
  var id = PropertiesService.getScriptProperties().getProperty(RSVP_CONFIG.PROPERTY_NAME);
  if (!id) throw new Error("Run Set up wedding sheets before deploying the backend.");
  var spreadsheet = SpreadsheetApp.openById(id);
  return getGuestSheetsFromSpreadsheet_(spreadsheet);
}

function getGuestSheetsFromSpreadsheet_(spreadsheet) {
  var sheets = RSVP_CONFIG.SHEET_NAMES.map(function (name) {
    var sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error("The " + name + " sheet is missing.");
    return sheet;
  });
  sheets.forEach(function (sheet) {
    ensureHeaders_(sheet);
  });
  return sheets;
}

function findGuestByToken_(token) {
  var sheets = getGuestSheets_();
  for (var index = 0; index < sheets.length; index += 1) {
    var sheet = sheets[index];
    var columns = getHeaderMap_(sheet);
    var rowNumber = findRow_(sheet, columns.token, token);
    if (rowNumber) {
      return {
        sheet: sheet,
        columns: columns,
        rowNumber: rowNumber,
        row: sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
      };
    }
  }
  return null;
}

function ensureHeaders_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  if (!existing.some(function (value) { return Boolean(value); })) {
    sheet.getRange(1, 1, 1, RSVP_CONFIG.HEADERS.length).setValues([RSVP_CONFIG.HEADERS]);
    return;
  }

  var missing = RSVP_CONFIG.HEADERS.filter(function (header) {
    return existing.indexOf(header) === -1;
  });
  if (missing.length) sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
}

function ensureConfirmedHeaders_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  if (!existing.some(function (value) { return Boolean(value); })) {
    sheet.getRange(1, 1, 1, RSVP_CONFIG.CONFIRMED_HEADERS.length)
      .setValues([RSVP_CONFIG.CONFIRMED_HEADERS]);
    return;
  }

  var missing = RSVP_CONFIG.CONFIRMED_HEADERS.filter(function (header) {
    return existing.indexOf(header) === -1;
  });
  if (missing.length) sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
}

function ensureHotelHeaders_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  if (!existing.some(function (value) { return Boolean(value); })) {
    sheet.getRange(1, 1, 1, RSVP_CONFIG.HOTEL_HEADERS.length)
      .setValues([RSVP_CONFIG.HOTEL_HEADERS]);
    return;
  }

  var missing = RSVP_CONFIG.HOTEL_HEADERS.filter(function (header) {
    return existing.indexOf(header) === -1;
  });
  if (missing.length) sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]);
}

function getHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var map = {};
  headers.forEach(function (header, index) {
    if (header) map[String(header).trim()] = index + 1;
  });
  RSVP_CONFIG.HEADERS.forEach(function (header) {
    if (!map[header]) throw new Error("Missing guest-list column: " + header);
  });
  return map;
}

function formatGuestSheet_(sheet) {
  var columns = getHeaderMap_(sheet);
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

function getConfirmedHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var map = {};
  headers.forEach(function (header, index) {
    if (header) map[String(header).trim()] = index + 1;
  });
  RSVP_CONFIG.CONFIRMED_HEADERS.forEach(function (header) {
    if (!map[header]) throw new Error("Missing confirmed-guest column: " + header);
  });
  return map;
}

function formatConfirmedSheet_(sheet) {
  var columns = getConfirmedHeaderMap_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setBackground("#b61b21")
    .setFontColor("#fff8f1")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.getRange(1, columns.submittedAt, sheet.getMaxRows(), 1)
    .setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.setColumnWidth(columns.partyNameEnglish, 180);
  sheet.setColumnWidth(columns.partyNameChinese, 160);
  sheet.setColumnWidth(columns.guestName, 180);
  sheet.setColumnWidth(columns.dietary, 180);
  sheet.setColumnWidth(columns.notes, 240);
}

function getHotelHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var map = {};
  headers.forEach(function (header, index) {
    if (header) map[String(header).trim()] = index + 1;
  });
  RSVP_CONFIG.HOTEL_HEADERS.forEach(function (header) {
    if (!map[header]) throw new Error("Missing hotel-interest column: " + header);
  });
  return map;
}

function formatHotelSheet_(sheet) {
  var columns = getHotelHeaderMap_(sheet);
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
  sheet.setColumnWidth(columns.contactName, 180);
  sheet.setColumnWidth(columns.checkInDate, 115);
  sheet.setColumnWidth(columns.checkOutDate, 115);
  sheet.setColumnWidth(columns.phone, 140);
  sheet.setColumnWidth(columns.email, 220);
  sheet.setColumnWidth(columns.specialRequests, 260);
}

function submitHotelInterest_(payload) {
  var token = validToken_(payload.token);
  var guest = findGuestByToken_(token);
  if (!guest) throw new Error("Invitation not found.");

  var contactName = clean_(payload.contactName, 120);
  var checkInDate = validStayDate_(payload.checkInDate);
  var checkOutDate = validStayDate_(payload.checkOutDate);
  var phone = clean_(payload.phone, 50);
  var email = clean_(payload.email, 180).toLowerCase();
  var numberOfPax = boundedHotelNumber_(payload.numberOfPax, "guests");
  var numberOfRooms = boundedHotelNumber_(payload.numberOfRooms, "rooms");
  var bedPreference = clean_(payload.bedPreference, 30);
  var allowedBeds = ["no-preference", "king", "twin"];
  var specialRequests = clean_(payload.specialRequests, RSVP_CONFIG.MAX_NOTE_LENGTH);

  if (!contactName) throw new Error("Please enter your full name.");
  if (checkOutDate <= checkInDate) throw new Error("Check-out must be after check-in.");
  if (!phone) throw new Error("Please enter a phone number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
  if (allowedBeds.indexOf(bedPreference) === -1) bedPreference = "no-preference";

  var spreadsheet = guest.sheet.getParent();
  var sheet = spreadsheet.getSheetByName(RSVP_CONFIG.HOTEL_SHEET_NAME)
    || spreadsheet.insertSheet(RSVP_CONFIG.HOTEL_SHEET_NAME);
  ensureHotelHeaders_(sheet);
  formatHotelSheet_(sheet);
  var columns = getHotelHeaderMap_(sheet);
  var rowNumber = findRow_(sheet, columns.token, token);
  var isNew = !rowNumber;
  if (isNew) rowNumber = sheet.getLastRow() + 1;

  var width = sheet.getLastColumn();
  var row;
  if (isNew) {
    row = [];
    for (var columnIndex = 0; columnIndex < width; columnIndex += 1) row.push("");
  } else {
    row = sheet.getRange(rowNumber, 1, 1, width).getValues()[0];
  }
  var now = new Date();

  row[columns.token - 1] = token;
  row[columns.guestSide - 1] = guest.sheet.getName();
  row[columns.partyNameEnglish - 1] = clean_(guest.row[guest.columns.partyNameEnglish - 1], 120);
  row[columns.partyNameChinese - 1] = clean_(guest.row[guest.columns.partyNameChinese - 1], 120);
  row[columns.contactName - 1] = contactName;
  row[columns.checkInDate - 1] = checkInDate;
  row[columns.checkOutDate - 1] = checkOutDate;
  row[columns.phone - 1] = phone;
  row[columns.email - 1] = email;
  row[columns.numberOfPax - 1] = numberOfPax;
  row[columns.numberOfRooms - 1] = numberOfRooms;
  row[columns.bedPreference - 1] = bedPreference;
  row[columns.specialRequests - 1] = specialRequests;
  row[columns.responseLanguage - 1] = payload.responseLanguage === "zh" ? "zh" : "en";
  if (isNew || !row[columns.submittedAt - 1]) row[columns.submittedAt - 1] = now;
  row[columns.lastUpdated - 1] = now;

  sheet.getRange(rowNumber, 1, 1, width).setValues([row]);
}

function validStayDate_(value) {
  var date = clean_(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Please enter valid stay dates.");
  var parts = date.split("-");
  var parsed = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  if (parsed.getUTCFullYear() !== Number(parts[0])
    || parsed.getUTCMonth() !== Number(parts[1]) - 1
    || parsed.getUTCDate() !== Number(parts[2])) {
    throw new Error("Please enter valid stay dates.");
  }
  return date;
}

function boundedHotelNumber_(value, label) {
  var number = Number(value);
  if (number % 1 !== 0 || number < 1 || number > 5) {
    throw new Error("Please select between 1 and 5 " + label + ".");
  }
  return number;
}

function syncConfirmedGuests_(spreadsheet, guestSide, token, sourceRow, sourceColumns, attending, guestNames, teaAttendance, dietary, notes, submittedAt) {
  var sheet = spreadsheet.getSheetByName(RSVP_CONFIG.CONFIRMED_SHEET_NAME)
    || spreadsheet.insertSheet(RSVP_CONFIG.CONFIRMED_SHEET_NAME);
  ensureConfirmedHeaders_(sheet);
  formatConfirmedSheet_(sheet);
  removeConfirmedTokenRows_(sheet, token);

  if (!attending || !guestNames.length) return;

  var partyNameEnglish = clean_(sourceRow[sourceColumns.partyNameEnglish - 1], 120);
  var partyNameChinese = clean_(sourceRow[sourceColumns.partyNameChinese - 1], 120);
  var rows = [];
  var guestIndex;
  for (guestIndex = 0; guestIndex < guestNames.length; guestIndex += 1) {
    rows.push([
      token,
      guestSide,
      partyNameEnglish,
      partyNameChinese,
      guestNames[guestIndex],
      teaAttendance,
      dietary,
      notes,
      submittedAt
    ]);
  }
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, RSVP_CONFIG.CONFIRMED_HEADERS.length)
    .setValues(rows);
}

function removeConfirmedTokenRows_(sheet, token) {
  if (sheet.getLastRow() < 2) return;
  var columns = getConfirmedHeaderMap_(sheet);
  var tokenValues = sheet.getRange(2, columns.token, sheet.getLastRow() - 1, 1).getDisplayValues();
  var rowIndex;
  for (rowIndex = tokenValues.length - 1; rowIndex >= 0; rowIndex -= 1) {
    if (clean_(tokenValues[rowIndex][0], 100) === token) {
      sheet.deleteRow(rowIndex + 2);
    }
  }
}

function createUniqueToken_(sheets) {
  var token;
  do {
    token = Utilities.getUuid().replace(/-/g, "");
  } while (sheets.some(function (sheet) {
    var columns = getHeaderMap_(sheet);
    return findRow_(sheet, columns.token, token);
  }));
  return token;
}

function findRow_(sheet, tokenColumn, token) {
  if (sheet.getLastRow() < 2) return 0;
  var match = sheet.getRange(2, tokenColumn, sheet.getLastRow() - 1, 1)
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
  var seats = Number(value);
  if (seats % 1 !== 0 || seats < 1) seats = 1;
  return Math.min(seats, RSVP_CONFIG.MAX_SEATS);
}

function validToken_(value) {
  var token = clean_(value, 100);
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
