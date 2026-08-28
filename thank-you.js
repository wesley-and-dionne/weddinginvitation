const translations = {
  en: {
    heading: "Thank You",
    attending: "Your RSVP has been received. We look forward to celebrating with you.",
    declining: "Thank you for letting us know. You will be warmly missed on our special day.",
    informationHeading: "Additional Information",
    parkingTitle: "Parking",
    parkingCopy: "The hotel provides on-site parking at a flat rate of RM15 for wedding guests. Please check with the wedding reception team for ticket validation.",
    transportTitle: "Getting There by Rail",
    monorailCopy: "Monorail: Raja Chulan station, approximately a 3-minute walk.",
    lrtCopy: "LRT: KLCC station on the Kelana Jaya Line, approximately 450 metres away.",
    mrtCopy: "MRT: Bukit Bintang station on the Kajang Line, approximately 720 metres away. From the nearby Bukit Bintang Monorail station, ride one stop towards Titiwangsa to Raja Chulan.",
    roomTitle: "Accommodation",
    roomCopy: "A preferential EQ room rate is available for invited family and friends on the wedding date.",
    expressInterest: "Express interest",
    contactTitle: "Contact",
    contactCopy: "For additional assistance, please contact the couple.",
    returnWebsite: "Return to wedding website",
  },
  zh: {
    heading: "谢谢您的回复",
    attending: "我们已收到您的回复，期待与您一同庆祝这份喜悦。",
    declining: "谢谢您告知我们。婚礼当天，我们会想念您的祝福与陪伴。",
    informationHeading: "宾客资讯",
    parkingTitle: "停车资讯",
    parkingCopy: "酒店为婚宴宾客提供现场停车，统一收费为 RM15。请向婚礼接待处查询停车票验证方式。",
    transportTitle: "公共交通",
    monorailCopy: "单轨列车：Raja Chulan 站，步行约 3 分钟。",
    lrtCopy: "轻快铁：KLCC 站（Kelana Jaya 线），距离酒店约 450 米。",
    mrtCopy: "捷运：Bukit Bintang 站（Kajang 线），距离酒店约 720 米。您也可步行至邻近的 Bukit Bintang 单轨列车站，往 Titiwangsa 方向乘搭一站至 Raja Chulan。",
    roomTitle: "住宿",
    roomCopy: "受邀亲友可申请婚礼日期的 EQ 优惠房价。",
    expressInterest: "登记住宿意向",
    contactTitle: "联系我们",
    contactCopy: "如需其他协助，请联系新人。",
    returnWebsite: "返回婚礼网站",
  },
};

const params = new URLSearchParams(window.location.search);
const token = params.get("invite") || "";
const response = params.get("response") === "no" ? "no" : "yes";
let currentLanguage = params.get("lang") === "zh" ? "zh" : "en";

const languageButton = document.querySelector(".language-toggle");
const returnLink = document.querySelector(".home-button");
const hotelInterestLink = document.querySelector("#hotel-interest-link");
const attendingInformation = document.querySelector("#attending-information");

attendingInformation.classList.toggle("hidden", response !== "yes");

const renderTranslation = (element, value) => {
  if (currentLanguage !== "zh") {
    element.textContent = value;
    return;
  }

  const parts = value.split(/([A-Za-z]+(?:\s+[A-Za-z]+)*|[0-9][0-9:.,/+\-–—]*)/g);
  const content = document.createDocumentFragment();

  parts.filter(Boolean).forEach((part) => {
    if (/[A-Za-z0-9]/.test(part)) {
      const span = document.createElement("span");
      span.className = "noto-text";
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
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    renderTranslation(element, translations[currentLanguage][element.dataset.i18n]);
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
  hotelInterestLink.href = returnParams.toString()
    ? `hotel-interest.html?${returnParams}`
    : "hotel-interest.html";
};

languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "en" ? "zh" : "en";
  applyLanguage();
});

applyLanguage();
