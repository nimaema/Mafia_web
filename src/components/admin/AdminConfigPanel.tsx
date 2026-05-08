"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createMafiaRole,
  updateMafiaRole,
  deleteMafiaRole,
  exportRoleBackup,
  downloadRoleBackupJson,
  importRoleBackupJson,
  createScenario,
  updateScenario,
  deleteScenario,
  installStandardScenarios,
  exportScenarioBackup,
  downloadScenarioBackupJson,
  importScenarioBackupJson,
  restoreScenarioBackup,
  restoreRoleBackup,
  getMafiaRolesSafe,
  getScenariosSafe,
} from "@/actions/admin";
import { Alignment } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePopup } from "@/components/PopupProvider";
import { ScenarioRoleComposition } from "@/components/ScenarioRoleComposition";

type AdminTab = "roles" | "scenarios";
type RoleAlignmentFilter = "ALL" | Alignment;
type AbilityEffectType = "NONE" | "CONVERT_TO_MAFIA" | "YAKUZA" | "TWO_NAME_INQUIRY";

type RoleNightAbilityChoice = {
  id: string;
  label: string;
  usesPerGame: number | null;
  effectType: AbilityEffectType;
};

type RoleNightAbility = {
  id: string;
  label: string;
  usesPerGame: number | null;
  usesPerNight: number | null;
  targetsPerUse: number;
  selfTargetLimit: number | null;
  effectType: AbilityEffectType;
  choices: RoleNightAbilityChoice[];
};

