const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9h3CD5hsLTrhEoRWqzB1wac2lOFIbmAbenLcBP4x80i_0Z2UwJKvcV3H0sFgUxqc/exec";

const translations = {
  en: {
    back: "← Additional information",
    heading: "Accommodation Interest",
    rateHeading: "Preferential EQ room rate",
    roomRate: "RM750 per room, per night",
    rateNote: "Subject to availability. This form records your interest and does not confirm a booking.",
    loadingInvitation: "Loading your invitation…",
    invitationFor: "Accommodation request for {party}.",
    privacyNote: "No passport, identification or payment details are required at this stage.",
    contactName: "Full name",
    checkIn: "Check-in date",
    checkOut: "Check-out date",
    phone: "Phone number",
    email: "Email address",
    numberOfPax: "Number of guests",
    numberOfRooms: "Number of rooms",
    bedPreference: "Bed preference",
    noPreference: "No preference",
    kingBed: "King bed",
    twinBeds: "Twin beds",
    bedNote: "Bed type is subject to hotel availability.",
    specialRequests: "Special requests or notes",
    optional: "(optional)",
    submit: "Express interest",
    submitting: "Submitting…",
    missingLink: "Please open this form from your personalised wedding invitation.",
    unavailable: "We could not load this invitation. Please return to the wedding website and try again.",
    invalidDates: "Check-out must be after the check-in date.",
    backendOutdated: "The accommodation form is not connected to the latest backend yet. Please try again after it has been updated.",
    submitError: "Unable to record your interest. Please try again.",
    confirmationHeading: "Interest received",
    confirmationCopy: "Thank you. Your accommodation interest has been recorded. We will share booking details once availability is confirmed.",
    returnWebsite: "Return to wedding website",
  },
  zh: {
    back: "← 返回宾客资讯",
    heading: "住宿意向登记",
    rateHeading: "EQ 酒店婚礼优惠房价",
    roomRate: "每间客房每晚 RM750",
    rateNote: "房间须视供应情况而定。提交此表格仅代表登记住宿意向，并不表示预订已确认。",
    loadingInvitation: "正在载入您的邀请…",
    invitationFor: "{party}的住宿意向登记。",
    privacyNote: "此阶段无需提供护照、身份证或付款资料。",
    contactName: "姓名",
    checkIn: "入住日期",
    checkOut: "退房日期",
    phone: "电话号码",
    email: "电邮地址",
    numberOfPax: "入住人数",
    numberOfRooms: "房间数量",
    bedPreference: "床型偏好",
    noPreference: "无偏好",
    kingBed: "大床",
    twinBeds: "双床",
    bedNote: "床型须视酒店供应情况而定。",
    specialRequests: "特别要求或留言",
    optional: "（选填）",
    submit: "提交住宿意向",
    submitting: "正在提交…",
    missingLink: "请通过您的专属婚礼邀请链接填写此表格。",
    unavailable: "暂时无法载入您的邀请，请返回婚礼网站后再试。",
    invalidDates: "退房日期必须晚于入住日期。",
    backendOutdated: "住宿表格尚未连接至最新系统，请在更新完成后再试。",
    submitError: "暂时无法登记住宿意向，请稍后再试。",
    confirmationHeading: "已收到住宿意向",
    confirmationCopy: "谢谢。您的住宿意向已登记，我们将在确认房间供应后提供预订详情。",
    returnWebsite: "返回婚礼网站",
  },
};

const demoInvitations = {
  "preview-one": { partyNameEnglish: "Alex Tan", partyNameChinese: "陈先生", seats: 1 },
  "preview-two": { partyNameEnglish: "The Tan Family", partyNameChinese: "陈府", seats: 2 },
};

const params = new URLSearchParams(window.location.search);
const token = params.get("invite") || "";
let currentLanguage = params.get("lang") === "zh" ? "zh" : "en";
let invitation = null;

const languageButton = document.querySelector(".language-toggle");
const form = document.querySelector("#hotel-interest-form");
const status = document.querySelector("#form-status");
const intro = document.querySelector("#hotel-intro");
const submitButton = form.querySelector('button[type="submit"]');
const confirmation = document.querySelector("#hotel-confirmation");
const checkIn = document.querySelector("#check-in");
const checkOut = document.querySelector("#check-out");
const numberOfPax = document.querySelector("#number-of-pax");
const numberOfRooms = document.querySelector("#number-of-rooms");
const backLink = document.querySelector("#back-link");
const returnLink = document.querySelector("#return-link");

