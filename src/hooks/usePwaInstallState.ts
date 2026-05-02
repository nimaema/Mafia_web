"use client";

import { useEffect, useMemo, useState } from "react";

export type PwaBrowserGuide = {
  key: "ios-safari" | "ios-chrome" | "android-chrome" | "samsung" | "android-firefox" | "edge" | "generic";
  label: string;
  icon: string;
  platformIcon: string;
  platformLabel: string;
  steps: string[];
  stepIcons: string[];
  note: string;
};

export type PwaInstallState = {
  ready: boolean;
  isStandalone: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isMobileBrowser: boolean;
  guide: PwaBrowserGuide;
};

const genericGuide: PwaBrowserGuide = {
  key: "generic",
  label: "مرورگر موبایل",
  icon: "install_mobile",
  platformIcon: "smartphone",
  platformLabel: "Mobile",
  steps: [
    "صفحه را در تب اصلی مرورگر باز کنید؛ داخل مرورگرهای داخلی شبکه‌های اجتماعی گزینه نصب معمولاً کامل نیست.",
    "منوی اصلی مرورگر را باز کنید و دنبال Install app یا Add to Home Screen بگردید.",
    "نام «مافیا بورد» را نگه دارید و Add یا Install را تأیید کنید.",
    "بعد از نصب، برنامه را فقط از آیکن صفحه اصلی باز کنید تا حالت تمام‌صفحه فعال شود.",
  ],
  stepIcons: ["more_vert", "add_to_home_screen", "check_circle", "home"],
  note: "اگر گزینه نصب دیده نمی‌شود، صفحه را رفرش کنید یا روی iPhone با Safari و روی Android با Chrome امتحان کنید.",
};

function standaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectGuide(userAgent: string): PwaBrowserGuide {
  const ua = userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isSamsung = /samsungbrowser/.test(ua);
  const isFirefox = /firefox|fxios/.test(ua);
  const isEdge = /edg\//.test(ua) || /edgios/.test(ua);
  const isChrome = /chrome|crios/.test(ua) && !isSamsung && !isEdge;
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);

  if (isIOS && isSafari) {
    return {
      key: "ios-safari",
      label: "Safari روی iPhone",
      icon: "ios_share",
      platformIcon: "phone_iphone",
      platformLabel: "iOS",
      steps: [
        "صفحه را در Safari معمولی باز کنید؛ اگر از داخل Telegram، Instagram یا Google app آمده‌اید، ابتدا Open in Safari را بزنید.",
        "دکمه Share را بزنید؛ همان آیکن مربع با فلش رو به بالا که معمولاً پایین صفحه Safari است.",
        "در لیست Share Sheet گزینه Add to Home Screen را انتخاب کنید؛ اگر نبود، پایین لیست Edit Actions را بزنید و آن را اضافه کنید.",
        "نام «مافیا بورد» را تأیید کنید، Add را بزنید و از این به بعد از آیکن روی Home Screen وارد شوید.",
      ],
      stepIcons: ["ios_share", "add_to_home_screen", "check_circle", "home"],
      note: "روی iPhone نصب وب‌اپ از مسیر Share در Safari انجام می‌شود. اگر Add to Home Screen را نمی‌بینید، صفحه احتمالاً داخل مرورگر داخلی یک اپ باز شده یا باید از Edit Actions فعالش کنید.",
    };
  }

  if (isIOS && (isChrome || isFirefox || isEdge)) {
    return {
      key: "ios-chrome",
      label: "مرورگر iPhone",
      icon: "open_in_browser",
      platformIcon: "phone_iphone",
      platformLabel: "iOS",
      steps: [
        "از منوی مرورگر فعلی، صفحه را در Safari باز کنید؛ نصب کامل روی iPhone معمولاً از Safari انجام می‌شود.",
        "در Safari دکمه Share پایین صفحه را بزنید.",
        "Add to Home Screen را انتخاب کنید؛ اگر نبود، از Edit Actions همان گزینه را به لیست اضافه کنید.",
        "Add را بزنید و ورودهای بعدی را از آیکن نصب‌شده انجام دهید.",
      ],
      stepIcons: ["open_in_browser", "ios_share", "add_to_home_screen", "home"],
      note: "Chrome، Firefox و Edge روی iPhone معمولاً نصب Home Screen را به Safari می‌سپارند؛ مسیر مطمئن‌تر این است که دامنه را مستقیم در Safari باز کنید.",
    };
  }

  if (isAndroid && isSamsung) {
    return {
      key: "samsung",
      label: "Samsung Internet",
      icon: "add_to_home_screen",
      platformIcon: "android",
      platformLabel: "Android",
      steps: [
        "صفحه را در Samsung Internet باز کنید و مطمئن شوید روی دامنه اصلی سایت هستید.",
        "منوی پایین مرورگر را باز کنید و Install app یا Add page to را انتخاب کنید.",
        "اگر گزینه Home screen نمایش داده شد، آن را انتخاب کنید و Add را بزنید.",
        "بعد از نصب، از آیکن مافیا بورد وارد شوید تا نوار مرورگر حذف شود.",
      ],
      stepIcons: ["menu", "install_mobile", "add_to_home_screen", "home"],
      note: "اگر Install app دیده شد همان را انتخاب کنید؛ این حالت از میانبر ساده به صفحه اصلی کامل‌تر است.",
    };
  }

  if (isAndroid && isFirefox) {
    return {
      key: "android-firefox",
      label: "Firefox روی Android",
      icon: "add_to_home_screen",
      platformIcon: "android",
      platformLabel: "Android",
      steps: [
        "صفحه را در تب اصلی Firefox باز کنید و یک بار رفرش کنید.",
        "منوی سه‌نقطه Firefox را باز کنید.",
        "Install یا Add to Home screen را انتخاب کنید و پیام نصب را تأیید کنید.",
        "برای تجربه تمام‌صفحه، بعد از نصب فقط از آیکن صفحه اصلی وارد شوید.",
      ],
      stepIcons: ["more_vert", "add_to_home_screen", "check_circle", "home"],
      note: "در بعضی نسخه‌ها متن گزینه به جای Install، عبارت Add to Home screen است.",
    };
  }

  if (isAndroid && isEdge) {
    return {
      key: "edge",
      label: "Edge روی Android",
      icon: "install_mobile",
      platformIcon: "android",
      platformLabel: "Android",
      steps: [
        "صفحه را در Edge باز کنید و مطمئن شوید داخل تب معمولی مرورگر هستید.",
        "منوی سه‌نقطه Edge را باز کنید و Apps یا Add to phone را بزنید.",
        "Install this site as an app را انتخاب کنید و نصب را تأیید کنید.",
        "بعد از نصب، ورودهای بعدی را از آیکن برنامه انجام دهید.",
      ],
      stepIcons: ["more_vert", "apps", "install_mobile", "home"],
      note: "اگر گزینه Apps دیده نشد، صفحه را رفرش کنید و دوباره منو را باز کنید.",
    };
  }

  if (isAndroid) {
    return {
      key: "android-chrome",
      label: "Chrome روی Android",
      icon: "install_mobile",
      platformIcon: "android",
      platformLabel: "Android",
      steps: [
        "صفحه را در Chrome باز کنید، روی دامنه اصلی بمانید و اگر لازم شد صفحه را یک بار رفرش کنید.",
        "منوی سه‌نقطه بالای Chrome را بزنید.",
        "Install app را انتخاب کنید؛ اگر به جای آن Add to Home screen دیدید همان گزینه را بزنید.",
        "Install یا Add را تأیید کنید و بعد از آیکن مافیا بورد روی صفحه اصلی وارد شوید.",
      ],
      stepIcons: ["more_vert", "install_mobile", "check_circle", "home"],
      note: "در Chrome گاهی نصب مستقیم با دکمه داخل سایت هم فعال می‌شود؛ اگر نبود، مسیر منوی سه‌نقطه مطمئن‌تر است.",
    };
  }

  return genericGuide;
}

function readState(): PwaInstallState {
  if (typeof window === "undefined") {
    return {
      ready: false,
      isStandalone: false,
      isPhone: false,
      isTablet: false,
      isMobileBrowser: false,
      guide: genericGuide,
    };
  }

  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const width = Math.min(window.innerWidth, window.screen?.width || window.innerWidth);
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const android = /android/.test(uaLower);
  const iosPhone = /iphone|ipod/.test(uaLower);
  const iosTablet = /ipad/.test(uaLower) || iPadOS;
  const androidTablet = android && !/mobile/.test(uaLower);
  const isTablet = iosTablet || androidTablet || (coarsePointer && width >= 768);
  const isPhone = !isTablet && (iosPhone || (android && /mobile/.test(uaLower)) || (coarsePointer && width < 768));
  const isStandalone = standaloneMode();

  return {
    ready: true,
    isStandalone,
    isPhone,
    isTablet,
    isMobileBrowser: isPhone && !isStandalone,
    guide: detectGuide(ua),
  };
}

export function usePwaInstallState() {
  const [state, setState] = useState<PwaInstallState>(() => ({
    ready: false,
    isStandalone: false,
    isPhone: false,
    isTablet: false,
    isMobileBrowser: false,
    guide: genericGuide,
  }));

  useEffect(() => {
    const update = () => setState(readState());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("appinstalled", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("appinstalled", update);
    };
  }, []);

  return useMemo(() => state, [state]);
}
