const translations = {
  en: {
    back: "← Additional information",
    heading: "Accommodation",
    rateHeading: "Preferential EQ room rate",
    roomRate: "RM780+ per room, per night",
    rateNote: "Available to invited family and friends, subject to room availability.",
    bookingInstruction: "Enter the promotional code below when booking through the EQ website.",
    promoCodeLabel: "Promo code",
    bookWithEq: "Book on the EQ website",
    bookingNote: "Reservations and payment are completed directly with the hotel.",
  },
  zh: {
    back: "← 返回宾客资讯",
    heading: "住宿",
    rateHeading: "EQ 酒店婚礼优惠房价",
    roomRate: "每间客房每晚 RM780+",
    rateNote: "优惠房价供受邀亲友使用，客房须视供应情况而定。",
    bookingInstruction: "请在 EQ 酒店网站预订时输入以下优惠码。",
    promoCodeLabel: "优惠码",
    bookWithEq: "前往 EQ 酒店网站预订",
    bookingNote: "预订及付款将直接由酒店处理。",
  },
};

const params = new URLSearchParams(window.location.search);
const token = params.get("invite") || "";
let currentLanguage = params.get("lang") === "zh" ? "zh" : "en";

const languageButton = document.querySelector(".language-toggle");
const backLink = document.querySelector("#back-link");

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

const applyLanguage = () => {
  document.documentElement.lang = currentLanguage;
  languageButton.setAttribute(
    "aria-label",
    currentLanguage === "en" ? "Switch to Chinese" : "切换至英文",
  );

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    renderTranslation(element, translations[currentLanguage][element.dataset.i18n]);
  });

  languageButton.querySelectorAll("[data-language]").forEach((label) => {
    label.classList.toggle("active", label.dataset.language === currentLanguage);
  });

  const shared = new URLSearchParams();
  if (token) shared.set("invite", token);
  if (currentLanguage === "zh") shared.set("lang", "zh");
  const suffix = shared.toString();
  backLink.href = suffix
    ? `thank-you.html?${suffix}&response=yes`
    : "thank-you.html?response=yes";
};

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh" : "en";
  applyLanguage();
});

applyLanguage();
