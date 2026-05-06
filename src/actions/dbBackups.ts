"use server";

import { auth } from "@/auth";
import {
  createDatabaseBackupFile,
  deleteDatabaseBackupFile,
  listDatabaseBackupFiles,
  restoreDatabaseBackupDataOnlyFile,
  restoreDatabaseBackupFile,
} from "@/lib/dbBackups";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
}

export async function listDatabaseBackups() {
  await checkAdmin();
  return listDatabaseBackupFiles();
}

export async function createDatabaseBackup() {
  await checkAdmin();
  const backup = await createDatabaseBackupFile("manual");
  revalidatePath("/dashboard/admin/backups");
  return { success: true, backup };
}

export async function deleteDatabaseBackup(fileName: string) {
  await checkAdmin();
  await deleteDatabaseBackupFile(fileName);
  revalidatePath("/dashboard/admin/backups");
  return { success: true };
}

export async function restoreDatabaseBackup(fileName: string) {
  await checkAdmin();
  await prisma.$disconnect();
  const result = await restoreDatabaseBackupFile(fileName);
  revalidatePath("/dashboard/admin/backups");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/moderator");
  return { success: true, ...result };
}

export async function restoreDatabaseBackupDataOnly(fileName: string) {
  await checkAdmin();
  await prisma.$disconnect();
  const result = await restoreDatabaseBackupDataOnlyFile(fileName);
  revalidatePath("/dashboard/admin/backups");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/moderator");
  return { success: true, ...result };
}
