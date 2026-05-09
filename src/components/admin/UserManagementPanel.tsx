"use client";

import { GameStatus, Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { banUser, deleteUser, getAllUsersSafe, sendEmailToUser, updateUserRole, verifyUserEmail } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";
import { usePresenceSnapshot } from "@/hooks/usePresenceSnapshot";

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  isBanned: boolean;
  emailVerified: Date | null;
  lastActiveAt: Date | string | null;
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

type StatusFilter = "ALL" | "ACTIVE" | "BANNED" | "ONLINE" | "RECENT" | "PASSWORD" | "GOOGLE" | "VERIFIED" | "UNVERIFIED";
type RoleFilter = "ALL" | Role;
type SortMode = "ROLE" | "EMAIL" | "LAST_ACTIVE" | "PLAYED" | "HOSTED";
type EmailComposerMode = "write" | "preview";
type EmailPreviewBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string }
  | { type: "divider" };

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
  return "border-zinc-500/20 bg-zinc-500/10 text-[var(--pm-muted)]";
}

function roleAccentClass(role: Role) {
  if (role === "ADMIN") return "from-purple-500 to-fuchsia-500";
  if (role === "MODERATOR") return "from-blue-500 to-lime-400";
  return "from-lime-500 to-emerald-400";
}

function parseDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return "ثبت نشده";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getActivityStatus(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) {
    return {
      label: "ثبت نشده",
      detail: "فعالیتی ثبت نشده",
      recent: false,
      className: "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]",
    };
  }

  const diff = Math.max(0, Date.now() - date.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const recent = diff <= 15 * minute;

  const label =
    diff < minute
      ? "همین الان"
      : diff < hour
        ? `${Math.floor(diff / minute)} دقیقه پیش`
        : diff < day
          ? `${Math.floor(diff / hour)} ساعت پیش`
          : diff < 7 * day
            ? `${Math.floor(diff / day)} روز پیش`
            : formatDateTime(date);

  return {
    label,
    detail: formatDateTime(date),
    recent,
    className: recent
      ? "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]"
      : diff < day
        ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        : "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]",
  };
}

function getUserPresence(user: UserRecord, onlineUserIds: Set<string>) {
  const activeGame =
    user.gamePlayers.find((player) => player.game.status === "IN_PROGRESS")?.game ||
    user.gamePlayers.find((player) => player.game.status === "WAITING")?.game;
  const isOnlineNow = onlineUserIds.has(user.id);

  if (isOnlineNow) {
    const isPlaying = activeGame?.status === "IN_PROGRESS";
    const isInLobby = activeGame?.status === "WAITING";

    return {
      label: isPlaying ? "آنلاین در بازی" : isInLobby ? "آنلاین در لابی" : "آنلاین",
      detail: activeGame?.name || (activeGame?.code ? `#${activeGame.code}` : "در حال استفاده از اپ"),
      icon: isPlaying ? "sports_esports" : isInLobby ? "sensors" : "radio_button_checked",
      online: true,
      className: "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]",
    };
  }

  if (!activeGame) {
    return {
      label: "آفلاین",
      detail: "بدون حضور فعال",
      icon: "radio_button_unchecked",
      online: false,
      className: "border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]",
    };
  }

  const isPlaying = activeGame.status === "IN_PROGRESS";
  return {
    label: isPlaying ? "در بازی ثبت‌شده" : "در لابی ثبت‌شده",
    detail: activeGame.name || (activeGame.code ? `#${activeGame.code}` : "بازی فعال"),
    icon: isPlaying ? "sports_esports" : "sensors",
    online: false,
    className: isPlaying
      ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
}

function parseEmailPreviewBlocks(body: string): EmailPreviewBlock[] {
  const blocks: EmailPreviewBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  body.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }
    if (line === "---") {
      flushParagraph();
      flushList();
      blocks.push({ type: "divider" });
      return;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(2) });
      return;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "note", text: line.slice(2) });
      return;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2));
      return;
    }
    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return blocks;
}

