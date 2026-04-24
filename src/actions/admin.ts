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
  return await prisma.mafiaRole.create({
    data: {
      name: data.name,
      description: data.description,
      alignment: data.alignment,
      is_permanent: false
    }
  });
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

export async function installStandardScenarios() {
  await checkAdmin();

  // Ensure base roles exist first
  const roles = await prisma.mafiaRole.findMany();
  const getRoleId = (name: string) => roles.find(r => r.name === name)?.id;

  const scenarios = [
    {
      name: "سناریو پدرخوانده",
      description: "سناریو استاندارد ۱۰ نفره - شب‌های مافیا",
      roles: [
        { name: "پدرخوانده", count: 1 },
        { name: "دکتر لکتر", count: 1 },
        { name: "مافیا ساده", count: 1 },
        { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 },
        { name: "روئین تن", count: 1 },
        { name: "شهروند ساده", count: 4 }
      ]
    },
    {
      name: "سناریو بازپرس",
      description: "سناریو پیشرفته با نقش بازپرس",
      roles: [
        { name: "پدرخوانده", count: 1 },
        { name: "مافیا ساده", count: 2 },
        { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 },
        { name: "شهروند ساده", count: 5 }
      ]
    },
    {
      name: "سناریو کاپو",
      description: "سناریو حرفه‌ای با نقش کاپو",
      roles: [
        { name: "پدرخوانده", count: 1 },
        { name: "کاپو", count: 1 },
        { name: "مافیا ساده", count: 1 },
        { name: "دکتر", count: 1 },
        { name: "کارآگاه", count: 1 },
        { name: "شهروند ساده", count: 5 }
      ]
    }
  ];

  for (const s of scenarios) {
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
}
