"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createMafiaRole,
  updateMafiaRole,
  deleteMafiaRole,
  createScenario,
  updateScenario,
  deleteScenario,
  installStandardScenarios,
  getMafiaRolesSafe,
  getScenariosSafe,
} from "@/actions/admin";
import { Alignment } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";

type AdminTab = "roles" | "scenarios";

type MafiaRoleRecord = {
  id: string;
  name: string;
  description: string | null;
  alignment: Alignment;
  is_permanent: boolean;
};

type ScenarioRecord = {
  id: string;
  name: string;
  description: string | null;
  roles: {
    roleId: string;
    count: number;
    role: MafiaRoleRecord;
  }[];
};

function alignmentLabel(alignment: Alignment) {
  if (alignment === "CITIZEN") return "شهروند";
  if (alignment === "MAFIA") return "مافیا";
  return "مستقل";
}

function alignmentClass(alignment: Alignment) {
  if (alignment === "CITIZEN") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  }
  if (alignment === "MAFIA") {
    return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300";
  }
  return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const isAdmin = session?.user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<AdminTab>("roles");
  const [roles, setRoles] = useState<MafiaRoleRecord[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleAlign, setNewRoleAlign] = useState<Alignment>("CITIZEN");

  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [newScenName, setNewScenName] = useState("");
  const [newScenDesc, setNewScenDesc] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<{ roleId: string; count: number }[]>([]);

  useEffect(() => {
    if (status === "loading") return;

    const tab = searchParams.get("tab");
    if (tab === "users" && isAdmin) {
      router.replace("/dashboard/admin/users");
      return;
    }

    const nextTab: AdminTab = tab === "scenarios" ? "scenarios" : "roles";
    setActiveTab((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
  }, [searchParams, isAdmin, router, status]);

  useEffect(() => {
    if (status === "loading") return;
    refreshData();
  }, [activeTab, status]);

  const refreshData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [rolesResult, scenariosResult] = await Promise.all([
        getMafiaRolesSafe(),
        getScenariosSafe(),
      ]);

      setRoles(rolesResult.data as MafiaRoleRecord[]);
      setScenarios(scenariosResult.data as ScenarioRecord[]);

      if (!rolesResult.success || !scenariosResult.success) {
        const fallback =
          activeTab === "scenarios"
            ? "اطلاعات سناریوها یا نقش‌ها بارگذاری نشد."
            : "اطلاعات نقش‌ها بارگذاری نشد.";
        setErrorMessage(rolesResult.error || scenariosResult.error || fallback);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("اطلاعات این بخش بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی کاربر را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    router.replace(`/dashboard/admin?tab=${tab}`, { scroll: false });
  };

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setNewRoleName("");
    setNewRoleDesc("");
    setNewRoleAlign("CITIZEN");
  };

  const resetScenarioForm = () => {
    setEditingScenarioId(null);
    setNewScenName("");
    setNewScenDesc("");
    setSelectedRoles([]);
  };

  const handleAddRole = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (editingRoleId) {
        await updateMafiaRole(editingRoleId, {
          name: newRoleName,
          description: newRoleDesc,
          alignment: newRoleAlign,
        });
        showToast("نقش بروزرسانی شد", "success");
      } else {
        await createMafiaRole({
          name: newRoleName,
          description: newRoleDesc,
          alignment: newRoleAlign,
        });
        showToast("نقش جدید ثبت شد", "success");
      }

      resetRoleForm();
      await refreshData();
    } catch (error) {
      console.error(error);
      showAlert("خطا", "ثبت نقش ناموفق بود", "error");
    }
  };

  const handleEditRole = (role: MafiaRoleRecord) => {
    setEditingRoleId(role.id);
    setNewRoleName(role.name);
    setNewRoleDesc(role.description || "");
    setNewRoleAlign(role.alignment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRole = async (roleId: string) => {
    showConfirm(
      "حذف نقش",
      "آیا از حذف این نقش اطمینان دارید؟",
      async () => {
        try {
          await deleteMafiaRole(roleId);
          showToast("نقش حذف شد", "success");
          await refreshData();
        } catch (error: any) {
          showAlert("خطا", error.message || "حذف نقش ناموفق بود", "error");
        }
      },
      "error"
    );
  };

  const handleAddScenario = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedRoles.length === 0) {
      showAlert("هشدار", "حداقل یک نقش برای سناریو انتخاب کنید", "warning");
      return;
    }

    try {
      if (editingScenarioId) {
        await updateScenario(editingScenarioId, {
          name: newScenName,
          description: newScenDesc,
          roles: selectedRoles,
        });
        showToast("سناریو بروزرسانی شد", "success");
      } else {
        await createScenario({
          name: newScenName,
          description: newScenDesc,
          roles: selectedRoles,
        });
        showToast("سناریو جدید ثبت شد", "success");
      }

      resetScenarioForm();
      await refreshData();
    } catch (error) {
      console.error(error);
      showAlert("خطا", "ثبت سناریو ناموفق بود", "error");
    }
  };

  const handleEditScenario = (scenario: ScenarioRecord) => {
    setEditingScenarioId(scenario.id);
    setNewScenName(scenario.name);
    setNewScenDesc(scenario.description || "");
    setSelectedRoles(
      scenario.roles.map((role) => ({
        roleId: role.roleId,
        count: role.count,
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    showConfirm(
      "حذف سناریو",
      "آیا از حذف این سناریو اطمینان دارید؟",
      async () => {
        try {
          await deleteScenario(scenarioId);
          showToast("سناریو حذف شد", "success");
          await refreshData();
        } catch (error) {
          console.error(error);
          showAlert("خطا", "حذف سناریو ناموفق بود", "error");
        }
      },
      "error"
    );
  };

  const toggleRoleInScenario = (roleId: string) => {
    setSelectedRoles((previous) => {
      const exists = previous.find((role) => role.roleId === roleId);
      if (exists) {
        return previous.filter((role) => role.roleId !== roleId);
      }
      return [...previous, { roleId, count: 1 }];
    });
  };

  const updateRoleCount = (roleId: string, delta: number) => {
    setSelectedRoles((previous) =>
      previous.map((role) =>
        role.roleId === roleId
          ? { ...role, count: Math.max(1, role.count + delta) }
          : role
      )
    );
  };

  const stats = useMemo(
    () => ({
      roles: roles.length,
      permanentRoles: roles.filter((role) => role.is_permanent).length,
      scenarios: scenarios.length,
      totalSeats: scenarios.reduce(
        (sum, scenario) =>
          sum + scenario.roles.reduce((scenarioSum, role) => scenarioSum + role.count, 0),
        0
      ),
    }),
    [roles, scenarios]
  );

  return (
    <div className="flex min-h-[80vh] flex-col gap-5" dir="rtl">
      <header className="ui-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="ui-icon-accent size-14">
              <span className="material-symbols-outlined text-3xl">theater_comedy</span>
            </div>
            <div>
              <p className="ui-kicker">طراحی و پیکربندی بازی</p>
              <h1 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">سناریوها و نقش‌ها</h1>
              <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                نقش‌های قابل استفاده، سناریوهای آماده و ترکیب نفرات هر بازی را از این بخش مدیریت کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            {isAdmin && (
              <Link href="/dashboard/admin/users" className="ui-button-secondary min-h-11 px-4">
                <span className="material-symbols-outlined text-xl">manage_accounts</span>
                مدیریت کاربران
              </Link>
            )}

            <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-white/10 dark:bg-zinc-950">
              <button
                onClick={() => switchTab("roles")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${
                  activeTab === "roles"
                    ? "bg-lime-500 text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:bg-white dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="material-symbols-outlined text-lg">theater_comedy</span>
                نقش‌ها
              </button>
              <button
                onClick={() => switchTab("scenarios")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${
                  activeTab === "scenarios"
                    ? "bg-lime-500 text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:bg-white dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="material-symbols-outlined text-lg">account_tree</span>
                سناریوها
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["نقش‌های ثبت‌شده", stats.roles, "theater_comedy", "text-lime-500"],
          ["نقش‌های سیستمی", stats.permanentRoles, "verified", "text-sky-500"],
          ["سناریوهای آماده", stats.scenarios, "account_tree", "text-violet-500"],
          ["جمع ظرفیت سناریوها", stats.totalSeats, "groups", "text-amber-500"],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="ui-card p-4">
            <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
            <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
          </div>
        ))}
      </section>

      <main className="ui-card relative min-h-[520px] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90">
            <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-lime-500 dark:border-zinc-800"></div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">در حال بارگذاری اطلاعات...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="ui-icon size-16 text-red-500">
              <span className="material-symbols-outlined text-3xl">cloud_off</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950 dark:text-white">بارگذاری اطلاعات ناموفق بود</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
            </div>
            <button onClick={refreshData} className="ui-button-primary">
              <span className="material-symbols-outlined text-xl">refresh</span>
              تلاش دوباره
            </button>
          </div>
        ) : activeTab === "roles" ? (
          <div className="grid min-h-[520px] gap-0 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="border-b border-zinc-200 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03] xl:border-b-0 xl:border-l">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-zinc-950 dark:text-white">
                    {editingRoleId ? "ویرایش نقش" : "نقش جدید"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    نام، جبهه و توضیح توانایی هر نقش را تعریف کنید.
                  </p>
                </div>
                {editingRoleId && (
                  <button onClick={resetRoleForm} className="ui-button-secondary min-h-9 px-3 text-xs">
                    لغو
                  </button>
                )}
              </div>

              <form onSubmit={handleAddRole} className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">نام نقش</label>
                  <input
                    value={newRoleName}
                    onChange={(event) => setNewRoleName(event.target.value)}
                    required
                    placeholder="مثلا تفنگدار"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">جبهه</label>
                  <select value={newRoleAlign} onChange={(event) => setNewRoleAlign(event.target.value as Alignment)}>
                    <option value="CITIZEN">شهروند</option>
                    <option value="MAFIA">مافیا</option>
                    <option value="NEUTRAL">مستقل</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">توضیح توانایی</label>
                  <textarea
                    value={newRoleDesc}
                    onChange={(event) => setNewRoleDesc(event.target.value)}
                    placeholder="رفتار یا توانایی ویژه نقش را شرح دهید."
                    className="min-h-28 resize-none"
                  />
                </div>

                <button type="submit" className="ui-button-primary min-h-11">
                  <span className="material-symbols-outlined text-xl">
                    {editingRoleId ? "save" : "add_circle"}
                  </span>
                  {editingRoleId ? "ذخیره تغییرات" : "ثبت نقش"}
                </button>
              </form>
            </section>

            <section className="p-5">
              {roles.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
                  <div className="ui-icon size-16">
                    <span className="material-symbols-outlined text-3xl text-zinc-400">theater_comedy</span>
                  </div>
                  <div>
                    <p className="font-black text-zinc-950 dark:text-white">هنوز نقشی ثبت نشده است</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">برای ساخت سناریو، ابتدا چند نقش به سیستم اضافه کنید.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {roles.map((role) => (
                    <article
                      key={role.id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-zinc-950 dark:text-white">{role.name}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(role.alignment)}`}>
                              {alignmentLabel(role.alignment)}
                            </span>
                            <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
                              {role.is_permanent ? "سیستمی" : "سفارشی"}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => handleEditRole(role)} className="ui-button-secondary min-h-9 px-3 text-xs">
                          ویرایش
                        </button>
                      </div>

                      <p className="mt-4 min-h-20 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {role.description || "برای این نقش هنوز توضیحی ثبت نشده است."}
                      </p>

                      <div className="mt-4 flex gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
                        <button onClick={() => handleEditRole(role)} className="ui-button-secondary min-h-9 flex-1 px-3 text-xs">
                          <span className="material-symbols-outlined text-base">edit_square</span>
                          ویرایش
                        </button>
                        {!role.is_permanent && (
                          <button onClick={() => handleDeleteRole(role.id)} className="ui-button-danger min-h-9 flex-1 px-3 text-xs">
                            <span className="material-symbols-outlined text-base">delete</span>
                            حذف
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="grid min-h-[520px] gap-0 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="border-b border-zinc-200 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03] xl:border-b-0 xl:border-l">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-zinc-950 dark:text-white">
                    {editingScenarioId ? "ویرایش سناریو" : "طراحی سناریو"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    نقش‌ها را کنار هم بچینید و ظرفیت دقیق بازی را مشخص کنید.
                  </p>
                </div>

                {editingScenarioId ? (
                  <button onClick={resetScenarioForm} className="ui-button-secondary min-h-9 px-3 text-xs">
                    لغو
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const result = await installStandardScenarios();
                      if (result?.success) {
                        showToast("سناریوهای پیش‌فرض نصب شدند", "success");
                        await refreshData();
                      }
                    }}
                    className="ui-button-secondary min-h-9 px-3 text-xs"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    نصب پیش‌فرض‌ها
                  </button>
                )}
              </div>

              <form onSubmit={handleAddScenario} className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">نام سناریو</label>
                  <input
                    value={newScenName}
                    onChange={(event) => setNewScenName(event.target.value)}
                    required
                    placeholder="مثلا تکاور ۱۵ نفره"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">توضیح کوتاه</label>
                  <textarea
                    value={newScenDesc}
                    onChange={(event) => setNewScenDesc(event.target.value)}
                    placeholder="هدف این سناریو یا نکته مهم اجرایی را بنویسید."
                    className="min-h-20 resize-none"
                  />
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/40">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">انتخاب نقش‌ها</label>
                    <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
                      مجموع: {selectedRoles.reduce((sum, role) => sum + role.count, 0)} نفر
                    </span>
                  </div>

                  <div className="custom-scrollbar max-h-80 space-y-2 overflow-y-auto">
                    {roles.length === 0 ? (
                      <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="material-symbols-outlined text-3xl text-zinc-400">playlist_add</span>
                        برای طراحی سناریو ابتدا نقش‌ها را اضافه کنید.
                      </div>
                    ) : (
                      roles.map((role) => {
                        const selected = selectedRoles.find((item) => item.roleId === role.id);

                        return (
                          <div
                            key={role.id}
                            className={`rounded-lg border p-3 transition-colors ${
                              selected
                                ? "border-lime-500/30 bg-lime-500/10"
                                : "border-zinc-200 bg-zinc-50 hover:bg-white dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => toggleRoleInScenario(role.id)}
                                className="flex flex-1 items-center gap-3 text-right"
                              >
                                <div className={`flex size-5 items-center justify-center rounded border ${selected ? "border-lime-500 bg-lime-500 text-zinc-950" : "border-zinc-300 dark:border-zinc-700"}`}>
                                  {selected && <span className="material-symbols-outlined text-sm">check</span>}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-zinc-950 dark:text-white">{role.name}</p>
                                  <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">{alignmentLabel(role.alignment)}</p>
                                </div>
                              </button>

                              {selected && (
                                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-zinc-950">
                                  <button type="button" onClick={() => updateRoleCount(role.id, -1)} className="text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white">
                                    <span className="material-symbols-outlined text-base">remove</span>
                                  </button>
                                  <span className="w-4 text-center text-sm font-black text-zinc-950 dark:text-white">{selected.count}</span>
                                  <button type="button" onClick={() => updateRoleCount(role.id, 1)} className="text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white">
                                    <span className="material-symbols-outlined text-base">add</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button type="submit" className="ui-button-primary min-h-11">
                  <span className="material-symbols-outlined text-xl">
                    {editingScenarioId ? "save" : "library_add"}
                  </span>
                  {editingScenarioId ? "ذخیره سناریو" : "ثبت سناریو"}
                </button>
              </form>
            </section>

            <section className="p-5">
              {scenarios.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
                  <div className="ui-icon size-16">
                    <span className="material-symbols-outlined text-3xl text-zinc-400">account_tree</span>
                  </div>
                  <div>
                    <p className="font-black text-zinc-950 dark:text-white">سناریویی برای نمایش وجود ندارد</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">سناریوهای پیش‌فرض را نصب کنید یا یکی را از ابتدا طراحی کنید.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 2xl:grid-cols-2">
                  {scenarios.map((scenario) => {
                    const totalPlayers = scenario.roles.reduce((sum, role) => sum + role.count, 0);

                    return (
                      <article
                        key={scenario.id}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-zinc-950 dark:text-white">{scenario.name}</h3>
                            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                              {scenario.description || "توضیحی برای این سناریو ثبت نشده است."}
                            </p>
                          </div>
                          <span className="rounded-lg bg-lime-500 px-3 py-1 text-xs font-black text-zinc-950">
                            {totalPlayers} نفر
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {scenario.roles.map((role) => (
                            <div key={`${scenario.id}-${role.roleId}`} className="ui-muted flex items-center justify-between p-3">
                              <div>
                                <p className="text-sm font-black text-zinc-950 dark:text-white">{role.role.name}</p>
                                <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {alignmentLabel(role.role.alignment)}
                                </p>
                              </div>
                              <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${alignmentClass(role.role.alignment)}`}>
                                x{role.count}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-2 border-t border-zinc-200 pt-4 dark:border-white/10">
                          <button onClick={() => handleEditScenario(scenario)} className="ui-button-secondary min-h-9 flex-1 px-3 text-xs">
                            <span className="material-symbols-outlined text-base">edit_square</span>
                            ویرایش
                          </button>
                          <button onClick={() => handleDeleteScenario(scenario.id)} className="ui-button-danger min-h-9 flex-1 px-3 text-xs">
                            <span className="material-symbols-outlined text-base">delete</span>
                            حذف
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
