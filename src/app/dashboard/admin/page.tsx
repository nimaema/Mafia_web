"use client";

import { useEffect, useState } from "react";
import { Alignment, Role } from "@prisma/client";
import {
  banUser,
  createMafiaRole,
  deleteMafiaRole,
  deleteUser,
  getAllUsers,
  getMafiaRoles,
  getScenarios,
  updateMafiaRole,
  updateUserRole,
} from "@/actions/admin";
import { ScenariosManager } from "@/components/admin/ScenariosManager";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";

const roleLabel: Record<Role, string> = {
  ADMIN: "مدیر",
  MODERATOR: "گرداننده",
  USER: "بازیکن",
};

const alignmentLabel: Record<Alignment, string> = {
  CITIZEN: "شهروند",
  MAFIA: "مافیا",
  NEUTRAL: "مستقل",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "scenarios">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Alignment | "ALL">("ALL");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleAlign, setRoleAlign] = useState<Alignment>("CITIZEN");
  const { showAlert, showConfirm, showToast } = usePopup();

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "users" || tab === "roles" || tab === "scenarios") setActiveTab(tab);
  }, []);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") setUsers(await getAllUsers());
      if (activeTab === "roles") setRoles(await getMafiaRoles());
      if (activeTab === "scenarios") {
        const [scenarioData, roleData] = await Promise.all([getScenarios(), getMafiaRoles()]);
        setScenarios(scenarioData);
        setRoles(roleData);
      }
    } catch (error: any) {
      showAlert("خطا", error.message || "دریافت اطلاعات انجام نشد.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const text = `${user.name || ""} ${user.email || ""} ${user.role}`.toLowerCase();
    return text.includes(userQuery.toLowerCase());
  });
  const filteredRoles = roles.filter((role) => roleFilter === "ALL" || role.alignment === roleFilter);

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleName("");
    setRoleDesc("");
    setRoleAlign("CITIZEN");
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleName.trim()) {
      showAlert("اطلاعات ناقص", "نام نقش را وارد کنید.", "warning");
      return;
    }
    try {
      if (editingRoleId) await updateMafiaRole(editingRoleId, { name: roleName, description: roleDesc, alignment: roleAlign });
      else await createMafiaRole({ name: roleName, description: roleDesc, alignment: roleAlign });
      resetRoleForm();
      await refreshData();
      showToast("نقش ذخیره شد", "success");
    } catch (error: any) {
      showAlert("خطا", error.message || "ذخیره نقش انجام نشد.", "error");
    }
  };

  const editRole = (role: any) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setRoleAlign(role.alignment);
  };

  const removeRole = (id: string) => {
    showConfirm("حذف نقش", "این نقش از سناریوهای مرتبط هم حذف می‌شود.", async () => {
      await deleteMafiaRole(id);
      await refreshData();
      showToast("نقش حذف شد", "success");
    }, "error");
  };

  const changeUserRole = async (userId: string, nextRole: Role) => {
    try {
      await updateUserRole(userId, nextRole);
      await refreshData();
      showToast("دسترسی کاربر بروزرسانی شد", "success");
    } catch (error: any) {
      showAlert("خطا", error.message || "تغییر دسترسی انجام نشد.", "error");
    }
  };

  const toggleBan = (user: any) => {
    showConfirm(user.isBanned ? "رفع مسدودیت" : "مسدود کردن", "وضعیت دسترسی این کاربر تغییر می‌کند.", async () => {
      await banUser(user.id, !user.isBanned);
      await refreshData();
      showToast(user.isBanned ? "کاربر فعال شد" : "کاربر مسدود شد", "success");
    }, user.isBanned ? "warning" : "error");
  };

  const removeUser = (user: any) => {
    showConfirm("حذف کاربر", "حذف کاربر غیرقابل بازگشت است.", async () => {
      await deleteUser(user.id);
      await refreshData();
      showToast("کاربر حذف شد", "success");
    }, "error");
  };

  return (
    <div className="space-y-5">
      <CommandSurface className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <StatusChip tone="violet">Admin Console</StatusChip>
            <h1 className="mt-3 text-3xl font-black text-zinc-50">کنترل مرکزی</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">کاربران، نقش‌ها و سناریوها در قالب دفتر عملیاتی جدید مدیریت می‌شوند.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="کاربر" value={users.length || "-"} tone="cyan" />
            <StatCell label="نقش" value={roles.length || "-"} tone="violet" />
            <StatCell label="سناریو" value={scenarios.length || "-"} tone="emerald" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1">
          {[
            ["users", "کاربران", "group"],
            ["roles", "نقش‌ها", "theater_comedy"],
            ["scenarios", "سناریوها", "account_tree"],
          ].map(([tab, label, icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-black transition-all ${activeTab === tab ? "bg-cyan-300 text-slate-950" : "text-zinc-400 hover:text-zinc-100"}`}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </CommandSurface>

      {loading ? (
        <EmptyState icon="progress_activity" title="در حال بارگذاری..." />
      ) : activeTab === "users" ? (
        <section className="space-y-3">
          <SectionHeader title="دفتر کاربران" eyebrow="User Ledger" icon="group" />
          <CommandSurface className="p-4">
            <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="جستجوی نام، ایمیل یا نقش..." className="pm-input h-12 px-4" />
            <div className="mt-4 space-y-2">
              {filteredUsers.map((user) => (
                <div key={user.id} className="pm-ledger-row p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/10">
                        {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : <span className="font-black text-cyan-100">{(user.name || user.email || "?").slice(0, 1)}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-zinc-100">{user.name || "بدون نام"}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500" dir="ltr">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={user.role === "ADMIN" ? "violet" : user.role === "MODERATOR" ? "cyan" : "neutral"}>{roleLabel[user.role as Role]}</StatusChip>
                      <StatusChip tone={user.isBanned ? "rose" : "emerald"}>{user.isBanned ? "مسدود" : "فعال"}</StatusChip>
                      <select value={user.role} onChange={(event) => changeUserRole(user.id, event.target.value as Role)} className="pm-input h-10 w-32 px-2 text-xs">
                        <option value="USER">بازیکن</option>
                        <option value="MODERATOR">گرداننده</option>
                        <option value="ADMIN">مدیر</option>
                      </select>
                      <CommandButton tone="ghost" onClick={() => toggleBan(user)}>{user.isBanned ? "فعال" : "مسدود"}</CommandButton>
                      <CommandButton tone="rose" onClick={() => removeUser(user)}>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </CommandButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CommandSurface>
        </section>
      ) : activeTab === "roles" ? (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <CommandSurface className="h-fit p-4">
            <SectionHeader title={editingRoleId ? "ویرایش نقش" : "نقش جدید"} eyebrow="Role Builder" icon="theater_comedy" />
            <form onSubmit={saveRole} noValidate className="mt-4 space-y-3">
              <input value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="نام نقش" className="pm-input h-12 px-4" />
              <select value={roleAlign} onChange={(event) => setRoleAlign(event.target.value as Alignment)} className="pm-input h-12 px-4">
                <option value="CITIZEN">شهروند</option>
                <option value="MAFIA">مافیا</option>
                <option value="NEUTRAL">مستقل</option>
              </select>
              <textarea value={roleDesc} onChange={(event) => setRoleDesc(event.target.value)} placeholder="توضیح نقش و توانایی‌ها" className="pm-input min-h-32 px-4 py-3" />
              <div className="grid grid-cols-2 gap-2">
                <CommandButton type="submit" className="w-full">ذخیره</CommandButton>
                <CommandButton type="button" tone="ghost" onClick={resetRoleForm}>پاک کردن</CommandButton>
              </div>
            </form>
          </CommandSurface>

          <div className="space-y-3">
            <SectionHeader title="کتابخانه نقش‌ها" eyebrow="Role Library" icon="theater_comedy" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["ALL", "CITIZEN", "MAFIA", "NEUTRAL"] as const).map((filter) => (
                <button key={filter} onClick={() => setRoleFilter(filter)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black ${roleFilter === filter ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.035] text-zinc-400"}`}>
                  {filter === "ALL" ? "همه" : alignmentLabel[filter]}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {filteredRoles.map((role) => (
                <CommandSurface key={role.id} interactive className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-zinc-50">{role.name}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">{role.description || "بدون توضیح"}</p>
                    </div>
                    <StatusChip tone={role.alignment === "MAFIA" ? "rose" : role.alignment === "CITIZEN" ? "cyan" : "amber"}>{alignmentLabel[role.alignment as Alignment]}</StatusChip>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <CommandButton tone="ghost" onClick={() => editRole(role)} className="flex-1">ویرایش</CommandButton>
                    {!role.is_permanent && (
                      <CommandButton tone="rose" onClick={() => removeRole(role.id)}>
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </CommandButton>
                    )}
                  </div>
                </CommandSurface>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <ScenariosManager initialRoles={roles} initialScenarios={scenarios} />
      )}
    </div>
  );
}
