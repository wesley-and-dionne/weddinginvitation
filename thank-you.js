const translations = {
  en: {
    heading: "Thank You",
    attending: "Your RSVP has been received. We look forward to celebrating with you.",
    declining: "Thank you for letting us know. You will be warmly missed on our special day.",
    returnWebsite: "Return to wedding website",
  },
  zh: {
    heading: "谢谢您的回复",
    attending: "我们已收到您的回复，期待与您一同庆祝这份喜悦。",
    declining: "谢谢您告知我们。婚礼当天，我们会想念您的祝福与陪伴。",
    returnWebsite: "返回婚礼网站",
  },
};

const params = new URLSearchParams(window.location.search);
const token = params.get("invite") || "";
const response = params.get("response") === "no" ? "no" : "yes";
let currentLanguage = params.get("lang") === "zh" ? "zh" : "en";

const languageButton = document.querySelector(".language-toggle");
const returnLink = document.querySelector(".home-button");

const applyLanguage = () => {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translations[currentLanguage][element.dataset.i18n];
  });
  document.querySelector("#thank-you-message").textContent =
    translations[currentLanguage][response === "yes" ? "attending" : "declining"];
  languageButton.querySelectorAll("[data-language]").forEach((label) => {
    label.classList.toggle("active", label.dataset.language === currentLanguage);
  });

  const returnParams = new URLSearchParams();
  if (token) returnParams.set("invite", token);
  if (currentLanguage === "zh") returnParams.set("lang", "zh");
  returnLink.href = returnParams.toString() ? `index.html?${returnParams}` : "index.html";
};

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh" : "en";
  applyLanguage();
});

applyLanguage();
