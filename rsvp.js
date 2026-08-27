const APPS_SCRIPT_URL = "";

const translations = {
  en: {
    back: "← Wedding website",
    heading: "Kindly RSVP",
    deadline: "Please respond by 1 February 2027.",
    lookupIntro: "Please use the personalised RSVP link included with your invitation.",
    linkHelp: "If the link is not working, please contact the couple for assistance.",
    invitationFound: "Your invitation",
    welcome: "Welcome,",
    attendanceQuestion: "May we have the pleasure of your company?",
    accepts: "Yes",
    declines: "No",
    numberAttending: "Number attending",
    teaAttendance: "Tea ceremony attendance",
    willAttend: "Will attend",
    unableAttend: "Unable to attend",
    guestOne: "Guest 1 full name",
    guestTwo: "Guest 2 full name",
    dietary: "Dietary requirements",
    optional: "(optional)",
    notes: "Notes",
    submit: "Submit RSVP",
    seatOne: "We have reserved 1 seat for you.",
    seatMany: "We have reserved {count} seats for your party.",
    setupPending: "This invitation will work after the private guest list is connected.",
    missingLink: "A personalised invitation link is required to access this RSVP.",
    submitPending: "The private RSVP spreadsheet is not connected yet. Please use a preview invitation.",
    chooseResponse: "Please select Yes or No.",
    submitError: "Unable to submit your RSVP. Please try again.",
  },
  zh: {
    back: "← 返回婚礼网站",
    heading: "敬请回复",
    deadline: "敬请于2027年2月1日前回复。",
    lookupIntro: "请使用喜帖中的专属回复链接。",
    linkHelp: "如链接无法使用，请联系新人协助。",
    invitationFound: "您的邀请",
    welcome: "欢迎您，",
    attendanceQuestion: "您会出席我们的婚礼吗？",
    accepts: "出席",
    declines: "不出席",
    numberAttending: "出席人数",
    teaAttendance: "敬茶仪式出席情况",
    willAttend: "将会出席",
    unableAttend: "无法出席",
    guestOne: "宾客一姓名",
    guestTwo: "宾客二姓名",
    dietary: "饮食需求",
    optional: "（选填）",
    notes: "留言",
    submit: "提交回复",
    seatOne: "已为您预留1席。",
    seatMany: "已为您预留{count}席。",
    setupPending: "连接私人宾客名单后，此邀请即可使用。",
    missingLink: "请通过您的专属邀请链接进入此页面。",
    submitPending: "私人回复表格尚未连接，请使用预览邀请。",
    chooseResponse: "请选择出席或不出席。",
    submitError: "暂时无法提交回复，请稍后再试。",
  },
};

const demoInvitations = {
  "preview-one": {
    token: "preview-one",
    partyNameEnglish: "Alex Tan",
    partyNameChinese: "陈先生",
    preferredLanguage: "en",
    seats: 1,
    teaInvited: false,
    demo: true,
  },
  "preview-two": {
    token: "preview-two",
    partyNameEnglish: "The Tan Family",
    partyNameChinese: "陈府",
    preferredLanguage: "zh",
    seats: 2,
    teaInvited: true,
    demo: true,
  },
};

const pageParams = new URLSearchParams(window.location.search);
const tokenFromUrl = pageParams.get("invite") || "";
const explicitLanguage = pageParams.get("lang");

const languageButton = document.querySelector(".language-toggle");
const lookupView = document.querySelector("#lookup-view");
const responseView = document.querySelector("#response-view");
const responseForm = document.querySelector("#response-form");
const lookupStatus = document.querySelector("#lookup-status");
const submitStatus = document.querySelector("#submit-status");
const attendeeCount = document.querySelector("#attendee-count");
const guestTwoField = document.querySelector("#guest-two-field");
const guestTwo = document.querySelector("#guest-two");
const teaField = document.querySelector("#tea-field");
const attendanceDetails = document.querySelector("#attendance-details");

let currentLanguage = explicitLanguage === "zh" ? "zh" : "en";
let currentInvitation = null;

const text = (key, replacements = {}) => {
  let value = translations[currentLanguage][key];
  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
};

const parseBoolean = (value) => value === true || String(value).toLowerCase() === "true";

const normalizeInvitation = (invitation) => ({
  ...invitation,
  token: invitation.token || tokenFromUrl,
  partyNameEnglish: invitation.partyNameEnglish || invitation.partyNameEn || invitation.partyName || "Guest",
  partyNameChinese:
    invitation.partyNameChinese || invitation.partyNameZh || invitation.partyName || invitation.partyNameEnglish || "贵宾",
  preferredLanguage: invitation.preferredLanguage === "zh" ? "zh" : "en",
  seats: Math.max(1, Number(invitation.seats) || 1),
  teaInvited: parseBoolean(invitation.teaInvited),
});

