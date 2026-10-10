"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CaretLeft, CheckCircle, DownloadSimple } from "@phosphor-icons/react";
import { usePwaInstallState } from "@/hooks/usePwaInstallState";
import { MIcon } from "@/components/ui/MIcon";
import { Sheet } from "@/components/ui/Sheet";

const PWA_LOGIN_PROMPT_KEY = "pwa-install-login-prompt-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const installBenefits = [
  { icon: "fullscreen", title: "تمام‌صفحه", text: "بدون نوار مرورگر" },
  { icon: "touch_app", title: "یک لمس", text: "از صفحه اصلی گوشی" },
  { icon: "phone_iphone", title: "مثل اپ", text: "نمای پایدار سر میز" },
];

const afterInstallTips = [
  "بعد از نصب، از آیکن نقاب روی صفحه اصلی وارد شوید.",
  "اگر هنوز صفحه مرورگر را می‌بینید، برنامه را از تب مرورگر باز کرده‌اید نه از آیکن نصب‌شده.",
  "اگر دوباره وارد صفحه ورود شدید، دامنه، HTTPS و Secret سرور باید ثابت بمانند.",
];

export function InstallPWANotice() {
  const pwa = usePwaInstallState();
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const promptKey =
    session?.user?.id && session.expires
      ? `${PWA_LOGIN_PROMPT_KEY}:${session.user.id}:${session.expires}`
      : "";

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  useEffect(() => {
    if (
      !pwa.ready ||
      !pwa.isMobileBrowser ||
      status !== "authenticated" ||
      !session?.user?.id ||
      !promptKey ||
      sessionStorage.getItem(promptKey) === "1"
    ) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 500);
    return () => window.clearTimeout(timer);
  }, [promptKey, pwa.ready, pwa.isMobileBrowser, session?.user?.id, status]);

  const close = () => {
    if (promptKey) sessionStorage.setItem(promptKey, "1");
    setVisible(false);
    setExpanded(false);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") close();
    setInstallPrompt(null);
  };

  if (!visible || !pwa.isMobileBrowser) return null;

  return (
    <>
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="motion-reveal fixed right-0 top-[38dvh] z-[260] flex flex-col items-center gap-2 rounded-s-[var(--radius-md)] bg-night py-3 pe-1.5 ps-2 text-moon shadow-[var(--nq-shadow)] md:hidden"
          aria-label="باز کردن راهنمای نصب نقاب"
        >
          <span className="grid size-8 place-items-center rounded-[0.6rem] bg-accent text-on-accent">
            <MIcon name={pwa.guide.icon} className="text-lg" />
          </span>
          <span className="text-xs font-extrabold [writing-mode:vertical-rl]">نصب اپ</span>
          <CaretLeft size={14} weight="bold" className="opacity-70" aria-hidden />
        </button>
      ) : null}

      <Sheet
        open={expanded}
        onClose={() => setExpanded(false)}
        title="نقاب را نصب کنید"
        eyebrow={`راهنمای ${pwa.guide.platformLabel}`}
        footer={
          <div className="grid gap-2">
            {installPrompt ? (
              <button type="button" onClick={install} className="nq-btn nq-btn-primary nq-btn-lg w-full">
                <DownloadSimple size={20} weight="bold" aria-hidden />
                نصب مستقیم
              </button>
            ) : null}
            <button type="button" onClick={close} className="nq-btn nq-btn-ghost w-full">
              فعلاً نه، تا ورود بعدی
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="font-medium leading-7 text-muted">همه‌چیز در مرورگر هم کار می‌کند؛ نصب فقط ورود سریع‌تر و صفحهٔ کامل می‌دهد.</p>

          <ul className="grid grid-cols-3 gap-2">
            {installBenefits.map((item) => (
              <li key={item.title} className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] bg-raised px-2 py-3 text-center">
                <MIcon name={item.icon} className="text-xl text-accent" />
                <span className="text-sm font-extrabold">{item.title}</span>
                <span className="text-xs font-medium leading-5 text-muted">{item.text}</span>
              </li>
            ))}
          </ul>

          <section aria-labelledby="pwa-steps-title">
            <h3 id="pwa-steps-title" className="mb-3 flex items-center gap-2 text-sm font-extrabold">
              <MIcon name={pwa.guide.platformIcon} className="text-lg text-accent" />
              {pwa.guide.label}
            </h3>
            <ol className="flex flex-col gap-2">
              {pwa.guide.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-line p-3">
                  <span className="relative grid size-10 shrink-0 place-items-center rounded-[0.75rem] bg-accent-soft text-accent">
                    <MIcon name={pwa.guide.stepIcons[index] || "touch_app"} className="text-xl" />
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-fg text-[0.7rem] font-black text-canvas">
                      {(index + 1).toLocaleString("fa-IR")}
                    </span>
                  </span>
                  <span className="pt-1.5 text-sm font-semibold leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <details className="group rounded-[var(--radius-md)] bg-raised">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-extrabold">
              بعد از نصب
              <MIcon name="keyboard_arrow_down" className="text-lg text-muted transition-transform group-open:rotate-180" />
            </summary>
            <ul className="flex flex-col gap-2 px-4 pb-4">
              {afterInstallTips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm font-medium leading-6 text-muted">
                  <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
          </details>

          {pwa.guide.note ? <p className="text-sm font-medium leading-6 text-faint">{pwa.guide.note}</p> : null}
        </div>
      </Sheet>
    </>
  );
}
