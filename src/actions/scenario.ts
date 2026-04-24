"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createScenario(data: { name: string; description?: string; roles: { roleId: string; count: number }[] }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    throw new Error("Unauthorized");
  }

  const scenario = await prisma.scenario.create({
    data: {
      name: data.name,
      description: data.description,
      roles: {
        create: data.roles.map((r) => ({
          roleId: r.roleId,
          count: r.count,
        })),
      },
    },
  });

  revalidatePath("/dashboard/moderator");
  return scenario;
}

export async function deleteScenario(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/dashboard/moderator");
}