const partyName = () => currentLanguage === "zh"
  ? currentInvitation.partyNameChinese
  : currentInvitation.partyNameEnglish;

const updateReturnLinks = () => {
  document.querySelectorAll('a[href^="index.html"]').forEach((link) => {
    const params = new URLSearchParams();
    if (tokenFromUrl) params.set("invite", tokenFromUrl);
    if (currentLanguage === "zh") params.set("lang", "zh");
    link.href = params.toString() ? `index.html?${params}` : "index.html";
  });
};

const renderInvitationText = () => {
  document.querySelector("#party-name").textContent = partyName();
  document.querySelector("#seat-note").textContent = currentInvitation.seats === 1
    ? text("seatOne")
    : text("seatMany", { count: currentInvitation.seats });
};

const applyLanguage = () => {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = text(element.dataset.i18n);
  });
  languageButton.querySelectorAll("[data-language]").forEach((label) => {
    label.classList.toggle("active", label.dataset.language === currentLanguage);
  });
  if (currentInvitation) renderInvitationText();
  updateReturnLinks();
};

const showResponseView = () => {
  lookupView.classList.add("hidden");
  responseView.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const updateGuestFields = () => {
  const selected = document.querySelector('input[name="attendance"]:checked');
  const attending = selected?.value === "yes";
  attendanceDetails.classList.toggle("hidden", !attending);
  document.querySelector("#guest-one").required = attending;

  if (!attending) {
    guestTwo.required = false;
    return;
  }

  const count = Number(attendeeCount.value);
  guestTwoField.classList.toggle("hidden", count < 2);
  guestTwo.required = count >= 2;
};

const loadInvitation = (rawInvitation) => {
  currentInvitation = normalizeInvitation(rawInvitation);
  if (!explicitLanguage && currentInvitation.preferredLanguage === "zh") currentLanguage = "zh";

  attendeeCount.replaceChildren();
  for (let count = 1; count <= currentInvitation.seats; count += 1) {
    const option = document.createElement("option");
    option.value = count;
    option.textContent = `${count}`;
    attendeeCount.append(option);
  }
  attendeeCount.value = currentInvitation.seats;
  teaField.classList.toggle("hidden", !currentInvitation.teaInvited);
  applyLanguage();
  updateGuestFields();
  showResponseView();
};

const lookupInvitation = async (token) => {
  const normalizedToken = token.trim();
  lookupStatus.textContent = "";

  if (!normalizedToken) {
    lookupStatus.textContent = text("missingLink");
    return;
  }
  if (demoInvitations[normalizedToken]) {
    loadInvitation(demoInvitations[normalizedToken]);
    return;
  }
  if (!APPS_SCRIPT_URL) {
    lookupStatus.textContent = text("setupPending");
    return;
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=lookup&token=${encodeURIComponent(normalizedToken)}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || text("submitError"));
    loadInvitation(result.invitation);
  } catch (error) {
    lookupStatus.textContent = error.message;
  }
};

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh" : "en";
  applyLanguage();
});

document.querySelectorAll('input[name="attendance"]').forEach((radio) => {
  radio.addEventListener("change", updateGuestFields);
});
attendeeCount.addEventListener("change", updateGuestFields);

responseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitStatus.textContent = "";

  const selected = document.querySelector('input[name="attendance"]:checked');
  if (!selected) {
    submitStatus.textContent = text("chooseResponse");
    return;
  }

  const attending = selected.value === "yes";
  const count = attending ? Number(attendeeCount.value) : 0;
  const guestNames = attending
    ? [document.querySelector("#guest-one").value, document.querySelector("#guest-two").value].filter(Boolean)
    : [];

  if (!currentInvitation.demo && !APPS_SCRIPT_URL) {
    submitStatus.textContent = text("submitPending");
    return;
  }

  if (APPS_SCRIPT_URL && !currentInvitation.demo) {
    const payload = {
      action: "submit",
      token: currentInvitation.token,
      response: attending ? "Yes" : "No",
      attendeeCount: count,
      guestNames,
      guestOne: guestNames[0] || "",
      guestTwo: guestNames[1] || "",
      teaAttendance: attending && currentInvitation.teaInvited
        ? document.querySelector("#tea-attendance").value
        : "not-attending",
      dietary: attending ? document.querySelector("#dietary").value : "",
      notes: attending ? document.querySelector("#notes").value : "",
      responseLanguage: currentLanguage,
    };

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || text("submitError"));
    } catch (error) {
      submitStatus.textContent = error.message || text("submitError");
      return;
    }
  }

  const thankYouParams = new URLSearchParams({
    invite: currentInvitation.token,
    response: attending ? "yes" : "no",
    lang: currentLanguage,
  });
  window.location.assign(`thank-you.html?${thankYouParams}`);
});

applyLanguage();
lookupInvitation(tokenFromUrl);
