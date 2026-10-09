import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { MaskMark } from "@/components/brand/MaskMark";
import { JoinByCode } from "@/components/game/JoinByCode";

export default function JoinGamePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1rem)]" dir="rtl">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Link href="/dashboard/user" className="nq-icon-btn" aria-label="بازگشت به خانه">
          <ArrowRight size={20} weight="bold" aria-hidden />
        </Link>
        <div className="my-auto py-10">
          <MaskMark className="h-10 text-accent" />
          <h1 className="nq-display mt-6 text-[3rem] leading-[1.1]">سر کدام میز؟</h1>
          <p className="mt-2 font-medium leading-7 text-muted">کد شش‌رقمی بازی را بزنید. گرداننده آن را سر میز اعلام می‌کند.</p>
          <JoinByCode className="mt-8" />
        </div>
      </div>
    </div>
  );
}
