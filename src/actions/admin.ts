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
    }
  });
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
  await prisma.mafiaRole.create({
    data: {
      name: data.name,
      description: data.description,
      alignment: data.alignment,
      is_permanent: false
    }
  });
  revalidatePath("/dashboard/admin");
}
