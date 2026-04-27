"use client";

import { GameStatus, Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { banUser, deleteUser, getAllUsersSafe, updateUserRole } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  isBanned: boolean;
  emailVerified: Date | null;
  password_hash: string | null;
  accounts: { provider: string }[];
  gamePlayers: {
    game: {
      id: string;
      name: string | null;
      code: string | null;
      status: GameStatus;
    };
  }[];
  _count: {
    gameHistories: number;
    gamesHosted: number;
  };
};

type StatusFilter = "ALL" | "ACTIVE" | "BANNED" | "ONLINE" | "PASSWORD" | "GOOGLE" | "VERIFIED" | "UNVERIFIED";
type RoleFilter = "ALL" | Role;
type SortMode = "ROLE" | "EMAIL" | "PLAYED" | "HOSTED";

function getInitial(name?: string | null, email?: string | null) {
  const source = (name || email || "?").trim();
  return source.slice(0, 1).toUpperCase();
}

function roleLabel(role: Role) {
  if (role === "ADMIN") return "مدیر";
  if (role === "MODERATOR") return "گرداننده";
  return "بازیکن";
}

function roleClass(role: Role) {
  if (role === "ADMIN") return "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300";
  if (role === "MODERATOR") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
}

function getUserPresence(user: UserRecord) {
  const activeGame =
    user.gamePlayers.find((player) => player.game.status === "IN_PROGRESS")?.game ||
    user.gamePlayers.find((player) => player.game.status === "WAITING")?.game;

  if (!activeGame) {
    return {
      label: "آفلاین",
      detail: "بدون حضور فعال",
      icon: "radio_button_unchecked",
      online: false,
      className: "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400",
    };
  }

  const isPlaying = activeGame.status === "IN_PROGRESS";
  return {
    label: isPlaying ? "در بازی" : "در لابی",
    detail: activeGame.name || (activeGame.code ? `#${activeGame.code}` : "بازی فعال"),
    icon: isPlaying ? "sports_esports" : "sensors",
    online: true,
    className: isPlaying
      ? "border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300"
      : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

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
      const presence = getUserPresence(user);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !user.isBanned) ||
        (statusFilter === "BANNED" && user.isBanned) ||
        (statusFilter === "ONLINE" && presence.online) ||
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
    onlineUsers: users.filter((user) => getUserPresence(user).online).length,
    googleUsers: users.filter((user) => user.accounts.some((account) => account.provider === "google")).length,
  };
  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) || filteredUsers[0] || null;
  const selectedPresence = selectedUser ? getUserPresence(selectedUser) : null;

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
              <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">کاربران و دسترسی‌ها</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                وضعیت حساب، روش ورود، سطح دسترسی، سابقه بازی و ابزارهای مدیریتی هر کاربر را از یک نمای متمرکز کنترل کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={refreshUsers} className="ui-button-primary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">refresh</span>
              بروزرسانی
            </button>
          </div>
        </div>
      </header>

      <section className="ui-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((value) => !value)}
          className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-right"
        >
          <div>
            <p className="text-sm font-black text-zinc-950 dark:text-white">نمای کلی کاربران</p>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {counts.total} کاربر، {counts.total - counts.banned} حساب فعال و {counts.googleUsers} ورود گوگل
            </p>
          </div>
          <span className="material-symbols-outlined text-zinc-400">
            {showStats ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
        </button>

        {showStats && (
          <div className="grid gap-3 border-t border-zinc-200 p-4 dark:border-white/10 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["کل کاربران", counts.total, "group", "text-lime-500"],
              ["مدیر و گرداننده", counts.admins + counts.moderators, "admin_panel_settings", "text-sky-500"],
              ["حساب فعال", counts.total - counts.banned, "verified", "text-emerald-500"],
              ["حضور فعال", counts.onlineUsers, "sensors", "text-amber-500"],
            ].map(([label, value, icon, color]) => (
              <div key={label} className="ui-muted p-4">
                <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
                <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ui-card p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_170px_190px]">
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-zinc-950/40">
            <span className="material-symbols-outlined text-zinc-400">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس نام یا ایمیل"
              className="w-full border-0 bg-transparent p-0 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-white"
            />
          </label>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}>
            <option value="ALL">همه نقش‌ها</option>
            <option value="ADMIN">مدیر</option>
            <option value="MODERATOR">گرداننده</option>
            <option value="USER">بازیکن</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="ACTIVE">فعال</option>
            <option value="BANNED">مسدود</option>
            <option value="ONLINE">در لابی/بازی</option>
            <option value="PASSWORD">رمزدار</option>
            <option value="GOOGLE">گوگل</option>
            <option value="VERIFIED">ایمیل تایید شده</option>
            <option value="UNVERIFIED">ایمیل تایید نشده</option>
          </select>

          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="ROLE">مرتب‌سازی: نقش</option>
            <option value="EMAIL">مرتب‌سازی: ایمیل</option>
            <option value="PLAYED">مرتب‌سازی: بیشترین بازی</option>
            <option value="HOSTED">مرتب‌سازی: بیشترین لابی</option>
          </select>
        </div>
      </section>

      <main className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="ui-card relative min-h-[520px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 p-5 dark:border-white/10">
            <div>
              <p className="font-black text-zinc-950 dark:text-white">فهرست کاربران</p>
              <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                {filteredUsers.length} نتیجه از {users.length} کاربر
              </p>
            </div>
            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
              انتخاب برای جزئیات
            </span>
          </div>

          {loading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90">
              <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-lime-500 dark:border-zinc-800"></div>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">در حال بارگذاری اطلاعات کاربران...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-6 text-center">
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
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="ui-icon size-16">
                <span className="material-symbols-outlined text-3xl text-zinc-400">person_search</span>
              </div>
              <div>
                <p className="font-black text-zinc-950 dark:text-white">کاربری با این فیلتر پیدا نشد</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">جستجو یا فیلترها را تغییر دهید.</p>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar max-h-[680px] overflow-y-auto p-3">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const hasGoogle = user.accounts.some((account) => account.provider === "google");
                  const hasPassword = Boolean(user.password_hash);
                  const isSelected = selectedUser?.id === user.id;
                  const presence = getUserPresence(user);

                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full rounded-lg border p-3 text-right transition-all ${
                        isSelected
                          ? "border-lime-500/40 bg-lime-500/10"
                          : "border-zinc-200 bg-zinc-50 hover:border-lime-500/25 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                            {user.image ? (
                              <img src={user.image} alt="" className="size-full object-cover" />
                            ) : (
                              getInitial(user.name, user.email)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-black text-zinc-950 dark:text-white">{user.name || "بدون نام"}</p>
                            <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400" dir="ltr">{user.email || "بدون ایمیل"}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black ${roleClass(user.role)}`}>
                                {roleLabel(user.role)}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black ${presence.className}`}>
                                <span className="material-symbols-outlined text-[13px]">{presence.icon}</span>
                                {presence.label}
                              </span>
                              {user.isBanned && (
                                <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-500">
                                  مسدود
                                </span>
                              )}
                              <span className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                                {[hasPassword ? "رمز" : null, hasGoogle ? "گوگل" : null].filter(Boolean).join(" + ") || "نامشخص"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden shrink-0 grid-cols-2 gap-2 text-center sm:grid">
                          <div className="ui-muted min-w-20 p-2">
                            <p className="text-base font-black text-zinc-950 dark:text-white">{user._count.gameHistories}</p>
                            <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">بازی</p>
                          </div>
                          <div className="ui-muted min-w-20 p-2">
                            <p className="text-base font-black text-zinc-950 dark:text-white">{user._count.gamesHosted}</p>
                            <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">لابی</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <aside className="ui-card h-fit overflow-hidden xl:sticky xl:top-6">
          {selectedUser ? (
            <div>
              <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-start gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white text-xl font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt="" className="size-full object-cover" />
                    ) : (
                      getInitial(selectedUser.name, selectedUser.email)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="ui-kicker">پرونده کاربر</p>
                    <h2 className="mt-1 truncate text-xl font-black text-zinc-950 dark:text-white">{selectedUser.name || "بدون نام"}</h2>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400" dir="ltr">{selectedUser.email || "بدون ایمیل"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="ui-muted p-3">
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">بازی‌ها</p>
                    <p className="mt-2 text-lg font-black text-zinc-950 dark:text-white">{selectedUser._count.gameHistories}</p>
                  </div>
                  <div className="ui-muted p-3">
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">لابی‌ها</p>
                    <p className="mt-2 text-lg font-black text-zinc-950 dark:text-white">{selectedUser._count.gamesHosted}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 p-4 dark:border-white/10">
                  <label className="text-xs font-black text-zinc-500 dark:text-zinc-400">سطح دسترسی</label>
                  <select
                    value={selectedUser.role}
                    onChange={(event) => handleRoleChange(selectedUser.id, event.target.value as Role)}
                    disabled={busyUserId === selectedUser.id || selectedUser.id === currentUserId}
                    className="mt-2 w-full"
                  >
                    <option value="USER">بازیکن</option>
                    <option value="MODERATOR">گرداننده</option>
                    <option value="ADMIN">مدیر</option>
                  </select>
                  {selectedUser.id === currentUserId && (
                    <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      برای جلوگیری از قفل شدن حساب، سطح دسترسی خودتان از اینجا تغییر نمی‌کند.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-white/10">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">وضعیت حساب</span>
                    <span className={selectedUser.isBanned ? "font-black text-red-500" : "font-black text-emerald-500"}>
                      {selectedUser.isBanned ? "مسدود" : "فعال"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-white/10">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">ورود با رمز</span>
                    <span className="font-black text-zinc-950 dark:text-white">{selectedUser.password_hash ? "فعال" : "ندارد"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-white/10">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">ورود با گوگل</span>
                    <span className="font-black text-zinc-950 dark:text-white">
                      {selectedUser.accounts.some((account) => account.provider === "google") ? "متصل" : "متصل نیست"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-white/10">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">حضور آنلاین</span>
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-black ${selectedPresence?.className || ""}`}>
                      <span className="material-symbols-outlined text-sm">{selectedPresence?.icon}</span>
                      {selectedPresence?.label || "آفلاین"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm dark:border-white/10">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">محل حضور</span>
                    <span className="truncate pr-3 text-left font-black text-zinc-950 dark:text-white">
                      {selectedPresence?.detail || "بدون حضور فعال"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
                  <button
                    onClick={() => handleBanToggle(selectedUser)}
                    disabled={busyUserId === selectedUser.id || selectedUser.id === currentUserId}
                    className={selectedUser.isBanned ? "ui-button-secondary w-full text-emerald-600 dark:text-emerald-400" : "ui-button-danger w-full"}
                  >
                    <span className="material-symbols-outlined text-lg">{selectedUser.isBanned ? "lock_open" : "block"}</span>
                    {selectedUser.isBanned ? "رفع مسدودیت" : "مسدودسازی کاربر"}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedUser)}
                    disabled={busyUserId === selectedUser.id || selectedUser.id === currentUserId}
                    className="ui-button-danger w-full"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    حذف کامل کاربر
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="ui-icon size-16">
                <span className="material-symbols-outlined text-3xl text-zinc-400">manage_search</span>
              </div>
              <div>
                <p className="font-black text-zinc-950 dark:text-white">کاربری انتخاب نشده</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">از فهرست سمت راست یک کاربر را انتخاب کنید.</p>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
