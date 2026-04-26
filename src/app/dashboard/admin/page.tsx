"use client";

import { useState, useEffect } from "react";
import { 
  getAllUsers, updateUserRole, 
  getMafiaRoles, createMafiaRole, updateMafiaRole, deleteMafiaRole,
  getScenarios, createScenario, updateScenario, deleteScenario,
  installStandardScenarios, banUser, deleteUser
} from "@/actions/admin";
import { Role, Alignment } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const { showAlert, showConfirm, showToast } = usePopup();
  const isAdmin = session?.user?.role === "ADMIN";
  const isModerator = session?.user?.role === "MODERATOR";

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "users" | "scenarios" | "roles") || (isAdmin ? "users" : "roles");
  const [activeTab, setActiveTab] = useState<"users" | "scenarios" | "roles">(initialTab);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab") as any;
    if (tab && (tab === "users" || tab === "scenarios" || tab === "roles")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users" && isAdmin) {
        const data = await getAllUsers();
        setUsers(data);
      } else if (activeTab === "roles") {
        const data = await getMafiaRoles();
        setRoles(data);
      } else if (activeTab === "scenarios") {
        const data = await getScenarios();
        setScenarios(data);
        const rolesData = await getMafiaRoles();
        setRoles(rolesData);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
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

  return (
    <div className="flex flex-col gap-8 min-h-[80vh] font-sans" dir="rtl">
      {/* Premium Header */}
      {/* Premium Header */}
      <header className="relative overflow-hidden rounded-[2.5rem] p-10 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[200%] bg-lime-500/5 blur-[120px] pointer-events-none rounded-full rotate-12"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-[40%] h-[150%] bg-blue-600/5 blur-[100px] pointer-events-none rounded-full -rotate-12"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-lime-400 to-emerald-600 p-[2px] shadow-2xl shadow-lime-500/10 group">
              <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-95 duration-500">
                <span className="material-symbols-outlined text-4xl bg-gradient-to-br from-lime-400 via-lime-200 to-emerald-500 bg-clip-text text-transparent">admin_panel_settings</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">پنل مدیریت</h2>
              <p className="text-slate-500 dark:text-zinc-500 font-medium">پیکربندی هسته بازی و نظارت بر کاربران</p>
            </div>
          </div>
          
          {/* Futuristic Tabs */}
          <div className="flex p-2 bg-black/40 rounded-2xl border border-[#0f172a]/20 dark:border-white/10 backdrop-blur-3xl shadow-inner">
            {isAdmin && (
              <button 
                onClick={() => setActiveTab("users")}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${activeTab === "users" ? "bg-lime-500 text-zinc-950 shadow-[0_0_20px_rgba(132,204,22,0.3)] scale-105" : "text-slate-500 dark:text-zinc-500 hover:text-zinc-300 hover:bg-[#0f172a]/5 dark:bg-white/5"}`}
              >
                <span className="material-symbols-outlined text-lg">group</span>
                کاربران
              </button>
            )}
            <button 
              onClick={() => setActiveTab("scenarios")}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${activeTab === "scenarios" ? "bg-lime-500 text-zinc-950 shadow-[0_0_20px_rgba(132,204,22,0.3)] scale-105" : "text-slate-500 dark:text-zinc-500 hover:text-zinc-300 hover:bg-[#0f172a]/5 dark:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-lg">account_tree</span>
              سناریوها
            </button>
            <button 
              onClick={() => setActiveTab("roles")}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${activeTab === "roles" ? "bg-lime-500 text-zinc-950 shadow-[0_0_20px_rgba(132,204,22,0.3)] scale-105" : "text-slate-500 dark:text-zinc-500 hover:text-zinc-300 hover:bg-[#0f172a]/5 dark:bg-white/5"}`}
            >
              <span className="material-symbols-outlined text-lg">theater_comedy</span>
              نقش‌ها
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden min-h-[500px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900/80 backdrop-blur-sm z-50 gap-4">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-lime-500 rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-zinc-400 font-medium">در حال بارگذاری اطلاعات...</p>
          </div>
        ) : (
          <>
            {activeTab === "users" && isAdmin && (
              <div className="overflow-x-auto p-2">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5">
                      <th className="p-5 font-semibold text-slate-600 dark:text-zinc-400 text-sm">کاربر</th>
                      <th className="p-5 font-semibold text-slate-600 dark:text-zinc-400 text-sm">ایمیل</th>
                      <th className="p-5 font-semibold text-slate-600 dark:text-zinc-400 text-sm">دسترسی</th>
                      <th className="p-5 font-semibold text-slate-600 dark:text-zinc-400 text-sm">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-[#0f172a]/20 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-zinc-400 font-bold uppercase">
                              {user.name ? user.name[0] : user.email[0]}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{user.name || "بدون نام"}</span>
                          </div>
                        </td>
                        <td className="p-5 text-sm text-slate-500 dark:text-zinc-500 font-mono" dir="ltr">{user.email}</td>
                        <td className="p-5">
                          <div className="flex flex-col gap-1 items-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' : user.role === 'MODERATOR' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-zinc-800 border-zinc-700 text-slate-600 dark:text-zinc-400'}`}>
                              {user.role}
                            </span>
                            {user.isBanned && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                مسدود شده
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            {user.role !== "MODERATOR" && user.role !== "ADMIN" && (
                              <button 
                                onClick={() => handleRoleUpdate(user.id, "MODERATOR")}
                                className="text-xs px-3 py-1.5 bg-zinc-800 border border-slate-200 dark:border-white/5 text-zinc-300 rounded-lg hover:bg-lime-500/20 hover:text-lime-400 hover:border-lime-500/30 transition-all"
                              >
                                ارتقا به گرداننده
                              </button>
                            )}
                            {user.role !== "USER" && user.role !== "ADMIN" && (
                              <button 
                                onClick={() => handleRoleUpdate(user.id, "USER")}
                                className="text-xs px-3 py-1.5 bg-zinc-800 border border-slate-200 dark:border-white/5 text-zinc-300 rounded-lg hover:bg-orange-500/20 hover:text-orange-600 dark:text-orange-400 hover:border-orange-500/30 transition-all"
                              >
                                سلب دسترسی
                              </button>
                            )}
                            <button
                              onClick={() => {
                                showConfirm(
                                  user.isBanned ? 'رفع مسدودیت' : 'مسدود کردن',
                                  `آیا از ${user.isBanned ? 'رفع مسدودیت' : 'مسدود کردن'} این کاربر اطمینان دارید؟`,
                                  async () => {
                                    try {
                                      await banUser(user.id, !user.isBanned);
                                      refreshData();
                                      showToast(user.isBanned ? "کاربر فعال شد" : "کاربر مسدود شد");
                                    } catch (e: any) { showAlert("خطا", e.message, "error"); }
                                  }
                                );
                              }}
                              className={`text-xs px-3 py-1.5 bg-zinc-800 border border-slate-200 dark:border-white/5 rounded-lg transition-all ${user.isBanned ? 'text-green-600 dark:text-green-400 hover:bg-green-500/20 hover:border-green-500/30' : 'text-red-600 dark:text-red-400 hover:bg-red-500/20 hover:border-red-500/30'}`}
                            >
                              {user.isBanned ? 'رفع مسدودیت' : 'مسدود کردن'}
                            </button>
                            <button
                              onClick={() => {
                                showConfirm(
                                  'حذف کامل کاربر',
                                  'آیا از حذف کامل این کاربر اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
                                  async () => {
                                    try {
                                      await deleteUser(user.id);
                                      refreshData();
                                      showToast("کاربر با موفقیت حذف شد");
                                    } catch (e: any) { showAlert("خطا", e.message, "error"); }
                                  },
                                  "error"
                                );
                              }}
                              className="text-xs px-3 py-1.5 bg-zinc-800 border border-slate-200 dark:border-white/5 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                            >
                              حذف کامل
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                        className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner" 
                        placeholder="مثلا: تفنگدار"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 ml-1">جبهه</label>
                      <select 
                        value={newRoleAlign}
                        onChange={(e) => setNewRoleAlign(e.target.value as Alignment)}
                        className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-lime-500/50 transition-all shadow-inner appearance-none"
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
                        className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 outline-none transition-all shadow-inner h-28 resize-none" 
                        placeholder="در شب چه کاری انجام میدهد؟"
                      />
                    </div>
                    <button type="submit" className={`mt-4 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${editingRoleId ? 'bg-blue-500 text-slate-900 dark:text-white hover:bg-blue-600 hover:shadow-blue-500/20' : 'bg-lime-500 text-zinc-950 hover:bg-lime-400 hover:shadow-lime-500/20'}`}>
                      {editingRoleId ? 'بروزرسانی نقش' : 'ثبت نقش در سیستم'}
                    </button>
                  </form>
                </div>

                {/* Role List Cards */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[800px] bg-white dark:bg-zinc-900/20">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {roles.map((role) => (
                        <div key={role.id} className="group p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-900 hover:bg-zinc-800 transition-all hover:border-[#0f172a]/20 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col gap-3">
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
                      className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 outline-none transition-all"
                    />
                    <textarea 
                      value={newScenDesc}
                      onChange={(e) => setNewScenDesc(e.target.value)}
                      placeholder="توضیحات کوتاه در مورد قوانین این سناریو..."
                      className="bg-white dark:bg-zinc-900/50 border border-[#0f172a]/20 dark:border-white/10 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder-zinc-600 focus:border-lime-500/50 outline-none transition-all h-20 resize-none"
                    />
                    
                    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">انتخاب نقش‌ها:</label>
                        <span className="text-[10px] font-bold bg-[#0f172a]/5 dark:bg-white/5 px-2 py-1 rounded border border-[#0f172a]/20 dark:border-white/10 text-slate-900 dark:text-white">
                          مجموع: {selectedRoles.reduce((acc, r) => acc + r.count, 0)} نفر
                        </span>
                      </div>
                      
                      {/* Role Selector Box */}
                      <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-zinc-900/30 p-2 custom-scrollbar">
                        <div className="flex flex-col gap-1">
                          {roles.map(role => {
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
                    
                    <button type="submit" className={`py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${editingScenarioId ? 'bg-blue-500 text-slate-900 dark:text-white hover:bg-blue-600' : 'bg-lime-500 text-zinc-950 hover:bg-lime-400'}`}>
                      {editingScenarioId ? 'بروزرسانی سناریو' : 'ذخیره سناریو جدید'}
                    </button>
                  </form>
                </div>

                {/* Scenario List */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[800px] bg-white dark:bg-zinc-900/20">
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {scenarios.map((scen) => (
                        <div key={scen.id} className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-900 hover:bg-zinc-800/80 transition-all hover:border-[#0f172a]/20 dark:border-white/10 hover:shadow-2xl relative overflow-hidden flex flex-col gap-4 group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                           
                           <div className="flex justify-between items-start relative z-10">
                              <div className="flex flex-col gap-1">
                                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">{scen.name}</h3>
                                <p className="text-sm text-slate-600 dark:text-zinc-400">{scen.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="bg-zinc-800 text-lime-400 border border-lime-500/20 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                  {scen.roles.reduce((acc: number, r: any) => acc + r.count, 0)} نفره
                                </span>
                                
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditScenario(scen)} className="w-8 h-8 rounded-full bg-zinc-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button onClick={() => handleDeleteScenario(scen.id)} className="w-8 h-8 rounded-full bg-zinc-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors">
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