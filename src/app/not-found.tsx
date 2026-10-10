import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { MaskMark } from "@/components/brand/MaskMark";

export default function NotFound() {
  return (
    <main className="nq-grain relative flex min-h-dvh flex-col justify-end overflow-hidden bg-night px-6 pb-[max(env(safe-area-inset-bottom),3rem)] text-moon" dir="rtl">
      <MaskMark className="pointer-events-none absolute -left-16 top-20 w-[26rem] rotate-[-12deg] text-moon opacity-10" />
      <div className="relative z-10 mx-auto w-full max-w-xl">
        <p className="text-base font-bold opacity-80">خطای ۴۰۴</p>
        <h1 className="nq-display mt-2 text-[4.2rem] leading-none sm:text-[5.5rem]">این میز خالی است.</h1>
        <p className="mt-5 max-w-sm text-lg font-semibold leading-8 opacity-90">صفحه‌ای که دنبالش بودید این‌جا نیست. شاید آدرس اشتباه است یا صفحه جابه‌جا شده.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/user" className="nq-btn nq-btn-lg bg-moon text-night">
            رفتن به خانه
            <ArrowLeft size={20} weight="bold" aria-hidden />
          </Link>
          <Link href="/" className="nq-btn nq-btn-lg bg-moon/12 text-moon">
            صفحه اصلی نقاب
          </Link>
        </div>
      </div>
    </main>
  );
}
