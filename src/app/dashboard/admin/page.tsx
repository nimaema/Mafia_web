"use client";

import { useEffect, useMemo, useState } from "react";
import { Alignment, Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
  banUser,
  createMafiaRole,
  deleteMafiaRole,
  deleteUser,
  exportRoleBackup,
  exportScenarioBackup,
  getAllUsers,
  getMafiaRoles,
  getScenarios,
  installStandardScenarios,
  restoreRoleBackup,
  restoreScenarioBackup,
  sendEmailToUser,
  updateMafiaRole,
  updateUserRole,
  verifyUserEmail,
} from "@/actions/admin";
import { ScenariosManager } from "@/components/admin/ScenariosManager";
import { usePopup } from "@/components/PopupProvider";
import { CommandButton, CommandSurface, EmptyState, SectionHeader, StatCell, StatusChip } from "@/components/CommandUI";
import { usePresenceSnapshot } from "@/hooks/usePresenceSnapshot";

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

type AbilityEffectType = "NONE" | "CONVERT_TO_MAFIA" | "YAKUZA" | "TWO_NAME_INQUIRY";
type RoleNightAbility = {
  id: string;
  label: string;
  usesPerGame: number | null;
  targetsPerUse: number;
  selfTargetLimit: number;
  effectType: AbilityEffectType;
  choices: { id: string; label: string; usesPerGame: null; effectType: "NONE" }[];
};

function normalizeRoleAbilities(value: unknown): RoleNightAbility[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any, index) => {
      const label = String(item?.label || "").trim();
      if (!label) return null;
      const targetsPerUse = Math.max(1, Math.min(5, Number(item?.targetsPerUse) || 1));
      return {
        id: String(item?.id || `ability-${index + 1}`),
        label,
        usesPerGame: typeof item?.usesPerGame === "number" ? item.usesPerGame : null,
        targetsPerUse,
        selfTargetLimit: Math.max(0, Math.min(5, Number(item?.selfTargetLimit) || 0)),
        effectType: ["CONVERT_TO_MAFIA", "YAKUZA", "TWO_NAME_INQUIRY"].includes(item?.effectType) ? item.effectType : "NONE",
        choices: Array.isArray(item?.choices)
          ? item.choices.slice(0, targetsPerUse).map((choice: any, choiceIndex: number) => ({
              id: String(choice?.id || `choice-${choiceIndex + 1}`),
              label: String(choice?.label || "").trim(),
              usesPerGame: null,
              effectType: "NONE" as const,
            })).filter((choice: any) => choice.label)
          : [],
      };
    })
    .filter(Boolean) as RoleNightAbility[];
}

function blankAbility(): RoleNightAbility {
  const id = `ability-${Date.now().toString(36)}`;
  return {
    id,
    label: "",
    usesPerGame: null,
    targetsPerUse: 1,
    selfTargetLimit: 0,
    effectType: "NONE",
    choices: [],
  };
}

