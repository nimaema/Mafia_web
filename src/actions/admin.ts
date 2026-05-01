"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Alignment, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { gameDisplayName, TEMP_SCENARIO_DESCRIPTION_PREFIX } from "@/lib/gameDisplay";
import { sendAdminUserEmail } from "@/lib/email";
import {
  mergeRoleDefinitions,
  STANDARD_ROLE_DEFINITIONS,
  STANDARD_SCENARIO_DEFINITIONS,
  type RoleBackupFile,
  type RoleDefinition,
  type ScenarioBackupFile,
  type ScenarioDefinition,
} from "../../prisma/scenario-data";

type SafeListResult<T> = {
  success: boolean;
  data: T[];
  error?: string;
};

type RoleNightAbilityChoiceInput = {
  id?: string;
  label: string;
  usesPerGame?: number | null;
  effectType?: string | null;
};

type RoleNightAbilityInput = {
  id?: string;
  label: string;
  usesPerGame?: number | null;
  usesPerNight?: number | null;
  targetsPerUse?: number | null;
  selfTargetLimit?: number | null;
  effectType?: string | null;
  choices?: RoleNightAbilityChoiceInput[];
};

const READ_ERROR = "اطلاعات این بخش بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی کاربر را بررسی کنید.";

const persistentScenarioWhere = {
  NOT: [
    { description: { startsWith: TEMP_SCENARIO_DESCRIPTION_PREFIX } },
    { description: "سناریو ساخته شده در لحظه" },
  ],
};

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی مدیر)");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || user.role !== "ADMIN") {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی مدیر)");
  }
  return session.user.id;
}

async function checkModerator() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  });
  if (!user || user.isBanned || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }
  return session.user.id;
}

