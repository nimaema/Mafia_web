"use client";

import { useActionState, useState } from "react";
import { updateProfile, changePassword } from "@/actions/user";
import { signIn, useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { useEffect } from "react";

export default function ProfileForm({ user, hasGoogleProvider, hasPassword }: { user: { name: string, email: string }, hasGoogleProvider?: boolean, hasPassword?: boolean }) {
  const { update } = useSession();
  const { showToast, showAlert } = usePopup();
  const [nameValue, setNameValue] = useState(user.name || "");
  const [nameWarning, setNameWarning] = useState("");

  const checkName = (value: string) => {
    const longPart = value.trim().split(/\s+/).find((part) => part.length > 25);
    setNameWarning(longPart ? "نام و نام خانوادگی هر کدام حداکثر ۲۵ کاراکتر هستند." : "");
  };

  const [result, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await updateProfile(formData);
      if (res.success) {
        await update(); 
      }
      return res;
    },
    null
  );

  const [pwdResult, pwdAction, isPwdPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await changePassword(formData);
      return res;
    },
    null
  );

  useEffect(() => {
    if (result?.success) {
      showToast("پروفایل با موفقیت بروزرسانی شد", "success");
    } else if (result?.error) {
      showAlert("خطا", result.error || "خطا در بروزرسانی", "error");
    }
  }, [result]);

  useEffect(() => {
    if (pwdResult?.success) {
      showToast(hasPassword ? "رمز عبور تغییر یافت" : "رمز عبور ایجاد شد", "success");
    } else if (pwdResult?.error) {
      showAlert("خطا", pwdResult.error || "خطا در تغییر رمز عبور", "error");
    }
  }, [pwdResult]);

  return (
    <div className="grid gap-5">
    <form action={action} noValidate className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.03]" onSubmit={(event) => {
      const formData = new FormData(event.currentTarget);
      if (!String(formData.get("name") || "").trim() || !String(formData.get("email") || "").trim()) {
        event.preventDefault();
        showAlert("فرم ناقص است", "نام و ایمیل را کامل وارد کنید.", "warning");
      }
      if (nameWarning) {
        event.preventDefault();
        showAlert("نام طولانی است", nameWarning, "warning");
      }
    }}>
      <div className="mb-5 flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-lime-500 text-xl text-zinc-950 shadow-sm shadow-lime-500/20">manage_accounts</span>
        <div>
          <h3 className="text-xl font-black text-zinc-950 dark:text-white">اطلاعات پروفایل</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">نام نمایشی و ایمیل حساب را مدیریت کنید.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">نام و نام خانوادگی</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">person</span>
          <input 
            type="text" 
            name="name" 
            value={nameValue}
            onChange={(event) => {
              setNameValue(event.target.value);
              checkName(event.target.value);
            }}
            maxLength={60}
            className="w-full pl-10 pr-4"
          />
        </div>
        {nameWarning && (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            {nameWarning}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">ایمیل</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
          <input 
            type="email" 
            name="email" 
            defaultValue={user.email} 
            dir="ltr"
            readOnly={hasGoogleProvider}
            className={`w-full pl-10 pr-4 ${hasGoogleProvider ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="ui-button-primary mt-5 min-h-12 w-full"
      >
        {isPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">save</span>
        )}
        ذخیره تغییرات
      </button>
    </form>

    <form action={pwdAction} noValidate className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-zinc-950/50" onSubmit={(event) => {
      const formData = new FormData(event.currentTarget);
      if (!String(formData.get("newPassword") || "") || !String(formData.get("confirmPassword") || "") || (hasPassword && !String(formData.get("currentPassword") || ""))) {
        event.preventDefault();
        showAlert("فرم ناقص است", "فیلدهای رمز عبور را کامل وارد کنید.", "warning");
      }
    }}>
      <div className="mb-5 flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-xl text-white shadow-sm shadow-sky-500/20">encrypted</span>
        <div>
          <h3 className="text-xl font-black text-zinc-950 dark:text-white">{hasPassword ? "تغییر رمز عبور" : "ایجاد رمز عبور"}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">برای ورود مستقیم با ایمیل، رمز حساب را امن نگه دارید.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
      {hasPassword && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">رمز عبور فعلی</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
            <input 
              type="password" 
              name="currentPassword" 
              dir="ltr"
              className="w-full pl-10 pr-4"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">رمز عبور جدید</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">key</span>
          <input 
            type="password" 
            name="newPassword" 
            dir="ltr"
            className="w-full pl-10 pr-4"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">تکرار رمز عبور جدید</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">key</span>
          <input 
            type="password" 
            name="confirmPassword" 
            dir="ltr"
            className="w-full pl-10 pr-4"
          />
        </div>
      </div>
      </div>

      <button 
        type="submit" 
        disabled={isPwdPending}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400 disabled:opacity-50"
      >
        {isPwdPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">password</span>
        )}
        {hasPassword ? "تغییر رمز" : "ایجاد رمز"}
      </button>
    </form>

    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-5 flex items-start gap-3">
        <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xl text-white shadow-sm shadow-zinc-950/20 dark:bg-white dark:text-zinc-950">linked_services</span>
        <div>
          <h3 className="text-xl font-black text-zinc-950 dark:text-white">اتصال حساب‌ها</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">ورود سریع‌تر و تصویر پروفایل گوگل از اینجا مدیریت می‌شود.</p>
        </div>
      </div>
      {hasGoogleProvider ? (
        <div className="flex items-center justify-between rounded-lg border border-lime-500/20 bg-lime-500/10 p-4">
          <div className="flex items-center gap-3">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            <div>
              <span className="font-black text-zinc-950 dark:text-white">حساب گوگل</span>
              <p className="mt-1 text-xs font-bold text-lime-700 dark:text-lime-300">تصویر و تایید ایمیل از گوگل دریافت می‌شود.</p>
            </div>
          </div>
          <span className="rounded-lg border border-lime-500/20 bg-white px-3 py-1 text-xs font-black text-lime-600 dark:bg-zinc-950 dark:text-lime-300">متصل</span>
        </div>
      ) : (
        <button 
          onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-black text-zinc-950 transition-colors hover:bg-white dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.06]"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          اتصال به حساب گوگل
        </button>
      )}
    </div>

    </div>
  );
}
