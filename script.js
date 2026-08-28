const translations = {
  en: {
    heroKicker: "The Wedding of",
    date: "1 MAY 2027",
    welcomeTitle: "Welcome",
    welcomeCopy:
      "We are delighted to invite you to celebrate the beginning of our new life together. Your love and presence mean the world to us as we embark on this beautiful journey.",
    itineraryTitle: "Wedding Itinerary",
    teaTime: "4:30–5:30 PM",
    teaTitle: "Tea Ceremony",
    mocktailTime: "6:00–7:00 PM",
    mocktailTitle: "Mocktail Hour",
    receptionTime: "7:00–10:30 PM",
    receptionTitle: "Reception",
    venueTitle: "Date & Venue",
    venueDate: "01/05/2027",
    venueName: "EQ Kuala Lumpur",
    venueRoom: "Diamond Ballroom · Level 1",
    mapLink: "Open in Google Maps",
    wazeLink: "Open in Waze",
    calendarLink: "Add to Calendar",
    googleCalendarLink: "Google Calendar",
    attireTitle: "Attire",
    blackTie: "Formal",
    or: "or",
    oriental: "Oriental",
    teaInfoTitle: "Tea Ceremony Information",
    teaInfoCopy:
      "During the tea ceremony, invited relatives of the bride and groom will be welcomed to accept tea and offer blessings to the couple.",
    rsvpDeadline: "Kindly RSVP by 1 February 2027",
  },
  zh: {
    heroKicker: "我们的婚礼",
    date: "2027年5月1日",
    welcomeTitle: "诚挚邀请",
    welcomeCopy:
      "我们诚挚邀请您共同见证人生新篇章。感谢您的爱与陪伴，与我们一同分享这份喜悦，开启美好的婚姻旅程。",
    itineraryTitle: "婚礼流程",
    teaTime: "下午 4:30–5:30",
    teaTitle: "敬茶仪式",
    mocktailTime: "晚上 6:00–7:00",
    mocktailTitle: "无酒精鸡尾酒时光",
    receptionTime: "晚上 7:00–10:30",
    receptionTitle: "婚宴开始",
    venueTitle: "日期与地点",
    venueDate: "01/05/2027",
    venueName: "吉隆坡 EQ 酒店",
    venueRoom: "一楼 Diamond Ballroom",
    mapLink: "在 Google 地图中打开",
    wazeLink: "在 Waze 中打开",
    calendarLink: "加入日历",
    googleCalendarLink: "Google 日历",
    attireTitle: "着装建议",
    blackTie: "正式礼服",
    or: "或",
    oriental: "中式",
    teaInfoTitle: "敬茶仪式",
    teaInfoCopy:
      "敬茶仪式期间，诚邀新郎与新娘的受邀亲属接受新人奉茶，并为新人送上祝福。",
    rsvpDeadline: "敬请于2027年2月1日前回复",
  },
};

const languageButton = document.querySelector(".language-toggle");
const rsvpLink = document.querySelector(".rsvp-button");
const pageParams = new URLSearchParams(window.location.search);
const invitationToken = pageParams.get("invite");
let currentLanguage = pageParams.get("lang") === "zh" ? "zh" : "en";

if (invitationToken) {
  fetch(
    "https://script.google.com/macros/s/AKfycby9h3CD5hsLTrhEoRWqzB1wac2lOFIbmAbenLcBP4x80i_0Z2UwJKvcV3H0sFgUxqc/exec?action=health",
    { mode: "no-cors", cache: "no-store" },
  ).catch(() => {});
}

const updateRsvpLink = () => {
  const rsvpParams = new URLSearchParams();
  if (invitationToken) rsvpParams.set("invite", invitationToken);
  if (currentLanguage === "zh") rsvpParams.set("lang", "zh");
  const query = rsvpParams.toString();
  rsvpLink.href = query ? `rsvp.html?${query}` : "rsvp.html";
};

const renderTranslation = (element, text, language) => {
  const parts = language === "zh"
    ? text.split(/([A-Za-z]+(?:\s+[A-Za-z]+)*|[0-9][0-9:.,/+\-–—]*)/g)
    : text.split(/([0-9][0-9:.,/+\-–—]*)/g);
  const content = document.createDocumentFragment();

  parts.filter(Boolean).forEach((part) => {
    const useNotoSerif = language === "zh"
      ? /[A-Za-z0-9]/.test(part)
      : /[0-9]/.test(part);

    if (useNotoSerif) {
      const latinText = document.createElement("span");
      latinText.className = /^[0-9]/.test(part)
        ? "latin-text number-text"
        : "latin-text";
      latinText.textContent = part;
      content.append(latinText);
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
    renderTranslation(
      element,
      translations[currentLanguage][element.dataset.i18n],
      currentLanguage,
    );
  });
  languageButton.querySelectorAll("[data-language]").forEach((label) => {
    label.classList.toggle("active", label.dataset.language === currentLanguage);
  });
  updateRsvpLink();
};

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh" : "en";
  applyLanguage();
});

applyLanguage();

const welcomeSection = document.querySelector(".welcome");
const mobileLanguageQuery = window.matchMedia("(max-width: 640px)");

const updateMobileLanguageButton = () => {
  const shouldShow = mobileLanguageQuery.matches
    && welcomeSection.getBoundingClientRect().top <= 76;
  languageButton.classList.toggle("mobile-sticky-visible", shouldShow);
};

window.addEventListener("scroll", updateMobileLanguageButton, { passive: true });
window.addEventListener("resize", updateMobileLanguageButton);
updateMobileLanguageButton();

const slides = Array.from(document.querySelectorAll(".carousel-slide"));
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentSlide = 0;

if (slides.length > 1 && !reducedMotionQuery.matches) {
  window.setInterval(() => {
    slides[currentSlide].classList.remove("active");
    slides[currentSlide].setAttribute("aria-hidden", "true");

    currentSlide = (currentSlide + 1) % slides.length;

    slides[currentSlide].classList.add("active");
    slides[currentSlide].setAttribute("aria-hidden", "false");
  }, 5000);
}
