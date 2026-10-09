import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/brand/Wordmark";
import { Crescent } from "@/components/brand/Crescent";
import { MaskAvatar } from "@/components/brand/MaskAvatar";

type AuthShellProps = {
  title: string;
  subtitle: string;
  /** Shows the login / register switch. */
  activeTab?: "login" | "register";
  children: ReactNode;
  footer?: ReactNode;
  /** Legacy prop from older screens; the shell no longer shows a page icon. */
  icon?: string;
};

const TABLE = ["sara", "kian", "mina", "arash", "bahar", "reza", "parisa", "houman", "shirin", "nima"];

export function AuthShell({ title, subtitle, activeTab, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" dir="rtl">
      {/* Night band: full column on desktop, a header band on phones */}
      <aside className="nq-grain relative overflow-hidden bg-night text-moon lg:order-2 lg:min-h-dvh">
        <Crescent className="pointer-events-none absolute -left-20 top-14 w-52 text-moon lg:-left-24 lg:top-24 lg:w-[30rem]" />

        <div className="relative z-10 flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] lg:px-10 lg:pt-8">
          <Link href="/" className="nq-icon-btn bg-moon/12 text-moon hover:bg-moon/20 hover:text-moon" aria-label="بازگشت به صفحه اصلی">
            <ArrowRight size={20} weight="bold" aria-hidden />
          </Link>
          <ThemeToggle tone="drench" />
        </div>

        <div className="relative z-10 px-6 pb-14 pt-6 lg:flex lg:min-h-[calc(100dvh-6rem)] lg:flex-col lg:justify-end lg:px-12 lg:pb-16">
          <Link href="/" aria-label="نقاب">
            <Wordmark className="h-14 text-moon lg:h-24" title="" />
          </Link>
          <p className="mt-3 max-w-xs text-sm font-bold leading-7 text-moon/80 lg:mt-6 lg:max-w-sm lg:text-base lg:leading-8">
            بازی مافیا، روی گوشی همه. نقش‌ها مخفی می‌مانند و داستان بازی ثبت می‌شود.
          </p>
          <div className="mt-10 hidden flex-wrap gap-2.5 lg:flex" aria-hidden>
            {TABLE.map((seed) => (
              <MaskAvatar key={seed} seed={seed} size="md" />
            ))}
          </div>
        </div>
      </aside>

      <main className="relative z-10 -mt-7 rounded-t-[var(--radius-xl)] bg-canvas px-5 pb-[max(env(safe-area-inset-bottom),2rem)] pt-8 lg:order-1 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:px-12">
        <div className="motion-reveal mx-auto w-full max-w-[26rem]">
          <h1 className="nq-display text-[2.6rem] leading-[1.15] text-fg">{title}</h1>
          <p className="mt-2 text-[0.95rem] font-medium leading-7 text-muted">{subtitle}</p>

          {activeTab ? (
            <nav aria-label="ورود یا ثبت نام" className="mt-6 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-raised p-1">
              <TabLink href="/auth/login" active={activeTab === "login"}>
                ورود
              </TabLink>
              <TabLink href="/auth/register" active={activeTab === "register"}>
                ساخت حساب
              </TabLink>
            </nav>
          ) : null}

          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 text-center">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`grid min-h-11 place-items-center rounded-[0.75rem] text-sm font-extrabold transition-colors ${
        active ? "bg-accent-soft text-accent" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}
