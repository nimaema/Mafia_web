"use client";

import { useMemo, useState } from "react";
import { Alignment } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  createScenario,
  deleteScenario,
  downloadScenarioBackupJson,
  exportScenarioBackup,
  importScenarioBackupJson,
  restoreScenarioBackup,
  updateScenario,
} from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";
import { ScenarioRoleComposition } from "@/components/ScenarioRoleComposition";

type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  alignment: Alignment;
};

type ScenarioRecord = {
  id: string;
  name: string;
  description?: string | null;
  roles: {
    id?: string;
    roleId: string;
    count: number;
    role: RoleRecord;
  }[];
};

function alignmentLabel(alignment: Alignment) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment: Alignment) {
  if (alignment === "CITIZEN") return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (alignment === "MAFIA") return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
}

function alignmentIcon(alignment: Alignment) {
  if (alignment === "CITIZEN") return "verified_user";
  if (alignment === "MAFIA") return "local_police";
  return "casino";
}

function alignmentAccentClass(alignment: Alignment) {
  if (alignment === "CITIZEN") return "from-sky-400 to-blue-500";
  if (alignment === "MAFIA") return "from-red-400 to-rose-600";
  return "from-amber-400 to-orange-500";
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ۀة]/g, "ه")
    .replace(/\u200c/g, " ")
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scenarioTotalPlayers(scenario: ScenarioRecord) {
  return scenario.roles.reduce((sum, role) => sum + role.count, 0);
}

function downloadJsonFile(data: unknown, fileName: string) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function readJsonUpload(file: File) {
  if (!file.name.toLowerCase().endsWith(".json")) {
    throw new Error("فایل باید با فرمت JSON باشد.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("حجم فایل JSON خیلی زیاد است. فایل سناریو باید کمتر از ۲ مگابایت باشد.");
  }
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error("ساختار فایل JSON معتبر نیست.");
  }
}

function backupFileDate() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function scenarioAlignmentCounts(scenario: ScenarioRecord) {
  return scenario.roles.reduce(
    (counts, scenarioRole) => {
      counts[scenarioRole.role.alignment] += scenarioRole.count;
      return counts;
    },
    { CITIZEN: 0, MAFIA: 0, NEUTRAL: 0 } as Record<Alignment, number>
  );
}

function scenarioDominantAlignment(scenario: ScenarioRecord) {
  const counts = scenarioAlignmentCounts(scenario);
  if (counts.MAFIA > counts.CITIZEN && counts.MAFIA >= counts.NEUTRAL) return "MAFIA";
  if (counts.NEUTRAL > counts.CITIZEN && counts.NEUTRAL > counts.MAFIA) return "NEUTRAL";
  return "CITIZEN";
}

