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
    "منوی اصلی مرورگر را باز کنید.",
    "Install app یا Add to Home Screen را بزنید.",
    "نام مافیا بورد را تأیید کنید.",
    "از آیکن نصب‌شده وارد شوید.",
  ],
  stepIcons: ["more_vert", "add_to_home_screen", "check_circle", "home"],
  note: "اگر گزینه نصب را نمی‌بینید، صفحه را یک بار رفرش کنید یا با Safari در iPhone و Chrome در Android باز کنید.",
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
        "در Safari دکمه Share پایین صفحه را بزنید.",
        "Add to Home Screen را انتخاب کنید.",
        "نام مافیا بورد را تأیید کنید و Add را بزنید.",
        "از آیکن مافیا بورد روی Home Screen وارد شوید.",
      ],
      stepIcons: ["ios_share", "add_to_home_screen", "check_circle", "home"],
      note: "در iPhone نصب کامل PWA فقط از Safari انجام می‌شود. اگر این گزینه را نمی‌بینید، مطمئن شوید صفحه داخل تب معمولی Safari باز است.",
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
        "همین صفحه را در Safari باز کنید.",
        "در Safari دکمه Share را بزنید.",
        "Add to Home Screen را انتخاب کنید.",
        "از آیکن نصب‌شده وارد شوید.",
      ],
      stepIcons: ["open_in_browser", "ios_share", "add_to_home_screen", "home"],
      note: "Chrome و Firefox روی iPhone معمولاً نصب کامل PWA را به Safari می‌سپارند.",
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
        "منوی پایین Samsung Internet را باز کنید.",
        "Install app یا Add page to را بزنید.",
        "Home screen را انتخاب و Add را تأیید کنید.",
        "از آیکن مافیا بورد وارد شوید.",
      ],
      stepIcons: ["menu", "install_mobile", "add_to_home_screen", "home"],
      note: "اگر Install app دیده شد، همان گزینه تجربه کامل‌تری نسبت به میانبر ساده می‌دهد.",
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
        "منوی سه‌نقطه Firefox را باز کنید.",
        "Install یا Add to Home screen را انتخاب کنید.",
        "پیام نصب را تأیید کنید.",
        "از آیکن نصب‌شده وارد شوید.",
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
        "منوی سه‌نقطه Edge را باز کنید.",
        "Apps یا Add to phone را انتخاب کنید.",
        "Install this site as an app را بزنید.",
        "از آیکن برنامه وارد شوید.",
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
        "منوی سه‌نقطه بالای Chrome را باز کنید.",
        "Install app یا Add to Home screen را بزنید.",
        "Install یا Add را تأیید کنید.",
        "از آیکن مافیا بورد وارد شوید.",
      ],
      stepIcons: ["more_vert", "install_mobile", "check_circle", "home"],
      note: "در Chrome معمولاً اگر نصب مستقیم ممکن باشد، همین صفحه دکمه نصب هم نشان می‌دهد.",
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
