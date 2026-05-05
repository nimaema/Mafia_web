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
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

type DatabaseBackupRecord = {
  fileName: string;
  kind: "auto" | "manual" | "pre-restore";
  createdAt: string;
  sizeBytes: number;
};

type BackupDiffItem = { name: string; changes?: string[] };
type RoleScenarioBackupOverview = {
  roleBackup: {
    exportedAt: string;
    exportedBy: { name: string | null; email?: string | null } | null;
    roles: number;
    diff: { added: BackupDiffItem[]; deleted: BackupDiffItem[]; modified: BackupDiffItem[] };
  } | null;
  scenarioBackup: {
    exportedAt: string;
    exportedBy: { name: string | null; email?: string | null } | null;
    roles: number;
    scenarios: number;
    diff: { added: BackupDiffItem[]; deleted: BackupDiffItem[]; modified: BackupDiffItem[] };
  } | null;
};

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatBackupSize(bytes: number) {
  if (bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function kindLabel(kind: DatabaseBackupRecord["kind"]) {
  if (kind === "auto") return "خودکار";
  if (kind === "pre-restore") return "قبل از بازیابی";
  return "دستی";
}

function diffCount(items?: { added: BackupDiffItem[]; deleted: BackupDiffItem[]; modified: BackupDiffItem[] }) {
  if (!items) return 0;
  return items.added.length + items.deleted.length + items.modified.length;
}

export function DatabaseBackupPanel() {
  const { showAlert, showConfirm, showToast } = usePopup();
  const [backups, setBackups] = useState<DatabaseBackupRecord[]>([]);
  const [overview, setOverview] = useState<RoleScenarioBackupOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalSize = backups.reduce((sum, backup) => sum + backup.sizeBytes, 0);
    return {
      totalSize,
      autoCount: backups.filter((backup) => backup.kind === "auto").length,
      latest: backups[0],
    };
  }, [backups]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [dbBackups, roleScenarioOverview] = await Promise.all([
        listDatabaseBackups(),
        getRoleScenarioBackupOverview(),
      ]);
      setBackups(dbBackups as DatabaseBackupRecord[]);
      setOverview(roleScenarioOverview as RoleScenarioBackupOverview);
    } catch (error: any) {
      showAlert("بکاپ", error.message || "اطلاعات بکاپ بارگذاری نشد.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const createBackup = async () => {
    setBusy("create");
    try {
      const result = await createDatabaseBackup();
      showToast(`بکاپ ساخته شد: ${formatBackupSize(result.backup.sizeBytes)}`, "success");
      await refresh();
    } catch (error: any) {
      showAlert("بکاپ دیتابیس", error.message || "ساخت بکاپ انجام نشد.", "error");
    } finally {
      setBusy(null);
    }
  };

  const runRestore = (backup: DatabaseBackupRecord, mode: "full" | "data") => {
    showConfirm(
      mode === "full" ? "بازیابی کامل دیتابیس" : "بازیابی داده با ساختار فعلی",
      mode === "full"
        ? "کل دیتابیس به این بکاپ برمی‌گردد و قبل از آن بکاپ ایمنی ساخته می‌شود."
        : "داده‌ها روی ساختار فعلی اعمال می‌شوند تا ستون‌های جدید حذف نشوند.",
      async () => {
        setBusy(`${mode}:${backup.fileName}`);
        try {
          await (mode === "full" ? restoreDatabaseBackup(backup.fileName) : restoreDatabaseBackupDataOnly(backup.fileName));
          showToast("بازیابی انجام شد", "success");
          window.location.reload();
        } catch (error: any) {
          showAlert("بازیابی", error.message || "بازیابی انجام نشد.", "error");
        } finally {
          setBusy(null);
        }
      },
      "warning"
    );
  };

  const removeBackup = (backup: DatabaseBackupRecord) => {
    showConfirm("حذف بکاپ", `فایل ${backup.fileName} حذف شود؟`, async () => {
      setBusy(`delete:${backup.fileName}`);
      try {
        await deleteDatabaseBackup(backup.fileName);
        showToast("فایل بکاپ حذف شد", "success");
        await refresh();
      } catch (error: any) {
        showAlert("حذف بکاپ", error.message || "حذف انجام نشد.", "error");
      } finally {
        setBusy(null);
      }
    }, "error");
  };

  if (loading) return <EmptyState icon="progress_activity" title="در حال خواندن بکاپ‌ها..." />;

  return (
    <div className="space-y-5">
      <CommandSurface className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <StatusChip tone="violet">Admin Backup Vault</StatusChip>
            <h1 className="mt-3 text-3xl font-black text-zinc-50">مرکز پشتیبان‌گیری</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">بکاپ دیتابیس، بازیابی امن، و وضعیت آخرین بکاپ نقش‌ها و سناریوها.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="فایل" value={backups.length} tone="cyan" />
            <StatCell label="خودکار" value={stats.autoCount} tone="emerald" />
            <StatCell label="حجم" value={formatBackupSize(stats.totalSize)} tone="violet" />
          </div>
        </div>
        <CommandButton onClick={createBackup} disabled={busy === "create"} className="mt-5 w-full md:w-auto">
          <span className="material-symbols-outlined text-[18px]">backup</span>
          ساخت بکاپ دستی
        </CommandButton>
      </CommandSurface>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ["نقش‌ها", overview?.roleBackup, overview?.roleBackup?.roles || 0],
          ["سناریوها", overview?.scenarioBackup, overview?.scenarioBackup?.scenarios || 0],
        ].map(([label, item, count]: any) => (
          <CommandSurface key={label} className="p-4">
            <SectionHeader title={`آخرین بکاپ ${label}`} eyebrow="Role / Scenario File" icon="inventory_2" />
            {item ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatCell label="تعداد" value={count} tone="cyan" />
                  <StatCell label="تغییرات" value={diffCount(item.diff)} tone={diffCount(item.diff) ? "amber" : "emerald"} />
                </div>
                <p className="text-sm leading-6 text-zinc-400">زمان: {formatBackupDate(item.exportedAt)}</p>
                <p className="text-sm leading-6 text-zinc-400">ثبت‌کننده: {item.exportedBy?.name || item.exportedBy?.email || "ثبت نشده"}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">هنوز بکاپی ثبت نشده است.</p>
            )}
          </CommandSurface>
        ))}
      </div>

      <section className="space-y-3">
        <SectionHeader title="فایل‌های دیتابیس" eyebrow="Database Snapshots" icon="storage" />
        {backups.length === 0 ? (
          <EmptyState icon="inventory_2" title="بکاپی موجود نیست" />
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <CommandSurface key={backup.fileName} interactive className="p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={backup.kind === "auto" ? "emerald" : backup.kind === "pre-restore" ? "amber" : "cyan"}>{kindLabel(backup.kind)}</StatusChip>
                      <StatusChip tone="neutral">{formatBackupSize(backup.sizeBytes)}</StatusChip>
                    </div>
                    <p className="mt-2 truncate font-mono text-sm font-black text-zinc-100" dir="ltr">{backup.fileName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{formatBackupDate(backup.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CommandButton tone="ghost" onClick={() => runRestore(backup, "data")} disabled={Boolean(busy)}>بازیابی داده</CommandButton>
                    <CommandButton tone="amber" onClick={() => runRestore(backup, "full")} disabled={Boolean(busy)}>بازیابی کامل</CommandButton>
                    <CommandButton tone="rose" onClick={() => removeBackup(backup)} disabled={Boolean(busy)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </CommandButton>
                  </div>
                </div>
              </CommandSurface>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
