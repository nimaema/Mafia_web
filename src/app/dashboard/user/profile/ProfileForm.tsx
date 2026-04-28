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
    <div className="flex flex-col gap-10">
    <form action={action} noValidate className="flex flex-col gap-5" onSubmit={(event) => {
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
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">اطلاعات پروفایل</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">نام و نام خانوادگی</label>
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
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-lime-500 transition-colors"
          />
        </div>
        {nameWarning && (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            {nameWarning}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ایمیل</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
          <input 
            type="email" 
            name="email" 
            defaultValue={user.email} 
            dir="ltr"
            readOnly={hasGoogleProvider}
            className={`w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-lime-500 transition-colors ${hasGoogleProvider ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-lime-500 text-zinc-950 py-3 rounded-lg font-bold mt-2 hover:bg-lime-600 transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">save</span>
        )}
        ذخیره تغییرات
      </button>
    </form>

    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2"></div>

    <form action={pwdAction} noValidate className="flex flex-col gap-5" onSubmit={(event) => {
      const formData = new FormData(event.currentTarget);
      if (!String(formData.get("newPassword") || "") || !String(formData.get("confirmPassword") || "") || (hasPassword && !String(formData.get("currentPassword") || ""))) {
        event.preventDefault();
        showAlert("فرم ناقص است", "فیلدهای رمز عبور را کامل وارد کنید.", "warning");
      }
    }}>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{hasPassword ? "تغییر رمز عبور" : "ایجاد رمز عبور"}</h3>

      {hasPassword && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">رمز عبور فعلی</label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">lock</span>
            <input 
              type="password" 
              name="currentPassword" 
              dir="ltr"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">رمز عبور جدید</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">key</span>
          <input 
            type="password" 
            name="newPassword" 
            dir="ltr"
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">تکرار رمز عبور جدید</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">key</span>
          <input 
            type="password" 
            name="confirmPassword" 
            dir="ltr"
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPwdPending}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold mt-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPwdPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">password</span>
        )}
        {hasPassword ? "تغییر رمز" : "ایجاد رمز"}
      </button>
    </form>

    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-2"></div>

    <div className="flex flex-col gap-5">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">اتصال حساب‌ها</h3>
      {hasGoogleProvider ? (
        <div className="bg-[#0f172a]/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            <span className="font-semibold text-slate-900 dark:text-white">حساب گوگل</span>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">متصل شده</span>
        </div>
      ) : (
        <button 
          onClick={() => signIn("google", { callbackUrl: "/dashboard/user/profile" })}
          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white py-3 rounded-lg font-bold hover:bg-[#0f172a]/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          اتصال به حساب گوگل
        </button>
      )}
    </div>

    </div>
  );
}
