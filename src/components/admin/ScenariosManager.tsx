"use client";

import { useState } from "react";
import { createScenario, updateScenario, deleteScenario } from "@/actions/admin";

export function ScenariosManager({ initialRoles, initialScenarios }: { initialRoles: any[], initialScenarios: any[] }) {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [loading, setLoading] = useState(false);
  const [editingScenario, setEditingScenario] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    roles: [] as { roleId: string, count: number }[]
  });

  const openForm = (scenario?: any) => {
    if (scenario) {
      setEditingScenario(scenario);
      setFormData({
        name: scenario.name,
        description: scenario.description || "",
        roles: scenario.roles.map((r: any) => ({ roleId: r.roleId, count: r.count }))
      });
    } else {
      setEditingScenario(null);
      setFormData({ name: "", description: "", roles: [] });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingScenario(null);
  };

  const updateRoleCount = (roleId: string, delta: number) => {
    setFormData(prev => {
      const existing = prev.roles.find(r => r.roleId === roleId);
      let newRoles = [...prev.roles];
      
      if (existing) {
        const newCount = existing.count + delta;
        if (newCount <= 0) {
          newRoles = newRoles.filter(r => r.roleId !== roleId);
        } else {
          newRoles = newRoles.map(r => r.roleId === roleId ? { ...r, count: newCount } : r);
        }
      } else if (delta > 0) {
        newRoles.push({ roleId, count: delta });
      }
      
      return { ...prev, roles: newRoles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingScenario) {
        const updated = await updateScenario(editingScenario.id, formData);
        setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await createScenario(formData);
        setScenarios(prev => [created, ...prev]);
      }
      closeForm();
    } catch (err: any) {
      alert(err.message || "خطا در ذخیره سناریو");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این سناریو اطمینان دارید؟")) return;
    try {
      await deleteScenario(id);
      setScenarios(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || "خطا در حذف سناریو");
    }
  };

  const totalPlayers = formData.roles.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-black px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-lime-500/20 active:translate-y-1"
        >
          <span className="material-symbols-outlined">add</span>
          سناریو جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map(scenario => (
          <div key={scenario.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black">{scenario.name}</h3>
                <p className="text-zinc-500 text-sm mt-1">{scenario.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openForm(scenario)} className="p-2 text-zinc-400 hover:text-blue-500 transition-colors">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button onClick={() => handleDelete(scenario.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
               <div className="flex justify-between mb-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <span>ترکیب نقش‌ها</span>
                  <span className="text-zinc-900 dark:text-white">تعداد کل: {scenario.roles.reduce((a:any, b:any) => a + b.count, 0)}</span>
               </div>
               <div className="flex flex-wrap gap-2">
                  {scenario.roles.map((sr: any) => (
                    <div key={sr.id} className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      sr.role.alignment === 'CITIZEN' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                      sr.role.alignment === 'MAFIA' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                      'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                    }`}>
                      {sr.role.name} × {sr.count}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-2xl font-black">{editingScenario ? 'ویرایش سناریو' : 'ساخت سناریو جدید'}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              <form id="scenario-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold px-1">نام سناریو</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                    placeholder="مثال: کلاسیک ۱۲ نفره"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold px-1">توضیحات</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500/50 min-h-[100px]"
                    placeholder="توضیحات کوتاهی درباره سناریو..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-2xl">
                    <span className="font-black">انتخاب نقش‌ها</span>
                    <span className="bg-lime-500 text-black px-3 py-1 rounded-full text-xs font-black">
                      مجموع بازیکنان: {totalPlayers}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {['CITIZEN', 'MAFIA', 'INDEPENDENT'].map(alignment => {
                      const alignmentRoles = initialRoles.filter(r => r.alignment === alignment);
                      if (alignmentRoles.length === 0) return null;
                      
                      return (
                        <div key={alignment} className="space-y-3">
                          <h4 className={`text-xs font-black uppercase tracking-widest ${
                            alignment === 'CITIZEN' ? 'text-blue-500' : 
                            alignment === 'MAFIA' ? 'text-red-500' : 
                            'text-zinc-500'
                          }`}>
                            {alignment === 'CITIZEN' ? 'تیم شهروند' : alignment === 'MAFIA' ? 'تیم مافیا' : 'نقش‌های مستقل'}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {alignmentRoles.map(role => {
                              const currentCount = formData.roles.find(r => r.roleId === role.id)?.count || 0;
                              return (
                                <div key={role.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                  <span className="text-sm font-bold px-2">{role.name}</span>
                                  <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700">
                                    <button 
                                      type="button"
                                      onClick={() => updateRoleCount(role.id, -1)}
                                      disabled={currentCount === 0}
                                      className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-md disabled:opacity-30 transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">remove</span>
                                    </button>
                                    <span className="w-4 text-center text-sm font-bold">{currentCount}</span>
                                    <button 
                                      type="button"
                                      onClick={() => updateRoleCount(role.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-md transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">add</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/50">
              <button 
                type="button"
                onClick={closeForm}
                className="px-6 py-3 font-bold rounded-xl text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                انصراف
              </button>
              <button 
                type="submit"
                form="scenario-form"
                disabled={loading || formData.roles.length === 0}
                className="px-6 py-3 font-bold rounded-xl bg-lime-500 hover:bg-lime-600 text-black disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? 'در حال ذخیره...' : 'ذخیره سناریو'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