type MafiaRoleRecord = {
  id: string;
  name: string;
  description: string | null;
  alignment: Alignment;
  is_permanent: boolean;
  nightAbilities?: RoleNightAbility[] | null;
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

const STANDARD_SCENARIO_NAMES = [
  "کلاسیک ۱۲ نفره",
  "کلاسیک ۱۳ نفره",
  "نماینده ۱۰ نفره",
  "نماینده ۱۲ نفره",
  "نماینده ۱۳ نفره",
  "فراماسون ۱۲ نفره",
  "فراماسون ۱۳ نفره",
  "فراماسون ۱۵ نفره",
  "تکاور ۱۰ نفره",
  "تکاور ۱۲ نفره",
  "تکاور ۱۳ نفره",
  "تکاور ۱۵ نفره",
  "کاپو ۱۰ نفره",
  "کاپو ۱۲ نفره",
  "کاپو ۱۳ نفره",
];

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
    throw new Error("حجم فایل JSON خیلی زیاد است. فایل نقش‌ها یا سناریوها باید کمتر از ۲ مگابایت باشد.");
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

function normalizeEffectType(value: unknown): AbilityEffectType {
  if (value === "CONVERT_TO_MAFIA" || value === "YAKUZA" || value === "TWO_NAME_INQUIRY") return value;
  return "NONE";
}

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

function normalizeRoleAbilities(value: unknown): RoleNightAbility[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((ability, index) => {
      const record = ability as Partial<RoleNightAbility>;
      const label = String(record.label || "").trim();
      if (!label) return null;
      return {
        id: String(record.id || `ability-${index + 1}`),
        label,
        usesPerGame: typeof record.usesPerGame === "number" ? record.usesPerGame : null,
        usesPerNight: typeof record.usesPerNight === "number" ? record.usesPerNight : null,
        targetsPerUse: typeof record.targetsPerUse === "number" ? Math.max(1, Math.min(5, record.targetsPerUse)) : 1,
        selfTargetLimit: typeof record.selfTargetLimit === "number" ? Math.max(0, Math.min(5, record.selfTargetLimit)) : 0,
        effectType: normalizeEffectType(record.effectType),
        choices: Array.isArray(record.choices)
          ? record.choices
              .map((choice, choiceIndex) => {
                const choiceLabel = String(choice.label || "").trim();
                if (!choiceLabel) return null;
                return {
                  id: String(choice.id || `choice-${choiceIndex + 1}`),
                  label: choiceLabel,
                  usesPerGame: typeof choice.usesPerGame === "number" ? choice.usesPerGame : null,
                  effectType: normalizeEffectType(choice.effectType),
                };
              })
              .filter(Boolean) as RoleNightAbilityChoice[]
          : [],
      };
    })
    .filter(Boolean) as RoleNightAbility[];
}

function nightLimitLabel(value: number | null) {
  return value ? `فقط ${value} شب در کل بازی` : "قابل استفاده در هر شب";
}

function abilityUsageLabel(ability: RoleNightAbility) {
  const targetCount = ability.targetsPerUse || 1;
  const selfLimit = ability.selfTargetLimit ?? 0;
  const parts = [nightLimitLabel(ability.usesPerGame)];
  parts.push(targetCount > 1 ? `هر ثبت شامل ${targetCount} هدف/گزینه` : "هر ثبت روی ۱ هدف");
  parts.push(selfLimit > 0 ? `روی خودش تا ${selfLimit} بار` : "روی خودش مجاز نیست");
  if (ability.choices.length) parts.push(`${ability.choices.length} نام برای هدف‌ها`);
  return parts.join("، ");
}

function abilityNeedsChoices(ability: RoleNightAbility) {
  return (ability.targetsPerUse || 1) > 1;
}

function requiredChoiceCount(ability: RoleNightAbility) {
  return Math.max(2, Math.min(5, ability.targetsPerUse || 1));
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
  const [newRoleAbilities, setNewRoleAbilities] = useState<RoleNightAbility[]>([]);

  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [newScenName, setNewScenName] = useState("");
  const [newScenDesc, setNewScenDesc] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<{ roleId: string; count: number }[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioRecord | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleAlignmentFilter, setRoleAlignmentFilter] = useState<RoleAlignmentFilter>("ALL");
  const [roleBackupBusy, setRoleBackupBusy] = useState(false);
  const [scenarioSearch, setScenarioSearch] = useState("");
  const [scenarioRoleSearch, setScenarioRoleSearch] = useState("");
  const [scenarioBackupBusy, setScenarioBackupBusy] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    const tab = searchParams.get("tab");
    if (tab === "users") {
      router.replace(isAdmin ? "/dashboard/admin/users" : "/dashboard/admin?tab=roles");
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
    setNewRoleAbilities([]);
  };

  const resetScenarioForm = () => {
    setEditingScenarioId(null);
    setNewScenName("");
    setNewScenDesc("");
    setSelectedRoles([]);
    setScenarioRoleSearch("");
  };

  const handleAddRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRoleName.trim()) {
      showAlert("نام نقش", "نام نقش را وارد کنید.", "warning");
      return;
    }
    const incompleteMultiUseAbility = newRoleAbilities.find((ability) => {
      if (!ability.label.trim() || !abilityNeedsChoices(ability)) return false;
      const filledChoices = ability.choices.filter((choice) => choice.label.trim()).length;
      return filledChoices < requiredChoiceCount(ability);
    });

    if (incompleteMultiUseAbility) {
      showAlert(
        "انتخاب‌های توانایی",
        `برای «${incompleteMultiUseAbility.label}» باید نام ${requiredChoiceCount(incompleteMultiUseAbility)} گزینه را وارد کنید.`,
        "warning"
      );
      return;
    }

    try {
      if (editingRoleId) {
        await updateMafiaRole(editingRoleId, {
          name: newRoleName,
          description: newRoleDesc,
          alignment: newRoleAlign,
          nightAbilities: newRoleAbilities,
        });
        showToast("نقش بروزرسانی شد", "success");
      } else {
        await createMafiaRole({
          name: newRoleName,
          description: newRoleDesc,
          alignment: newRoleAlign,
          nightAbilities: newRoleAbilities,
        });
        showToast("نقش جدید ثبت شد", "success");
      }

      resetRoleForm();
      await refreshData();
    } catch (error: any) {
      console.error(error);
      showAlert("خطا", error.message || "ثبت نقش ناموفق بود", "error");
    }
  };

  const handleEditRole = (role: MafiaRoleRecord) => {
    setEditingRoleId(role.id);
    setNewRoleName(role.name);
    setNewRoleDesc(role.description || "");
    setNewRoleAlign(role.alignment);
    setNewRoleAbilities(normalizeRoleAbilities(role.nightAbilities));
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

  const handleRoleBackup = async () => {
    setRoleBackupBusy(true);
    try {
      const result = await exportRoleBackup();
      showToast(`${result.roles} نقش در فایل سرور ذخیره شد`, "success");
    } catch (error: any) {
      showAlert("بکاپ نقش‌ها", error.message || "بکاپ نقش‌ها انجام نشد.", "error");
    } finally {
      setRoleBackupBusy(false);
    }
  };

  const handleRoleDownload = async () => {
    setRoleBackupBusy(true);
    try {
      const result = await downloadRoleBackupJson();
      downloadJsonFile(result.backup, `playmafia-roles-${backupFileDate()}.json`);
      showToast(`${result.roles} نقش به صورت JSON دانلود شد`, "success");
    } catch (error: any) {
      showAlert("دانلود JSON نقش‌ها", error.message || "دانلود JSON نقش‌ها انجام نشد.", "error");
    } finally {
      setRoleBackupBusy(false);
    }
  };

  const handleRoleJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const payload = await readJsonUpload(file);
      showConfirm(
        "به‌روزرسانی نقش‌ها از JSON",
        "نقش‌های داخل فایل روی دیتابیس اعمال می‌شوند. نقش‌های هم‌نام بروزرسانی می‌شوند و بقیه نقش‌های فعلی حذف نمی‌شوند.",
        async () => {
          setRoleBackupBusy(true);
          try {
            const result = await importRoleBackupJson(payload);
            showToast(`${result.roles} نقش از فایل JSON اعمال شد`, "success");
            await refreshData();
          } catch (error: any) {
            showAlert("آپلود JSON نقش‌ها", error.message || "آپلود JSON نقش‌ها انجام نشد.", "error");
          } finally {
            setRoleBackupBusy(false);
          }
        },
        "warning"
      );
    } catch (error: any) {
      showAlert("فایل JSON", error.message || "فایل JSON قابل خواندن نیست.", "error");
    }
  };

  const handleRoleRestore = () => {
    showConfirm(
      "بازیابی نقش‌ها",
      "نقش‌های داخل فایل بکاپ روی دیتابیس اعمال می‌شوند. نقش‌های موجود حذف نمی‌شوند، اما موارد هم‌نام بروزرسانی می‌شوند.",
      async () => {
        setRoleBackupBusy(true);
        try {
          const result = await restoreRoleBackup();
          showToast(`${result.roles} نقش از فایل بکاپ اعمال شد`, "success");
          await refreshData();
        } catch (error: any) {
          showAlert("بازیابی نقش‌ها", error.message || "بازیابی نقش‌ها انجام نشد.", "error");
        } finally {
          setRoleBackupBusy(false);
        }
      },
      "warning"
    );
  };

  const handleAddScenario = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newScenName.trim()) {
      showAlert("نام سناریو", "نام سناریو را وارد کنید.", "warning");
      return;
    }

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

  const handleDuplicateScenario = (scenario: ScenarioRecord) => {
    setEditingScenarioId(null);
    setNewScenName(`${scenario.name} کپی`);
    setNewScenDesc(scenario.description || "");
    setSelectedRoles(
      scenario.roles.map((role) => ({
        roleId: role.roleId,
        count: role.count,
      }))
    );
    setSelectedScenario(null);
    setScenarioRoleSearch("");
    switchTab("scenarios");
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
          setSelectedScenario(null);
          await refreshData();
        } catch (error) {
          console.error(error);
          showAlert("خطا", "حذف سناریو ناموفق بود", "error");
        }
      },
      "error"
    );
  };

  const handleScenarioBackup = async () => {
    setScenarioBackupBusy(true);
    try {
      const result = await exportScenarioBackup();
      showToast(`${result.scenarios} سناریو در فایل سرور ذخیره شد`, "success");
    } catch (error: any) {
      showAlert("بکاپ سناریو", error.message || "بکاپ سناریو انجام نشد.", "error");
    } finally {
      setScenarioBackupBusy(false);
    }
  };

  const handleScenarioDownload = async () => {
    setScenarioBackupBusy(true);
    try {
      const result = await downloadScenarioBackupJson();
      downloadJsonFile(result.backup, `playmafia-scenarios-${backupFileDate()}.json`);
      showToast(`${result.scenarios} سناریو به صورت JSON دانلود شد`, "success");
    } catch (error: any) {
      showAlert("دانلود JSON سناریوها", error.message || "دانلود JSON سناریوها انجام نشد.", "error");
    } finally {
      setScenarioBackupBusy(false);
    }
  };

  const handleScenarioJsonUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const payload = await readJsonUpload(file);
      showConfirm(
        "به‌روزرسانی سناریوها از JSON",
        "سناریوها و نقش‌های داخل فایل روی دیتابیس اعمال می‌شوند. موارد هم‌نام بروزرسانی می‌شوند و سناریوهای دیگر حذف نمی‌شوند.",
        async () => {
          setScenarioBackupBusy(true);
          try {
            const result = await importScenarioBackupJson(payload);
            showToast(`${result.scenarios} سناریو و ${result.roles} نقش از JSON اعمال شد`, "success");
            await refreshData();
          } catch (error: any) {
            showAlert("آپلود JSON سناریوها", error.message || "آپلود JSON سناریوها انجام نشد.", "error");
          } finally {
            setScenarioBackupBusy(false);
          }
        },
        "warning"
      );
    } catch (error: any) {
      showAlert("فایل JSON", error.message || "فایل JSON قابل خواندن نیست.", "error");
    }
  };

  const handleScenarioRestore = () => {
    showConfirm(
      "بازیابی سناریوها",
      "سناریوهای داخل فایل بکاپ روی دیتابیس اعمال می‌شوند. سناریوهای موجود حذف نمی‌شوند، اما موارد هم‌نام بروزرسانی می‌شوند.",
      async () => {
        setScenarioBackupBusy(true);
        try {
          const result = await restoreScenarioBackup();
          showToast(`${result.scenarios} سناریو از فایل بکاپ اعمال شد`, "success");
          await refreshData();
        } catch (error: any) {
          showAlert("بازیابی سناریو", error.message || "بازیابی از فایل انجام نشد.", "error");
        } finally {
          setScenarioBackupBusy(false);
        }
      },
      "warning"
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

  const updateRoleAbility = (abilityId: string, patch: Partial<RoleNightAbility>) => {
    setNewRoleAbilities((previous) =>
      previous.map((ability) => (ability.id === abilityId ? { ...ability, ...patch } : ability))
    );
  };

  const updateAbilityTargetsPerUse = (abilityId: string, value: number) => {
    setNewRoleAbilities((previous) =>
      previous.map((ability) => {
        if (ability.id !== abilityId) return ability;
        const targetsPerUse = Math.max(1, Math.min(5, value));
        const nextAbility = { ...ability, targetsPerUse };
        if (!abilityNeedsChoices(nextAbility)) return { ...nextAbility, choices: [] };

        const minimumChoices = requiredChoiceCount(nextAbility);
        const choices = [...nextAbility.choices].slice(0, minimumChoices);
        while (choices.length < minimumChoices) {
          choices.push({ id: `choice-${Date.now()}-${choices.length}`, label: "", usesPerGame: null, effectType: "NONE" });
        }
        return { ...nextAbility, choices };
      })
    );
  };

  const updateAbilityChoice = (abilityId: string, choiceId: string, patch: Partial<RoleNightAbilityChoice>) => {
    setNewRoleAbilities((previous) =>
      previous.map((ability) =>
        ability.id === abilityId
          ? {
              ...ability,
              choices: ability.choices.map((choice) =>
                choice.id === choiceId ? { ...choice, ...patch } : choice
              ),
            }
          : ability
      )
    );
  };

  const stats = useMemo(
    () => ({
      roles: roles.length,
      citizenRoles: roles.filter((role) => role.alignment === "CITIZEN").length,
      mafiaRoles: roles.filter((role) => role.alignment === "MAFIA").length,
      scenarios: scenarios.length,
    }),
    [roles, scenarios]
  );

  const installedStandardScenarios = useMemo(
    () => STANDARD_SCENARIO_NAMES.every((name) => scenarios.some((scenario) => scenario.name === name)),
    [scenarios]
  );

  const visibleRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    return roles.filter((role) => {
      const matchesAlignment = roleAlignmentFilter === "ALL" || role.alignment === roleAlignmentFilter;
      const matchesQuery =
        !query ||
        [
          role.name,
          role.description || "",
          alignmentLabel(role.alignment),
          ...normalizeRoleAbilities(role.nightAbilities).flatMap((ability) => [
            ability.label,
            ...ability.choices.map((choice) => choice.label),
          ]),
        ]
          .some((value) => value.toLowerCase().includes(query));
      return matchesAlignment && matchesQuery;
    });
  }, [roleAlignmentFilter, roleSearch, roles]);

  const visibleRoleGroups = useMemo(
    () =>
      (["CITIZEN", "MAFIA", "NEUTRAL"] as Alignment[])
        .map((alignment) => ({
          alignment,
          roles: visibleRoles.filter((role) => role.alignment === alignment),
        }))
        .filter((group) => group.roles.length > 0),
    [visibleRoles]
  );

  const visibleScenarios = useMemo(() => {
    const query = normalizeSearchText(scenarioSearch);
    if (!query) return scenarios;
    return scenarios.filter((scenario) => normalizeSearchText(scenario.name).includes(query));
  }, [scenarioSearch, scenarios]);

  const selectedScenarioRoleMap = useMemo(
    () => new Map(selectedRoles.map((role) => [role.roleId, role.count])),
    [selectedRoles]
  );

  const scenarioRoleOptions = useMemo(() => {
    const query = normalizeSearchText(scenarioRoleSearch);
    const visibleRoleOptions = query
      ? roles.filter((role) => normalizeSearchText(role.name).includes(query))
      : roles;

    return [...visibleRoleOptions].sort((left, right) => {
      const leftCount = selectedScenarioRoleMap.get(left.id) || 0;
      const rightCount = selectedScenarioRoleMap.get(right.id) || 0;
      if (leftCount !== rightCount) return rightCount - leftCount;
      return left.name.localeCompare(right.name, "fa");
    });
  }, [roles, scenarioRoleSearch, selectedScenarioRoleMap]);

  return (
    <div className="flex min-h-[80vh] flex-col gap-5" dir="rtl">
      <header className="pm-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="pm-icon-primary size-14">
              <span className="material-symbols-outlined text-3xl">theater_comedy</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--pm-primary)]">طراحی و پیکربندی بازی</p>
              <h1 className="mt-1 text-3xl font-black text-[var(--pm-text)]">سناریوها و نقش‌ها</h1>
              <p className="mt-1 text-sm leading-6 text-[var(--pm-muted)]">
                نقش‌های قابل استفاده، سناریوهای آماده و ترکیب نفرات هر بازی را از این بخش مدیریت کنید.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--pm-line)] bg-zinc-100 p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
              <button
                onClick={() => switchTab("roles")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${
                  activeTab === "roles"
                    ? "bg-[var(--pm-primary)] text-zinc-950 shadow-sm"
                    : "text-[var(--pm-muted)] hover:bg-white dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="material-symbols-outlined text-lg">theater_comedy</span>
                نقش‌ها
              </button>
              <button
                onClick={() => switchTab("scenarios")}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition-colors ${
                  activeTab === "scenarios"
                    ? "bg-[var(--pm-primary)] text-zinc-950 shadow-sm"
                    : "text-[var(--pm-muted)] hover:bg-white dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="material-symbols-outlined text-lg">account_tree</span>
                سناریوها
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="pm-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStats((value) => !value)}
          className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-right"
        >
          <div>
            <p className="text-sm font-black text-[var(--pm-text)]">نمای کلی پیکربندی</p>
            <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">
              {stats.roles} نقش، {stats.scenarios} سناریو و ترکیب‌های آماده بازی
            </p>
          </div>
          <span className="material-symbols-outlined text-[var(--pm-muted)]">
            {showStats ? "keyboard_arrow_up" : "keyboard_arrow_down"}
          </span>
        </button>

        {showStats && (
          <div className="grid gap-3 border-t border-[var(--pm-line)] p-4 dark:border-[var(--pm-line)] md:grid-cols-2 xl:grid-cols-4">
            {[
              ["کل نقش‌ها", stats.roles, "theater_comedy", "text-[var(--pm-primary)]"],
              ["شهروند", stats.citizenRoles, "verified_user", "text-sky-500"],
              ["مافیا", stats.mafiaRoles, "local_police", "text-red-500"],
              ["سناریو", stats.scenarios, "account_tree", "text-amber-500"],
            ].map(([label, value, icon, color]) => (
              <div key={label} className="pm-muted-card group overflow-hidden p-4 transition-colors hover:border-[var(--pm-primary)]/25">
                <div className="flex items-center justify-between gap-3">
                  <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                  <span className="h-1.5 w-10 rounded-full bg-zinc-200 transition-colors group-hover:bg-[var(--pm-primary)] dark:bg-white/10"></span>
                </div>
                <p className="mt-3 text-2xl font-black text-[var(--pm-text)]">{value}</p>
                <p className="mt-1 text-xs font-bold text-[var(--pm-muted)]">{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <main className="pm-card relative min-h-[520px] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/92 p-6 backdrop-blur-xl dark:bg-zinc-900/92">
            <div className="w-full max-w-md rounded-2xl border border-[var(--pm-line)] bg-white p-5 text-center shadow-2xl shadow-zinc-950/10 dark:border-[var(--pm-line)] dark:bg-zinc-950">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--pm-primary)] text-zinc-950 shadow-lg shadow-[var(--pm-primary)]/20">
                <span className="material-symbols-outlined animate-spin text-3xl leading-none">progress_activity</span>
              </div>
              <p className="mt-4 text-base font-black text-[var(--pm-text)]">در حال همگام‌سازی مرکز پیکربندی</p>
              <p className="mt-2 text-xs font-bold leading-6 text-[var(--pm-muted)]">
                نقش‌ها، سناریوها و توانایی‌های بازی برای نمایش دقیق آماده می‌شوند.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["نقش‌ها", "سناریوها", "توانایی‌ها"].map((item) => (
                  <span key={item} className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2 py-1.5 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.04] dark:text-[var(--pm-muted)]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 p-6 text-center">
            <div className="pm-icon size-16 text-red-500">
              <span className="material-symbols-outlined text-3xl">cloud_off</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--pm-text)]">بارگذاری اطلاعات ناموفق بود</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--pm-muted)]">{errorMessage}</p>
            </div>
            <button onClick={refreshData} className="pm-button-primary">
              <span className="material-symbols-outlined text-xl">refresh</span>
              تلاش دوباره
            </button>
          </div>
        ) : activeTab === "roles" ? (
          <div className="grid min-h-[520px] gap-0 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="border-b border-[var(--pm-line)] bg-zinc-50/70 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03] xl:border-b-0 xl:border-l">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--pm-text)]">
                    {editingRoleId ? "ویرایش نقش" : "نقش جدید"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">
                    نام، جبهه و توضیح توانایی هر نقش را تعریف کنید.
                  </p>
                </div>
                {editingRoleId && (
                  <button onClick={resetRoleForm} className="pm-button-secondary min-h-9 px-3 text-xs">
                    لغو
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-white text-sky-700 dark:bg-zinc-950 dark:text-sky-300">
                      <span className="material-symbols-outlined text-lg">cloud_done</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[var(--pm-text)]">پشتیبان نقش‌ها</p>
                      <p className="mt-1 text-[10px] leading-5 text-[var(--pm-muted)]">
                        نقش‌ها را روی سرور نگه دارید، یا نسخه JSON همین وضعیت را دانلود و با فایل JSON بروزرسانی کنید.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleRoleBackup}
                      disabled={roleBackupBusy}
                      className="pm-button-secondary min-h-9 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">backup</span>
                      ذخیره بکاپ
                    </button>
                    <button
                      type="button"
                      onClick={handleRoleRestore}
                      disabled={roleBackupBusy}
                      className="pm-button-secondary min-h-9 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">settings_backup_restore</span>
                      بازیابی
                    </button>
                    <button
                      type="button"
                      onClick={handleRoleDownload}
                      disabled={roleBackupBusy}
                      className="pm-button-secondary min-h-9 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      JSON
                    </button>
                    <label className={`pm-button-secondary min-h-9 cursor-pointer px-3 text-xs ${roleBackupBusy ? "pointer-events-none opacity-60" : ""}`}>
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      آپلود
                      <input type="file" accept="application/json,.json" className="hidden" onChange={handleRoleJsonUpload} disabled={roleBackupBusy} />
                    </label>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddRole} noValidate className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[var(--pm-muted)]">نام نقش</label>
                  <input
                    value={newRoleName}
                    onChange={(event) => setNewRoleName(event.target.value)}
                    placeholder="مثلا تفنگدار"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[var(--pm-muted)]">جبهه</label>
                  <select value={newRoleAlign} onChange={(event) => setNewRoleAlign(event.target.value as Alignment)}>
                    <option value="CITIZEN">شهروند</option>
                    <option value="MAFIA">مافیا</option>
                    <option value="NEUTRAL">مستقل</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[var(--pm-muted)]">توضیح توانایی</label>
                  <textarea
                    value={newRoleDesc}
                    onChange={(event) => setNewRoleDesc(event.target.value)}
                    placeholder="رفتار یا توانایی ویژه نقش را شرح دهید."
                    className="min-h-28 resize-none"
                  />
                </div>

                <div className="rounded-lg border border-[var(--pm-line)] bg-white p-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[var(--pm-text)]">توانایی‌های شب همین نقش</p>
                      <p className="mt-1 text-[10px] leading-5 text-[var(--pm-muted)]">
                        فقط برای نقشی که در حال ساخت یا ویرایش است اعمال می‌شود؛ مثل دکتر، گادفادر، بازپرس یا تفنگدار.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNewRoleAbilities((previous) => [
                          ...previous,
                          {
                            id: `ability-${Date.now()}`,
                            label: "",
                            usesPerGame: null,
                            usesPerNight: 1,
                            targetsPerUse: 1,
                            selfTargetLimit: 0,
                            effectType: "NONE",
                            choices: [],
                          },
                        ])
                      }
                      className="pm-button-secondary min-h-9 shrink-0 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      افزودن
                    </button>
                  </div>

                  {newRoleAbilities.length === 0 ? (
                    <div className="mt-3 rounded-lg border border-dashed border-[var(--pm-line)] bg-zinc-50 p-3 text-xs font-bold leading-5 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                      اگر نقش در شب اکشن خاصی ندارد، این بخش را خالی بگذارید. شلیک مافیا جداگانه و به جبهه مافیا وصل است.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {newRoleAbilities.map((ability) => (
                        <div key={ability.id} className="overflow-hidden rounded-lg border border-[var(--pm-line)] bg-[var(--pm-surface-soft)]">
                          <div className="p-3">
                            <div className="flex items-end gap-2">
                              <label className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="text-[10px] font-black text-[var(--pm-muted)]">نام توانایی</span>
                                <input
                                  value={ability.label}
                                  onChange={(event) =>
                                    updateRoleAbility(ability.id, { label: event.target.value.slice(0, 60) })
                                  }
                                  placeholder="مثلاً یاکوزا، نجات دکتر یا بازپرسی"
                                  className="min-h-10 text-sm"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => setNewRoleAbilities((previous) => previous.filter((item) => item.id !== ability.id))}
                                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"
                                aria-label="حذف توانایی"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <label className="flex min-w-0 flex-col gap-1">
                                <span className="text-[10px] font-black text-[var(--pm-muted)]">چند شب</span>
                                <select
                                  value={ability.usesPerGame ?? "INFINITE"}
                                  onChange={(event) =>
                                    updateRoleAbility(ability.id, {
                                      usesPerGame: event.target.value === "INFINITE" ? null : Number(event.target.value),
                                    })
                                  }
                                  className="min-h-10 text-sm"
                                >
                                  <option value="INFINITE">هر شب</option>
                                  <option value="1">۱ شب</option>
                                  <option value="2">۲ شب</option>
                                  <option value="3">۳ شب</option>
                                  <option value="4">۴ شب</option>
                                  <option value="5">۵ شب</option>
                                </select>
                              </label>

                              <label className="flex min-w-0 flex-col gap-1">
                                <span className="text-[10px] font-black text-[var(--pm-muted)]">روی چند نفر</span>
                                <select
                                  value={ability.targetsPerUse || 1}
                                  onChange={(event) =>
                                    updateAbilityTargetsPerUse(ability.id, Number(event.target.value))
                                  }
                                  className="min-h-10 text-sm"
                                >
                                  <option value="1">۱ نفر</option>
                                  <option value="2">۲ نفر</option>
                                  <option value="3">۳ نفر</option>
                                  <option value="4">۴ نفر</option>
                                  <option value="5">۵ نفر</option>
                                </select>
                              </label>

                              <label className="flex min-w-0 flex-col gap-1">
                                <span className="text-[10px] font-black text-[var(--pm-muted)]">روی خودش</span>
                                <select
                                  value={ability.selfTargetLimit ?? 0}
                                  onChange={(event) =>
                                    updateRoleAbility(ability.id, {
                                      selfTargetLimit: Number(event.target.value),
                                    })
                                  }
                                  className="min-h-10 text-sm"
                                >
                                  <option value="0">۰ بار</option>
                                  <option value="1">۱ بار</option>
                                  <option value="2">۲ بار</option>
                                  <option value="3">۳ بار</option>
                                  <option value="4">۴ بار</option>
                                  <option value="5">۵ بار</option>
                                </select>
                              </label>
                            </div>
                          </div>

                          {abilityNeedsChoices(ability) && (
                            <div className="border-t border-[var(--pm-line)] bg-white p-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/45">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-xs font-black text-[var(--pm-text)]">انتخاب‌های داخل توانایی</p>
                                  <p className="mt-1 text-[10px] leading-5 text-[var(--pm-muted)]">
                                    چون این توانایی روی چند نفر/گزینه اعمال می‌شود، نام هر گزینه را جدا وارد کنید.
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 space-y-2">
                                {ability.choices.slice(0, requiredChoiceCount(ability)).map((choice, choiceIndex) => (
                                  <div key={choice.id} className="grid gap-2 lg:grid-cols-[90px_minmax(0,1fr)]">
                                    <div className="flex min-h-9 items-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-3 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                                      گزینه {choiceIndex + 1}
                                    </div>
                                    <input
                                      value={choice.label}
                                      onChange={(event) =>
                                        updateAbilityChoice(ability.id, choice.id, {
                                          label: event.target.value.slice(0, 60),
                                        })
                                      }
                                      placeholder={choiceIndex === 0 ? "مثلاً تفنگ واقعی" : "مثلاً تفنگ مشقی"}
                                      className="min-h-9 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>

                              <p className={`mt-3 rounded-lg border px-3 py-2 text-[10px] font-bold leading-5 ${
                                ability.choices.filter((choice) => choice.label.trim()).length >= requiredChoiceCount(ability)
                                  ? "border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 text-[var(--pm-primary)]"
                                  : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              }`}>
                                نام {requiredChoiceCount(ability)} گزینه لازم است.
                              </p>
                            </div>
                          )}

                          <div className="border-t border-[var(--pm-line)] bg-white px-3 py-2 text-[10px] font-bold leading-5 text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-zinc-950/50 dark:text-[var(--pm-muted)]">
                            {abilityUsageLabel(ability)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="pm-button-primary min-h-11">
                  <span className="material-symbols-outlined text-xl">
                    {editingRoleId ? "save" : "add_circle"}
                  </span>
                  {editingRoleId ? "ذخیره تغییرات" : "ثبت نقش"}
                </button>
              </form>
            </section>

            <section className="space-y-4 p-5">
              {roles.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--pm-line)] p-8 text-center dark:border-[var(--pm-line)]">
                  <div className="pm-icon size-16">
                    <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">theater_comedy</span>
                  </div>
                  <div>
                    <p className="font-black text-[var(--pm-text)]">هنوز نقشی ثبت نشده است</p>
                    <p className="mt-1 text-sm text-[var(--pm-muted)]">برای ساخت سناریو، ابتدا چند نقش به سیستم اضافه کنید.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
                      <span className="material-symbols-outlined text-[var(--pm-muted)]">search</span>
                      <input
                        value={roleSearch}
                        onChange={(event) => setRoleSearch(event.target.value)}
                        placeholder="جستجوی نقش، جبهه یا توضیح"
                        className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                      />
                    </label>

                    <div className="custom-scrollbar flex gap-1 overflow-x-auto rounded-lg border border-[var(--pm-line)] bg-zinc-100 p-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                      {[
                        ["ALL", "همه", roles.length],
                        ["CITIZEN", "شهروند", stats.citizenRoles],
                        ["MAFIA", "مافیا", stats.mafiaRoles],
                        ["NEUTRAL", "مستقل", roles.filter((role) => role.alignment === "NEUTRAL").length],
                      ].map(([value, label, count]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRoleAlignmentFilter(value as RoleAlignmentFilter)}
                          className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-black transition-all ${
                            roleAlignmentFilter === value
                              ? "bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                              : "text-[var(--pm-muted)] hover:bg-white dark:text-[var(--pm-muted)] dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{label}</span>
                          <span className="rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] text-current dark:bg-zinc-900/40">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {visibleRoles.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--pm-line)] p-8 text-center dark:border-[var(--pm-line)]">
                      <div className="pm-icon size-16">
                        <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">manage_search</span>
                      </div>
                      <div>
                        <p className="font-black text-[var(--pm-text)]">نقشی با این جستجو پیدا نشد</p>
                        <p className="mt-1 text-sm text-[var(--pm-muted)]">عبارت جستجو را کوتاه‌تر یا متفاوت وارد کنید.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {visibleRoleGroups.map((group) => (
                        <details
                          key={group.alignment}
                          open={Boolean(roleSearch) || roleAlignmentFilter !== "ALL" || group.alignment === "CITIZEN"}
                          className="group/role-side rounded-lg border border-[var(--pm-line)] bg-zinc-50/70 p-3 dark:border-[var(--pm-line)] dark:bg-white/[0.02]"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined flex size-9 rounded-lg border ${alignmentClass(group.alignment)}`}>
                                {alignmentIcon(group.alignment)}
                              </span>
                              <div>
                                <p className="text-sm font-black text-[var(--pm-text)]">{alignmentLabel(group.alignment)}</p>
                                <p className="mt-0.5 text-[10px] font-bold text-[var(--pm-muted)]">{group.roles.length} نقش</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`hidden h-1.5 w-16 rounded-full bg-gradient-to-l sm:block ${alignmentAccentClass(group.alignment)}`} />
                              <span className="material-symbols-outlined text-[var(--pm-muted)] transition-transform group-open/role-side:rotate-180">keyboard_arrow_down</span>
                            </div>
                          </summary>

                          <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                            {group.roles.map((role) => {
                              const abilities = normalizeRoleAbilities(role.nightAbilities);

                              return (
                              <article
                                key={role.id}
                                className="group relative overflow-hidden rounded-lg border border-[var(--pm-line)] bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--pm-primary)]/30 hover:shadow-lg hover:shadow-zinc-950/5 dark:border-[var(--pm-line)] dark:bg-zinc-950/70 dark:hover:bg-zinc-950 dark:hover:shadow-black/20"
                              >
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${alignmentAccentClass(role.alignment)}`} />
                                <div className="flex items-start justify-between gap-3 pt-1">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${alignmentClass(role.alignment)}`}>
                                      <span className="material-symbols-outlined text-xl">{alignmentIcon(role.alignment)}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="truncate text-base font-black text-[var(--pm-text)]">{role.name}</h3>
                                      <p className="mt-1 text-[10px] font-bold text-[var(--pm-muted)]">{alignmentLabel(role.alignment)}</p>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 gap-1">
                                    <button
                                      onClick={() => handleEditRole(role)}
                                      className="flex size-8 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] transition-all hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)] dark:hover:text-sky-300"
                                      title="ویرایش نقش"
                                    >
                                      <span className="material-symbols-outlined text-base">edit_square</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRole(role.id)}
                                      className="flex size-8 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white"
                                      title="حذف نقش"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                  </div>
                                </div>

                                <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--pm-muted)]">
                                  {role.description || "برای این نقش هنوز توضیحی ثبت نشده است."}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--pm-line)] pt-3 dark:border-[var(--pm-line)]">
                                  {abilities.length ? (
                                    abilities.slice(0, 3).map((ability) => (
                                      <span
                                        key={`${role.id}-${ability.id}`}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 px-2 py-1 text-[10px] font-black text-[var(--pm-primary)]"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">dark_mode</span>
                                        {ability.label}، {abilityUsageLabel(ability)}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                                      بدون اکشن شب
                                    </span>
                                  )}
                                  {abilities.length > 3 && (
                                    <span className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                                      +{abilities.length - 3}
                                    </span>
                                  )}
                                </div>
                              </article>
                              );
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        ) : (
          <div className="grid min-h-[520px] gap-0 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="border-b border-[var(--pm-line)] bg-zinc-50/70 p-5 dark:border-[var(--pm-line)] dark:bg-white/[0.03] xl:border-b-0 xl:border-l">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--pm-text)]">
                    {editingScenarioId ? "ویرایش سناریو" : "طراحی سناریو"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--pm-muted)]">
                    نقش‌ها را کنار هم بچینید و ظرفیت دقیق بازی را مشخص کنید.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {editingScenarioId && (
                    <button onClick={resetScenarioForm} className="pm-button-secondary min-h-9 px-3 text-xs">
                      لغو
                    </button>
                  )}
                </div>
              </div>

              {!editingScenarioId && isAdmin && (
                <div className="mt-4 rounded-lg border border-[var(--pm-primary)]/20 bg-[var(--pm-primary)]/10 p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--pm-primary)]/20 bg-white text-cyan-700 dark:bg-zinc-950 dark:text-[var(--pm-primary)]">
                      <span className="material-symbols-outlined text-lg">cloud_done</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[var(--pm-text)]">پشتیبان سناریوها</p>
                      <p className="mt-1 text-[10px] leading-5 text-[var(--pm-muted)]">
                        وضعیت فعلی را روی سرور ذخیره کنید، یا برای انتقال/ویرایش دستی نسخه JSON بگیرید و دوباره آپلود کنید.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleScenarioBackup}
                      disabled={scenarioBackupBusy}
                      className="pm-button-secondary min-h-9 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">backup</span>
                      ذخیره بکاپ
                    </button>
                    <button
                      type="button"
                      onClick={handleScenarioRestore}
                      disabled={scenarioBackupBusy}
                      className="pm-button-secondary min-h-9 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">settings_backup_restore</span>
                      بازیابی
                    </button>
                    <button
                      type="button"
                      onClick={handleScenarioDownload}
                      disabled={scenarioBackupBusy}
                      className="pm-button-secondary min-h-9 px-3 text-xs"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      JSON
                    </button>
                    <label className={`pm-button-secondary min-h-9 cursor-pointer px-3 text-xs ${scenarioBackupBusy ? "pointer-events-none opacity-60" : ""}`}>
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      آپلود
                      <input type="file" accept="application/json,.json" className="hidden" onChange={handleScenarioJsonUpload} disabled={scenarioBackupBusy} />
                    </label>
                    {!installedStandardScenarios && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await installStandardScenarios();
                          if (result?.success) {
                            showToast("سناریوهای پیش‌فرض نصب شدند", "success");
                            await refreshData();
                          }
                        }}
                        className="pm-button-secondary col-span-2 min-h-9 px-3 text-xs"
                      >
                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                        نصب سناریوهای پیش‌فرض
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleAddScenario} noValidate className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[var(--pm-muted)]">نام سناریو</label>
                  <input
                    value={newScenName}
                    onChange={(event) => setNewScenName(event.target.value)}
                    placeholder="مثلا تکاور ۱۵ نفره"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[var(--pm-muted)]">توضیح کوتاه</label>
                  <textarea
                    value={newScenDesc}
                    onChange={(event) => setNewScenDesc(event.target.value)}
                    placeholder="هدف این سناریو یا نکته مهم اجرایی را بنویسید."
                    className="min-h-20 resize-none"
                  />
                </div>

                <div className="rounded-lg border border-[var(--pm-line)] bg-white p-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--pm-muted)]">انتخاب نقش‌ها</label>
                    <span className="rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-2.5 py-1 text-[10px] font-black text-[var(--pm-muted)] dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)]">
                      مجموع: {selectedRoles.reduce((sum, role) => sum + role.count, 0)} نفر
                    </span>
                  </div>

                  <label className="mb-3 flex min-h-10 items-center gap-2 rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-3 dark:border-[var(--pm-line)] dark:bg-white/[0.03]">
                    <span className="material-symbols-outlined text-base text-[var(--pm-muted)]">search</span>
                    <input
                      value={scenarioRoleSearch}
                      onChange={(event) => setScenarioRoleSearch(event.target.value)}
                      placeholder="جستجوی نام نقش برای سناریو"
                      className="w-full border-0 bg-transparent p-0 text-xs outline-none focus:ring-0"
                    />
                  </label>

                  <div className="custom-scrollbar max-h-80 space-y-2 overflow-y-auto">
                    {roles.length === 0 ? (
                      <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--pm-muted)]">
                        <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">playlist_add</span>
                        برای طراحی سناریو ابتدا نقش‌ها را اضافه کنید.
                      </div>
                    ) : scenarioRoleOptions.length === 0 ? (
                      <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--pm-muted)]">
                        <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">manage_search</span>
                        نقشی با این جستجو پیدا نشد.
                      </div>
                    ) : (
                      scenarioRoleOptions.map((role) => {
                        const selected = selectedRoles.find((item) => item.roleId === role.id);

                        return (
                          <div
                            key={role.id}
                            className={`rounded-lg border p-3 transition-colors ${
                              selected
                                ? "border-[var(--pm-primary)]/35 bg-[var(--pm-primary)]/10 shadow-sm shadow-[var(--pm-primary)]/10"
                                : "border-[var(--pm-line)] bg-zinc-50 hover:bg-white dark:border-[var(--pm-line)] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => toggleRoleInScenario(role.id)}
                                className="group/role-option flex flex-1 items-center gap-3 text-right"
                              >
                                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
                                  selected
                                    ? "border-cyan-400 bg-gradient-to-br from-cyan-300 to-cyan-500 text-zinc-950 shadow-sm shadow-[var(--pm-primary)]/30"
                                    : "border-zinc-300 bg-white text-zinc-300 group-hover/role-option:border-cyan-400 group-hover/role-option:text-[var(--pm-primary)] dark:border-[var(--pm-line)] dark:bg-zinc-950 dark:text-zinc-700"
                                }`}>
                                  <span className="material-symbols-outlined text-lg">{selected ? "check" : "add"}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-black text-[var(--pm-text)]">{role.name}</p>
                                  <p className="mt-1 text-[10px] text-[var(--pm-muted)]">{alignmentLabel(role.alignment)}</p>
                                </div>
                              </button>

                              {selected && (
                                <div className="flex items-center gap-2 rounded-lg border border-[var(--pm-line)] bg-white px-2 py-1 dark:border-[var(--pm-line)] dark:bg-zinc-950">
                                  <button type="button" onClick={() => updateRoleCount(role.id, -1)} className="text-[var(--pm-muted)] transition-colors hover:text-zinc-950 dark:hover:text-white">
                                    <span className="material-symbols-outlined text-base">remove</span>
                                  </button>
                                  <span className="w-4 text-center text-sm font-black text-[var(--pm-text)]">{selected.count}</span>
                                  <button type="button" onClick={() => updateRoleCount(role.id, 1)} className="text-[var(--pm-muted)] transition-colors hover:text-zinc-950 dark:hover:text-white">
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

                <button type="submit" className="pm-button-primary min-h-11">
                  <span className="material-symbols-outlined text-xl">
                    {editingScenarioId ? "save" : "library_add"}
                  </span>
                  {editingScenarioId ? "ذخیره سناریو" : "ثبت سناریو"}
                </button>
              </form>
            </section>

            <section className="space-y-4 p-5">
              {scenarios.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--pm-line)] p-8 text-center dark:border-[var(--pm-line)]">
                  <div className="pm-icon size-16">
                    <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">account_tree</span>
                  </div>
                  <div>
                    <p className="font-black text-[var(--pm-text)]">سناریویی برای نمایش وجود ندارد</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--pm-muted)]">سناریوهای پیش‌فرض را نصب کنید یا یکی را از ابتدا طراحی کنید.</p>
                  </div>
                </div>
              ) : (
                <>
                  <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--pm-line)] bg-zinc-50 px-3 dark:border-[var(--pm-line)] dark:bg-zinc-950/40">
                    <span className="material-symbols-outlined text-[var(--pm-muted)]">search</span>
                    <input
                      value={scenarioSearch}
                      onChange={(event) => setScenarioSearch(event.target.value)}
                      placeholder="جستجوی نام سناریو"
                      className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                    />
                  </label>

                  {visibleScenarios.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--pm-line)] p-8 text-center dark:border-[var(--pm-line)]">
                      <div className="pm-icon size-16">
                        <span className="material-symbols-outlined text-3xl text-[var(--pm-muted)]">manage_search</span>
                      </div>
                      <div>
                        <p className="font-black text-[var(--pm-text)]">سناریویی با این جستجو پیدا نشد</p>
                        <p className="mt-1 text-sm text-[var(--pm-muted)]">فقط نام سناریو جستجو می‌شود؛ عبارت را دقیق‌تر وارد کنید.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {visibleScenarios.map((scenario) => {
                        const totalPlayers = scenarioTotalPlayers(scenario);
                        const alignmentCounts = scenarioAlignmentCounts(scenario);
                        const dominantAlignment = scenarioDominantAlignment(scenario);
                        const composition = [
                          { label: "شهروند", value: alignmentCounts.CITIZEN, alignment: "CITIZEN" as Alignment, barClass: "bg-sky-500" },
                          { label: "مافیا", value: alignmentCounts.MAFIA, alignment: "MAFIA" as Alignment, barClass: "bg-red-500" },
                          { label: "مستقل", value: alignmentCounts.NEUTRAL, alignment: "NEUTRAL" as Alignment, barClass: "bg-amber-500" },
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
                                  {totalPlayers} نفر
                                </span>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleEditScenario(scenario);
                                  }}
                                  className="flex size-8 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] transition-all hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)] dark:hover:text-sky-300"
                                  title="ویرایش سناریو"
                                >
                                  <span className="material-symbols-outlined text-base">edit_square</span>
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDuplicateScenario(scenario);
                                  }}
                                  className="flex size-8 items-center justify-center rounded-lg border border-[var(--pm-line)] bg-zinc-50 text-[var(--pm-muted)] transition-all hover:border-[var(--pm-primary)]/30 hover:bg-[var(--pm-primary)]/10 hover:text-cyan-700 dark:border-[var(--pm-line)] dark:bg-white/[0.03] dark:text-[var(--pm-muted)] dark:hover:text-[var(--pm-primary)]"
                                  title="کپی سناریو"
                                >
                                  <span className="material-symbols-outlined text-base">content_copy</span>
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteScenario(scenario.id);
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
                                      style={{ width: `${totalPlayers > 0 ? Math.max(6, (item.value / totalPlayers) * 100) : 0}%` }}
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
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {selectedScenario && (
        <div
          className="pm-modal-layer fixed inset-0 z-[240] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm"
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
              <button
                onClick={() => setSelectedScenario(null)}
                className="pm-button-secondary min-h-10 px-3"
                aria-label="بستن"
              >
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
                  handleEditScenario(selectedScenario);
                  setSelectedScenario(null);
                }}
                className="pm-button-secondary min-h-10 flex-1 px-4"
              >
                <span className="material-symbols-outlined text-lg">edit_square</span>
                ویرایش سناریو
              </button>
              <button
                onClick={() => handleDuplicateScenario(selectedScenario)}
                className="pm-button-secondary min-h-10 flex-1 px-4"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
                کپی برای نسخه جدید
              </button>
              <button
                onClick={() => handleDeleteScenario(selectedScenario.id)}
                className="pm-button-danger min-h-10 flex-1 px-4"
              >
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
