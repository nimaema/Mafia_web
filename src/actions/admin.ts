"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Alignment } from "@prisma/client";
import { revalidatePath } from "next/cache";

type SafeListResult<T> = {
  success: boolean;
  data: T[];
  error?: string;
};

const READ_ERROR = "اطلاعات این بخش بارگذاری نشد. اتصال پایگاه داده یا سطح دسترسی کاربر را بررسی کنید.";
const TEMP_SCENARIO_DESCRIPTION_PREFIX = "__TEMP_GAME_SCENARIO__";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی مدیر)");
  }
  return session.user.id;
}

async function checkModerator() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("شما دسترسی لازم برای این عملیات را ندارید. (نیاز به دسترسی گرداننده یا مدیر)");
  }
  return session.user.id;
}

// User Management
export async function getAllUsers() {
  await checkAdmin();
  return await prisma.user.findMany({
    include: {
      accounts: {
        select: { provider: true }
      },
      _count: {
        select: {
          gameHistories: true,
          gamesHosted: true,
        }
      }
    },
    orderBy: [
      { role: "desc" },
      { email: "asc" },
    ]
  });
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

export async function createMafiaRole(data: { name: string; description: string; alignment: Alignment }) {
  await checkModerator();
  const role = await prisma.mafiaRole.create({
    data: {
      name: data.name,
      description: data.description,
      alignment: data.alignment,
      is_permanent: false
    }
  });
  revalidatePath("/dashboard/admin");
  return role;
}

export async function updateMafiaRole(id: string, data: { name: string; description: string; alignment: Alignment }) {
  await checkModerator();
  const role = await prisma.mafiaRole.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      alignment: data.alignment
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

// Scenario Management
export async function getScenarios() {
  await checkModerator();
  return await prisma.scenario.findMany({
    where: {
      NOT: [
        { description: { startsWith: TEMP_SCENARIO_DESCRIPTION_PREFIX } },
        { description: "سناریو ساخته شده در لحظه" },
      ],
    },
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

export async function installStandardScenarios() {
  await checkModerator();

  const allRoles = await prisma.mafiaRole.findMany();
  const id = (name: string) => allRoles.find(r => r.name === name)?.id;

  const scenarios = [
    {
      name: "کلاسیک ۱۲ نفره",
      description: "سناریو بازپرس و محقق - ۱۲ نفر",
      roles: [
        { name: "محقق", count: 1 }, { name: "بازپرس", count: 1 }, { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 }, { name: "رویین‌تن", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "شهروند ساده", count: 2 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "شیاد", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "کلاسیک ۱۳ نفره",
      description: "سناریو بازپرس و محقق - ۱۳ نفر",
      roles: [
        { name: "محقق", count: 1 }, { name: "بازپرس", count: 1 }, { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 }, { name: "رویین‌تن", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "شهروند ساده", count: 3 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "شیاد", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "نماینده ۱۰ نفره",
      description: "سناریو نماینده - ۱۰ نفر",
      roles: [
        { name: "دکتر", count: 1 }, { name: "راهنما", count: 1 }, { name: "مین‌گذار", count: 1 },
        { name: "وکیل", count: 1 }, { name: "محافظ", count: 1 }, { name: "شهروند ساده", count: 2 },
        { name: "دن مافیا", count: 1 }, { name: "یاغی", count: 1 }, { name: "هکر", count: 1 },
      ],
    },
    {
      name: "نماینده ۱۲ نفره",
      description: "سناریو نماینده - ۱۲ نفر",
      roles: [
        { name: "دکتر", count: 1 }, { name: "راهنما", count: 1 }, { name: "مین‌گذار", count: 1 },
        { name: "وکیل", count: 1 }, { name: "محافظ", count: 1 }, { name: "سرباز", count: 1 },
        { name: "شهروند ساده", count: 2 },
        { name: "دن مافیا", count: 1 }, { name: "یاغی", count: 1 }, { name: "هکر", count: 1 },
        { name: "ناتو", count: 1 },
      ],
    },
    {
      name: "فراماسون ۱۲ نفره",
      description: "سناریو فراماسون - ۱۲ نفر",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 }, { name: "تفنگدار", count: 1 },
        { name: "رویین‌تن", count: 1 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "سایلنسر", count: 1 },
        { name: "مافیا ساده", count: 1 },
        { name: "جوکر", count: 1 },
      ],
    },
    {
      name: "فراماسون ۱۳ نفره",
      description: "سناریو فراماسون - ۱۳ نفر",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 }, { name: "تفنگدار", count: 1 },
        { name: "رویین‌تن", count: 1 }, { name: "کابوی", count: 1 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "سایلنسر", count: 1 },
        { name: "مافیا ساده", count: 1 },
        { name: "جوکر", count: 1 },
      ],
    },
    {
      name: "فراماسون ۱۵ نفره",
      description: "سناریو فراماسون - ۱۵ نفر | نسخه کامل",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکتیرانداز", count: 1 },
        { name: "فراماسون", count: 1 }, { name: "فرمانده", count: 1 }, { name: "کشیش", count: 1 },
        { name: "تفنگدار", count: 1 }, { name: "رویین‌تن", count: 1 }, { name: "کابوی", count: 1 },
        { name: "قاضی", count: 1 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "سایلنسر", count: 1 },
        { name: "تروریست", count: 1 },
        { name: "جوکر", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۰ نفره",
      description: "سناریو تکاور - ۱۰ نفر",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 2 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۲ نفره",
      description: "سناریو تکاور - ۱۲ نفر",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 3 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۳ نفره",
      description: "سناریو تکاور - ۱۳ نفر",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 4 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
        { name: "مافیا ساده", count: 1 },
      ],
    },
    {
      name: "تکاور ۱۵ نفره",
      description: "سناریو تکاور - ۱۵ نفر | نسخه کامل",
      roles: [
        { name: "کارآگاه", count: 1 }, { name: "دکتر", count: 1 }, { name: "تکاور", count: 1 },
        { name: "نگهبان", count: 1 }, { name: "تفنگدار", count: 1 }, { name: "شهروند ساده", count: 5 },
        { name: "رئیس مافیا", count: 1 }, { name: "ناتو", count: 1 }, { name: "افسونگر", count: 1 },
        { name: "مافیا ساده", count: 2 },
      ],
    },
  ];

  for (const s of scenarios) {
    const roleLinks = s.roles
      .map(r => ({ roleId: id(r.name), count: r.count }))
      .filter((r): r is { roleId: string; count: number } => r.roleId != null);

    if (roleLinks.length === 0) continue;

    const existing = await prisma.scenario.findUnique({ where: { name: s.name } });

    if (existing) {
      await prisma.scenarioRole.deleteMany({ where: { scenarioId: existing.id } });
      await prisma.scenario.update({
        where: { id: existing.id },
        data: {
          description: s.description,
          roles: { create: roleLinks.map(rl => ({ count: rl.count, role: { connect: { id: rl.roleId } } })) },
        },
      });
    } else {
      await prisma.scenario.create({
        data: {
          name: s.name,
          description: s.description,
          roles: { create: roleLinks.map(rl => ({ count: rl.count, role: { connect: { id: rl.roleId } } })) },
        },
      });
    }
  }

  revalidatePath("/dashboard/moderator/scenarios");
  return { success: true };
}

export async function deleteScenario(id: string) {
  await checkModerator();
  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/dashboard/moderator/scenarios");
}
