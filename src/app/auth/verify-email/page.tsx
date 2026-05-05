import { AuthFrame } from "@/components/AuthFrame";
import { CommandButton } from "@/components/CommandUI";

export default function VerifyEmailPage() {
  return (
    <AuthFrame title="تایید ایمیل" subtitle="برای فعال شدن کامل حساب، صندوق ایمیل خود را بررسی کنید." icon="mark_email_unread">
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
          لینک تایید برای ایمیل حساب شما ارسال می‌شود. بعد از تایید، دوباره وارد PlayMafia شوید.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CommandButton href="/auth/login" className="w-full">
            ورود
          </CommandButton>
          <CommandButton href="/" tone="ghost" className="w-full">
            صفحه اصلی
          </CommandButton>
        </div>
      </div>
    </AuthFrame>
  );
}
