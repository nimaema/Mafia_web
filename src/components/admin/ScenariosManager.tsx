"use client";

import { useMemo, useState } from "react";
import { Alignment } from "@prisma/client";
import { createScenario, deleteScenario, updateScenario } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";

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

function scenarioTotalPlayers(scenario: ScenarioRecord) {
  return scenario.roles.reduce((sum, role) => sum + role.count, 0);
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
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>(initialScenarios);
  const [loading, setLoading] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ScenarioRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioRecord | null>(null);
  const [scenarioSearch, setScenarioSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [showStats, setShowStats] = useState(false);
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
    const query = scenarioSearch.trim().toLowerCase();
    if (!query) return scenarios;

    return scenarios.filter((scenario) =>
      [
        scenario.name,
        scenario.description || "",
        ...scenario.roles.map((scenarioRole) => scenarioRole.role.name),
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [scenarioSearch, scenarios]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return initialRoles;

    return initialRoles.filter((role) =>
      [role.name, role.description || "", alignmentLabel(role.alignment)]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [initialRoles, roleSearch]);

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

  return (
    <div className="space-y-5" dir="rtl">
      <section className="ui-card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="ui-kicker">کتابخانه سناریوها</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">ترکیب‌های آماده بازی</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              سناریوها را به صورت خلاصه ببینید، با جستجو سریع پیدا کنید و جزئیات نقش‌ها را در پنجره جداگانه بررسی کنید.
            </p>
          </div>
          <button onClick={() => openForm()} className="ui-button-primary min-h-11 px-5">
            <span className="material-symbols-outlined text-xl">add_circle</span>
            سناریو جدید
          </button>
        </div>
      </section>

      <section className="ui-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((value) => !value)}
          className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-right"
        >
          <div>
            <p className="text-sm font-black text-zinc-950 dark:text-white">نمای کلی سناریوها</p>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {stats.scenarios} سناریو، {stats.roles} نقش قابل استفاده
            </p>
          </div>
          <span className="material-symbols-outlined text-zinc-400">
            {showStats ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
        </button>

        {showStats && (
          <div className="grid gap-3 border-t border-zinc-200 p-4 dark:border-white/10 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["سناریوها", stats.scenarios, "account_tree", "text-lime-500"],
              ["نقش‌های قابل استفاده", stats.roles, "theater_comedy", "text-sky-500"],
              ["نقش‌های شهروند", stats.citizenRoles, "verified_user", "text-sky-500"],
              ["نقش‌های مافیا", stats.mafiaRoles, "local_police", "text-red-500"],
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
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 dark:border-white/10 dark:bg-zinc-950/40">
          <span className="material-symbols-outlined text-zinc-400">search</span>
          <input
            value={scenarioSearch}
            onChange={(event) => setScenarioSearch(event.target.value)}
            placeholder="جستجوی سناریو یا نقش"
            className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
          />
        </label>
      </section>

      {filteredScenarios.length === 0 ? (
        <section className="ui-card flex min-h-[380px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="ui-icon size-16">
            <span className="material-symbols-outlined text-3xl text-zinc-400">account_tree</span>
          </div>
          <div>
            <p className="font-black text-zinc-950 dark:text-white">سناریویی برای نمایش وجود ندارد</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">یک سناریوی جدید بسازید یا عبارت جستجو را تغییر دهید.</p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredScenarios.map((scenario) => {
            const total = scenarioTotalPlayers(scenario);
            const counts = scenarioAlignmentCounts(scenario);
            const dominantAlignment = scenarioDominantAlignment(scenario);
            const previewRoles = scenario.roles.slice(0, 4);
            const extraRoles = Math.max(0, scenario.roles.length - previewRoles.length);

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
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-lime-500/30 hover:shadow-lg hover:shadow-zinc-950/5 focus:outline-none focus:ring-2 focus:ring-lime-500/30 dark:border-white/10 dark:bg-zinc-950/70 dark:hover:bg-zinc-950 dark:hover:shadow-black/20"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${alignmentAccentClass(dominantAlignment)}`} />
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${alignmentClass(dominantAlignment)}`}>
                      <span className="material-symbols-outlined text-xl">account_tree</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">سناریوی {alignmentLabel(dominantAlignment)}</p>
                      <h3 className="mt-1 line-clamp-2 break-words text-base font-black leading-6 text-zinc-950 dark:text-white">{scenario.name}</h3>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <span className="flex min-h-8 items-center rounded-lg border border-lime-500/20 bg-lime-500/10 px-2 text-[10px] font-black text-lime-700 dark:text-lime-300">
                      {total} نفر
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openForm(scenario);
                      }}
                      className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition-all hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-sky-300"
                      title="ویرایش سناریو"
                    >
                      <span className="material-symbols-outlined text-base">edit_square</span>
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

                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                  {scenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "شهروند", value: counts.CITIZEN, alignment: "CITIZEN" as Alignment },
                    { label: "مافیا", value: counts.MAFIA, alignment: "MAFIA" as Alignment },
                    { label: "مستقل", value: counts.NEUTRAL, alignment: "NEUTRAL" as Alignment },
                  ].map(({ label, value, alignment }) => (
                    <div key={label} className={`rounded-lg border p-2 text-center ${alignmentClass(alignment)}`}>
                      <p className="text-sm font-black">{value}</p>
                      <p className="mt-1 text-[9px] font-bold">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-white/10">
                  {previewRoles.map((scenarioRole) => (
                    <span key={`${scenario.id}-${scenarioRole.roleId}`} className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(scenarioRole.role.alignment)}`}>
                      {scenarioRole.role.name} x{scenarioRole.count}
                    </span>
                  ))}
                  {extraRoles > 0 && (
                    <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                      +{extraRoles} نقش دیگر
                    </span>
                  )}
                  <div className="mr-auto flex items-center gap-1 text-[10px] font-black text-zinc-400 transition-colors group-hover:text-lime-600 dark:group-hover:text-lime-300">
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-28 backdrop-blur-sm sm:items-center sm:pb-4">
          <section className="ui-card flex max-h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col overflow-hidden sm:max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <p className="ui-kicker">طراحی سناریو</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                  {editingScenario ? "ویرایش سناریو" : "ساخت سناریو جدید"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  نقش‌ها را جستجو و تعداد هر کدام را مشخص کنید.
                </p>
              </div>
              <button onClick={closeForm} className="ui-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form id="scenario-form" onSubmit={handleSubmit} noValidate className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">نام سناریو</span>
                  <input
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="مثلا کلاسیک ۱۲ نفره"
                  />
                </label>

                <div className="ui-muted p-3">
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">مجموع بازیکنان</p>
                  <p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{totalPlayers}</p>
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">توضیحات</span>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="min-h-[96px] resize-none"
                  placeholder="توضیحات کوتاهی درباره سناریو..."
                />
              </label>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-zinc-950 dark:text-white">نقش‌های سناریو</p>
                  <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                    {formData.roles.length} نقش انتخاب شده
                  </span>
                </div>

                <label className="mb-3 flex min-h-11 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="material-symbols-outlined text-zinc-400">search</span>
                  <input
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    placeholder="جستجوی نقش"
                    className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                  />
                </label>

                <div className="custom-scrollbar max-h-[390px] overflow-y-auto">
                  {filteredRoles.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      <span className="material-symbols-outlined text-3xl text-zinc-400">manage_search</span>
                      نقشی با این جستجو پیدا نشد.
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredRoles.map((role) => {
                        const currentCount = formData.roles.find((item) => item.roleId === role.id)?.count || 0;

                        return (
                          <div key={role.id} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{role.name}</p>
                                <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                                  {alignmentLabel(role.alignment)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-950">
                                <button
                                  type="button"
                                  onClick={() => updateRoleCount(role.id, -1)}
                                  disabled={currentCount === 0}
                                  className="flex size-7 items-center justify-center rounded-md hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-white/10"
                                >
                                  <span className="material-symbols-outlined text-base">remove</span>
                                </button>
                                <span className="w-5 text-center text-sm font-black text-zinc-950 dark:text-white">{currentCount}</span>
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

            <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <button type="button" onClick={closeForm} className="ui-button-secondary min-h-11 px-5">
                انصراف
              </button>
              <button
                type="submit"
                form="scenario-form"
                disabled={loading || formData.roles.length === 0}
                className="ui-button-primary min-h-11 px-5 disabled:opacity-50"
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
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-28 backdrop-blur-sm sm:items-center sm:pb-4"
          onClick={() => setSelectedScenario(null)}
        >
          <section
            className="ui-card max-h-[calc(100dvh-8rem)] w-full max-w-3xl overflow-hidden sm:max-h-[88vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="min-w-0">
                <p className="ui-kicker">جزئیات سناریو</p>
                <h2 className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{selectedScenario.name}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {selectedScenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                </p>
              </div>
              <button onClick={() => setSelectedScenario(null)} className="ui-button-secondary size-10 p-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="custom-scrollbar max-h-[62vh] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["کل بازیکن", scenarioTotalPlayers(selectedScenario), "groups", "text-lime-500"],
                  ["شهروند", scenarioAlignmentCounts(selectedScenario).CITIZEN, "verified_user", "text-sky-500"],
                  ["مافیا", scenarioAlignmentCounts(selectedScenario).MAFIA, "local_police", "text-red-500"],
                  ["مستقل", scenarioAlignmentCounts(selectedScenario).NEUTRAL, "casino", "text-amber-500"],
                ].map(([label, value, icon, color]) => (
                  <div key={label} className="ui-muted p-3">
                    <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                    <p className="mt-2 text-lg font-black text-zinc-950 dark:text-white">{value}</p>
                    <p className="mt-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selectedScenario.roles.map((scenarioRole) => (
                  <div key={`${selectedScenario.id}-${scenarioRole.roleId}`} className="ui-muted flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-zinc-950 dark:text-white">{scenarioRole.role.name}</p>
                      <p className={`mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-black ${alignmentClass(scenarioRole.role.alignment)}`}>
                        {alignmentLabel(scenarioRole.role.alignment)}
                      </p>
                    </div>
                    <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(scenarioRole.role.alignment)}`}>
                      x{scenarioRole.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-zinc-200 p-5 dark:border-white/10">
              <button
                onClick={() => {
                  openForm(selectedScenario);
                  setSelectedScenario(null);
                }}
                className="ui-button-secondary min-h-10 flex-1 px-4"
              >
                <span className="material-symbols-outlined text-lg">edit_square</span>
                ویرایش سناریو
              </button>
              <button onClick={() => handleDelete(selectedScenario.id)} className="ui-button-danger min-h-10 flex-1 px-4">
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