function normalizeNightAbilities(abilities?: RoleNightAbilityInput[]): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!Array.isArray(abilities)) return Prisma.JsonNull;

  const cleanLimit = (value: unknown, max = 20) =>
    value === null || value === undefined || value === ""
      ? null
      : Math.max(1, Math.min(max, Number(value) || 1));
  const cleanSelfLimit = (value: unknown) =>
    value === null || value === undefined || value === ""
      ? 0
      : Math.max(0, Math.min(5, Number(value) || 0));

  const cleanId = (value: string, fallback: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9آ-ی]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || fallback;

  const cleanAbilities = abilities
    .map((ability, index) => {
      const label = ability.label?.trim().slice(0, 60);
      if (!label) return null;
      const id = cleanId(ability.id || label, `ability-${index + 1}`);
      const targetsPerUse = cleanLimit(ability.targetsPerUse, 5) || 1;
      const needsChoices = targetsPerUse > 1;
      const choices = needsChoices && Array.isArray(ability.choices)
        ? ability.choices
            .slice(0, targetsPerUse)
            .map((choice, choiceIndex) => {
              const choiceLabel = choice.label?.trim().slice(0, 60);
              if (!choiceLabel) return null;
              return {
                id: cleanId(choice.id || choiceLabel, `${id}-choice-${choiceIndex + 1}`),
                label: choiceLabel,
                usesPerGame: null,
                effectType: "NONE",
              };
            })
            .filter(Boolean)
        : [];

      return {
        id,
        label,
        usesPerGame: cleanLimit(ability.usesPerGame),
        usesPerNight: 1,
        targetsPerUse,
        selfTargetLimit: cleanSelfLimit(ability.selfTargetLimit),
        effectType: "NONE",
        choices,
      };
    })
    .filter(Boolean);

  return cleanAbilities.length ? (cleanAbilities as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function validateNightAbilities(abilities?: RoleNightAbilityInput[]) {
  if (!Array.isArray(abilities)) return;

  for (const ability of abilities) {
    const label = ability.label?.trim();
    if (!label) continue;
    const targetsPerUse = Math.max(1, Math.min(5, Number(ability.targetsPerUse) || 1));
    if (targetsPerUse <= 1) continue;

    const filledChoices = Array.isArray(ability.choices)
      ? ability.choices.filter((choice) => choice.label?.trim()).length
      : 0;

    if (filledChoices < targetsPerUse) {
      throw new Error(`برای توانایی «${label}» باید نام ${targetsPerUse} گزینه را وارد کنید.`);
    }
  }
}

// User Management
export async function getAllUsers() {
  await checkAdmin();
  const users = await prisma.user.findMany({
    include: {
      accounts: {
        select: { provider: true }
      },
      _count: {
        select: {
          gameHistories: true,
          gamesHosted: true,
        }
      },
      gamePlayers: {
        where: {
          game: {
            status: { in: ["WAITING", "IN_PROGRESS"] },
          },
        },
        select: {
          game: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: [
      { role: "desc" },
      { email: "asc" },
    ]
  });

  return users.map((user) => ({
    ...user,
    gamePlayers: user.gamePlayers.map((record) => ({
      ...record,
      game: {
        ...record.game,
        name: gameDisplayName(record.game),
      },
    })),
  }));
}

export async function getAllUsersSafe(): Promise<SafeListResult<any>> {
  try {
    return { success: true, data: await getAllUsers() };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], error: READ_ERROR };
  }
}

export async function updateUserRole(userId: string, role: Role) {
  const adminId = await checkAdmin();
  if (adminId === userId && role !== "ADMIN") {
    throw new Error("شما نمی‌توانید نقش خودتان را تغییر دهید");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
  revalidatePath("/dashboard/admin/users");
}

export async function banUser(userId: string, isBanned: boolean) {
  const adminId = await checkAdmin();
  if (adminId === userId) {
    throw new Error("شما نمی‌توانید خودتان را مسدود کنید");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned }
  });
  revalidatePath("/dashboard/admin/users");
}

export async function deleteUser(userId: string) {
  const adminId = await checkAdmin();
  if (adminId === userId) {
    throw new Error("شما نمی‌توانید حساب کاربری خود را حذف کنید");
  }
  await prisma.user.delete({
    where: { id: userId }
  });
  revalidatePath("/dashboard/admin/users");
}

export async function verifyUserEmail(userId: string) {
  await checkAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });
  revalidatePath("/dashboard/admin/users");
}

export async function sendEmailToUser(userId: string, data: { subject: string; body: string }) {
  await checkAdmin();

  const subject = data.subject.trim();
  const body = data.body.trim();
  if (!subject || subject.length < 3) {
    throw new Error("موضوع ایمیل را کامل وارد کنید.");
  }
  if (!body || body.length < 10) {
    throw new Error("متن ایمیل باید حداقل ۱۰ کاراکتر باشد.");
  }
  if (subject.length > 120) {
    throw new Error("موضوع ایمیل خیلی طولانی است.");
  }
  if (body.length > 4000) {
    throw new Error("متن ایمیل خیلی طولانی است.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) {
    throw new Error("این کاربر ایمیل قابل ارسال ندارد.");
  }

  const result = await sendAdminUserEmail(user.email, subject, body);
  if (!result.delivered) {
    throw new Error("ارسال ایمیل انجام نشد. تنظیمات سرویس ایمیل را بررسی کنید.");
  }

  return { success: true };
}

// Role Management
export async function getMafiaRoles() {
  await checkModerator();
  return await prisma.mafiaRole.findMany({
    orderBy: { alignment: 'asc' }
  });
}

export async function getMafiaRolesSafe(): Promise<SafeListResult<any>> {
  try {
    return { success: true, data: await getMafiaRoles() };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], error: READ_ERROR };
  }
}

export async function createMafiaRole(data: { name: string; description: string; alignment: Alignment; nightAbilities?: RoleNightAbilityInput[] }) {
  await checkModerator();
  validateNightAbilities(data.nightAbilities);
  const role = await prisma.mafiaRole.create({
    data: {
      name: data.name,
      description: data.description,
      alignment: data.alignment,
      is_permanent: false,
      nightAbilities: normalizeNightAbilities(data.nightAbilities),
    }
  });
  revalidatePath("/dashboard/admin");
  return role;
}

