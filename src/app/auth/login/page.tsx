"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthField, AuthFrame } from "@/components/AuthFrame";
import { CommandButton } from "@/components/CommandUI";

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useActionState<string | null, FormData>(
    async (_prevState, formData) => {
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      if (!email || !password) return "ایمیل و رمز عبور را کامل وارد کنید.";

      const result = await loginUser(formData);
      if (result.success) {
        if (result.role === "ADMIN") router.push("/dashboard/admin/users");
        else if (result.role === "MODERATOR") router.push("/dashboard/moderator");
        else router.push("/dashboard/user");
        return null;
      }
      if (result.needsVerification) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(result.email || email)}`);
        return null;
      }
      return result.error || "ایمیل یا رمز عبور درست نیست.";
    },
    null
  );

  return (
    <AuthFrame title="ورود به PlayMafia" subtitle="به اتاق فرمان بازی وصل شو." icon="login" active="login">
      <form action={setError} noValidate className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 p-3 text-sm font-bold leading-6 text-rose-100">
            {error}
          </div>
        )}

        <AuthField label="ایمیل" icon="mail">
          <input name="email" type="email" dir="ltr" placeholder="name@example.com" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>

        <AuthField label="رمز عبور" icon="lock">
          <input name="password" type="password" dir="ltr" placeholder="••••••••" className="pm-input h-12 px-3 pl-10 text-left" />
        </AuthField>

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs font-black text-cyan-200 hover:text-cyan-100">
            فراموشی رمز؟
          </Link>
        </div>

        <CommandButton type="submit" className="w-full">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          ورود
        </CommandButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-bold text-zinc-500">
        <span className="h-px flex-1 bg-white/10" />
        <span>یا</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <CommandButton tone="ghost" onClick={() => signIn("google")} className="w-full">
        <span className="material-symbols-outlined text-[18px]">account_circle</span>
        ادامه با گوگل
      </CommandButton>
    </AuthFrame>
  );
}
