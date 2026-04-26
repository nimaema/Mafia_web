"use client";

import { useState, useEffect } from "react";
import { 
  updateUserRole, 
  createMafiaRole, updateMafiaRole, deleteMafiaRole,
  createScenario, updateScenario, deleteScenario,
  installStandardScenarios, banUser, deleteUser,
  getAllUsersSafe, getMafiaRolesSafe, getScenariosSafe
} from "@/actions/admin";
import { Role, Alignment } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const isAdmin = session?.user?.role === "ADMIN";

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "users" | "scenarios" | "roles") || "roles";
  const [activeTab, setActiveTab] = useState<"users" | "scenarios" | "roles">(initialTab);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync tab with URL
  useEffect(() => {
    if (status === "loading") return;

    const tab = searchParams.get("tab") as any;
    const nextTab =
      tab === "users" && isAdmin
        ? "users"
        : tab === "scenarios" || tab === "roles"
          ? tab
          : isAdmin
            ? "users"
            : "roles";

    setActiveTab((currentTab) => currentTab === nextTab ? currentTab : nextTab);
  }, [searchParams, isAdmin, status]);

  // Role Form
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleAlign, setNewRoleAlign] = useState<Alignment>("CITIZEN");

  // Scenario Form
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [newScenName, setNewScenName] = useState("");
  const [newScenDesc, setNewScenDesc] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<{roleId: string, count: number}[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    refreshData();
  }, [activeTab, isAdmin, status]);

  const refreshData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (activeTab === "users" && isAdmin) {
        const result = await getAllUsersSafe();
        setUsers(result.data);
        if (!result.success) setErrorMessage(result.error || "اطلاعات کاربران بارگذاری نشد.");
      } else if (activeTab === "roles") {
        const result = await getMafiaRolesSafe();
        setRoles(result.data);
        if (!result.success) setErrorMessage(result.error || "اطلاعات نقش‌ها بارگذاری نشد.");
      } else if (activeTab === "scenarios") {
        const scenarioResult = await getScenariosSafe();
        const rolesResult = await getMafiaRolesSafe();
        setScenarios(scenarioResult.data);
        setRoles(rolesResult.data);
        if (!scenarioResult.success || !rolesResult.success) {
          setErrorMessage(scenarioResult.error || rolesResult.error || "اطلاعات سناریوها بارگذاری نشد.");
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("اطلاعات این بخش بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی کاربر را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, role: Role) => {
    try {
      await updateUserRole(userId, role);
      refreshData();
    } catch (error) {
      showAlert("خطا", "خطا در تغییر دسترسی", "error");
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await updateMafiaRole(editingRoleId, { name: newRoleName, description: newRoleDesc, alignment: newRoleAlign });
      } else {
        await createMafiaRole({ name: newRoleName, description: newRoleDesc, alignment: newRoleAlign });
      }
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRoleAlign("CITIZEN");
      setEditingRoleId(null);
      refreshData();
    } catch (error) {
      showAlert("خطا", "خطا در ثبت نقش", "error");
    }
  };

  const handleDeleteRole = async (id: string) => {
    showConfirm("حذف نقش", "آیا از حذف این نقش اطمینان دارید؟", async () => {
      try {
        await deleteMafiaRole(id);
        refreshData();
        showToast("نقش با موفقیت حذف شد", "success");
      } catch (error: any) {
        showAlert("خطا", error.message || "خطا در حذف نقش", "error");
      }
    }, "error");
  };

  const handleEditRole = (role: any) => {
    setEditingRoleId(role.id);
    setNewRoleName(role.name);
    setNewRoleDesc(role.description || "");
    setNewRoleAlign(role.alignment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return showAlert("هشدار", "حداقل یک نقش انتخاب کنید", "warning");
    try {
      if (editingScenarioId) {
        await updateScenario(editingScenarioId, { 
          name: newScenName, 
          description: newScenDesc, 
          roles: selectedRoles 
        });
      } else {
        await createScenario({ 
          name: newScenName, 
          description: newScenDesc, 
          roles: selectedRoles 
        });
      }
      setNewScenName("");
      setNewScenDesc("");
      setSelectedRoles([]);
      setEditingScenarioId(null);
      refreshData();
    } catch (error) {
      showAlert("خطا", "خطا در ثبت سناریو", "error");
    }
  };

  const handleDeleteScenario = async (id: string) => {
    showConfirm("حذف سناریو", "آیا از حذف این سناریو اطمینان دارید؟", async () => {
      try {
        await deleteScenario(id);
        refreshData();
        showToast("سناریو حذف شد", "success");
      } catch (error) {
        showAlert("خطا", "خطا در حذف سناریو", "error");
      }
    }, "error");
  };

  const handleEditScenario = (scen: any) => {
    setEditingScenarioId(scen.id);
    setNewScenName(scen.name);
    setNewScenDesc(scen.description || "");
    setSelectedRoles(scen.roles.map((r: any) => ({
      roleId: r.roleId,
      count: r.count
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRoleInScenario = (roleId: string) => {
    setSelectedRoles(prev => {
      const exists = prev.find(r => r.roleId === roleId);
      if (exists) return prev.filter(r => r.roleId !== roleId);
      return [...prev, { roleId, count: 1 }];
    });
  };

  const updateRoleCount = (roleId: string, delta: number) => {
    setSelectedRoles(prev => prev.map(r => 
      r.roleId === roleId ? { ...r, count: Math.max(1, r.count + delta) } : r
    ));
  };

  const userCounts = {
    total: users.length,
    admins: users.filter((user) => user.role === "ADMIN").length,
    moderators: users.filter((user) => user.role === "MODERATOR").length,
    banned: users.filter((user) => user.isBanned).length,
  };

  return (
    <div className="flex min-h-[80vh] flex-col gap-5 font-sans" dir="rtl">
      <header className="ui-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="ui-icon-accent size-14">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <div>
              <p className="ui-kicker">کنترل مدیریتی</p>
              <h2 className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">پنل مدیریت</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">کاربران، نقش‌ها و سناریوها را از یک نمای متمرکز مدیریت کنید.</p>
            </div>
          </div>
          
          <div className={`grid gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-white/10 dark:bg-zinc-950 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab("users")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${activeTab === "users" ? "bg-lime-500 text-zinc-950 shadow-sm" : "text-zinc-500 hover:bg-white dark:hover:bg-white/[0.06]"}`}
              >
                <span className="material-symbols-outlined text-lg">group</span>
                کاربران
              </button>
            )}
            <button 
              onClick={() => setActiveTab("scenarios")}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${activeTab === "scenarios" ? "bg-lime-500 text-zinc-950 shadow-sm" : "text-zinc-500 hover:bg-white dark:hover:bg-white/[0.06]"}`}
            >
              <span className="material-symbols-outlined text-lg">account_tree</span>
              سناریوها
            </button>
            <button 
              onClick={() => setActiveTab("roles")}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${activeTab === "roles" ? "bg-lime-500 text-zinc-950 shadow-sm" : "text-zinc-500 hover:bg-white dark:hover:bg-white/[0.06]"}`}
            >
              <span className="material-symbols-outlined text-lg">theater_comedy</span>
              نقش‌ها
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ui-card relative min-h-[500px] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90">
            <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-lime-500 dark:border-zinc-800"></div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">در حال بارگذاری اطلاعات...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[500px] flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="ui-icon size-16 text-red-500">
              <span className="material-symbols-outlined text-3xl">cloud_off</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-950 dark:text-white">بارگذاری اطلاعات ناموفق بود</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
            </div>
            <button onClick={refreshData} className="ui-button-primary">
              <span className="material-symbols-outlined text-xl">refresh</span>
              تلاش دوباره
            </button>
          </div>
        ) : (
          <>
            {activeTab === "users" && isAdmin && (
              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["کل کاربران", userCounts.total, "group", "text-lime-500"],
                    ["مدیران", userCounts.admins, "admin_panel_settings", "text-purple-500"],
                    ["گرداننده‌ها", userCounts.moderators, "sports_esports", "text-sky-500"],
                    ["مسدود", userCounts.banned, "block", "text-red-500"],
                  ].map(([label, value, icon, color]) => (
                    <div key={label} className="ui-muted p-4">
                      <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                      <p className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">{value}</p>
                      <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10">
                  <div className="hidden grid-cols-[1.4fr_1.4fr_0.8fr_1.6fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] md:grid">
                    <span>کاربر</span>
                    <span>ایمیل</span>
                    <span>دسترسی</span>
                    <span>عملیات</span>
                  </div>

                  <div className="divide-y divide-zinc-200 dark:divide-white/10">
                    {users.map((user) => (
                      <div key={user.id} className="grid gap-4 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] md:grid-cols-[1.4fr_1.4fr_0.8fr_1.6fr] md:items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm font-black text-zinc-600 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300">
                            {user.name ? user.name[0] : user.email?.[0]}
                          </div>
                          <div>
                            <p className="font-black text-zinc-950 dark:text-white">{user.name || "بدون نام"}</p>
                            <p className="mt-1 text-xs text-zinc-500 md:hidden" dir="ltr">{user.email}</p>
                          </div>
                        </div>

                        <div className="hidden truncate text-sm font-mono text-zinc-500 dark:text-zinc-400 md:block" dir="ltr">{user.email}</div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-lg border px-2.5 py-1 text-xs font-black ${
                            user.role === "ADMIN" ? "border-purple-500/20 bg-purple-500/10 text-purple-500" :
                            user.role === "MODERATOR" ? "border-sky-500/20 bg-sky-500/10 text-sky-500" :
                            "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
                          }`}>
                            {user.role}
                          </span>
                          {user.isBanned && <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-500">مسدود</span>}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {user.role !== "MODERATOR" && user.role !== "ADMIN" && (
                            <button onClick={() => handleRoleUpdate(user.id, "MODERATOR")} className="ui-button-secondary min-h-8 px-3 py-1.5 text-xs">
                              گرداننده
                            </button>
                          )}
                          {user.role !== "USER" && user.role !== "ADMIN" && (
                            <button onClick={() => handleRoleUpdate(user.id, "USER")} className="ui-button-secondary min-h-8 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
                              سلب دسترسی
                            </button>
                          )}
                          <button
                            onClick={() => {
                              showConfirm(
                                user.isBanned ? "رفع مسدودیت" : "مسدود کردن",
                                `آیا از ${user.isBanned ? "رفع مسدودیت" : "مسدود کردن"} این کاربر اطمینان دارید؟`,
                                async () => {
                                  try {
                                    await banUser(user.id, !user.isBanned);
                                    refreshData();
                                    showToast(user.isBanned ? "کاربر فعال شد" : "کاربر مسدود شد");
                                  } catch (e: any) { showAlert("خطا", e.message || "خطای نامشخص", "error"); }
                                }
                              );
                            }}
                            className={`min-h-8 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${user.isBanned ? "border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white" : "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"}`}
                          >
                            {user.isBanned ? "فعال کردن" : "مسدود"}
                          </button>
                          <button
                            onClick={() => {
                              showConfirm(
                                "حذف کامل کاربر",
                                "آیا از حذف کامل این کاربر اطمینان دارید؟ این عمل غیرقابل بازگشت است.",
                                async () => {
                                  try {
                                    await deleteUser(user.id);
                                    refreshData();
                                    showToast("کاربر با موفقیت حذف شد");
                                  } catch (e: any) { showAlert("خطا", e.message || "خطای نامشخص", "error"); }
                                },
                                "error"
                              );
                            }}
                            className="min-h-8 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "roles" && (
              <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
                {/* Modern Form */}
                <div className="w-full lg:w-96 p-8 border-l border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950/30">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className={`material-symbols-outlined ${editingRoleId ? 'text-blue-600 dark:text-blue-400' : 'text-lime-400'}`}>
                        {editingRoleId ? 'edit_square' : 'add_circle'}
                      </span>
                      {editingRoleId ? 'ویرایش نقش' : 'نقش جدید'}
                    </h4>
                    {editingRoleId && (
                      <button 
                        onClick={() => {
                          setEditingRoleId(null);
                          setNewRoleName("");
                          setNewRoleDesc("");
                          setNewRoleAlign("CITIZEN");
                        }}
                        className="text-xs text-slate-500 dark:text-zinc-500 hover:text-red-600 dark:text-red-400 transition-colors bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5"
                      >
                        لغو ویرایش
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleAddRole} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 ml-1">نام نقش</label>
                      <input 
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                        className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-lg p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner" 
                        placeholder="مثلا: تفنگدار"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 ml-1">جبهه</label>
                      <select 
                        value={newRoleAlign}
                        onChange={(e) => setNewRoleAlign(e.target.value as Alignment)}
                        className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-lg p-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-lime-500/50 transition-all shadow-inner appearance-none"
                      >
                        <option value="CITIZEN">شهروند</option>
                        <option value="MAFIA">مافیا</option>
                        <option value="NEUTRAL">مستقل</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 ml-1">توضیحات توانایی</label>
                      <textarea 
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-lg p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner h-28 resize-none" 
                        placeholder="در شب چه کاری انجام میدهد؟"
                      />
                    </div>
                    <button type="submit" className={`mt-4 py-3.5 rounded-lg font-bold text-sm transition-all shadow-lg ${editingRoleId ? 'bg-blue-500 text-slate-900 dark:text-white hover:bg-blue-600 hover:shadow-blue-500/20' : 'bg-lime-500 text-zinc-950 hover:bg-lime-400 hover:shadow-lime-500/20'}`}>
                      {editingRoleId ? 'بروزرسانی نقش' : 'ثبت نقش در سیستم'}
                    </button>
                  </form>
                </div>

                {/* Role List Cards */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[800px] bg-white dark:bg-zinc-900/20">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {roles.length === 0 ? (
                        <div className="col-span-full flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
                          <div className="ui-icon size-16">
                            <span className="material-symbols-outlined text-3xl text-zinc-400">theater_comedy</span>
                          </div>
                          <div>
                            <p className="font-black text-zinc-950 dark:text-white">هنوز نقشی ثبت نشده است</p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">برای ساخت سناریو، اول چند نقش تعریف کنید.</p>
                          </div>
                        </div>
                      ) : roles.map((role) => (
                        <div key={role.id} className="group p-5 rounded-lg border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:border-lime-500/30 hover:bg-zinc-50 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 relative overflow-hidden flex flex-col gap-3">
                           {/* Alignment Glow */}
                           <div className={`absolute -top-10 -right-10 w-24 h-24 blur-3xl rounded-full opacity-20 transition-opacity group-hover:opacity-40 ${role.alignment === 'CITIZEN' ? 'bg-green-500' : role.alignment === 'MAFIA' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                           
                           <div className="flex justify-between items-start relative z-10">
                              <span className="font-extrabold text-slate-900 dark:text-white text-lg">{role.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${role.alignment === 'CITIZEN' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : role.alignment === 'MAFIA' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'}`}>
                                  {role.alignment === 'CITIZEN' ? 'شهروند' : role.alignment === 'MAFIA' ? 'مافیا' : 'مستقل'}
                                </span>
                              </div>
                           </div>
                           <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed relative z-10 flex-1">{role.description || "بدون توضیحات"}</p>
                           
                           <div className="flex gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 relative z-10">
                              <button 
                                onClick={() => handleEditRole(role)}
                                className="flex-1 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                              >
                                ویرایش
                              </button>
                              {!role.is_permanent && (
                                <button 
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="flex-1 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                >
                                  حذف
                                </button>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === "scenarios" && (
              <div className="flex flex-col lg:flex-row h-full min-h-[600px]">
                {/* Form */}
                <div className="w-full lg:w-[420px] p-8 border-l border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950/30 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className={`material-symbols-outlined ${editingScenarioId ? 'text-blue-600 dark:text-blue-400' : 'text-lime-400'}`}>
                        {editingScenarioId ? 'edit_square' : 'add_task'}
                      </span>
                      {editingScenarioId ? 'ویرایش سناریو' : 'طراحی سناریو'}
                    </h4>
                    {editingScenarioId ? (
                      <button 
                        onClick={() => {
                          setEditingScenarioId(null);
                          setNewScenName("");
                          setNewScenDesc("");
                          setSelectedRoles([]);
                        }}
                        className="text-xs text-slate-500 dark:text-zinc-500 hover:text-red-600 dark:text-red-400 transition-colors bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5"
                      >
                        لغو
                      </button>
                    ) : (
                      <button 
                        onClick={async () => {
                          const res = await installStandardScenarios();
                          if (res?.success) {
                            showAlert("موفقیت", "سناریوها با موفقیت نصب شدند", "success");
                            refreshData();
                          }
                        }}
                        className="text-[10px] font-bold px-3 py-1.5 bg-lime-500/10 text-lime-600 dark:text-lime-400 rounded-full hover:bg-lime-500 hover:text-zinc-950 transition-all border border-lime-500/20"
                      >
                        نصب پیش‌فرض‌ها
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddScenario} className="flex flex-col gap-5 flex-1">
                    <input 
                      value={newScenName}
                      onChange={(e) => setNewScenName(e.target.value)}
                      required
                      placeholder="نام سناریو (مثلا: تکاور ۱۵ نفره)"
                      className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-lg p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 outline-none transition-all"
                    />
                    <textarea 
                      value={newScenDesc}
                      onChange={(e) => setNewScenDesc(e.target.value)}
                      placeholder="توضیحات کوتاه در مورد قوانین این سناریو..."
                      className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-lg p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 outline-none transition-all h-20 resize-none"
                    />
                    
                    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">انتخاب نقش‌ها:</label>
                        <span className="text-[10px] font-bold bg-[#0f172a]/5 dark:bg-white/5 px-2 py-1 rounded border border-[#0f172a]/20 dark:border-white/10 text-slate-900 dark:text-white">
                          مجموع: {selectedRoles.reduce((acc, r) => acc + r.count, 0)} نفر
                        </span>
                      </div>
                      
                      {/* Role Selector Box */}
                      <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-white/5 rounded-lg bg-white dark:bg-zinc-900/30 p-2 custom-scrollbar">
                        <div className="flex flex-col gap-1">
                          {roles.length === 0 ? (
                            <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                              <span className="material-symbols-outlined text-3xl text-zinc-400">playlist_add</span>
                              برای طراحی سناریو ابتدا نقش‌ها را اضافه کنید.
                            </div>
                          ) : roles.map(role => {
                            const isSelected = !!selectedRoles.find(r => r.roleId === role.id);
                            return (
                              <div key={role.id} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isSelected ? 'bg-[#0f172a]/5 dark:bg-white/5 border border-[#0f172a]/20 dark:border-white/10' : 'hover:bg-[#0f172a]/5 dark:bg-white/5 border border-transparent'}`}>
                                <div 
                                  className="flex items-center gap-3 flex-1 cursor-pointer"
                                  onClick={() => toggleRoleInScenario(role.id)}
                                >
                                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-lime-500' : 'border border-zinc-600'}`}>
                                    {isSelected && <span className="material-symbols-outlined text-[12px] text-zinc-950 font-bold">check</span>}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-sm ${isSelected ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-zinc-400'}`}>{role.name}</span>
                                    <span className={`text-[10px] ${role.alignment === 'CITIZEN' ? 'text-green-500/70' : role.alignment === 'MAFIA' ? 'text-red-600 dark:text-red-400/70' : 'text-yellow-500/70'}`}>
                                      {role.alignment === 'CITIZEN' ? 'شهروند' : role.alignment === 'MAFIA' ? 'مافیا' : 'مستقل'}
                                    </span>
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 px-2 py-1 rounded-md border border-slate-200 dark:border-white/5">
                                    <button type="button" onClick={() => updateRoleCount(role.id, -1)} className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-white transition-colors"><span className="material-symbols-outlined text-[16px]">remove</span></button>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white w-4 text-center">{selectedRoles.find(r => r.roleId === role.id)?.count}</span>
                                    <button type="button" onClick={() => updateRoleCount(role.id, 1)} className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:text-white transition-colors"><span className="material-symbols-outlined text-[16px]">add</span></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <button type="submit" className={`py-3.5 rounded-lg font-bold text-sm transition-all shadow-lg ${editingScenarioId ? 'bg-blue-500 text-slate-900 dark:text-white hover:bg-blue-600' : 'bg-lime-500 text-zinc-950 hover:bg-lime-400'}`}>
                      {editingScenarioId ? 'بروزرسانی سناریو' : 'ذخیره سناریو جدید'}
                    </button>
                  </form>
                </div>

                {/* Scenario List */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[800px] bg-white dark:bg-zinc-900/20">
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {scenarios.length === 0 ? (
                        <div className="col-span-full flex min-h-96 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
                          <div className="ui-icon size-16">
                            <span className="material-symbols-outlined text-3xl text-zinc-400">account_tree</span>
                          </div>
                          <div>
                            <p className="font-black text-zinc-950 dark:text-white">سناریویی برای نمایش وجود ندارد</p>
                            <p className="mt-1 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">سناریوهای پیش‌فرض را نصب کنید یا با انتخاب نقش‌ها یک سناریوی تازه بسازید.</p>
                          </div>
                        </div>
                      ) : scenarios.map((scen) => (
                        <div key={scen.id} className="p-6 rounded-lg border border-slate-200 bg-white transition-all hover:border-lime-500/30 hover:bg-zinc-50 hover:shadow-2xl dark:border-white/10 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 relative overflow-hidden flex flex-col gap-4 group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                           
                           <div className="flex justify-between items-start relative z-10">
                              <div className="flex flex-col gap-1">
                                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">{scen.name}</h3>
                                <p className="text-sm text-slate-600 dark:text-zinc-400">{scen.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="border border-lime-500/20 bg-lime-500/10 px-3 py-1.5 text-xs font-bold text-lime-700 shadow-sm dark:text-lime-300 rounded-full">
                                  {scen.roles.reduce((acc: number, r: any) => acc + r.count, 0)} نفره
                                </span>
                                
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditScenario(scen)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 transition-colors hover:bg-blue-500/10 dark:border-white/10 dark:bg-zinc-950 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button onClick={() => handleDeleteScenario(scen.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-red-600 transition-colors hover:bg-red-500/10 dark:border-white/10 dark:bg-zinc-950 dark:text-red-400">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </div>
                           </div>
                           
                           <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>
                           
                           {/* Role Tags */}
                           <div className="flex flex-wrap gap-2 relative z-10">
                              {scen.roles.map((r: any) => (
                                <span key={r.role.id} className={`text-[11px] font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${r.role.alignment === 'CITIZEN' ? 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-300' : r.role.alignment === 'MAFIA' ? 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-300' : 'border-yellow-500/20 bg-yellow-500/5 text-amber-600 dark:text-yellow-300'}`}>
                                  {r.role.name} 
                                  <span className={`text-[10px] w-4 h-4 rounded flex items-center justify-center font-bold ${r.role.alignment === 'CITIZEN' ? 'bg-green-500/20' : r.role.alignment === 'MAFIA' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                                    {r.count}
                                  </span>
                                </span>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
