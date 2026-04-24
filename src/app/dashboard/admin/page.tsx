"use client";

import { useState, useEffect } from "react";
import { 
  getAllUsers, updateUserRole, 
  getMafiaRoles, createMafiaRole, 
  getScenarios, createScenario, installStandardScenarios 
} from "@/actions/admin";
import { Role, Alignment } from "@prisma/client";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "scenarios" | "roles">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Form
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleAlign, setNewRoleAlign] = useState<Alignment>("CITIZEN");

  // Scenario Form
  const [newScenName, setNewScenName] = useState("");
  const [newScenDesc, setNewScenDesc] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<{roleId: string, count: number}[]>([]);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
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
      alert("خطا در تغییر دسترسی");
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMafiaRole({ name: newRoleName, description: newRoleDesc, alignment: newRoleAlign });
      setNewRoleName("");
      setNewRoleDesc("");
      refreshData();
    } catch (error) {
      alert("خطا در ایجاد نقش");
    }
  };

  const handleAddScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) return alert("حداقل یک نقش انتخاب کنید");
    try {
      await createScenario({ 
        name: newScenName, 
        description: newScenDesc, 
        roles: selectedRoles 
      });
      setNewScenName("");
      setNewScenDesc("");
      setSelectedRoles([]);
      refreshData();
    } catch (error) {
      alert("خطا در ایجاد سناریو");
    }
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <h2 className="text-3xl font-black flex items-center gap-3">
          <span className="material-symbols-outlined text-lime-500 text-4xl">admin_panel_settings</span>
          پنل مدیریت سیستم
        </h2>
        
        {/* Tabs */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit border border-zinc-200 dark:border-zinc-700">
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === "users" ? "bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400 shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
          >
            <span className="material-symbols-outlined text-xl">group</span>
            کاربران
          </button>
          <button 
            onClick={() => setActiveTab("scenarios")}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === "scenarios" ? "bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400 shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
          >
            <span className="material-symbols-outlined text-xl">account_tree</span>
            سناریوها
          </button>
          <button 
            onClick={() => setActiveTab("roles")}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === "roles" ? "bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400 shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
          >
            <span className="material-symbols-outlined text-xl">theater_comedy</span>
            نقش‌ها
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <main className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-zinc-400 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-5xl animate-spin">refresh</span>
            در حال بارگذاری اطلاعات...
          </div>
        ) : (
          <>
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="p-4 font-semibold text-sm">نام</th>
                      <th className="p-4 font-semibold text-sm">ایمیل</th>
                      <th className="p-4 font-semibold text-sm">سطح دسترسی</th>
                      <th className="p-4 font-semibold text-sm">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4 text-sm font-medium">{user.name || "بدون نام"}</td>
                        <td className="p-4 text-sm text-zinc-500 font-mono" dir="ltr">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : user.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {user.role !== "MODERATOR" && (
                              <button 
                                onClick={() => handleRoleUpdate(user.id, "MODERATOR")}
                                className="text-[10px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-lime-500 hover:text-white transition-colors"
                              >
                                تبدیل به گرداننده
                              </button>
                            )}
                            {user.role !== "USER" && (
                              <button 
                                onClick={() => handleRoleUpdate(user.id, "USER")}
                                className="text-[10px] px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-red-500 hover:text-white transition-colors"
                              >
                                سلب دسترسی
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "roles" && (
              <div className="flex flex-col md:flex-row h-full">
                {/* Form */}
                <div className="w-full md:w-80 p-6 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lime-500">add_circle</span>
                    افزودن نقش جدید
                  </h4>
                  <form onSubmit={handleAddRole} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500">نام نقش</label>
                      <input 
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        required
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-lime-500" 
                        placeholder="مثلا: تفنگدار"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500">جبهه</label>
                      <select 
                        value={newRoleAlign}
                        onChange={(e) => setNewRoleAlign(e.target.value as Alignment)}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-lime-500"
                      >
                        <option value="CITIZEN">شهروند</option>
                        <option value="MAFIA">مافیا</option>
                        <option value="NEUTRAL">مستقل</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500">توضیحات</label>
                      <textarea 
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-lime-500 h-24" 
                        placeholder="توضیح توانایی نقش..."
                      />
                    </div>
                    <button type="submit" className="bg-lime-500 text-zinc-950 py-2 rounded-lg font-bold hover:bg-lime-600 transition-colors shadow-sm mt-2">ثبت نقش</button>
                  </form>
                </div>

                {/* List */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {roles.map((role) => (
                        <div key={role.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20 flex flex-col gap-2">
                           <div className="flex justify-between items-center">
                              <span className="font-bold">{role.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${role.alignment === 'CITIZEN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : role.alignment === 'MAFIA' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800'}`}>
                                {role.alignment === 'CITIZEN' ? 'شهروند' : role.alignment === 'MAFIA' ? 'مافیا' : 'مستقل'}
                              </span>
                           </div>
                           <p className="text-xs text-zinc-500 leading-relaxed">{role.description || "توضیحی ندارد"}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === "scenarios" && (
              <div className="flex flex-col md:flex-row h-full">
                {/* Form */}
                <div className="w-full md:w-96 p-6 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-lime-500">add_task</span>
                      ایجاد سناریو
                    </h4>
                    <button 
                      onClick={async () => {
                        await installStandardScenarios();
                        refreshData();
                      }}
                      className="text-[10px] px-2 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 rounded hover:bg-lime-500 hover:text-white transition-colors border border-lime-200 dark:border-lime-800"
                    >
                      نصب سناریوهای استاندارد
                    </button>
                  </div>

                  <form onSubmit={handleAddScenario} className="flex flex-col gap-4">
                    <input 
                      value={newScenName}
                      onChange={(e) => setNewScenName(e.target.value)}
                      required
                      placeholder="نام سناریو (مثلا: پدرخوانده)"
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-lime-500"
                    />
                    <textarea 
                      value={newScenDesc}
                      onChange={(e) => setNewScenDesc(e.target.value)}
                      placeholder="توضیحات کوتاه..."
                      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-lime-500 h-20"
                    />
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-500">نقش‌های انتخاب شده:</label>
                      <div className="max-h-48 overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 flex flex-col gap-2 bg-white dark:bg-zinc-950">
                        {roles.map(role => (
                          <div key={role.id} className="flex items-center justify-between gap-2 p-1 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={!!selectedRoles.find(r => r.roleId === role.id)}
                                onChange={() => toggleRoleInScenario(role.id)}
                                className="accent-lime-500"
                              />
                              <span className="text-xs">{role.name}</span>
                            </div>
                            {selectedRoles.find(r => r.roleId === role.id) && (
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => updateRoleCount(role.id, -1)} className="w-5 h-5 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center text-xs">-</button>
                                <span className="text-xs font-bold">{selectedRoles.find(r => r.roleId === role.id)?.count}</span>
                                <button type="button" onClick={() => updateRoleCount(role.id, 1)} className="w-5 h-5 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center text-xs">+</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="bg-lime-500 text-zinc-950 py-2 rounded-lg font-bold hover:bg-lime-600 transition-colors shadow-sm">ذخیره سناریو</button>
                  </form>
                </div>

                {/* List */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {scenarios.map((scen) => (
                        <div key={scen.id} className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex flex-col gap-4">
                           <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <span className="font-bold text-lg">{scen.name}</span>
                                <span className="text-xs text-zinc-500">{scen.description}</span>
                              </div>
                              <span className="bg-zinc-900 text-white text-[10px] px-2 py-1 rounded-full">
                                {scen.roles.reduce((acc: number, r: any) => acc + r.count, 0)} نفره
                              </span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {scen.roles.map((r: any) => (
                                <span key={r.role.id} className={`text-[10px] px-2 py-1 rounded border ${r.role.alignment === 'CITIZEN' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                  {r.role.name} ({r.count})
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
    </div>
  );
}
