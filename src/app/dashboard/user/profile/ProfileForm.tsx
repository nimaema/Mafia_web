"use client";

import { useState, useTransition } from "react";
import { updateProfile, changePassword } from "@/actions/user";
import { useSession } from "next-auth/react";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
  };
  hasGoogleProvider: boolean;
  hasPassword: boolean;
}

export default function ProfileForm({ user, hasGoogleProvider, hasPassword }: ProfileFormProps) {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.success) {
        setMessage({ type: "success", text: "پروفایل با موفقیت بروزرسانی شد" });
        // Update session client-side
        await update({
          user: {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
          }
        });
      } else {
        setMessage({ type: "error", text: res.error || "خطایی رخ داد" });
      }
    });
  };

  const handleChangePassword = async (formData: FormData) => {
    setPasswordMessage(null);
    startPasswordTransition(async () => {
      const res = await changePassword(formData);
      if (res.success) {
        setPasswordMessage({ type: "success", text: "رمز عبور با موفقیت تغییر یافت" });
        (document.getElementById("password-form") as HTMLFormElement)?.reset();
      } else {
        setPasswordMessage({ type: "error", text: res.error || "خطایی رخ داد" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Basic Info Form */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400">person</span>
          اطلاعات کاربری
        </h3>
        <form action={handleUpdateProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-500">نام و نام خانوادگی</label>
              <input
                name="name"
                defaultValue={user.name}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="نام خود را وارد کنید"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-500">ایمیل</label>
              <input
                name="email"
                type="email"
                defaultValue={user.email}
                required
                readOnly={hasGoogleProvider}
                className={`w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 outline-none transition-all ${hasGoogleProvider ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="ایمیل خود را وارد کنید"
              />
              {hasGoogleProvider && (
                <p className="text-[10px] text-zinc-400">ایمیل حساب‌های گوگل قابل تغییر نیست</p>
              )}
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Form (Only if not Google-only or if they want to add a password) */}
      {!hasGoogleProvider || hasPassword ? (
        <div className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-10">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-400">lock</span>
            تغییر رمز عبور
          </h3>
          <form id="password-form" action={handleChangePassword} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hasPassword && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-500">رمز عبور فعلی</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-500">رمز عبور جدید</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-500">تکرار رمز عبور جدید</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-xl text-sm ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                {passwordMessage.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPasswordPending}
                className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {isPasswordPending ? 'در حال تغییر...' : 'تغییر رمز عبور'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
