const APPS_SCRIPT_URL = "";

const translations = {
  en: {
    back: "← Wedding website",
    heading: "Kindly RSVP",
    deadline: "Please respond by 1 February 2027.",
    lookupIntro: "Please open the personalised RSVP link sent with your invitation.",
    linkHelp: "If your link is not working, please contact the couple for assistance.",
    invitationFound: "Invitation found",
    welcome: "Welcome,",
    attendanceQuestion: "Will you be joining us?",
    accepts: "Joyfully accepts",
    declines: "Regretfully declines",
    numberAttending: "Number attending",
    teaAttendance: "Tea ceremony attendance",
    willAttend: "Will attend",
    unableAttend: "Unable to attend",
    guestOne: "Guest 1 full name",
    guestTwo: "Guest 2 full name",
    contact: "Email or mobile number",
    dietary: "Dietary requirements",
    optional: "(optional)",
    notes: "Accessibility needs or note",
    submit: "Submit RSVP",
    received: "RSVP Received",
    dateVenue: "Date & Venue",
    itinerary: "Wedding Itinerary",
    teaCeremony: "Tea Ceremony",
    mocktailHour: "Mocktail Hour",
    reception: "Reception",
    attire: "Attire",
    attireCopy: "Formal or Oriental",
    teaReminder: "Please arrive by 4:15 PM.",
    next: "What happens next",
    nextCopy: "You may return using your personalised invitation link if you need to update your response.",
    returnWebsite: "Return to wedding website",
    seatOne: "This invitation is reserved for 1 guest.",
    seatMany: "This invitation is reserved for up to {count} guests.",
    confirmedOne: "Thank you. We have recorded your response for 1 guest.",
    confirmedMany: "Thank you. We have recorded your response for {count} guests.",
    confirmedDecline: "Thank you for letting us know. We will miss celebrating with you.",
    setupPending: "This invitation code will work after the private guest list is connected.",
    missingLink: "A personalised invitation link is required to access this RSVP.",
    submitPending: "The private RSVP spreadsheet is not connected yet. Please use a preview invitation.",
  },
  zh: {
    back: "← 返回婚礼网站",
    heading: "敬请回复",
    deadline: "敬请于 2027年2月1日前确认出席。",
    lookupIntro: "请使用随喜帖发送给您的个人回复链接。",
    linkHelp: "如果链接无法使用，请联系新人寻求协助。",
    invitationFound: "已找到邀请",
    welcome: "欢迎您，",
    attendanceQuestion: "您会出席我们的婚礼吗？",
    accepts: "欣然出席",
    declines: "未克出席",
    numberAttending: "出席人数",
    teaAttendance: "敬茶仪式出席情况",
    willAttend: "将会出席",
    unableAttend: "无法出席",
    guestOne: "宾客一姓名",
    guestTwo: "宾客二姓名",
    contact: "电子邮箱或手机号码",
    dietary: "饮食需求",
    optional: "（选填）",
    notes: "无障碍需求或留言",
    submit: "提交回复",
    received: "回复已收到",
    dateVenue: "日期与地点",
    itinerary: "婚礼流程",
    teaCeremony: "敬茶仪式",
    mocktailHour: "无酒精鸡尾酒时光",
    reception: "婚宴",
    attire: "着装建议",
    attireCopy: "正式或中式服装",
    teaReminder: "请于下午 4:15 前抵达。",
    next: "接下来",
    nextCopy: "如需更改回复，您可使用个人邀请链接再次进入此页面。",
    returnWebsite: "返回婚礼网站",
    seatOne: "此邀请为您预留了 1 个席位。",
    seatMany: "此邀请最多为您预留了 {count} 个席位。",
    confirmedOne: "谢谢，我们已记录 1 位宾客的回复。",
    confirmedMany: "谢谢，我们已记录 {count} 位宾客的回复。",
    confirmedDecline: "谢谢您告知我们。很遗憾无法与您一同庆祝。",
    setupPending: "连接私人宾客名单后，此邀请代码即可使用。",
    missingLink: "此回复页面需要通过个人邀请链接进入。",
    submitPending: "私人回复表格尚未连接，请使用预览邀请。",
  },
};

const demoInvitations = {
  "preview-one": { token: "preview-one", partyName: "Alex Tan", seats: 1, teaInvited: false, demo: true },
  "preview-two": { token: "preview-two", partyName: "The Tan Family", seats: 2, teaInvited: true, demo: true },
};