function formatActivity(value?: string | Date | null) {
  if (!value) return "ثبت نشده";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "ثبت نشده";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "همین الان";
  if (diff < hour) return `${Math.floor(diff / minute)} دقیقه پیش`;
  if (diff < day) return `${Math.floor(diff / hour)} ساعت پیش`;
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const onlineUserIds = usePresenceSnapshot();
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
  const [roleAbilities, setRoleAbilities] = useState<RoleNightAbility[]>([]);
  const [emailUser, setEmailUser] = useState<any | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const { showAlert, showConfirm, showToast } = usePopup();
  const isAdmin = session?.user?.role === "ADMIN";

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
  const onlineIds = useMemo(
    () => new Set((onlineUserIds.members || []).map((member) => member.id)),
    [onlineUserIds.members]
  );
  const emailPreview = useMemo(
    () => emailBody.split(/\r?\n/).filter(Boolean).slice(0, 8),
    [emailBody]
  );

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleName("");
    setRoleDesc("");
    setRoleAlign("CITIZEN");
    setRoleAbilities([]);
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleName.trim()) {
      showAlert("اطلاعات ناقص", "نام نقش را وارد کنید.", "warning");
      return;
    }
    try {
      const cleanAbilities = roleAbilities
        .map((ability) => ({
          ...ability,
          label: ability.label.trim(),
          choices: ability.targetsPerUse > 1 ? ability.choices.slice(0, ability.targetsPerUse).map((choice) => ({ ...choice, label: choice.label.trim() })) : [],
        }))
        .filter((ability) => ability.label);
      if (editingRoleId) await updateMafiaRole(editingRoleId, { name: roleName, description: roleDesc, alignment: roleAlign, nightAbilities: cleanAbilities });
      else await createMafiaRole({ name: roleName, description: roleDesc, alignment: roleAlign, nightAbilities: cleanAbilities });
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
    setRoleAbilities(normalizeRoleAbilities(role.nightAbilities));
  };

  const updateAbility = (index: number, patch: Partial<RoleNightAbility>) => {
    setRoleAbilities((prev) =>
      prev.map((ability, abilityIndex) => {
        if (abilityIndex !== index) return ability;
        const next = { ...ability, ...patch };
        const targetCount = Math.max(1, Math.min(5, next.targetsPerUse || 1));
        const currentChoices = next.choices || [];
        next.choices = targetCount > 1
          ? Array.from({ length: targetCount }, (_, choiceIndex) => currentChoices[choiceIndex] || {
              id: `${next.id}-choice-${choiceIndex + 1}`,
              label: "",
              usesPerGame: null,
              effectType: "NONE" as const,
            })
          : [];
        return next;
      })
    );
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

  const verifyEmail = async (user: any) => {
    try {
      await verifyUserEmail(user.id);
      await refreshData();
      showToast("ایمیل کاربر تایید شد", "success");
    } catch (error: any) {
      showAlert("خطا", error.message || "تایید ایمیل انجام نشد.", "error");
    }
  };

  const submitEmail = async () => {
    if (!emailUser) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      showAlert("ایمیل ناقص", "موضوع و متن ایمیل را وارد کنید.", "warning");
      return;
    }
    setBusyAction("email");
    try {
      await sendEmailToUser(emailUser.id, { subject: emailSubject, body: emailBody });
      setEmailUser(null);
      setEmailSubject("");
      setEmailBody("");
      showToast("ایمیل ارسال شد", "success");
    } catch (error: any) {
      showAlert("ارسال ایمیل", error.message || "ارسال ایمیل انجام نشد.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const runRoleBackup = async (mode: "export" | "restore") => {
    setBusyAction(`role-${mode}`);
    try {
      if (mode === "export") await exportRoleBackup();
      else {
        await restoreRoleBackup();
        await refreshData();
      }
      showToast(mode === "export" ? "بکاپ نقش‌ها ساخته شد" : "بکاپ نقش‌ها بازیابی شد", "success");
    } catch (error: any) {
      showAlert("بکاپ نقش‌ها", error.message || "عملیات انجام نشد.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const runScenarioBackup = async (mode: "export" | "restore" | "install") => {
    setBusyAction(`scenario-${mode}`);
    try {
      if (mode === "export") await exportScenarioBackup();
      else if (mode === "restore") await restoreScenarioBackup();
      else await installStandardScenarios();
      await refreshData();
      showToast("کتابخانه سناریو بروزرسانی شد", "success");
    } catch (error: any) {
      showAlert("سناریوها", error.message || "عملیات انجام نشد.", "error");
    } finally {
      setBusyAction(null);
    }
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
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/10">
                        {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : <span className="font-black text-cyan-100">{(user.name || user.email || "?").slice(0, 1)}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-zinc-100">{user.name || "بدون نام"}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500" dir="ltr">{user.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <StatusChip tone={onlineIds.has(user.id) ? "emerald" : "neutral"}>
                            {onlineIds.has(user.id) ? "آنلاین" : "آفلاین"}
                          </StatusChip>
                          <StatusChip tone={user.emailVerified ? "emerald" : "amber"}>
                            {user.emailVerified ? "ایمیل تایید شده" : "ایمیل تایید نشده"}
                          </StatusChip>
                          <StatusChip tone="cyan">آخرین فعالیت: {formatActivity(user.lastActiveAt)}</StatusChip>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <StatusChip tone={user.role === "ADMIN" ? "violet" : user.role === "MODERATOR" ? "cyan" : "neutral"}>{roleLabel[user.role as Role]}</StatusChip>
                      <StatusChip tone={user.isBanned ? "rose" : "emerald"}>{user.isBanned ? "مسدود" : "فعال"}</StatusChip>
                      <StatusChip tone="neutral">{user._count?.gameHistories || 0} بازی</StatusChip>
                      <select value={user.role} onChange={(event) => changeUserRole(user.id, event.target.value as Role)} className="pm-input h-10 w-32 px-2 text-xs">
                        <option value="USER">بازیکن</option>
                        <option value="MODERATOR">گرداننده</option>
                        <option value="ADMIN">مدیر</option>
                      </select>
                      {!user.emailVerified && (
                        <CommandButton tone="emerald" onClick={() => verifyEmail(user)}>
                          تایید
                        </CommandButton>
                      )}
                      <CommandButton tone="ghost" onClick={() => setEmailUser(user)}>
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                      </CommandButton>
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
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-100">توانایی‌های شب</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">تعداد شب‌ها، تعداد هدف در هر استفاده، و حد استفاده روی خودش را تعریف کنید.</p>
                  </div>
                  <CommandButton type="button" tone="ghost" onClick={() => setRoleAbilities((prev) => [...prev, blankAbility()])}>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </CommandButton>
                </div>
                {roleAbilities.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs font-bold text-zinc-500">برای نقش‌های شب‌فعال، توانایی اضافه کنید.</p>
                ) : (
                  <div className="space-y-2">
                    {roleAbilities.map((ability, index) => (
                      <div key={ability.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <input value={ability.label} onChange={(event) => updateAbility(index, { label: event.target.value })} placeholder="نام توانایی، مثل خریداری یا نجات" className="pm-input h-10 px-3 text-sm" />
                          <button type="button" onClick={() => setRoleAbilities((prev) => prev.filter((_, i) => i !== index))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-200">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          <label className="text-[11px] font-black text-zinc-400">
                            چند شب
                            <select value={ability.usesPerGame ?? "INF"} onChange={(event) => updateAbility(index, { usesPerGame: event.target.value === "INF" ? null : Number(event.target.value) })} className="pm-input mt-1 h-10 px-2 text-xs">
                              <option value="INF">هر شب</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}</option>)}
                            </select>
                          </label>
                          <label className="text-[11px] font-black text-zinc-400">
                            روی چند نفر
                            <select value={ability.targetsPerUse} onChange={(event) => updateAbility(index, { targetsPerUse: Number(event.target.value) })} className="pm-input mt-1 h-10 px-2 text-xs">
                              {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
                            </select>
                          </label>
                          <label className="text-[11px] font-black text-zinc-400">
                            روی خودش
                            <select value={ability.selfTargetLimit} onChange={(event) => updateAbility(index, { selfTargetLimit: Number(event.target.value) })} className="pm-input mt-1 h-10 px-2 text-xs">
                              {[0, 1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
                            </select>
                          </label>
                        </div>
                        <label className="mt-2 block text-[11px] font-black text-zinc-400">
                          رفتار گزارش
                          <select value={ability.effectType} onChange={(event) => updateAbility(index, { effectType: event.target.value as AbilityEffectType })} className="pm-input mt-1 h-10 px-2 text-xs">
                            <option value="NONE">ثبت ساده</option>
                            <option value="CONVERT_TO_MAFIA">خریداری</option>
                            <option value="YAKUZA">یاکوزا</option>
                            <option value="TWO_NAME_INQUIRY">بازپرسی دو نفره</option>
                          </select>
                        </label>
                        {ability.targetsPerUse > 1 && (
                          <div className="mt-2 grid gap-2">
                            {ability.choices.map((choice, choiceIndex) => (
                              <input
                                key={choice.id}
                                value={choice.label}
                                onChange={(event) =>
                                  updateAbility(index, {
                                    choices: ability.choices.map((item, i) => i === choiceIndex ? { ...item, label: event.target.value } : item),
                                  })
                                }
                                placeholder={`نام گزینه ${choiceIndex + 1}`}
                                className="pm-input h-10 px-3 text-xs"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CommandButton type="submit" className="w-full">ذخیره</CommandButton>
                <CommandButton type="button" tone="ghost" onClick={resetRoleForm}>پاک کردن</CommandButton>
              </div>
            </form>
          </CommandSurface>

          <div className="space-y-3">
            <SectionHeader
              title="کتابخانه نقش‌ها"
              eyebrow="Role Library"
              icon="theater_comedy"
              action={isAdmin && (
                <div className="flex gap-2">
                  <CommandButton tone="ghost" onClick={() => runRoleBackup("export")} disabled={busyAction === "role-export"}>بکاپ</CommandButton>
                  <CommandButton tone="ghost" onClick={() => runRoleBackup("restore")} disabled={busyAction === "role-restore"}>بازیابی</CommandButton>
                </div>
              )}
            />
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
                    <StatusChip tone={normalizeRoleAbilities(role.nightAbilities).length ? "violet" : "neutral"}>
                      {normalizeRoleAbilities(role.nightAbilities).length || 0} توانایی
                    </StatusChip>
                    <CommandButton tone="rose" onClick={() => removeRole(role.id)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </CommandButton>
                  </div>
                </CommandSurface>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {isAdmin && (
            <CommandSurface className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-zinc-50">پشتیبان سناریوها</p>
                  <p className="mt-1 text-sm text-zinc-400">سناریوهای فعلی را ذخیره، بازیابی یا استانداردها را دوباره همگام کنید.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CommandButton tone="ghost" onClick={() => runScenarioBackup("export")} disabled={busyAction === "scenario-export"}>بکاپ</CommandButton>
                  <CommandButton tone="ghost" onClick={() => runScenarioBackup("restore")} disabled={busyAction === "scenario-restore"}>بازیابی</CommandButton>
                  <CommandButton tone="violet" onClick={() => runScenarioBackup("install")} disabled={busyAction === "scenario-install"}>همگام‌سازی</CommandButton>
                </div>
              </div>
            </CommandSurface>
          )}
          <ScenariosManager initialRoles={roles} initialScenarios={scenarios} />
        </div>
      )}

      {emailUser && (
        <div className="fixed inset-0 z-[240] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md md:items-center">
          <CommandSurface className="pm-safe-sheet grid w-full max-w-4xl gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StatusChip tone="cyan">ارسال ایمیل</StatusChip>
                  <h3 className="mt-3 text-xl font-black text-zinc-50">{emailUser.name || emailUser.email}</h3>
                  <p className="mt-1 text-xs text-zinc-400" dir="ltr">{emailUser.email}</p>
                </div>
                <button onClick={() => setEmailUser(null)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="mt-5 space-y-3">
                <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} placeholder="موضوع ایمیل" className="pm-input h-12 px-4" />
                <textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} placeholder={"متن ایمیل\n# تیتر\n- آیتم لیست\n> نکته مهم"} className="pm-input min-h-56 px-4 py-3" />
                <CommandButton onClick={submitEmail} disabled={busyAction === "email"} className="w-full">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  ارسال ایمیل
                </CommandButton>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200/70">Preview</p>
              <h4 className="mt-3 text-2xl font-black text-zinc-50">{emailSubject || "موضوع ایمیل"}</h4>
              <div className="mt-4 space-y-2">
                {(emailPreview.length ? emailPreview : ["پیش‌نمایش متن ایمیل اینجا نمایش داده می‌شود."]).map((line, index) => (
                  <p key={`${line}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-7 text-zinc-300">{line.replace(/^#\s*/, "").replace(/^[- >]\s*/, "")}</p>
                ))}
              </div>
            </div>
          </CommandSurface>
        </div>
      )}
    </div>
  );
}