export function ScenariosManager({
  initialRoles,
  initialScenarios,
}: {
  initialRoles: RoleRecord[];
  initialScenarios: ScenarioRecord[];
}) {
  const { showAlert, showConfirm, showToast } = usePopup();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>(initialScenarios);
  const [loading, setLoading] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ScenarioRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioRecord | null>(null);
  const [scenarioSearch, setScenarioSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    roles: [] as { roleId: string; count: number }[],
  });

  const stats = useMemo(
    () => ({
      scenarios: scenarios.length,
      roles: initialRoles.length,
      citizenRoles: initialRoles.filter((role) => role.alignment === "CITIZEN").length,
      mafiaRoles: initialRoles.filter((role) => role.alignment === "MAFIA").length,
    }),
    [initialRoles, scenarios]
  );

  const filteredScenarios = useMemo(() => {
    const query = normalizeSearchText(scenarioSearch);
    if (!query) return scenarios;

    return scenarios.filter((scenario) => normalizeSearchText(scenario.name).includes(query));
  }, [scenarioSearch, scenarios]);

  const roleCountMap = useMemo(
    () => new Map(formData.roles.map((role) => [role.roleId, role.count])),
    [formData.roles]
  );

  const filteredRoles = useMemo(() => {
    const query = normalizeSearchText(roleSearch);
    const visibleRoles = query
      ? initialRoles.filter((role) => normalizeSearchText(role.name).includes(query))
      : initialRoles;

    return [...visibleRoles].sort((left, right) => {
      const leftCount = roleCountMap.get(left.id) || 0;
      const rightCount = roleCountMap.get(right.id) || 0;
      if (leftCount !== rightCount) return rightCount - leftCount;
      return left.name.localeCompare(right.name, "fa");
    });
  }, [initialRoles, roleCountMap, roleSearch]);

  const totalPlayers = formData.roles.reduce((sum, role) => sum + role.count, 0);

  const openForm = (scenario?: ScenarioRecord) => {
    if (scenario) {
      setEditingScenario(scenario);
      setFormData({
        name: scenario.name,
        description: scenario.description || "",
        roles: scenario.roles.map((role) => ({ roleId: role.roleId, count: role.count })),
      });
    } else {
      setEditingScenario(null);
      setFormData({ name: "", description: "", roles: [] });
    }

    setRoleSearch("");
    setShowForm(true);
  };

  const openDuplicateForm = (scenario: ScenarioRecord) => {
    setEditingScenario(null);
    setFormData({
      name: `${scenario.name} کپی`,
      description: scenario.description || "",
      roles: scenario.roles.map((role) => ({ roleId: role.roleId, count: role.count })),
    });
    setSelectedScenario(null);
    setRoleSearch("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingScenario(null);
    setRoleSearch("");
  };

  const updateRoleCount = (roleId: string, delta: number) => {
    setFormData((previous) => {
      const existing = previous.roles.find((role) => role.roleId === roleId);
      if (!existing && delta > 0) {
        return { ...previous, roles: [...previous.roles, { roleId, count: 1 }] };
      }
      if (!existing) return previous;

      const nextCount = Math.max(0, existing.count + delta);
      if (nextCount === 0) {
        return { ...previous, roles: previous.roles.filter((role) => role.roleId !== roleId) };
      }

      return {
        ...previous,
        roles: previous.roles.map((role) => (role.roleId === roleId ? { ...role, count: nextCount } : role)),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      showAlert("نام سناریو", "نام سناریو را وارد کنید.", "warning");
      return;
    }
    if (formData.roles.length === 0) {
      showAlert("نقش‌های سناریو", "حداقل یک نقش برای سناریو انتخاب کنید.", "warning");
      return;
    }
    setLoading(true);

    try {
      if (editingScenario) {
        const updated = await updateScenario(editingScenario.id, formData);
        setScenarios((previous) => previous.map((scenario) => (scenario.id === updated.id ? updated : scenario)));
      } else {
        const created = await createScenario(formData);
        setScenarios((previous) => [created, ...previous]);
      }

      showToast(editingScenario ? "سناریو بروزرسانی شد" : "سناریو جدید ساخته شد", "success");
      closeForm();
    } catch (error: any) {
      showAlert("خطا", error.message || "خطا در ذخیره سناریو", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      "حذف سناریو",
      "آیا از حذف این سناریو اطمینان دارید؟",
      async () => {
        try {
          await deleteScenario(id);
          setScenarios((previous) => previous.filter((scenario) => scenario.id !== id));
          setSelectedScenario((current) => (current?.id === id ? null : current));
          showToast("سناریو با موفقیت حذف شد", "success");
        } catch (error: any) {
          showAlert("خطا", error.message || "خطا در حذف سناریو", "error");
        }
      },
      "error"
    );
  };

  const handleBackup = async () => {
    setBackupBusy(true);
    try {
      const result = await exportScenarioBackup();
      showToast(`${result.scenarios} سناریو در فایل سرور ذخیره شد`, "success");
    } catch (error: any) {
      showAlert("بکاپ سناریو", error.message || "بکاپ سناریو انجام نشد.", "error");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleDownload = async () => {
    setBackupBusy(true);
    try {
      const result = await downloadScenarioBackupJson();
      downloadJsonFile(result.backup, `playmafia-scenarios-${backupFileDate()}.json`);
      showToast(`${result.scenarios} سناریو به صورت JSON دانلود شد`, "success");
    } catch (error: any) {
      showAlert("دانلود JSON سناریو", error.message || "دانلود JSON انجام نشد.", "error");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const payload = await readJsonUpload(file);
      showConfirm(
        "به‌روزرسانی سناریوها از JSON",
        "سناریوها و نقش‌های داخل فایل روی دیتابیس اعمال می‌شوند. موارد هم‌نام بروزرسانی می‌شوند و بقیه سناریوهای فعلی حذف نمی‌شوند.",
        async () => {
          setBackupBusy(true);
          try {
            const result = await importScenarioBackupJson(payload);
            showToast(`${result.scenarios} سناریو و ${result.roles} نقش از JSON اعمال شد`, "success");
            window.location.reload();
          } catch (error: any) {
            showAlert("آپلود JSON سناریو", error.message || "آپلود JSON انجام نشد.", "error");
          } finally {
            setBackupBusy(false);
          }
        },
        "warning"
      );
    } catch (error: any) {
      showAlert("فایل JSON", error.message || "فایل JSON قابل خواندن نیست.", "error");
    }
  };

  const handleRestore = () => {
    showConfirm(
      "بازیابی سناریوها",
      "سناریوهای داخل فایل بکاپ روی دیتابیس اعمال می‌شوند. سناریوهای موجود حذف نمی‌شوند، اما موارد هم‌نام بروزرسانی می‌شوند.",
      async () => {
        setBackupBusy(true);
        try {
          const result = await restoreScenarioBackup();
          showToast(`${result.scenarios} سناریو از فایل بکاپ اعمال شد`, "success");
          window.location.reload();
        } catch (error: any) {
          showAlert("بازیابی سناریو", error.message || "بازیابی از فایل انجام نشد.", "error");
        } finally {
          setBackupBusy(false);
        }
      },
      "warning"
    );
  };

  return (
    <div className="space-y-5" dir="rtl">
      <section className="pm-card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">کتابخانه سناریوها</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">ترکیب‌های آماده بازی</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--pm-muted)]">
              سناریوها را به صورت خلاصه ببینید، با جستجو سریع پیدا کنید و جزئیات نقش‌ها را در پنجره جداگانه بررسی کنید.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openForm()} className="pm-button-primary min-h-11 px-5">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              سناریو جدید
            </button>
          </div>
        </div>
      </section>

      {isAdmin && (
      <section className="pm-card overflow-hidden">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]">
              <span className="material-symbols-outlined text-xl">cloud_done</span>
            </div>
            <div>
              <p className="text-sm font-black text-[var(--pm-text)]">پشتیبان کتابخانه سناریو</p>
              <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">
                وضعیت فعلی را روی سرور ذخیره کنید، یا نسخه JSON بگیرید و همان JSON را برای بروزرسانی روی دیتابیس اعمال کنید.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <button onClick={handleBackup} disabled={backupBusy} className="pm-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">backup</span>
              ذخیره بکاپ
            </button>
            <button onClick={handleRestore} disabled={backupBusy} className="pm-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">settings_backup_restore</span>
              بازیابی
            </button>
            <button onClick={handleDownload} disabled={backupBusy} className="pm-button-secondary min-h-10 px-3 text-xs">
              <span className="material-symbols-outlined text-base">download</span>
              JSON
            </button>
            <label className={`pm-button-secondary min-h-10 cursor-pointer px-3 text-xs ${backupBusy ? "pointer-events-none opacity-60" : ""}`}>
              <span className="material-symbols-outlined text-base">upload_file</span>
              آپلود
              <input type="file" accept="application/json,.json" className="hidden" onChange={handleJsonUpload} disabled={backupBusy} />
            </label>
          </div>
        </div>
      </section>
      )}

      <section className="pm-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((value) => !value)}
          className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-right"
        >
          <div>
            <p className="text-sm font-black text-[var(--pm-text)]">نمای کلی سناریوها</p>
            <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">
              {stats.scenarios} سناریو، {stats.roles} نقش قابل استفاده
            </p>
          </div>
          <span className="material-symbols-outlined text-[var(--pm-muted)]">
            {showStats ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
        </button>

        {showStats && (
          <div className="grid gap-3 border-t border-[var(--pm-line)] p-4 dark:border-[var(--pm-line)] md:grid-cols-2 xl:grid-cols-4">
            {[
              ["سناریوها", stats.scenarios, "account_tree", "text-[var(--pm-primary)]"],
              ["نقش‌های قابل استفاده", stats.roles, "theater_comedy", "text-sky-500"],
              ["نقش‌های شهروند", stats.citizenRoles, "verified_user", "text-sky-500"],
              ["نقش‌های مافیا", stats.mafiaRoles, "local_police", "text-red-500"],
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
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
          <span className="material-symbols-outlined text-[var(--pm-muted)]">search</span>
          <input
            value={scenarioSearch}
            onChange={(event) => setScenarioSearch(event.target.value)}
            placeholder="جستجوی نام سناریو"
            className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
          />
        </label>
      </section>

      {filteredScenarios.length === 0 ? (
        <section className="pm-card flex min-h-[380px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="pm-icon size-16">
            <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">account_tree</span>
          </div>
          <div>
            <p className="font-black text-[var(--pm-text)]">سناریویی برای نمایش وجود ندارد</p>
            <p className="mt-1 text-sm text-[var(--pm-muted)]">یک سناریوی جدید بسازید یا عبارت جستجو را تغییر دهید.</p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredScenarios.map((scenario) => {
            const total = scenarioTotalPlayers(scenario);
            const counts = scenarioAlignmentCounts(scenario);
            const dominantAlignment = scenarioDominantAlignment(scenario);
            const composition = [
              { label: "شهروند", value: counts.CITIZEN, alignment: "CITIZEN" as Alignment, barClass: "bg-sky-500" },
              { label: "مافیا", value: counts.MAFIA, alignment: "MAFIA" as Alignment, barClass: "bg-red-500" },
              { label: "مستقل", value: counts.NEUTRAL, alignment: "NEUTRAL" as Alignment, barClass: "bg-amber-500" },
            ];

            return (
              <article
                key={scenario.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedScenario(scenario)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedScenario(scenario);
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/30 hover:shadow-lg hover:shadow-zinc-950/5 focus:outline-none focus:ring-2 focus:ring-[var(--pm-primary)]/30 dark:border-[var(--pm-line)] dark:bg-zinc-950/70 dark:hover:bg-zinc-950 dark:hover:shadow-black/20"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${alignmentAccentClass(dominantAlignment)}`} />
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${alignmentClass(dominantAlignment)}`}>
                      <span className="material-symbols-outlined text-xl">account_tree</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[var(--pm-muted)]">سناریوی {alignmentLabel(dominantAlignment)}</p>
                      <h3 className="mt-1 break-words text-xl font-black leading-8 text-[var(--pm-text)]">{scenario.name}</h3>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <span className="flex min-h-8 items-center rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2 text-[10px] font-black text-[var(--pm-primary)]">
                      {total} نفر
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openForm(scenario);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] transition-all hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)] dark:hover:text-sky-300"
                      title="ویرایش سناریو"
                    >
                      <span className="material-symbols-outlined text-base">edit_square</span>
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openDuplicateForm(scenario);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] transition-all hover:border-[var(--pm-primary)]/30 hover:bg-[var(--pm-primary)]/10 hover:text-cyan-700 dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)] dark:hover:text-[var(--pm-primary)]"
                      title="کپی سناریو"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(scenario.id);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"
                      title="حذف سناریو"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--pm-muted)]">
                  {scenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                </p>

                <div className="mt-4 overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface-soft)]">
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                    <span className="font-black text-[var(--pm-text)]">ترکیب سناریو</span>
                    <span className="font-bold text-[var(--pm-muted)]">{scenario.roles.length} نوع نقش</span>
                  </div>
                  <div className="flex h-2 overflow-hidden bg-zinc-200 dark:bg-white/10">
                    {composition.map((item) => (
                      item.value > 0 && (
                        <span
                          key={item.label}
                          className={item.barClass}
                          style={{ width: `${total > 0 ? Math.max(6, (item.value / total) * 100) : 0}%` }}
                        />
                      )
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-white/10">
                    {composition.map(({ label, value, alignment }) => (
                      <div key={label} className={`border-0 bg-white px-2 py-2 text-center dark:bg-zinc-950/70 ${alignmentClass(alignment)}`}>
                        <p className="text-sm font-black">{value}</p>
                        <p className="mt-0.5 text-[9px] font-bold">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-[var(--pm-line)] pt-3 dark:border-[var(--pm-line)]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[var(--pm-muted)]">برای دیدن نقش‌ها و ظرفیت دقیق وارد جزئیات شوید.</p>
                  </div>
                  <div className="mr-auto flex items-center gap-1 text-[10px] font-black text-[var(--pm-muted)] transition-colors group-hover:text-[var(--pm-primary)] dark:group-hover:text-[var(--pm-primary)]">
                    جزئیات
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {showForm && (
        <div className="pm-modal-layer fixed inset-0 z-[240] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <section className="pm-card pm-safe-modal flex w-full max-w-3xl flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">طراحی سناریو</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">
                  {editingScenario ? "ویرایش سناریو" : "ساخت سناریو جدید"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--pm-muted)]">
                  نقش‌ها را جستجو و تعداد هر کدام را مشخص کنید.
                </p>
              </div>
              <button onClick={closeForm} className="pm-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form id="scenario-form" onSubmit={handleSubmit} noValidate className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[var(--pm-muted)]">نام سناریو</span>
                  <input
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="مثلا کلاسیک ۱۲ نفره"
                  />
                </label>

                <div className="pm-muted-card p-3">
                  <p className="text-xs font-bold text-[var(--pm-muted)]">مجموع بازیکنان</p>
                  <p className="mt-2 text-2xl font-black text-[var(--pm-text)]">{totalPlayers}</p>
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[var(--pm-muted)]">توضیحات</span>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="min-h-[96px] resize-none"
                  placeholder="توضیحات کوتاهی درباره سناریو..."
                />
              </label>

              <div className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 p-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--pm-text)]">نقش‌های سناریو</p>
                  <span className="rounded-lg border border-[var(--pm-line)] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-[var(--pm-muted)]">
                    {formData.roles.length} نقش انتخاب شده
                  </span>
                </div>

                <label className="mb-3 flex min-h-11 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-white px-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                  <span className="material-symbols-outlined text-[var(--pm-muted)]">search</span>
                  <input
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="جستجوی نام نقش"
                    className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                  />
                </label>

                <div className="custom-scrollbar max-h-[390px] overflow-y-auto">
                  {filteredRoles.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center text-sm text-[var(--pm-muted)]">
                      <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">manage_search</span>
                      نقشی با این جستجو پیدا نشد.
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredRoles.map((role) => {
                        const currentCount = formData.roles.find((item) => item.roleId === role.id)?.count || 0;

                        return (
                          <div key={role.id} className="rounded-lg border border-[var(--pm-line)] bg-white p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[var(--pm-text)]">{role.name}</p>
                                <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                                  {alignmentLabel(role.alignment)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[var(--pm-line)] bg-white p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                                <button
                                  type="button"
                                  onClick={() => updateRoleCount(role.id, -1)}
                                  disabled={currentCount === 0}
                                  className="flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-white/10"
                                >
                                  <span className="material-symbols-outlined text-base">remove</span>
                                </button>
                                <span className="w-5 text-center text-sm font-black text-[var(--pm-text)]">{currentCount}</span>
                                <button
                                  type="button"
                                  onClick={() => updateRoleCount(role.id, 1)}
                                  className="flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-white/10"
                                >
                                  <span className="material-symbols-outlined text-base">add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <button type="button" onClick={closeForm} className="pm-button-secondary min-h-11 px-5">
                انصراف
              </button>
              <button
                type="submit"
                form="scenario-form"
                disabled={loading || formData.roles.length === 0}
                className="pm-button-primary min-h-11 px-5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl">{loading ? "progress_activity" : "save"}</span>
                {loading ? "در حال ذخیره..." : "ذخیره سناریو"}
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedScenario && (
        <div
          className="pm-modal-layer fixed inset-0 z-[240] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedScenario(null)}
        >
          <section
            className="pm-card pm-safe-modal motion-pop w-full max-w-3xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--pm-line)] bg-zinc-50/80 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">جزئیات سناریو</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--pm-text)]">{selectedScenario.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--pm-muted)]">
                  {selectedScenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                </p>
              </div>
              <button onClick={() => setSelectedScenario(null)} className="pm-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar max-h-[calc(100dvh-15rem)] overflow-y-auto p-5 sm:max-h-[62vh]">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["کل بازیکن", scenarioTotalPlayers(selectedScenario), "groups", "text-[var(--pm-primary)]"],
                  ["شهروند", scenarioAlignmentCounts(selectedScenario).CITIZEN, "verified_user", "text-sky-500"],
                  ["مافیا", scenarioAlignmentCounts(selectedScenario).MAFIA, "local_police", "text-red-500"],
                  ["مستقل", scenarioAlignmentCounts(selectedScenario).NEUTRAL, "casino", "text-amber-500"],
                ].map(([label, value, icon, color]) => (
                  <div key={label} className="pm-muted-card p-3">
                    <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                    <p className="mt-2 text-lg font-black text-[var(--pm-text)]">{value}</p>
                    <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <ScenarioRoleComposition roles={selectedScenario.roles} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[var(--pm-line)] p-5 dark:border-[var(--pm-line)]">
              <button
                onClick={() => {
                  openForm(selectedScenario);
                  setSelectedScenario(null);
                }}
                className="pm-button-secondary min-h-10 flex-1 px-4"
              >
                <span className="material-symbols-outlined text-lg">edit_square</span>
                ویرایش سناریو
              </button>
              <button
                onClick={() => openDuplicateForm(selectedScenario)}
                className="pm-button-secondary min-h-10 flex-1 px-4"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
                کپی برای نسخه جدید
              </button>
              <button onClick={() => handleDelete(selectedScenario.id)} className="pm-button-danger min-h-10 flex-1 px-4">
                <span className="material-symbols-outlined text-lg">delete</span>
                حذف سناریو
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