export async function updateMafiaRole(id: string, data: { name: string; description: string; alignment: Alignment; nightAbilities?: RoleNightAbilityInput[] }) {
  await checkModerator();
  validateNightAbilities(data.nightAbilities);
  const role = await prisma.mafiaRole.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      alignment: data.alignment,
      nightAbilities: normalizeNightAbilities(data.nightAbilities),
    }
  });
  revalidatePath("/dashboard/admin");
  return role;
}

export async function deleteMafiaRole(id: string) {
  await checkModerator();

  // Delete associated scenario roles first (Prisma handles this if onDelete: Cascade is set, but it's not set for ScenarioRole -> MafiaRole)
  await prisma.scenarioRole.deleteMany({ where: { roleId: id } });
  
  await prisma.mafiaRole.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
}

export async function exportRoleBackup() {
  await checkModerator();
  const { writeRoleBackupFile } = await import("../../prisma/scenario-backup");

  const roles = await prisma.mafiaRole.findMany({
    orderBy: [{ alignment: "asc" }, { name: "asc" }],
  });

  const backup: RoleBackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    roles: roles.map((role) => ({
      name: role.name,
      alignment: role.alignment,
      description: role.description || "",
      is_permanent: role.is_permanent,
      nightAbilities: role.nightAbilities,
    })),
  };

  const filePath = await writeRoleBackupFile(backup);
  return { success: true, filePath, roles: backup.roles.length };
}

export async function restoreRoleBackup() {
  await checkModerator();
  const { readRoleBackupFile, roleBackupPath } = await import("../../prisma/scenario-backup");

  const backup = await readRoleBackupFile();
  if (!backup) {
    throw new Error(`فایل بکاپ نقش‌ها پیدا نشد یا قابل خواندن نیست: ${roleBackupPath()}`);
  }

  const result = await syncScenarioDefinitions(
    mergeRoleDefinitions(STANDARD_ROLE_DEFINITIONS, backup.roles),
    []
  );

  return { success: true, roles: result.roles, filePath: roleBackupPath() };
}

