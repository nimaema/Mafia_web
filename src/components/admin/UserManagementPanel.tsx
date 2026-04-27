"use client";

import Link from "next/link";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { banUser, deleteUser, getAllUsersSafe, updateUserRole } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isBanned: boolean;
  emailVerified: Date | null;
  password_hash: string | null;
  accounts: { provider: string }[];
  _count: {
    gameHistories: number;
    gamesHosted: number;
    passwordResetTokens: number;
  };
};

type StatusFilter = "ALL" | "ACTIVE" | "BANNED" | "PASSWORD" | "GOOGLE" | "VERIFIED" | "UNVERIFIED";
type RoleFilter = "ALL" | Role;
type SortMode = "ROLE" | "EMAIL" | "PLAYED" | "HOSTED";

function getInitial(name?: string | null, email?: string | null) {
  const source = (name || email || "?").trim();
  return source.slice(0, 1).toUpperCase();
}

export function UserManagementPanel() {
  const { data: session, status } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("ROLE");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);
  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (status === "loading") return;
    refreshUsers();
  }, [status]);

  const refreshUsers = async () => {
    setLoading(true);
    setErrorMessage("");
    const result = await getAllUsersSafe();
    setUsers(result.data as UserRecord[]);
    if (!result.success) {
      setErrorMessage(result.error || "اطلاعات کاربران بارگذاری نشد.");
    }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return users
      .filter((user) => {
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const hasPassword = Boolean(user.password_hash);
      const hasGoogle = user.accounts.some((account) => account.provider === "google");

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !user.isBanned) ||
        (statusFilter === "BANNED" && user.isBanned) ||
        (statusFilter === "PASSWORD" && hasPassword) ||
        (statusFilter === "GOOGLE" && hasGoogle) ||
        (statusFilter === "VERIFIED" && Boolean(user.emailVerified)) ||
        (statusFilter === "UNVERIFIED" && !user.emailVerified);

      return matchesSearch && matchesRole && matchesStatus;
    })
      .sort((left, right) => {
        if (sortMode === "EMAIL") {
          return (left.email || "").localeCompare(right.email || "", "fa");
        }
        if (sortMode === "PLAYED") {
          return right._count.gameHistories - left._count.gameHistories;
        }
        if (sortMode === "HOSTED") {
          return right._count.gamesHosted - left._count.gamesHosted;
        }

        const roleWeight: Record<Role, number> = {
          ADMIN: 0,
          MODERATOR: 1,
          USER: 2,
        };

        const roleDiff = roleWeight[left.role] - roleWeight[right.role];
        if (roleDiff !== 0) return roleDiff;
        return (left.email || "").localeCompare(right.email || "", "fa");
      });
  }, [deferredSearch, roleFilter, sortMode, statusFilter, users]);

  const counts = {
    total: users.length,
    admins: users.filter((user) => user.role === "ADMIN").length,
    moderators: users.filter((user) => user.role === "MODERATOR").length,
    banned: users.filter((user) => user.isBanned).length,
    passwordUsers: users.filter((user) => user.password_hash).length,
    googleUsers: users.filter((user) => user.accounts.some((account) => account.provider === "google")).length,
  };

  const handleRoleChange = async (userId: string, nextRole: Role) => {
    if (userId === currentUserId && nextRole !== "ADMIN") {
      showAlert("خطا", "نمی‌توانید دسترسی مدیریت خودتان را حذف کنید.", "error");
      return;
    }

    setBusyUserId(userId);
    try {
      await updateUserRole(userId, nextRole);
      showToast("سطح دسترسی کاربر بروزرسانی شد", "success");
      await refreshUsers();
    } catch (error: any) {
      showAlert("خطا", error.message || "تغییر دسترسی ناموفق بود", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleBanToggle = async (user: UserRecord) => {
    if (user.id === currentUserId) {
      showAlert("خطا", "نمی‌توانید حساب خودتان را مسدود کنید.", "error");
      return;
    }

    showConfirm(
      user.isBanned ? "رفع مسدودیت" : "مسدود کردن",
      `آیا از ${user.isBanned ? "رفع مسدودیت" : "مسدود کردن"} ${user.name || user.email || "این کاربر"} مطمئن هستید؟`,
      async () => {
        setBusyUserId(user.id);
        try {
          await banUser(user.id, !user.isBanned);
          showToast(user.isBanned ? "کاربر دوباره فعال شد" : "کاربر مسدود شد", "success");
          await refreshUsers();
        } catch (error: any) {
          showAlert("خطا", error.message || "تغییر وضعیت کاربر ناموفق بود", "error");
        } finally {
          setBusyUserId(null);
        }
      },
      "error"
    );
  };

  const handleDelete = async (user: UserRecord) => {
    if (user.id === currentUserId) {
      showAlert("خطا", "نمی‌توانید حساب خودتان را حذف کنید.", "error");
      return;
    }

    showConfirm(
      "حذف کامل کاربر",
      `حساب ${user.name || user.email || "این کاربر"} و همه داده‌های مرتبط حذف می‌شود. این کار قابل بازگشت نیست.`,
      async () => {
        setBusyUserId(user.id);
        try {
          await deleteUser(user.id);
          showToast("کاربر حذف شد", "success");
          await refreshUsers();
        } catch (error: any) {
          showAlert("خطا", error.message || "حذف کاربر ناموفق بود", "error");
        } finally {
          setBusyUserId(null);
        }
      },
      "error"
    );
  };

  return (
    <div className="flex min-h-[80vh] flex-col gap-5" dir="rtl">
      <header className="ui-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="ui-icon-accent size-14">
              <span className="material-symbols-outlined text-3xl">manage_accounts</span>
            </div>
            <div>
              <p className="ui-kicker">مدیریت کاربران</p>
              <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">کنترل دسترسی و وضعیت کاربران</h1>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                جستجو، فیلتر، تغییر نقش، مسدودسازی و بررسی روش ورود کاربران از یک نمای جداگانه.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <Link href="/dashboard/admin?tab=roles" className="ui-button-secondary min-h-10 px-3 text-xs">
                <span className="material-symbols-outlined text-base">theater_comedy</span>
                نقش‌ها
              </Link>
              <Link href="/dashboard/admin?tab=scenarios" className="ui-button-secondary min-h-10 px-3 text-xs">
                <span className="material-symbols-outlined text-base">account_tree</span>
                سناریوها
              </Link>
            </div>

            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950/40">
              <span className="material-symbols-outlined text-zinc-400">search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو بر اساس نام یا ایمیل"
                className="w-full border-0 bg-transparent p-0 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-white"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="min-h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100"
            >
              <option value="ALL">همه نقش‌ها</option>
              <option value="ADMIN">مدیر</option>
              <option value="MODERATOR">گرداننده</option>
              <option value="USER">بازیکن</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="min-h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="ACTIVE">فعال</option>
              <option value="BANNED">مسدود</option>
              <option value="VERIFIED">ایمیل تایید شده</option>
              <option value="UNVERIFIED">ایمیل تایید نشده</option>
              <option value="PASSWORD">رمزدار</option>
              <option value="GOOGLE">گوگل</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="min-h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100"
            >
              <option value="ROLE">مرتب‌سازی: نقش</option>
              <option value="EMAIL">مرتب‌سازی: ایمیل</option>
              <option value="PLAYED">مرتب‌سازی: بیشترین بازی</option>
              <option value="HOSTED">مرتب‌سازی: بیشترین لابی</option>
            </select>

            <button onClick={refreshUsers} className="ui-button-secondary min-h-11">
              <span className="material-symbols-outlined text-xl">refresh</span>
              بروزرسانی
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["کل کاربران", counts.total, "group", "text-lime-500"],
          ["مدیران", counts.admins, "admin_panel_settings", "text-purple-500"],
          ["گرداننده‌ها", counts.moderators, "sports_esports", "text-sky-500"],
          ["مسدود", counts.banned, "block", "text-red-500"],
          ["ورود با رمز", counts.passwordUsers, "password", "text-amber-500"],
          ["ورود با گوگل", counts.googleUsers, "alternate_email", "text-emerald-500"],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="ui-card p-4">
            <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
          </div>
        ))}
      </section>

      <main className="ui-card relative min-h-[420px] overflow-hidden p-5">
        {loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90">
            <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-lime-500 dark:border-zinc-800"></div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">در حال بارگذاری اطلاعات کاربران...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center gap-5 text-center">
            <div className="ui-icon size-16 text-red-500">
              <span className="material-symbols-outlined text-3xl">cloud_off</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950 dark:text-white">بارگذاری کاربران ناموفق بود</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
            </div>
            <button onClick={refreshUsers} className="ui-button-primary">
              <span className="material-symbols-outlined text-xl">refresh</span>
              تلاش دوباره
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center gap-4 text-center">
            <div className="ui-icon size-16">
              <span className="material-symbols-outlined text-3xl text-zinc-400">person_search</span>
            </div>
            <div>
              <p className="font-black text-zinc-950 dark:text-white">کاربری با این فیلتر پیدا نشد</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">جستجو یا فیلترها را تغییر دهید.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredUsers.map((user) => {
              const isBusy = busyUserId === user.id;
              const isCurrentUser = user.id === currentUserId;
              const hasGoogle = user.accounts.some((account) => account.provider === "google");
              const hasPassword = Boolean(user.password_hash);

              return (
                <article key={user.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                          {getInitial(user.name, user.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black text-zinc-950 dark:text-white">{user.name || "بدون نام"}</p>
                          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400" dir="ltr">{user.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${
                              user.role === "ADMIN"
                                ? "border-purple-500/20 bg-purple-500/10 text-purple-500"
                                : user.role === "MODERATOR"
                                  ? "border-sky-500/20 bg-sky-500/10 text-sky-500"
                                  : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
                            }`}>
                              {user.role}
                            </span>
                            {user.isBanned && (
                              <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-black text-red-500">
                                مسدود
                              </span>
                            )}
                            {user._count.passwordResetTokens > 0 && (
                              <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-500">
                                بازیابی فعال
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-[10px] font-black text-lime-600 dark:text-lime-400">
                                شما
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <select
                        value={user.role}
                        onChange={(event) => handleRoleChange(user.id, event.target.value as Role)}
                        disabled={isBusy || isCurrentUser}
                        className="min-h-10 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        <option value="USER">بازیکن</option>
                        <option value="MODERATOR">گرداننده</option>
                        <option value="ADMIN">مدیر</option>
                      </select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">بازی‌های انجام‌شده</p>
                        <p className="mt-2 text-lg font-black text-zinc-950 dark:text-white">{user._count.gameHistories}</p>
                      </div>
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">لابی‌های گردانده</p>
                        <p className="mt-2 text-lg font-black text-zinc-950 dark:text-white">{user._count.gamesHosted}</p>
                      </div>
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">روش ورود</p>
                        <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                          {[hasPassword ? "رمز" : null, hasGoogle ? "گوگل" : null].filter(Boolean).join(" + ") || "نامشخص"}
                        </p>
                      </div>
                      <div className="ui-muted p-3">
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">ایمیل</p>
                        <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
                          {user.emailVerified ? "تایید شده" : "تایید نشده"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleBanToggle(user)}
                        disabled={isBusy || isCurrentUser}
                        className={user.isBanned ? "ui-button-secondary min-h-9 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400" : "ui-button-danger min-h-9 px-3 py-2 text-xs"}
                      >
                        <span className="material-symbols-outlined text-base">{user.isBanned ? "lock_open" : "block"}</span>
                        {user.isBanned ? "رفع مسدودیت" : "مسدودسازی"}
                      </button>

                      <button
                        onClick={() => handleDelete(user)}
                        disabled={isBusy || isCurrentUser}
                        className="ui-button-danger min-h-9 px-3 py-2 text-xs"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        حذف کامل
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