function renderPreviewText(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function UserManagementPanel() {
  const { data: session, status } = useSession();
  const presence = usePresenceSnapshot();
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
  const [emailComposerUser, setEmailComposerUser] = useState<UserRecord | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailComposerMode, setEmailComposerMode] = useState<EmailComposerMode>("write");

  const deferredSearch = useDeferredValue(search);
  const currentUserId = session?.user?.id;
  const onlineUserIds = useMemo(() => new Set(presence.members.map((member) => member.id)), [presence.members]);

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
      const presence = getUserPresence(user, onlineUserIds);
      const activity = getActivityStatus(user.lastActiveAt);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !user.isBanned) ||
        (statusFilter === "BANNED" && user.isBanned) ||
        (statusFilter === "ONLINE" && presence.online) ||
        (statusFilter === "RECENT" && activity.recent) ||
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
        if (sortMode === "LAST_ACTIVE") {
          return (parseDate(right.lastActiveAt)?.getTime() || 0) - (parseDate(left.lastActiveAt)?.getTime() || 0);
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
  }, [deferredSearch, onlineUserIds, roleFilter, sortMode, statusFilter, users]);

  const counts = {
    total: users.length,
    admins: users.filter((user) => user.role === "ADMIN").length,
    moderators: users.filter((user) => user.role === "MODERATOR").length,
    banned: users.filter((user) => user.isBanned).length,
    onlineUsers: users.filter((user) => getUserPresence(user, onlineUserIds).online).length,
    recentUsers: users.filter((user) => getActivityStatus(user.lastActiveAt).recent).length,
    googleUsers: users.filter((user) => user.accounts.some((account) => account.provider === "google")).length,
  };
  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) || filteredUsers[0] || null;
  const selectedPresence = selectedUser ? getUserPresence(selectedUser, onlineUserIds) : null;
  const selectedActivity = selectedUser ? getActivityStatus(selectedUser.lastActiveAt) : null;

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

  const handleVerifyEmail = async (user: UserRecord) => {
    if (!user.email) {
      showAlert("ایمیل کاربر", "این کاربر ایمیلی برای تایید ندارد.", "warning");
      return;
    }
    if (user.emailVerified) {
      showToast("ایمیل این کاربر قبلاً تایید شده است.", "info");
      return;
    }

    showConfirm(
      "تایید دستی ایمیل",
      `ایمیل ${user.email} برای این کاربر تایید شده ثبت شود؟`,
      async () => {
        setBusyUserId(user.id);
        try {
          await verifyUserEmail(user.id);
          showToast("ایمیل کاربر تایید شد", "success");
          await refreshUsers();
        } catch (error: any) {
          showAlert("خطا", error.message || "تایید ایمیل ناموفق بود", "error");
        } finally {
          setBusyUserId(null);
        }
      },
      "warning"
    );
  };

  const openEmailComposer = (user: UserRecord) => {
    if (!user.email) {
      showAlert("ایمیل کاربر", "این کاربر ایمیلی برای ارسال پیام ندارد.", "warning");
      return;
    }

    setEmailComposerUser(user);
    setEmailSubject("");
    setEmailBody("");
    setEmailComposerMode("write");
  };

  const insertEmailSnippet = (snippet: string) => {
    setEmailBody((current) => {
      const separator = current.trim() ? "\n\n" : "";
      return `${current}${separator}${snippet}`.slice(0, 4000);
    });
  };

  const addEmailFormatBlock = (value: string) => {
    setEmailBody((current) => {
      const separator = current.trim() ? "\n\n" : "";
      return `${current}${separator}${value}`.slice(0, 4000);
    });
  };

  const handleSendEmail = async () => {
    if (!emailComposerUser) return;
    if (!emailSubject.trim()) {
      showAlert("موضوع ایمیل", "موضوع ایمیل را وارد کنید.", "warning");
      return;
    }
    if (emailBody.trim().length < 10) {
      showAlert("متن ایمیل", "متن ایمیل باید کمی کامل‌تر باشد.", "warning");
      return;
    }

    setBusyUserId(emailComposerUser.id);
    try {
      await sendEmailToUser(emailComposerUser.id, {
        subject: emailSubject,
        body: emailBody,
      });
      showToast("ایمیل برای کاربر ارسال شد", "success");
      setEmailComposerUser(null);
    } catch (error: any) {
      showAlert("خطا در ارسال ایمیل", error.message || "ارسال ایمیل انجام نشد.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col gap-5" dir="rtl">
      <header className="pm-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="pm-icon-primary size-14">
              <span className="material-symbols-outlined text-3xl">manage_accounts</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">مدیریت کاربران</p>
              <h1 className="mt-1 text-3xl font-black text-[var(--pm-text)]">کاربران و دسترسی‌ها</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--pm-muted)]">
                وضعیت حساب، روش ورود، سطح دسترسی، سابقه بازی و ابزارهای مدیریتی هر کاربر را از یک نمای متمرکز کنترل کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={refreshUsers} className="pm-button-primary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">refresh</span>
              بروزرسانی
            </button>
          </div>
        </div>
      </header>

      <section className="pm-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((value) => !value)}
          className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-right"
        >
          <div>
            <p className="text-sm font-black text-[var(--pm-text)]">نمای کلی کاربران</p>
            <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">
              {counts.total} کاربر، {counts.onlineUsers} آنلاین و {counts.googleUsers} ورود گوگل
            </p>
          </div>
          <span className="material-symbols-outlined text-[var(--pm-muted)]">
            {showStats ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
        </button>

        {showStats && (
          <div className="grid gap-3 border-t border-[var(--pm-line)] p-4 dark:border-[var(--pm-line)] md:grid-cols-2 xl:grid-cols-5">
            {[
              ["کل کاربران", counts.total, "group", "text-[var(--pm-primary)]"],
              ["مدیر و گرداننده", counts.admins + counts.moderators, "admin_panel_settings", "text-sky-500"],
              ["حساب فعال", counts.total - counts.banned, "verified", "text-emerald-500"],
              ["آنلاین همین حالا", counts.onlineUsers, "radio_button_checked", "text-[var(--pm-primary)]"],
              ["فعال ۱۵ دقیقه اخیر", counts.recentUsers, "bolt", "text-amber-500"],
            ].map(([label, value, icon, color]) => (
              <div key={label} className="pm-muted-card p-4">
                <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                <p className="mt-3 text-2xl font-black text-[var(--pm-text)]">{value}</p>
                <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pm-card p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_170px_190px]">
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-white px-3 text-sm dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
            <span className="material-symbols-outlined text-[var(--pm-muted)]">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجو بر اساس نام یا ایمیل"
              className="w-full border-0 bg-transparent p-0 text-sm text-zinc-900 outline-none placeholder:text-[var(--pm-muted)] focus:ring-0 dark:text-white"
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
            <option value="ONLINE">آنلاین</option>
            <option value="RECENT">فعال ۱۵ دقیقه اخیر</option>
            <option value="PASSWORD">رمزدار</option>
            <option value="GOOGLE">گوگل</option>
            <option value="VERIFIED">ایمیل تایید شده</option>
            <option value="UNVERIFIED">ایمیل تایید نشده</option>
          </select>

          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="ROLE">مرتب‌سازی: نقش</option>
            <option value="EMAIL">مرتب‌سازی: ایمیل</option>
            <option value="LAST_ACTIVE">مرتب‌سازی: آخرین فعالیت</option>
            <option value="PLAYED">مرتب‌سازی: بیشترین بازی</option>
            <option value="HOSTED">مرتب‌سازی: بیشترین لابی</option>
          </select>
        </div>
      </section>

      <main className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="pm-card relative h-fit overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">لیست عملیاتی</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">کاربران سیستم</h2>
              <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">
                {filteredUsers.length} نتیجه از {users.length} کاربر
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black">
              <span className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2.5 py-1 text-[var(--pm-primary)]">{counts.onlineUsers} آنلاین</span>
              <span className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2.5 py-1 text-[var(--pm-primary)]">{counts.recentUsers} فعال اخیر</span>
              <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-700 dark:text-sky-300">{counts.admins + counts.moderators} مدیر/گرداننده</span>
              <span className="rounded-lg border border-[var(--pm-line)] bg-white px-2.5 py-1 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-[var(--pm-muted)]">برای جزئیات انتخاب کنید</span>
            </div>
          </div>

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/92 p-6 backdrop-blur-xl dark:bg-zinc-900/92">
              <div className="w-full max-w-md rounded-2xl border border-[var(--pm-line)] bg-white p-5 text-center shadow-2xl shadow-zinc-950/10 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-sky-400 text-sky-950 shadow-lg shadow-sky-500/20">
                  <span className="material-symbols-outlined animate-spin text-3xl leading-none">sync</span>
                </div>
                <p className="mt-4 text-base font-black text-[var(--pm-text)]">در حال ساخت نمای مدیریتی کاربران</p>
                <p className="mt-2 text-xs font-bold leading-6 text-[var(--pm-muted)]">
                  وضعیت حساب‌ها، آخرین فعالیت و دسترسی‌ها در حال مرتب‌سازی هستند.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["حساب‌ها", "دسترسی‌ها", "فعالیت"].map((item) => (
                    <span key={item} className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2 py-1.5 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-[var(--pm-muted)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 p-6 text-center">
              <div className="pm-icon size-16 text-red-500">
                <span className="material-symbols-outlined text-3xl">cloud_off</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--pm-text)]">بارگذاری کاربران ناموفق بود</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--pm-muted)]">{errorMessage}</p>
              </div>
              <button onClick={refreshUsers} className="pm-button-primary">
                <span className="material-symbols-outlined text-xl">refresh</span>
                تلاش دوباره
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="pm-icon size-16">
                <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">person_search</span>
              </div>
              <div>
                <p className="font-black text-[var(--pm-text)]">کاربری با این فیلتر پیدا نشد</p>
                <p className="mt-1 text-sm text-[var(--pm-muted)]">جستجو یا فیلترها را تغییر دهید.</p>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar max-h-[720px] overflow-y-auto">
              <div className="sticky top-0 z-10 hidden grid-cols-[minmax(220px,1.3fr)_132px_156px_88px] gap-3 border-b border-[var(--pm-line)] bg-zinc-50/95 px-4 py-2 text-[10px] font-black text-[var(--pm-muted)] backdrop-blur dark:border-[var(--pm-line)] dark:bg-zinc-950/95 dark:text-[var(--pm-muted)] lg:grid">
                <span>کاربر</span>
                <span>دسترسی</span>
                <span>فعالیت</span>
                <span className="text-center">آمار</span>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-white/10">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  const presence = getUserPresence(user, onlineUserIds);
                  const activity = getActivityStatus(user.lastActiveAt);

                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`group relative grid w-full gap-3 px-4 py-3 text-right transition-all lg:grid-cols-[minmax(220px,1.3fr)_132px_156px_88px] lg:items-center ${
                        isSelected
                          ? "bg-[var(--pm-primary)]/10 shadow-[inset_0_0_0_1px_rgba(190,242,100,0.18)]"
                          : "bg-white hover:bg-zinc-50 dark:bg-transparent dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className={`absolute inset-y-3 right-0 w-1 rounded-l-full bg-gradient-to-b ${roleAccentClass(user.role)}`} />
                      <div className="flex min-w-0 items-center gap-3 pr-1">
                        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-sm font-black text-zinc-700 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-zinc-200">
                          {user.image ? (
                            <img src={user.image} alt="" className="size-full object-cover" />
                          ) : (
                            getInitial(user.name, user.email)
                          )}
                          <span className={`absolute bottom-0.5 right-0.5 size-3 rounded-full border-2 border-white dark:border-zinc-950 ${presence.online ? "bg-[var(--pm-primary)]" : activity.recent ? "bg-sky-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-[var(--pm-text)]">{user.name || "بدون نام"}</p>
                          <p className="mt-1 truncate text-xs text-[var(--pm-muted)]" dir="ltr">{user.email || "بدون ایمیل"}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black lg:hidden">
                            <span className={`rounded-lg border px-2 py-0.5 ${roleClass(user.role)}`}>{roleLabel(user.role)}</span>
                            <span className={`rounded-lg border px-2 py-0.5 ${presence.className}`}>{presence.label}</span>
                            <span className={`rounded-lg border px-2 py-0.5 ${activity.className}`}>{activity.label}</span>
                            <span className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2 py-0.5 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                              {user._count.gameHistories} بازی / {user._count.gamesHosted} لابی
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden min-w-0 lg:block">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${roleClass(user.role)}`}>
                            {roleLabel(user.role)}
                          </span>
                          {user.isBanned && (
                            <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-500">
                              مسدود
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 text-[10px] font-black ${user.emailVerified ? "text-[var(--pm-primary)] dark:text-[var(--pm-primary)]" : "text-amber-600 dark:text-amber-300"}`}>
                          {user.emailVerified ? "ایمیل تایید شده" : "در انتظار تایید ایمیل"}
                        </p>
                      </div>

                      <div className="hidden min-w-0 lg:block">
                        <p className="truncate text-xs font-black text-[var(--pm-text)]">{activity.label}</p>
                        <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] font-bold text-[var(--pm-muted)]">
                          <span className={`size-1.5 shrink-0 rounded-full ${presence.online ? "bg-[var(--pm-primary)]" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                          <span className="truncate">{presence.label}، {presence.detail}</span>
                        </div>
                      </div>

                      <div className="hidden grid-cols-2 overflow-hidden rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-center dark:border-[var(--pm-line)] dark:bg-white/[0.03] lg:grid">
                        <div className="border-l border-[var(--pm-line)] px-2 py-1.5 dark:border-[var(--pm-line)]">
                          <p className="text-sm font-black text-[var(--pm-text)]">{user._count.gameHistories}</p>
                          <p className="text-[8px] font-bold text-[var(--pm-muted)]">بازی</p>
                        </div>
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-black text-[var(--pm-text)]">{user._count.gamesHosted}</p>
                          <p className="text-[8px] font-bold text-[var(--pm-muted)]">لابی</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <aside className="pm-card h-fit overflow-hidden xl:sticky xl:top-6">
          {selectedUser ? (
            <div>
              <div className="pm-contrast-surface relative overflow-hidden border-b border-[var(--pm-line)] bg-zinc-950 p-5 text-white dark:border-[var(--pm-line)]">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${roleAccentClass(selectedUser.role)}`} />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(190,242,100,0.12),transparent_44%),linear-gradient(90deg,rgba(96,165,250,0.08)_1px,transparent_1px)] bg-[size:auto,2.75rem_2.75rem]" />
                <div className="relative flex items-start gap-4">
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white/10 text-2xl font-black text-white shadow-xl shadow-black/20">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt="" className="size-full object-cover" />
                    ) : (
                      getInitial(selectedUser.name, selectedUser.email)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--pm-primary)]">پرونده کاربر</p>
                    <h2 className="mt-2 line-clamp-2 break-words text-2xl font-black leading-8 text-white">{selectedUser.name || "بدون نام"}</h2>
                    <p className="mt-1 truncate text-xs text-zinc-300" dir="ltr">{selectedUser.email || "بدون ایمیل"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-[var(--pm-line)] bg-white/10 px-2.5 py-1 text-[10px] font-black text-white">{roleLabel(selectedUser.role)}</span>
                      <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-black ${selectedPresence?.online ? "border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]" : "border-[var(--pm-line)] bg-white/10 text-zinc-300"}`}>
                        <span className="material-symbols-outlined text-sm">{selectedPresence?.icon}</span>
                        {selectedPresence?.label || "آفلاین"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="pm-muted-card p-3">
                    <p className="text-[10px] font-bold text-[var(--pm-muted)]">بازی‌ها</p>
                    <p className="mt-2 text-lg font-black text-[var(--pm-text)]">{selectedUser._count.gameHistories}</p>
                  </div>
                  <div className="pm-muted-card p-3">
                    <p className="text-[10px] font-bold text-[var(--pm-muted)]">لابی‌ها</p>
                    <p className="mt-2 text-lg font-black text-[var(--pm-text)]">{selectedUser._count.gamesHosted}</p>
                  </div>
                </div>

                <div className={`rounded-lg border p-4 ${selectedActivity?.className || ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black">آخرین استفاده از اپ</p>
                      <p className="mt-2 text-xl font-black">{selectedActivity?.label || "ثبت نشده"}</p>
                      <p className="mt-1 text-[10px] font-bold opacity-80">{selectedActivity?.detail || "فعالیتی ثبت نشده"}</p>
                    </div>
                    <span className="material-symbols-outlined text-2xl">schedule</span>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--pm-line)] p-4 dark:border-[var(--pm-line)]">
                  <label className="text-xs font-black text-[var(--pm-muted)]">سطح دسترسی</label>
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
                    <p className="mt-2 text-xs leading-5 text-[var(--pm-muted)]">
                      برای جلوگیری از قفل شدن حساب، سطح دسترسی خودتان از اینجا تغییر نمی‌کند.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-[var(--pm-line)] p-3 text-sm dark:border-[var(--pm-line)]">
                    <span className="font-bold text-[var(--pm-muted)]">وضعیت حساب</span>
                    <span className={selectedUser.isBanned ? "font-black text-red-500" : "font-black text-emerald-500"}>
                      {selectedUser.isBanned ? "مسدود" : "فعال"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--pm-line)] p-3 text-sm dark:border-[var(--pm-line)]">
                    <span className="font-bold text-[var(--pm-muted)]">ورود با رمز</span>
                    <span className="font-black text-[var(--pm-text)]">{selectedUser.password_hash ? "فعال" : "ندارد"}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--pm-line)] p-3 text-sm dark:border-[var(--pm-line)]">
                    <span className="font-bold text-[var(--pm-muted)]">ورود با گوگل</span>
                    <span className="font-black text-[var(--pm-text)]">
                      {selectedUser.accounts.some((account) => account.provider === "google") ? "متصل" : "متصل نیست"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--pm-line)] p-3 text-sm dark:border-[var(--pm-line)]">
                    <span className="font-bold text-[var(--pm-muted)]">تایید ایمیل</span>
                    <span className={selectedUser.emailVerified ? "font-black text-[var(--pm-primary)] dark:text-[var(--pm-primary)]" : "font-black text-amber-600 dark:text-amber-300"}>
                      {selectedUser.emailVerified ? "تایید شده" : "در انتظار تایید"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--pm-line)] p-3 text-sm dark:border-[var(--pm-line)]">
                    <span className="font-bold text-[var(--pm-muted)]">حضور آنلاین</span>
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-black ${selectedPresence?.className || ""}`}>
                      <span className="material-symbols-outlined text-sm">{selectedPresence?.icon}</span>
                      {selectedPresence?.label || "آفلاین"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-[var(--pm-line)] pt-4 dark:border-[var(--pm-line)]">
                  <button
                    onClick={() => openEmailComposer(selectedUser)}
                    disabled={busyUserId === selectedUser.id || !selectedUser.email}
                    className="pm-button-secondary w-full text-sky-600 dark:text-sky-300"
                  >
                    <span className="material-symbols-outlined text-lg">outgoing_mail</span>
                    ارسال ایمیل به کاربر
                  </button>
                  {!selectedUser.emailVerified && (
                    <button
                      onClick={() => handleVerifyEmail(selectedUser)}
                      disabled={busyUserId === selectedUser.id || !selectedUser.email}
                      className="pm-button-secondary w-full text-[var(--pm-primary)]"
                    >
                      <span className="material-symbols-outlined text-lg">mark_email_read</span>
                      تایید دستی ایمیل کاربر
                    </button>
                  )}
                  <button
                    onClick={() => handleBanToggle(selectedUser)}
                    disabled={busyUserId === selectedUser.id || selectedUser.id === currentUserId}
                    className={selectedUser.isBanned ? "pm-button-secondary w-full text-emerald-600 dark:text-emerald-400" : "pm-button-danger w-full"}
                  >
                    <span className="material-symbols-outlined text-lg">{selectedUser.isBanned ? "lock_open" : "block"}</span>
                    {selectedUser.isBanned ? "رفع مسدودیت" : "مسدودسازی کاربر"}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedUser)}
                    disabled={busyUserId === selectedUser.id || selectedUser.id === currentUserId}
                    className="pm-button-danger w-full"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    حذف کامل کاربر
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="pm-icon size-16">
                <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">manage_search</span>
              </div>
              <div>
                <p className="font-black text-[var(--pm-text)]">کاربری انتخاب نشده</p>
                <p className="mt-1 text-sm leading-6 text-[var(--pm-muted)]">از فهرست سمت راست یک کاربر را انتخاب کنید.</p>
              </div>
            </div>
          )}
        </aside>
      </main>

      {emailComposerUser && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[520] flex items-end justify-center bg-zinc-950/70 p-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] backdrop-blur-sm md:items-center md:pb-4"
          onClick={() => setEmailComposerUser(null)}
        >
          <section
            className="pm-card flex max-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col overflow-hidden md:max-h-[calc(100dvh-2rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">ارسال پیام مدیریتی</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">ایمیل به {emailComposerUser.name || "کاربر"}</h2>
                <p className="mt-2 truncate text-xs font-bold text-[var(--pm-muted)]" dir="ltr">
                  {emailComposerUser.email}
                </p>
              </div>
              <button onClick={() => setEmailComposerUser(null)} className="pm-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="custom-scrollbar flex gap-1 overflow-x-auto rounded-lg border border-[var(--pm-line)] bg-zinc-100 p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                  {[
                    { mode: "write" as EmailComposerMode, label: "نوشتن", icon: "edit_note" },
                    { mode: "preview" as EmailComposerMode, label: "پیش‌نمایش", icon: "preview" },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setEmailComposerMode(item.mode)}
                      className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-black transition-all ${
                        emailComposerMode === item.mode
                          ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                          : "text-[var(--pm-muted)] hover:bg-white dark:text-[var(--pm-muted)] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertEmailSnippet("سلام،\n\n")}
                    className="pm-button-secondary min-h-10 px-3 text-xs"
                  >
                    شروع
                  </button>
                  <button
                    type="button"
                    onClick={() => insertEmailSnippet("با احترام،\nتیم مافیا بورد")}
                    className="pm-button-secondary min-h-10 px-3 text-xs"
                  >
                    امضا
                  </button>
                </div>
              </div>

              {emailComposerMode === "write" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-black text-[var(--pm-muted)]">موضوع ایمیل</span>
                      <input
                        value={emailSubject}
                        onChange={(event) => setEmailSubject(event.target.value.slice(0, 120))}
                        placeholder="مثلاً اطلاع‌رسانی درباره حساب شما"
                      />
                    </label>

                    <div className="custom-scrollbar flex gap-1 overflow-x-auto rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
                      {[
                        { label: "عنوان", icon: "title", value: "# عنوان بخش" },
                        { label: "پررنگ", icon: "format_bold", value: "**متن مهم**" },
                        { label: "لیست", icon: "format_list_bulleted", value: "- مورد اول\n- مورد دوم" },
                        { label: "نکته", icon: "priority_high", value: "> نکته مهم برای کاربر" },
                        { label: "خط", icon: "horizontal_rule", value: "---" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => addEmailFormatBlock(item.value)}
                          className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black text-[var(--pm-muted)] transition-all hover:bg-white hover:text-zinc-950 dark:text-[var(--pm-muted)] dark:hover:bg-white/[0.06] dark:hover:text-white"
                        >
                          <span className="material-symbols-outlined text-base">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <label className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-[var(--pm-muted)]">متن پیام</span>
                        <span className="text-[10px] font-bold text-[var(--pm-muted)]">{emailBody.length}/4000</span>
                      </div>
                      <textarea
                        value={emailBody}
                        onChange={(event) => setEmailBody(event.target.value.slice(0, 4000))}
                        placeholder="پیام مدیریت را اینجا بنویسید. هر پاراگراف را با یک خط خالی جدا کنید تا در ایمیل به شکل کارت‌های خوانا دیده شود."
                        className="min-h-72 resize-none leading-7"
                      />
                    </label>
                  </div>

                  <aside className="space-y-3 rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                    <p className="text-sm font-black text-[var(--pm-text)]">ابزار نگارش</p>
                    {[
                      "وضعیت حساب شما توسط مدیریت بررسی شد.",
                      "برای ادامه، لطفاً وارد حساب کاربری خود شوید و اطلاعات پروفایل را بررسی کنید.",
                      "در صورت نیاز به راهنمایی، از بخش پشتیبانی داخل سایت پیام بدهید.",
                      "# اطلاع‌رسانی حساب\n\nوضعیت حساب شما به‌روزرسانی شد.\n\n- ورود دوباره به سایت\n- بررسی پروفایل\n- تماس با مدیریت در صورت وجود سوال",
                      "> این پیام فقط برای اطلاع‌رسانی است و نیازی به پاسخ مستقیم به ایمیل نیست.",
                    ].map((snippet) => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() => insertEmailSnippet(snippet)}
                        className="w-full rounded-lg border border-[var(--pm-line)] bg-white p-3 text-right text-xs font-bold leading-5 text-[var(--pm-muted)] transition-all hover:border-[var(--pm-primary)]/30 hover:bg-[var(--pm-primary)]/10 dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-300"
                      >
                        {snippet}
                      </button>
                    ))}
                  </aside>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[28px] border border-[var(--pm-line)] bg-[#e8edf0] p-3 shadow-inner dark:border-[var(--pm-line)]">
                  <div className="mx-auto max-w-2xl overflow-hidden rounded-[26px] border border-[var(--pm-line)] bg-white shadow-2xl shadow-zinc-950/10">
                    <div className="pm-contrast-surface bg-[linear-gradient(135deg,#15181b_0%,#2457d6_48%,#65a30d_100%)] p-6 text-white">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-lg bg-[var(--pm-primary)] text-xl font-black text-zinc-950">M</div>
                          <div>
                            <p className="font-black">مافیا بورد</p>
                            <p className="mt-1 text-xs font-bold text-[var(--pm-primary)]">پیام مدیریت</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-[var(--pm-primary)]/25 bg-[var(--pm-primary)]/10 px-3 py-1 text-xs font-black text-[var(--pm-primary)]">پیام رسمی</span>
                      </div>
                      <h3 className="mt-7 text-2xl font-black leading-10">{emailSubject.trim() || "موضوع ایمیل"}</h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-zinc-300">این پیام توسط تیم مدیریت مافیا بورد برای اطلاع‌رسانی مستقیم حساب شما ارسال شده است.</p>
                    </div>

                    <div className="space-y-3 p-5">
                      {(parseEmailPreviewBlocks(emailBody).length ? parseEmailPreviewBlocks(emailBody) : [{ type: "paragraph" as const, lines: ["متن پیام اینجا نمایش داده می‌شود."] }]).map((block, index) => {
                        if (block.type === "heading") {
                          return <h4 key={index} className="text-xl font-black leading-9 text-zinc-950">{renderPreviewText(block.text)}</h4>;
                        }
                        if (block.type === "list") {
                          return (
                            <div key={index} className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                              {block.items.map((item, itemIndex) => (
                                <p key={itemIndex} className="flex items-start gap-2 text-sm font-bold leading-7 text-sky-900">
                                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--pm-primary)]" />
                                  <span>{renderPreviewText(item)}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        if (block.type === "note") {
                          return (
                            <div key={index} className="rounded-lg border border-[var(--pm-primary)]/30 border-r-4 bg-[var(--pm-primary)]/10 p-4 text-sm font-black leading-7 text-[var(--pm-primary)]">
                              {renderPreviewText(block.text)}
                            </div>
                          );
                        }
                        if (block.type === "divider") {
                          return <div key={index} className="h-px bg-zinc-200" />;
                        }
                        return (
                          <div key={index} className="rounded-lg border border-[var(--pm-line)] bg-white p-4 text-sm font-semibold leading-8 text-zinc-700">
                            {block.lines.map((line, lineIndex) => (
                              <span key={`${index}-${lineIndex}`}>
                                {renderPreviewText(line)}
                                {lineIndex < block.lines.length - 1 && <br />}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                      <div className="rounded-lg border border-[var(--pm-primary)]/30 bg-[var(--pm-primary)]/10 p-3 text-xs font-bold leading-6 text-[var(--pm-primary)]">
                        اگر درباره این پیام سوالی دارید، از داخل سایت با مدیریت پیگیری کنید و اطلاعات حساس حساب خود را در پاسخ ایمیل ارسال نکنید.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3 text-xs font-bold leading-6 text-[var(--pm-primary)]">
                ایمیل با قالب رسمی مافیا بورد و راست‌چین ارسال می‌شود. برای قالب‌بندی می‌توانید از عنوان، لیست، متن پررنگ، نکته و خط جداکننده استفاده کنید.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <button onClick={() => setEmailComposerUser(null)} className="pm-button-secondary min-h-11 flex-1 px-4">
                انصراف
              </button>
              <button
                onClick={handleSendEmail}
                disabled={busyUserId === emailComposerUser.id}
                className="pm-button-primary min-h-11 flex-1 px-4"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                ارسال ایمیل
              </button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
