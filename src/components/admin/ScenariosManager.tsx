"use client";

import { useMemo, useState } from "react";
import { createScenario, deleteScenario, updateScenario } from "@/actions/admin";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatusChip } from "@/components/CommandUI";

const alignmentLabel: Record<string, string> = {
  CITIZEN: "شهروند",
  MAFIA: "مافیا",
  NEUTRAL: "مستقل",
};

export function ScenariosManager({ initialRoles, initialScenarios }: { initialRoles: any[]; initialScenarios: any[] }) {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [loading, setLoading] = useState(false);
  const [editingScenario, setEditingScenario] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const { showAlert, showConfirm, showToast } = usePopup();
  const [formData, setFormData] = useState({ name: "", description: "", roles: [] as { roleId: string; count: number }[] });

  const filteredScenarios = scenarios.filter((scenario) => scenario.name.includes(query.trim()));
  const sortedRoles = useMemo(() => {
    return [...initialRoles]
      .filter((role) => !roleQuery.trim() || role.name.includes(roleQuery.trim()))
      .sort((a, b) => {
        const ac = formData.roles.find((item) => item.roleId === a.id)?.count || 0;
        const bc = formData.roles.find((item) => item.roleId === b.id)?.count || 0;
        return bc - ac || a.name.localeCompare(b.name, "fa");
      });
  }, [initialRoles, formData.roles, roleQuery]);

  const openForm = (scenario?: any) => {
    if (scenario) {
      setEditingScenario(scenario);
      setFormData({
        name: scenario.name,
        description: scenario.description || "",
        roles: scenario.roles.map((role: any) => ({ roleId: role.roleId, count: role.count })),
      });
    } else {
      setEditingScenario(null);
      setFormData({ name: "", description: "", roles: [] });
    }
    setShowForm(true);
  };

  const duplicateForm = (scenario: any) => {
    setEditingScenario(null);
    setFormData({
      name: `${scenario.name} کپی`,
      description: scenario.description || "",
      roles: scenario.roles.map((role: any) => ({ roleId: role.roleId, count: role.count })),
    });
    setShowForm(true);
  };

  const updateRoleCount = (roleId: string, delta: number) => {
    setFormData((prev) => {
      const existing = prev.roles.find((role) => role.roleId === roleId);
      if (!existing && delta > 0) return { ...prev, roles: [...prev.roles, { roleId, count: 1 }] };
      if (!existing) return prev;
      const next = Math.max(0, existing.count + delta);
      return {
        ...prev,
        roles: next === 0 ? prev.roles.filter((role) => role.roleId !== roleId) : prev.roles.map((role) => (role.roleId === roleId ? { ...role, count: next } : role)),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || formData.roles.length === 0) {
      showAlert("اطلاعات ناقص", "نام سناریو و حداقل یک نقش لازم است.", "warning");
      return;
    }
    setLoading(true);
    try {
      if (editingScenario) {
        const updated = await updateScenario(editingScenario.id, formData);
        setScenarios((prev) => prev.map((scenario) => (scenario.id === updated.id ? updated : scenario)));
      } else {
        const created = await createScenario(formData);
        setScenarios((prev) => [created, ...prev]);
      }
      showToast(editingScenario ? "سناریو بروزرسانی شد" : "سناریو ساخته شد", "success");
      setShowForm(false);
    } catch (error: any) {
      showAlert("خطا", error.message || "خطا در ذخیره سناریو", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm("حذف سناریو", "این سناریو از کتابخانه حذف می‌شود.", async () => {
      await deleteScenario(id);
      setScenarios((prev) => prev.filter((scenario) => scenario.id !== id));
      showToast("سناریو حذف شد", "success");
    }, "error");
  };

  const totalPlayers = formData.roles.reduce((sum, role) => sum + role.count, 0);

  return (
    <div className="space-y-4">
      <CommandSurface className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی سناریو..." className="pm-input h-12 px-4 sm:max-w-sm" />
          <CommandButton onClick={() => openForm()}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            سناریو جدید
          </CommandButton>
        </div>
      </CommandSurface>

      {filteredScenarios.length === 0 ? (
        <EmptyState icon="account_tree" title="سناریویی پیدا نشد" />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredScenarios.map((scenario) => {
            const total = scenario.roles.reduce((sum: number, role: any) => sum + role.count, 0);
            const grouped = scenario.roles.reduce((acc: any, item: any) => {
              acc[item.role.alignment] = (acc[item.role.alignment] || 0) + item.count;
              return acc;
            }, {});
            return (
              <CommandSurface key={scenario.id} interactive className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-zinc-50">{scenario.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">{scenario.description || "بدون توضیح"}</p>
                  </div>
                  <StatusChip tone="cyan">{total} نفر</StatusChip>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(grouped).map(([alignment, count]) => (
                    <StatusChip key={alignment} tone={alignment === "MAFIA" ? "rose" : alignment === "CITIZEN" ? "cyan" : "amber"}>
                      {alignmentLabel[alignment]} × {count as number}
                    </StatusChip>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <CommandButton tone="ghost" onClick={() => openForm(scenario)} className="flex-1">ویرایش</CommandButton>
                  <CommandButton tone="ghost" onClick={() => duplicateForm(scenario)}>کپی</CommandButton>
                  <CommandButton tone="rose" onClick={() => handleDelete(scenario.id)}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </CommandButton>
                </div>
              </CommandSurface>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[230] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet flex w-full max-w-3xl flex-col overflow-hidden p-5">
            <div className="flex items-start justify-between gap-3">
              <SectionHeader title={editingScenario ? "ویرایش سناریو" : "سناریوی جدید"} eyebrow={`${totalPlayers} بازیکن`} icon="account_tree" />
              <button onClick={() => setShowForm(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="mt-4 grid min-h-0 gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="نام سناریو" className="pm-input h-12 px-4" />
                <textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="توضیحات" className="pm-input min-h-32 px-4 py-3" />
                <CommandButton type="submit" disabled={loading} className="w-full">ذخیره سناریو</CommandButton>
              </div>
              <div className="min-h-0">
                <input value={roleQuery} onChange={(event) => setRoleQuery(event.target.value)} placeholder="جستجوی نقش..." className="pm-input h-12 px-4" />
                <div className="pm-scrollbar mt-3 max-h-[54vh] space-y-2 overflow-y-auto">
                  {sortedRoles.map((role) => {
                    const count = formData.roles.find((item) => item.roleId === role.id)?.count || 0;
                    return (
                      <div key={role.id} className={`pm-ledger-row flex items-center justify-between gap-3 p-3 ${count ? "border-cyan-300/30 bg-cyan-300/10" : ""}`}>
                        <div className="min-w-0">
                          <p className="truncate font-black text-zinc-100">{role.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{alignmentLabel[role.alignment]}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
                          <button type="button" onClick={() => updateRoleCount(role.id, -1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">-</button>
                          <span className="w-6 text-center font-black text-cyan-100">{count}</span>
                          <button type="button" onClick={() => updateRoleCount(role.id, 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