const languageButton = document.querySelector(".language-toggle");
const lookupView = document.querySelector("#lookup-view");
const responseView = document.querySelector("#response-view");
const confirmationView = document.querySelector("#confirmation-view");
const responseForm = document.querySelector("#response-form");
const lookupStatus = document.querySelector("#lookup-status");
const submitStatus = document.querySelector("#submit-status");
const attendeeCount = document.querySelector("#attendee-count");
const guestTwoField = document.querySelector("#guest-two-field");
const guestTwo = document.querySelector("#guest-two");
const teaField = document.querySelector("#tea-field");
const attendanceDetails = document.querySelector("#attendance-details");

let currentLanguage = "en";
let currentInvitation = null;
let lastResponse = null;

const text = (key, replacements = {}) => {
  let value = translations[currentLanguage][key];
  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
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
  if (lastResponse) renderConfirmationText();
};

const showView = (view) => {
  [lookupView, responseView, confirmationView].forEach((section) => section.classList.add("hidden"));
  view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const renderInvitationText = () => {
  document.querySelector("#party-name").textContent = currentInvitation.partyName;
  document.querySelector("#seat-note").textContent = currentInvitation.seats === 1
    ? text("seatOne")
    : text("seatMany", { count: currentInvitation.seats });
};

const updateGuestFields = () => {
  const attending = document.querySelector('input[name="attendance"]:checked').value === "yes";
  attendanceDetails.classList.toggle("hidden", !attending);

  document.querySelector("#guest-one").required = attending;
  document.querySelector("#contact").required = attending;

  if (!attending) {
    guestTwo.required = false;
    return;
  }
  const count = Number(attendeeCount.value);
  guestTwoField.classList.toggle("hidden", count < 2);
  guestTwo.required = count >= 2;
};

const renderConfirmationText = () => {
  document.querySelector("#confirmation-message").textContent = !lastResponse.attending
    ? text("confirmedDecline")
    : lastResponse.count === 1
      ? text("confirmedOne")
      : text("confirmedMany", { count: lastResponse.count });
};

const loadInvitation = (invitation) => {
  currentInvitation = invitation;
  attendeeCount.replaceChildren();
  for (let count = 1; count <= invitation.seats; count += 1) {
    const option = document.createElement("option");
    option.value = count;
    option.textContent = `${count}`;
    attendeeCount.append(option);
  }
  attendeeCount.value = invitation.seats;
  document.querySelector("#guest-one").value = invitation.partyName;
  teaField.classList.toggle("hidden", !invitation.teaInvited);
  renderInvitationText();
  updateGuestFields();
  showView(responseView);
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
    if (!response.ok || !result.success) throw new Error(result.message || "Lookup failed");
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
  const attending = document.querySelector('input[name="attendance"]:checked').value === "yes";
  const count = attending ? Number(attendeeCount.value) : 0;

  if (!currentInvitation.demo && !APPS_SCRIPT_URL) {
    submitStatus.textContent = text("submitPending");
    return;
  }

  if (APPS_SCRIPT_URL && !currentInvitation.demo) {
    const payload = {
      action: "submit",
      token: currentInvitation.token,
      attending,
      attendeeCount: count,
      guestOne: document.querySelector("#guest-one").value,
      guestTwo: document.querySelector("#guest-two").value,
      teaAttendance: currentInvitation.teaInvited ? document.querySelector("#tea-attendance").value : "not-invited",
      contact: document.querySelector("#contact").value,
      dietary: document.querySelector("#dietary").value,
      notes: document.querySelector("#notes").value,
    };
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      submitStatus.textContent = result.message || "Unable to submit RSVP.";
      return;
    }
  }

  lastResponse = { attending, count };
  renderConfirmationText();
  document.querySelector("#tea-confirmation-card").classList.toggle("hidden", !currentInvitation.teaInvited || !attending);
  showView(confirmationView);
});

const tokenFromUrl = new URLSearchParams(window.location.search).get("invite");
if (tokenFromUrl) {
  document.querySelectorAll('a[href="index.html"]').forEach((link) => {
    link.href = `index.html?invite=${encodeURIComponent(tokenFromUrl)}`;
  });
  lookupInvitation(tokenFromUrl);
} else {
  lookupStatus.textContent = translations.en.missingLink;
}

applyLanguage();
