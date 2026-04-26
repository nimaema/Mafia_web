"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/user";

export default function ProfileForm({ user }: { user: { name: string, email: string } }) {
  const [result, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await updateProfile(formData);
      return res;
    },
    null
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      {result?.success && (
        <div className="bg-lime-500/10 border border-lime-500/30 text-lime-600 dark:text-lime-400 text-sm py-3 px-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          <span>پروفایل با موفقیت بروزرسانی شد</span>
        </div>
      )}
      
      {result?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm py-3 px-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{result.error}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">نام و نام خانوادگی</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">person</span>
          <input 
            type="text" 
            name="name" 
            defaultValue={user.name} 
            required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-lime-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ایمیل</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">mail</span>
          <input 
            type="email" 
            name="email" 
            defaultValue={user.email} 
            required
            dir="ltr"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-lime-500 transition-colors"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-lime-500 text-zinc-950 py-3 rounded-xl font-bold mt-2 hover:bg-lime-600 transition-colors shadow-lg shadow-lime-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <span className="material-symbols-outlined animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined">save</span>
        )}
        ذخیره تغییرات
      </button>
    </form>
  );
}
