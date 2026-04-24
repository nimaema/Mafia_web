"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Alignment } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
}

// User Management
export async function getAllUsers() {
  await checkAdmin();
  return await prisma.user.findMany({
    orderBy: { id: 'desc' }
  });
}

export async function updateUserRole(userId: string, role: Role) {
  await checkAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
  revalidatePath("/dashboard/admin");
}

// Role Management
export async function getMafiaRoles() {
  await checkAdmin();
  return await prisma.mafiaRole.findMany({
    orderBy: { alignment: 'asc' }
  });
}

export async function createMafiaRole(data: { name: string; description: string; alignment: Alignment }) {
  await checkAdmin();
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
  await checkAdmin();
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
  await checkAdmin();
  // Check if role is permanent
  const role = await prisma.mafiaRole.findUnique({ where: { id } });
  if (role?.is_permanent) {
    throw new Error("نقش‌های سیستمی قابل حذف نیستند");
  }

  // Delete associated scenario roles first (Prisma handles this if onDelete: Cascade is set, but it's not set for ScenarioRole -> MafiaRole)
  await prisma.scenarioRole.deleteMany({ where: { roleId: id } });
  
  await prisma.mafiaRole.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
}

// Scenario Management
export async function getScenarios() {
  await checkAdmin();
  return await prisma.scenario.findMany({
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

export async function createScenario(data: { name: string, description: string, roles: { roleId: string, count: number }[] }) {
  await checkAdmin();
  
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
    }
  });

  revalidatePath("/dashboard/admin");
  return scenario;
}

export async function updateScenario(id: string, data: { name: string, description: string, roles: { roleId: string, count: number }[] }) {
  await checkAdmin();

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
    }
  });

  revalidatePath("/dashboard/admin");
  return scenario;
}

export async function installStandardScenarios() {
  await checkAdmin();

  const roles = await prisma.mafiaRole.findMany();
  const getRoleId = (name: string) => roles.find(r => r.name === name)?.id;

  const scenarios = [
    {
      name: "سناریو پدرخوانده",
      description: "سناریو استاندارد ۱۰ نفره - شب‌های مافیا",
      roles: [
        { name: "پدرخوانده", alignment: Alignment.MAFIA, count: 1 },
        { name: "دکتر لکتر", alignment: Alignment.MAFIA, count: 1 },
        { name: "مافیا ساده", alignment: Alignment.MAFIA, count: 1 },
        { name: "دکتر", alignment: Alignment.CITIZEN, count: 1 },
        { name: "کارآگاه", alignment: Alignment.CITIZEN, count: 1 },
        { name: "روئین تن", alignment: Alignment.CITIZEN, count: 1 },
        { name: "شهروند ساده", alignment: Alignment.CITIZEN, count: 4 }
      ]
    },
    {
      name: "سناریو بازپرس",
      description: "سناریو پیشرفته با نقش بازپرس",
      roles: [
        { name: "پدرخوانده", alignment: Alignment.MAFIA, count: 1 },
        { name: "مافیا ساده", alignment: Alignment.MAFIA, count: 2 },
        { name: "دکتر", alignment: Alignment.CITIZEN, count: 1 },
        { name: "کارآگاه", alignment: Alignment.CITIZEN, count: 1 },
        { name: "بازپرس", alignment: Alignment.CITIZEN, count: 1 },
        { name: "شهروند ساده", alignment: Alignment.CITIZEN, count: 4 }
      ]
    },
    {
      name: "سناریو کاپو",
      description: "سناریو حرفه‌ای با نقش کاپو",
      roles: [
        { name: "پدرخوانده", alignment: Alignment.MAFIA, count: 1 },
        { name: "کاپو", alignment: Alignment.MAFIA, count: 1 },
        { name: "مافیا ساده", alignment: Alignment.MAFIA, count: 1 },
        { name: "دکتر", alignment: Alignment.CITIZEN, count: 1 },
        { name: "کارآگاه", alignment: Alignment.CITIZEN, count: 1 },
        { name: "شهروند ساده", alignment: Alignment.CITIZEN, count: 5 }
      ]
    }
  ];

  for (const s of scenarios) {
    // Ensure all roles exist first
    for (const r of s.roles) {
      await prisma.mafiaRole.upsert({
        where: { name: r.name },
        update: {},
        create: {
          name: r.name,
          alignment: r.alignment,
          description: `نقش ${r.name}`,
          is_permanent: true
        }
      });
    }

    const currentRoles = await prisma.mafiaRole.findMany();
    const getRoleId = (name: string) => currentRoles.find(r => r.name === name)?.id;

    const roleLinks = s.roles.map(r => ({
      roleId: getRoleId(r.name) || "",
      count: r.count
    })).filter(r => r.roleId !== "");

    if (roleLinks.length > 0) {
      await prisma.scenario.upsert({
        where: { name: s.name },
        update: {},
        create: {
          name: s.name,
          description: s.description,
          roles: {
            create: roleLinks.map(rl => ({
              count: rl.count,
              role: { connect: { id: rl.roleId } }
            }))
          }
        }
      });
    }
  }

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteScenario(id: string) {
  await checkAdmin();
  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/dashboard/admin");
}