// Scenario Management
export async function getScenarios() {
  await checkModerator();
  return await prisma.scenario.findMany({
    where: persistentScenarioWhere,
    include: {
      roles: {
        include: {
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getScenariosSafe(): Promise<SafeListResult<any>> {
  try {
    return { success: true, data: await getScenarios() };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], error: READ_ERROR };
  }
}

export async function createScenario(data: { name: string, description: string, roles: { roleId: string, count: number }[] }) {
  await checkModerator();
  
  const scenario = await prisma.scenario.create({
    data: {
      name: data.name,
      description: data.description,
      roles: {
        create: data.roles.map(r => ({
          count: r.count,
          role: { connect: { id: r.roleId } }
        }))
      }
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/moderator/scenarios");
  return scenario;
}

export async function updateScenario(id: string, data: { name: string, description: string, roles: { roleId: string, count: number }[] }) {
  await checkModerator();

  // First delete old roles
  await prisma.scenarioRole.deleteMany({
    where: { scenarioId: id }
  });

  const scenario = await prisma.scenario.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      roles: {
        create: data.roles.map(r => ({
          count: r.count,
          role: { connect: { id: r.roleId } }
        }))
      }
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  revalidatePath("/dashboard/moderator/scenarios");
  return scenario;
}

async function syncScenarioDefinitions(roleDefinitions: RoleDefinition[], scenarioDefinitions: ScenarioDefinition[]) {
  const nightAbilitiesData = (role: RoleDefinition) =>
    role.nightAbilities === undefined
      ? {}
      : { nightAbilities: role.nightAbilities === null ? Prisma.JsonNull : role.nightAbilities as Prisma.InputJsonValue };

  for (const role of roleDefinitions) {
    await prisma.mafiaRole.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        alignment: role.alignment,
        is_permanent: role.is_permanent ?? true,
        ...nightAbilitiesData(role),
      },
      create: {
        name: role.name,
        description: role.description,
        alignment: role.alignment,
        is_permanent: role.is_permanent ?? true,
        ...nightAbilitiesData(role),
      },
    });
  }

  const dbRoles = await prisma.mafiaRole.findMany();
  const roleIdByName = new Map(dbRoles.map((role) => [role.name, role.id]));

  for (const scenario of scenarioDefinitions) {
    const roleLinks = scenario.roles
      .map((role) => ({ roleId: roleIdByName.get(role.name), count: role.count }))
      .filter((role): role is { roleId: string; count: number } => Boolean(role.roleId));

    if (roleLinks.length === 0) continue;

    const existing = await prisma.scenario.findUnique({ where: { name: scenario.name } });
    if (existing) {
      await prisma.scenarioRole.deleteMany({ where: { scenarioId: existing.id } });
      await prisma.scenario.update({
        where: { id: existing.id },
        data: {
          description: scenario.description,
          roles: {
            create: roleLinks.map((role) => ({
              count: role.count,
              role: { connect: { id: role.roleId } },
            })),
          },
        },
      });
    } else {
      await prisma.scenario.create({
        data: {
          name: scenario.name,
          description: scenario.description,
          roles: {
            create: roleLinks.map((role) => ({
              count: role.count,
              role: { connect: { id: role.roleId } },
            })),
          },
        },
      });
    }
  }

  revalidatePath("/dashboard/moderator/scenarios");
  revalidatePath("/dashboard/admin");
  return { roles: roleDefinitions.length, scenarios: scenarioDefinitions.length };
}

export async function exportScenarioBackup() {
  await checkModerator();
  const { writeScenarioBackupFile } = await import("../../prisma/scenario-backup");

  const [roles, scenarios] = await Promise.all([
    prisma.mafiaRole.findMany({ orderBy: [{ alignment: "asc" }, { name: "asc" }] }),
    prisma.scenario.findMany({
      where: persistentScenarioWhere,
      include: {
        roles: {
          include: { role: true },
          orderBy: { role: { name: "asc" } },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const backup: ScenarioBackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    roles: roles.map((role) => ({
      name: role.name,
      alignment: role.alignment,
      description: role.description || "",
      is_permanent: role.is_permanent,
      nightAbilities: role.nightAbilities,
    })),
    scenarios: scenarios.map((scenario) => ({
      name: scenario.name,
      description: scenario.description || "",
      roles: scenario.roles.map((scenarioRole) => ({
        name: scenarioRole.role.name,
        count: scenarioRole.count,
      })),
    })),
  };

  const filePath = await writeScenarioBackupFile(backup);
  return { success: true, filePath, scenarios: backup.scenarios.length, roles: backup.roles.length };
}

export async function restoreScenarioBackup() {
  await checkModerator();
  const { readScenarioBackupFile, scenarioBackupPath } = await import("../../prisma/scenario-backup");

  const backup = await readScenarioBackupFile();
  if (!backup) {
    throw new Error(`فایل بکاپ سناریو پیدا نشد یا قابل خواندن نیست: ${scenarioBackupPath()}`);
  }

  const result = await syncScenarioDefinitions(
    mergeRoleDefinitions(STANDARD_ROLE_DEFINITIONS, backup.roles),
    backup.scenarios
  );

  return { success: true, ...result, filePath: scenarioBackupPath() };
}

export async function installStandardScenarios() {
  await checkModerator();

  const result = await syncScenarioDefinitions(STANDARD_ROLE_DEFINITIONS, STANDARD_SCENARIO_DEFINITIONS);
  return { success: true, ...result };
}

export async function deleteScenario(id: string) {
  await checkModerator();
  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/dashboard/moderator/scenarios");
}
