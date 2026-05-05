"use client";

import { useActionState, useEffect } from "react";
import { updateProfile, changePassword } from "@/actions/user";
import { signIn, useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton } from "@/components/CommandUI";

export default function ProfileForm({
  user,
  hasGoogleProvider,
  hasPassword,
}: {
  user: { name: string; email: string };
  hasGoogleProvider?: boolean;
  hasPassword?: boolean;
}) {
  const { update } = useSession();
  const { showToast, showAlert } = usePopup();

  const [result, action, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
    const res = await updateProfile(formData);
    if (res.success) await update();
    return res;
  }, null);

  const [pwdResult, pwdAction, isPwdPending] = useActionState(async (_prevState: any, formData: FormData) => {
    return changePassword(formData);
  }, null);

  useEffect(() => {
    if (result?.success) showToast("پروفایل بروزرسانی شد", "success");
    else if (result?.error) showAlert("خطا", result.error, "error");
  }, [result, showAlert, showToast]);

  useEffect(() => {
    if (pwdResult?.success) showToast(hasPassword ? "رمز عبور تغییر یافت" : "رمز عبور ایجاد شد", "success");
    else if (pwdResult?.error) showAlert("خطا", pwdResult.error, "error");
  }, [pwdResult, hasPassword, showAlert, showToast]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={action} noValidate className="space-y-4">
        <div>
          <p className="text-lg font-black text-zinc-50">اطلاعات اصلی</p>
          <p className="mt-1 text-sm text-zinc-400">نام نمایشی و ایمیل حساب را تنظیم کنید.</p>
        </div>
        <input name="name" defaultValue={user.name} maxLength={50} className="pm-input h-12 px-4" placeholder="نام نمایشی" />
        <input name="email" defaultValue={user.email} dir="ltr" readOnly={hasGoogleProvider} className={`pm-input h-12 px-4 text-left ${hasGoogleProvider ? "opacity-55" : ""}`} placeholder="email@example.com" />
        <CommandButton type="submit" disabled={isPending} className="w-full">
          <span className="material-symbols-outlined text-[18px]">{isPending ? "progress_activity" : "save"}</span>
          ذخیره تغییرات
        </CommandButton>
      </form>

      <form action={pwdAction} noValidate className="space-y-4">
        <div>
          <p className="text-lg font-black text-zinc-50">{hasPassword ? "امنیت رمز" : "ساخت رمز عبور"}</p>
          <p className="mt-1 text-sm text-zinc-400">برای ورود با ایمیل، رمز حساب را مدیریت کنید.</p>
        </div>
        {hasPassword && <input name="currentPassword" type="password" dir="ltr" className="pm-input h-12 px-4 text-left" placeholder="رمز فعلی" />}
        <input name="newPassword" type="password" dir="ltr" className="pm-input h-12 px-4 text-left" placeholder="رمز جدید" />
        <input name="confirmPassword" type="password" dir="ltr" className="pm-input h-12 px-4 text-left" placeholder="تکرار رمز جدید" />
        <CommandButton type="submit" tone="violet" disabled={isPwdPending} className="w-full">
          <span className="material-symbols-outlined text-[18px]">password</span>
          {hasPassword ? "تغییر رمز" : "ایجاد رمز"}
        </CommandButton>
      </form>

      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-zinc-50">اتصال گوگل</p>
            <p className="mt-1 text-sm text-zinc-400">{hasGoogleProvider ? "حساب گوگل به پروفایل متصل است." : "می‌توانید ورود با گوگل را فعال کنید."}</p>
          </div>
          {hasGoogleProvider ? (
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">متصل</span>
          ) : (
            <CommandButton tone="ghost" onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })}>
              اتصال گوگل
            </CommandButton>
          )}
        </div>
      </div>
    </div>
  );
}