const text = (key, replacements = {}) => {
  let value = translations[currentLanguage][key];
  Object.entries(replacements).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
};

const renderTranslation = (element, value) => {
  const parts = currentLanguage === "zh"
    ? value.split(/([A-Za-z]+(?:\s+[A-Za-z]+)*|[0-9][0-9:.,/+\-–—]*)/g)
    : value.split(/([0-9][0-9:.,/+\-–—]*)/g);
  const content = document.createDocumentFragment();

  parts.filter(Boolean).forEach((part) => {
    const useNotoSerif = currentLanguage === "zh"
      ? /[A-Za-z0-9]/.test(part)
      : /[0-9]/.test(part);

    if (useNotoSerif) {
      const span = document.createElement("span");
      span.className = /^[0-9]/.test(part) ? "noto-text number-text" : "noto-text";
      span.textContent = part;
      content.append(span);
    } else {
      content.append(document.createTextNode(part));
    }
  });

  element.replaceChildren(content);
};

const partyName = () => currentLanguage === "zh"
  ? invitation.partyNameChinese || invitation.partyNameEnglish
  : invitation.partyNameEnglish || invitation.partyNameChinese;

const updateLinks = () => {
  const shared = new URLSearchParams();
  if (token) shared.set("invite", token);
  if (currentLanguage === "zh") shared.set("lang", "zh");
  const suffix = shared.toString();
  backLink.href = suffix
    ? `thank-you.html?${suffix}&response=yes`
    : "thank-you.html?response=yes";
  returnLink.href = suffix ? `index.html?${suffix}` : "index.html";
};

const applyLanguage = () => {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    renderTranslation(element, text(element.dataset.i18n));
  });
  if (invitation) renderTranslation(intro, text("invitationFor", { party: partyName() }));
  languageButton.querySelectorAll("[data-language]").forEach((label) => {
    label.classList.toggle("active", label.dataset.language === currentLanguage);
  });
  updateLinks();
};

const showForm = (rawInvitation) => {
  invitation = {
    ...rawInvitation,
    seats: Math.min(5, Math.max(1, Number(rawInvitation.seats) || 1)),
  };
  populateNumberOptions(numberOfPax, invitation.seats);
  updateRoomOptions();
  form.classList.remove("hidden");
  applyLanguage();
};

const populateNumberOptions = (select, maximum) => {
  const previousValue = Math.min(Number(select.value) || 1, maximum);
  select.replaceChildren();
  for (let value = 1; value <= maximum; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    select.append(option);
  }
  select.value = String(previousValue);
};

function updateRoomOptions() {
  populateNumberOptions(numberOfRooms, Math.max(1, Number(numberOfPax.value) || 1));
}

const loadInvitation = async () => {
  if (!token) {
    intro.textContent = text("missingLink");
    return;
  }

  if (demoInvitations[token]) {
    showForm(demoInvitations[token]);
    return;
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=lookup&token=${encodeURIComponent(token)}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    showForm(result.invitation);
  } catch (error) {
    intro.textContent = text("unavailable");
  }
};

const updateDateMinimums = () => {
  if (checkIn.value) checkOut.min = checkIn.value;
};

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh" : "en";
  applyLanguage();
});

checkIn.addEventListener("change", updateDateMinimums);
numberOfPax.addEventListener("change", updateRoomOptions);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";

  if (!checkIn.value || !checkOut.value || checkOut.value <= checkIn.value) {
    status.textContent = text("invalidDates");
    return;
  }

  const payload = {
    action: "hotelInterest",
    token,
    contactName: document.querySelector("#contact-name").value,
    checkInDate: checkIn.value,
    checkOutDate: checkOut.value,
    phone: document.querySelector("#phone").value,
    email: document.querySelector("#email").value,
    numberOfPax: Number(numberOfPax.value),
    numberOfRooms: Number(numberOfRooms.value),
    bedPreference: document.querySelector("#bed-preference").value,
    specialRequests: document.querySelector("#special-requests").value,
    responseLanguage: currentLanguage,
  };

  if (demoInvitations[token]) {
    form.classList.add("hidden");
    confirmation.classList.remove("hidden");
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = text("submitting");

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || text("submitError"));
    form.classList.add("hidden");
    confirmation.classList.remove("hidden");
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    status.textContent = error.message === "Unsupported request."
      ? text("backendOutdated")
      : error.message || text("submitError");
  } finally {
    submitButton.disabled = false;
    renderTranslation(submitButton, text("submit"));
  }
});

applyLanguage();
loadInvitation();
