"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getRoles() {
  return await prisma.role.findMany({
    orderBy: { name: "asc" },
  });
}
