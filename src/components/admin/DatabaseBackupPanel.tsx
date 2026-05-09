"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDatabaseBackup,
  deleteDatabaseBackup,
  listDatabaseBackups,
  restoreDatabaseBackup,
  restoreDatabaseBackupDataOnly,
} from "@/actions/dbBackups";
import { getRoleScenarioBackupOverview } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";

type DatabaseBackupRecord = {
  fileName: string;
  kind: "auto" | "manual" | "pre-restore";
  createdAt: string;
  sizeBytes: number;
};

type BackupDiffItem = {
  name: string;
  changes?: string[];
};

type RoleScenarioBackupOverview = {
  roleBackup: {
    exportedAt: string;
    exportedBy: { id: string; name: string | null; email?: string | null } | null;
    roles: number;
    diff: {
      added: BackupDiffItem[];
      deleted: BackupDiffItem[];
      modified: BackupDiffItem[];
    };
  } | null;
  scenarioBackup: {
    exportedAt: string;
    exportedBy: { id: string; name: string | null; email?: string | null } | null;
    roles: number;
    scenarios: number;
    diff: {
      added: BackupDiffItem[];
      deleted: BackupDiffItem[];
      modified: BackupDiffItem[];
    };
  } | null;
};

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBackupSize(bytes: number) {
  if (bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function backupKindLabel(kind: DatabaseBackupRecord["kind"]) {
  if (kind === "auto") return "خودکار";
  if (kind === "pre-restore") return "قبل از بازیابی";
  return "دستی";
}

function backupKindClass(kind: DatabaseBackupRecord["kind"]) {
  if (kind === "auto") return "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]";
  if (kind === "pre-restore") return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

function backupAuthorLabel(author?: { name: string | null; email?: string | null } | null) {
  return author?.name || author?.email || "ثبت نشده";
}

function diffTone(type: "added" | "deleted" | "modified") {
  if (type === "added") return "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]";
  if (type === "deleted") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

export function DatabaseBackupPanel() {
  const { showAlert, showConfirm, showToast } = usePopup();
  const [databaseBackups, setDatabaseBackups] = useState<DatabaseBackupRecord[]>([]);
  const [databaseBackupsLoading, setDatabaseBackupsLoading] = useState(true);
  const [databaseBackupBusy, setDatabaseBackupBusy] = useState<string | null>(null);
  const [roleScenarioBackupOverview, setRoleScenarioBackupOverview] = useState<RoleScenarioBackupOverview | null>(null);
  const [roleScenarioBackupsLoading, setRoleScenarioBackupsLoading] = useState(true);

  const databaseBackupStats = useMemo(() => {
    const totalSizeBytes = databaseBackups.reduce((sum, backup) => sum + backup.sizeBytes, 0);
    return {
      totalSizeBytes,
      autoCount: databaseBackups.filter((backup) => backup.kind === "auto").length,
      manualCount: databaseBackups.filter((backup) => backup.kind === "manual").length,
      latest: databaseBackups[0],
    };
  }, [databaseBackups]);

  useEffect(() => {
    refreshAllBackups();
  }, []);

  const refreshAllBackups = async () => {
    await Promise.all([refreshDatabaseBackups(), refreshRoleScenarioBackupOverview()]);
  };

  const refreshDatabaseBackups = async () => {
    setDatabaseBackupsLoading(true);
    try {
      const backups = await listDatabaseBackups();
      setDatabaseBackups(backups as DatabaseBackupRecord[]);
    } catch (error: any) {
      showAlert("بکاپ دیتابیس", error.message || "لیست بکاپ‌ها بارگذاری نشد.", "error");
    } finally {
      setDatabaseBackupsLoading(false);
    }
  };

  const refreshRoleScenarioBackupOverview = async () => {
    setRoleScenarioBackupsLoading(true);
    try {
      const overview = await getRoleScenarioBackupOverview();
      setRoleScenarioBackupOverview(overview as RoleScenarioBackupOverview);
    } catch (error: any) {
      showAlert("بکاپ نقش‌ها و سناریوها", error.message || "اطلاعات بکاپ نقش‌ها و سناریوها بارگذاری نشد.", "error");
    } finally {
      setRoleScenarioBackupsLoading(false);
    }
  };

  const handleCreateDatabaseBackup = async () => {
    setDatabaseBackupBusy("create");
    try {
      const result = await createDatabaseBackup();
      showToast(`بکاپ دیتابیس ساخته شد: ${formatBackupSize(result.backup.sizeBytes)}`, "success");
      await refreshDatabaseBackups();
    } catch (error: any) {
      showAlert("بکاپ دیتابیس", error.message || "ساخت بکاپ دیتابیس انجام نشد.", "error");
    } finally {
      setDatabaseBackupBusy(null);
    }
  };

  const handleDeleteDatabaseBackup = (backup: DatabaseBackupRecord) => {
    showConfirm(
      "حذف فایل بکاپ",
      `فایل ${backup.fileName} حذف شود؟ این کار دیتابیس فعلی را تغییر نمی‌دهد، فقط فایل بکاپ حذف می‌شود.`,
      async () => {
        setDatabaseBackupBusy(`delete:${backup.fileName}`);
        try {
          await deleteDatabaseBackup(backup.fileName);
          showToast("فایل بکاپ حذف شد", "success");
          await refreshDatabaseBackups();
        } catch (error: any) {
          showAlert("حذف بکاپ", error.message || "حذف فایل بکاپ انجام نشد.", "error");
        } finally {
          setDatabaseBackupBusy(null);
        }
      },
      "error"
    );
  };

  const handleRestoreDatabaseBackup = (backup: DatabaseBackupRecord) => {
    showConfirm(
      "بازیابی کامل دیتابیس",
      `کل دیتابیس به وضعیت ${formatBackupDate(backup.createdAt)} برمی‌گردد. قبل از بازیابی، فایل بکاپ اعتبارسنجی می‌شود و اگر بکاپ ایمنی ۱۵ دقیقه اخیر وجود داشته باشد همان استفاده می‌شود. ادامه می‌دهید؟`,
      async () => {
        setDatabaseBackupBusy(`full:${backup.fileName}`);
        try {
          const result = await restoreDatabaseBackup(backup.fileName);
          showToast(
            result.safetyBackupReused
              ? `دیتابیس بازیابی شد. از بکاپ ایمنی اخیر استفاده شد: ${result.safetyBackup.fileName}`
              : `دیتابیس بازیابی شد. بکاپ ایمنی: ${result.safetyBackup.fileName}`,
            "success"
          );
          await refreshDatabaseBackups();
          window.location.reload();
        } catch (error: any) {
          showAlert("بازیابی دیتابیس", error.message || "بازیابی دیتابیس انجام نشد.", "error");
        } finally {
          setDatabaseBackupBusy(null);
        }
      },
      "warning"
    );
  };

  const handleRestoreDatabaseBackupDataOnly = (backup: DatabaseBackupRecord) => {
    showConfirm(
      "بازیابی داده با ساختار فعلی",
      `داده‌های ${formatBackupDate(backup.createdAt)} روی جداول فعلی اعمال می‌شود، اما ساختار فعلی دیتابیس و ستون‌های جدید حذف نمی‌شوند. فایل ابتدا اعتبارسنجی می‌شود و بکاپ ایمنی اخیر دوباره استفاده می‌شود تا با هر تلاش فایل تازه ساخته نشود. ادامه می‌دهید؟`,
      async () => {
        setDatabaseBackupBusy(`data:${backup.fileName}`);
        try {
          const result = await restoreDatabaseBackupDataOnly(backup.fileName);
          showToast(
            result.safetyBackupReused
              ? `داده‌ها بازیابی شدند. از بکاپ ایمنی اخیر استفاده شد: ${result.safetyBackup.fileName}`
              : `داده‌ها با ساختار فعلی بازیابی شدند. بکاپ ایمنی: ${result.safetyBackup.fileName}`,
            "success"
          );
          await refreshDatabaseBackups();
          window.location.reload();
        } catch (error: any) {
          showAlert(
            "بازیابی داده",
            error.message || "بازیابی داده با ساختار فعلی انجام نشد. اگر ستون‌های قدیمی حذف شده باشند، از بازیابی کامل یا بکاپ جدیدتر استفاده کنید.",
            "error"
          );
        } finally {
          setDatabaseBackupBusy(null);
        }
      },
      "warning"
    );
  };

  const renderDiffList = (title: string, type: "added" | "deleted" | "modified", items: BackupDiffItem[]) => (
    <div className={`rounded-lg border p-3 ${diffTone(type)}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black">{title}</p>
        <span className="rounded-md bg-white/60 px-2 py-0.5 text-[10px] font-black dark:bg-zinc-950/50">{items.length}</span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {items.length ? (
          items.slice(0, 8).map((item) => (
            <div key={`${type}-${item.name}`} className="rounded-md bg-white/60 px-2 py-1.5 text-[11px] font-bold leading-5 dark:bg-zinc-950/45">
              <span className="block truncate">{item.name}</span>
              {item.changes?.length ? <span className="mt-0.5 block truncate opacity-75">{item.changes.join("، ")}</span> : null}
            </div>
          ))
        ) : (
          <p className="rounded-md bg-white/60 px-2 py-2 text-[11px] font-bold opacity-70 dark:bg-zinc-950/45">موردی ثبت نشده</p>
        )}
        {items.length > 8 && <p className="text-[10px] font-black opacity-70">+{items.length - 8} مورد دیگر</p>}
      </div>
    </div>
  );

  const renderConfigBackupCard = (
    title: string,
    icon: string,
    backup: NonNullable<RoleScenarioBackupOverview["roleBackup"] | RoleScenarioBackupOverview["scenarioBackup"]> | null,
    countLabel: string
  ) => (
    <article className="overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface)]/60">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50 p-4 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="pm-icon">
            <span className="material-symbols-outlined text-lg text-sky-600 dark:text-sky-300">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-black text-[var(--pm-text)]">{title}</p>
            <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">
              {backup ? `${countLabel} | آخرین ذخیره: ${formatBackupDate(backup.exportedAt)}` : "هنوز فایل بکاپی ذخیره نشده است"}
            </p>
          </div>
        </div>
        {roleScenarioBackupsLoading && <span className="material-symbols-outlined animate-spin text-[var(--pm-muted)]">progress_activity</span>}
      </div>

      {backup ? (
        <div className="p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold text-[var(--pm-muted)]">ذخیره‌کننده</p>
              <p className="mt-1 truncate text-sm font-black text-[var(--pm-text)]">{backupAuthorLabel(backup.exportedBy)}</p>
            </div>
            <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold text-[var(--pm-muted)]">زمان ذخیره</p>
              <p className="mt-1 text-sm font-black text-[var(--pm-text)]">{formatBackupDate(backup.exportedAt)}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {renderDiffList("اضافه شده بعد از بکاپ", "added", backup.diff.added)}
            {renderDiffList("حذف شده از دیتابیس", "deleted", backup.diff.deleted)}
            {renderDiffList("تغییر کرده بعد از بکاپ", "modified", backup.diff.modified)}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-lg border border-dashed border-[var(--pm-line)] bg-zinc-50 p-4 text-sm font-bold leading-6 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
            بعد از ذخیره بکاپ نقش‌ها یا سناریوها، زمان، شخص ذخیره‌کننده و تغییرات نسبت به دیتابیس فعلی اینجا دیده می‌شود.
          </div>
        </div>
      )}
    </article>
  );

  return (
    <div className="flex min-h-[80vh] flex-col gap-5" dir="rtl">
      <header className="pm-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="pm-icon-primary size-14">
              <span className="material-symbols-outlined text-3xl">database</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">ابزار مدیر سیستم</p>
              <h1 className="mt-1 text-3xl font-black text-[var(--pm-text)]">بکاپ و بازیابی دیتابیس</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--pm-muted)]">
                بکاپ‌های خودکار، فایل‌های دستی و بازیابی امن داده‌ها را از یک صفحه اختصاصی مدیریت کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refreshAllBackups}
              disabled={databaseBackupsLoading || roleScenarioBackupsLoading || Boolean(databaseBackupBusy)}
              className="pm-button-secondary min-h-10 px-3 text-xs"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              بروزرسانی
            </button>
            <button
              type="button"
              onClick={handleCreateDatabaseBackup}
              disabled={Boolean(databaseBackupBusy)}
              className="pm-button-primary min-h-10 px-3 text-xs"
            >
              <span className={`material-symbols-outlined text-base ${databaseBackupBusy === "create" ? "animate-spin" : ""}`}>
                {databaseBackupBusy === "create" ? "progress_activity" : "backup"}
              </span>
              بکاپ فوری
            </button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface)]/70">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="relative p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-lime-400 via-sky-400 to-amber-400" />
            <div className="flex items-start gap-4">
              <div className="pm-icon-primary size-12">
                <span className="material-symbols-outlined text-2xl">restore_page</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">مرکز بازیابی امن</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">بازگشت بدون از دست دادن ساختار جدید</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pm-muted)]">
                  بکاپ خودکار هر ۲۴ ساعت ساخته می‌شود و تا ۷ روز نگه داشته می‌شود. برای تغییرات اخیر دیتابیس، گزینه بازیابی داده ساختار فعلی را حفظ می‌کند؛ بازگشت کامل فقط برای rollback اضطراری است.
                </p>
              </div>
            </div>
          </div>

          <aside className="border-t border-[var(--pm-line)] bg-[linear-gradient(135deg,#f8fafc,#ffffff_55%,#edf4e6)] p-5 text-zinc-950 dark:border-[var(--pm-line)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.035))] dark:text-white lg:border-r lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--pm-muted)]">آخرین نقطه بازیابی</p>
                <p className="mt-1 text-lg font-black">
                  {databaseBackupStats.latest ? formatBackupDate(databaseBackupStats.latest.createdAt) : "هنوز ساخته نشده"}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-[var(--pm-primary)] text-zinc-950">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[var(--pm-line)] bg-white/78 p-3 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-white/10">
                <p className="text-xl font-black">{databaseBackups.length}</p>
                <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">فایل بکاپ</p>
              </div>
              <div className="rounded-lg border border-[var(--pm-line)] bg-white/78 p-3 shadow-sm shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-white/10">
                <p className="text-xl font-black">{formatBackupSize(databaseBackupStats.totalSizeBytes)}</p>
                <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">حجم کل</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["خودکار", `${databaseBackupStats.autoCount} فایل`, "event_repeat", "text-[var(--pm-primary)]"],
          ["دستی", `${databaseBackupStats.manualCount} فایل`, "touch_app", "text-sky-500"],
          ["نگهداری", "۷ روز آخر", "calendar_clock", "text-amber-500"],
          ["فرمت", "Postgres dump", "inventory_2", "text-[var(--pm-muted)]"],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="rounded-lg border border-[var(--pm-line)] bg-white p-4 dark:border-[var(--pm-line)] dark:bg-zinc-950/60">
            <div className="flex items-center justify-between gap-3">
              <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
              <span className="h-1.5 w-8 rounded-full bg-zinc-200 dark:bg-white/10" />
            </div>
            <p className="mt-3 text-base font-black text-[var(--pm-text)]">{value}</p>
            <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">{label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {renderConfigBackupCard(
          "آخرین بکاپ نقش‌ها",
          "theater_comedy",
          roleScenarioBackupOverview?.roleBackup || null,
          roleScenarioBackupOverview?.roleBackup ? `${roleScenarioBackupOverview.roleBackup.roles} نقش` : ""
        )}
        {renderConfigBackupCard(
          "آخرین بکاپ سناریوها",
          "account_tree",
          roleScenarioBackupOverview?.scenarioBackup || null,
          roleScenarioBackupOverview?.scenarioBackup
            ? `${roleScenarioBackupOverview.scenarioBackup.scenarios} سناریو، ${roleScenarioBackupOverview.scenarioBackup.roles} نقش`
            : ""
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface)]/60">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--pm-line)] bg-zinc-50 px-4 py-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
            <div>
              <p className="text-sm font-black text-[var(--pm-text)]">فایل‌های قابل بازیابی</p>
              <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">
                هر ردیف زمان ساخت، نوع و حجم فایل را نشان می‌دهد.
              </p>
            </div>
            {databaseBackupsLoading && (
              <span className="material-symbols-outlined animate-spin text-[var(--pm-muted)]">progress_activity</span>
            )}
          </div>

          {databaseBackupsLoading && databaseBackups.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-[var(--pm-primary)] text-zinc-950 shadow-lg shadow-[var(--pm-primary)]/20">
                <span className="material-symbols-outlined animate-spin text-3xl leading-none">progress_activity</span>
              </div>
              <p className="mt-4 text-base font-black text-[var(--pm-text)]">در حال خواندن آرشیو بکاپ‌ها</p>
              <p className="mt-2 max-w-md text-xs font-bold leading-6 text-[var(--pm-muted)]">
                فایل‌های روزانه و بازیابی‌های نقش و سناریو در حال مرتب‌سازی هستند.
              </p>
            </div>
          ) : databaseBackups.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="pm-icon size-16">
                <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">database_off</span>
              </div>
              <div>
                <p className="font-black text-[var(--pm-text)]">هنوز بکاپی ساخته نشده است</p>
                <p className="mt-1 text-sm leading-6 text-[var(--pm-muted)]">بکاپ خودکار بعد از اجرای سرویس ساخته می‌شود؛ برای شروع فوری از دکمه بکاپ فوری استفاده کنید.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-white/10">
              {databaseBackups.map((backup) => (
                <article key={backup.fileName} className="grid gap-3 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1fr)_150px_270px] lg:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="pm-icon mt-0.5">
                      <span className="material-symbols-outlined text-lg">folder_data</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${backupKindClass(backup.kind)}`}>
                          {backupKindLabel(backup.kind)}
                        </span>
                        <span className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-zinc-300">
                          {formatBackupSize(backup.sizeBytes)}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-black text-[var(--pm-text)]" dir="ltr">{backup.fileName}</h3>
                      <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">{formatBackupDate(backup.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 text-center dark:border-[var(--pm-line)] dark:bg-white/[0.03] lg:grid-cols-1">
                    <div>
                      <p className="text-base font-black text-[var(--pm-text)]">{formatBackupSize(backup.sizeBytes)}</p>
                      <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">حجم فایل</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-[var(--pm-text)]">{backupKindLabel(backup.kind)}</p>
                      <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">نوع بکاپ</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => handleRestoreDatabaseBackupDataOnly(backup)}
                      disabled={Boolean(databaseBackupBusy)}
                      className="pm-button-primary min-h-10 px-3 text-xs"
                    >
                      <span className={`material-symbols-outlined text-base ${databaseBackupBusy === `data:${backup.fileName}` ? "animate-spin" : ""}`}>
                        {databaseBackupBusy === `data:${backup.fileName}` ? "progress_activity" : "database_upload"}
                      </span>
                      بازیابی داده
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreDatabaseBackup(backup)}
                      disabled={Boolean(databaseBackupBusy)}
                      className="pm-button-secondary min-h-10 px-3 text-xs text-amber-700 dark:text-amber-300"
                    >
                      <span className={`material-symbols-outlined text-base ${databaseBackupBusy === `full:${backup.fileName}` ? "animate-spin" : ""}`}>
                        {databaseBackupBusy === `full:${backup.fileName}` ? "progress_activity" : "settings_backup_restore"}
                      </span>
                      بازگشت کامل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDatabaseBackup(backup)}
                      disabled={Boolean(databaseBackupBusy)}
                      className="pm-button-danger min-h-10 px-3 text-xs"
                    >
                      <span className={`material-symbols-outlined text-base ${databaseBackupBusy === `delete:${backup.fileName}` ? "animate-spin" : ""}`}>
                        {databaseBackupBusy === `delete:${backup.fileName}` ? "progress_activity" : "delete"}
                      </span>
                      حذف فایل
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-[var(--pm-line)] bg-white p-4 dark:border-[var(--pm-line)] dark:bg-zinc-950/60 xl:sticky xl:top-5">
          <div className="flex items-center gap-3">
            <div className="pm-icon">
              <span className="material-symbols-outlined text-lg text-[var(--pm-primary)]">rule_settings</span>
            </div>
            <div>
              <p className="text-sm font-black text-[var(--pm-text)]">نوع بازیابی را درست انتخاب کنید</p>
              <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">فایل قبل از بازیابی اعتبارسنجی می‌شود و بکاپ ایمنی اخیر دوباره استفاده می‌شود.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--pm-primary)] dark:text-[var(--pm-primary)]">database_upload</span>
                <p className="text-xs font-black text-[var(--pm-text)]">بازیابی داده</p>
              </div>
              <p className="mt-2 text-xs leading-6 text-[var(--pm-muted)]">
                برای وقتی که فیلد جدید به دیتابیس اضافه شده است. ساختار فعلی حفظ می‌شود و داده‌های بکاپ روی جدول‌های موجود برمی‌گردد.
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-600 dark:text-amber-300">settings_backup_restore</span>
                <p className="text-xs font-black text-[var(--pm-text)]">بازگشت کامل</p>
              </div>
              <p className="mt-2 text-xs leading-6 text-[var(--pm-muted)]">
                کل دیتابیس، شامل ساختار و داده‌ها، به همان لحظه بکاپ برمی‌گردد. این گزینه برای rollback اضطراری مناسب است.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
