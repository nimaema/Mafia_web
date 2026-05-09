"use client";

import { useState } from "react";
import { updateUserRole, deleteUser } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";

export function UsersTable({ users, currentUserId }: { users: any[], currentUserId: string }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { showAlert, showConfirm, showToast } = usePopup();

  const handleRoleChange = async (userId: string, newRole: "USER" | "MODERATOR" | "ADMIN") => {
    if (userId === currentUserId && newRole !== "ADMIN") {
      showAlert("خطا", "شما نمی‌توانید نقش مدیریت خود را لغو کنید.", "error");
      return;
    }
    
    setLoadingId(userId);
    try {
      await updateUserRole(userId, newRole);
      showToast("نقش کاربر با موفقیت تغییر کرد", "success");
    } catch (err: any) {
      showAlert("خطا", err.message || "خطا در تغییر نقش", "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (userId === currentUserId) {
      showAlert("خطا", "نمی‌توانید حساب خودتان را حذف کنید.", "error");
      return;
    }

    showConfirm("حذف کاربر", `آیا از حذف دائم کاربر "${name}" اطمینان دارید؟`, async () => {
      setLoadingId(userId);
      try {
        await deleteUser(userId);
        showToast("کاربر با موفقیت حذف شد", "success");
      } catch (err: any) {
        showAlert("خطا", err.message || "خطا در حذف کاربر", "error");
      } finally {
        setLoadingId(null);
      }
    }, "error");
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-200 dark:bg-zinc-800/50 border-b border-[var(--pm-line)] dark:border-[var(--pm-line)] text-sm font-bold">
            <th className="p-4">نام کاربر</th>
            <th className="p-4">ایمیل</th>
            <th className="p-4">سطح دسترسی</th>
            <th className="p-4">تعداد بازی</th>
            <th className="p-4 text-center">عملیات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {users.map(user => (
            <tr key={user.id} className={`hover:bg-gray-200 dark:hover:bg-zinc-800/30 transition-colors ${loadingId === user.id ? 'opacity-50' : ''}`}>
              <td className="p-4 font-medium">{user.name || "بدون نام"}</td>
              <td className="p-4 text-sm text-[var(--pm-muted)]" dir="ltr">{user.email}</td>
              <td className="p-4">
                <select 
                  value={user.role} 
                  onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                  disabled={loadingId === user.id || user.id === currentUserId}
                  className={`text-xs px-2 py-1.5 rounded-md font-bold cursor-pointer border-0 ring-1 focus:ring-2 focus:outline-none transition-all ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-600 dark:text-purple-400 dark:ring-purple-800' :
                    user.role === 'MODERATOR' ? 'bg-[var(--pm-primary)]/20 text-[var(--pm-primary-strong)] ring-lime-200 dark:bg-[var(--pm-primary)]/15 dark:text-[var(--pm-primary)] dark:ring-lime-800' :
                    'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-[var(--pm-muted)] dark:ring-zinc-700'
                  }`}
                >
                  <option value="USER">بازیکن</option>
                  <option value="MODERATOR">گرداننده</option>
                  <option value="ADMIN">ادمین</option>
                </select>
              </td>
              <td className="p-4 text-sm font-bold text-[var(--pm-muted)]">{user._count.gameHistories}</td>
              <td className="p-4 text-center">
                <button 
                  onClick={() => handleDelete(user.id, user.name || user.email)}
                  disabled={loadingId === user.id || user.id === currentUserId}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:hover:bg-red-900 dark:text-red-600 dark:text-red-400 transition-colors flex items-center justify-center disabled:opacity-50 mx-auto"
                  title="حذف کاربر"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
