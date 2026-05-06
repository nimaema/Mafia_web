"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Alignment, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type SuggestionType = "NEW_ROLE" | "NEW_SCENARIO" | "CHANGE_ROLE" | "CHANGE_SCENARIO";
type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED";

type SuggestionInput = {
  type: SuggestionType;
  title: string;
  description: string;
  targetRoleId?: string;
  targetScenarioId?: string;
  proposedName?: string;
  proposedDescription?: string;
  proposedAlignment?: Alignment;
};

type ReviewInput = {
  decision: "APPROVED" | "REJECTED";
  adminNote?: string;
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  NEW_ROLE: "نقش جدید",
  NEW_SCENARIO: "سناریوی جدید",
  CHANGE_ROLE: "اصلاح نقش",
  CHANGE_SCENARIO: "اصلاح سناریو",
};

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("برای ثبت درخواست باید وارد حساب خود شوید.");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isBanned: true },
  });

  if (!user || user.isBanned) throw new Error("حساب شما امکان ثبت درخواست ندارد.");
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("این بخش فقط برای مدیر سیستم فعال است.");
  return user;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function cleanLong(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeType(value: unknown): SuggestionType {
  if (value === "NEW_ROLE" || value === "NEW_SCENARIO" || value === "CHANGE_ROLE" || value === "CHANGE_SCENARIO") {
    return value;
  }
  throw new Error("نوع درخواست معتبر نیست.");
}

function normalizeAlignmentOrNull(value: unknown): Alignment | null {
  if (value === "CITIZEN" || value === "MAFIA" || value === "NEUTRAL") return value;
  return null;
}

function buildPayload(input: SuggestionInput): Prisma.InputJsonObject {
  return {
    proposedName: clean(input.proposedName, 80) || null,
    proposedDescription: cleanLong(input.proposedDescription, 1600) || null,
    proposedAlignment: normalizeAlignmentOrNull(input.proposedAlignment),
  };
}

function formatDate(date?: Date | null) {
  return date ? date.toISOString() : null;
}

function serializeRequest(request: any) {
  return {
    ...request,
    createdAt: formatDate(request.createdAt),
    updatedAt: formatDate(request.updatedAt),
    reviewedAt: formatDate(request.reviewedAt),
  };
}

function revalidateSuggestionPaths(userId?: string) {
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/user/requests");
  revalidatePath("/dashboard/admin/requests");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin?tab=roles");
  revalidatePath("/dashboard/admin?tab=scenarios");
  revalidatePath("/dashboard/moderator/scenarios");
  if (userId) revalidatePath(`/dashboard/user/requests?user=${userId}`);
}

export async function getSuggestionReferenceData() {
  await requireUser();
  const [roles, scenarios] = await Promise.all([
    prisma.mafiaRole.findMany({
      select: { id: true, name: true, alignment: true, description: true },
      orderBy: [{ alignment: "asc" }, { name: "asc" }],
    }),
    prisma.scenario.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { roles, scenarios };
}

export async function getMySuggestionRequests() {
  const user = await requireUser();
  const requests = await prisma.suggestionRequest.findMany({
    where: { userId: user.id },
    include: {
      targetRole: { select: { id: true, name: true, alignment: true } },
      targetScenario: { select: { id: true, name: true } },
      createdRole: { select: { id: true, name: true, alignment: true } },
      createdScenario: { select: { id: true, name: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map(serializeRequest);
}

export async function createSuggestionRequest(input: SuggestionInput) {
  const user = await requireUser();
  const type = normalizeType(input.type);
  const title = clean(input.title, 90);
  const description = cleanLong(input.description, 1800);
  const proposedName = clean(input.proposedName, 80);
  const proposedDescription = cleanLong(input.proposedDescription, 1600);
  const proposedAlignment = normalizeAlignmentOrNull(input.proposedAlignment);

  if (title.length < 3) throw new Error("عنوان درخواست را کامل‌تر وارد کنید.");
  if (description.length < 10) throw new Error("توضیح درخواست باید حداقل ۱۰ کاراکتر باشد.");

  if ((type === "NEW_ROLE" || type === "NEW_SCENARIO") && proposedName.length < 2) {
    throw new Error("برای درخواست جدید، نام پیشنهادی را وارد کنید.");
  }
  if (type === "CHANGE_ROLE" && !proposedName && !proposedDescription && !proposedAlignment) {
    throw new Error("برای اصلاح نقش، حداقل نام، توضیح یا جبهه پیشنهادی را وارد کنید.");
  }
  if (type === "CHANGE_SCENARIO" && !proposedName && !proposedDescription) {
    throw new Error("برای اصلاح، حداقل نام یا توضیح پیشنهادی را وارد کنید.");
  }
  if (type === "CHANGE_ROLE" && !input.targetRoleId) throw new Error("نقشی که می‌خواهید اصلاح شود را انتخاب کنید.");
  if (type === "CHANGE_SCENARIO" && !input.targetScenarioId) throw new Error("سناریویی که می‌خواهید اصلاح شود را انتخاب کنید.");

  if (input.targetRoleId) {
    const exists = await prisma.mafiaRole.count({ where: { id: input.targetRoleId } });
    if (!exists) throw new Error("نقش انتخاب‌شده پیدا نشد.");
  }
  if (input.targetScenarioId) {
    const exists = await prisma.scenario.count({ where: { id: input.targetScenarioId } });
    if (!exists) throw new Error("سناریوی انتخاب‌شده پیدا نشد.");
  }

  await prisma.suggestionRequest.create({
    data: {
      userId: user.id,
      type,
      title,
      description,
      targetRoleId: type === "CHANGE_ROLE" ? input.targetRoleId : null,
      targetScenarioId: type === "CHANGE_SCENARIO" ? input.targetScenarioId : null,
      payload: buildPayload({ ...input, type }),
    },
  });

  revalidateSuggestionPaths(user.id);
  return { success: true };
}

export async function getAdminSuggestionRequests(status: SuggestionStatus | "ALL" = "ALL") {
  await requireAdmin();
  const requests = await prisma.suggestionRequest.findMany({
    where: status === "ALL" ? undefined : { status },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      targetRole: { select: { id: true, name: true, alignment: true, description: true } },
      targetScenario: { select: { id: true, name: true, description: true } },
      createdRole: { select: { id: true, name: true, alignment: true } },
      createdScenario: { select: { id: true, name: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return requests.map(serializeRequest);
}

export async function reviewSuggestionRequest(requestId: string, input: ReviewInput) {
  const admin = await requireAdmin();
  const decision = input.decision === "APPROVED" ? "APPROVED" : "REJECTED";
  const adminNote = cleanLong(input.adminNote, 1000);

  const request = await prisma.suggestionRequest.findUnique({
    where: { id: requestId },
    include: { targetRole: true, targetScenario: true },
  });

  if (!request) throw new Error("درخواست پیدا نشد.");
  if (request.status !== "PENDING") throw new Error("این درخواست قبلاً بررسی شده است.");

  let createdRoleId: string | null = null;
  let createdScenarioId: string | null = null;
  const payload = (request.payload || {}) as {
    proposedName?: string | null;
    proposedDescription?: string | null;
    proposedAlignment?: Alignment | null;
  };

  if (decision === "APPROVED") {
    const proposedName = clean(payload.proposedName, 80);
    const proposedDescription = cleanLong(payload.proposedDescription, 1600);
    const proposedAlignment = normalizeAlignmentOrNull(payload.proposedAlignment);
    const roleNameForCreate = proposedName || request.title;
    const scenarioNameForCreate = proposedName || request.title;

    if (request.type === "NEW_ROLE" || (request.type === "CHANGE_ROLE" && proposedName)) {
      const duplicate = await prisma.mafiaRole.findFirst({
        where: {
          name: request.type === "NEW_ROLE" ? roleNameForCreate : proposedName,
          ...(request.type === "CHANGE_ROLE" && request.targetRoleId ? { NOT: { id: request.targetRoleId } } : {}),
        },
        select: { id: true },
      });
      if (duplicate) throw new Error("نقشی با این نام از قبل وجود دارد.");
    }

    if (request.type === "NEW_SCENARIO" || (request.type === "CHANGE_SCENARIO" && proposedName)) {
      const duplicate = await prisma.scenario.findFirst({
        where: {
          name: request.type === "NEW_SCENARIO" ? scenarioNameForCreate : proposedName,
          ...(request.type === "CHANGE_SCENARIO" && request.targetScenarioId ? { NOT: { id: request.targetScenarioId } } : {}),
        },
        select: { id: true },
      });
      if (duplicate) throw new Error("سناریویی با این نام از قبل وجود دارد.");
    }

    await prisma.$transaction(async (tx) => {
      if (request.type === "NEW_ROLE") {
        const role = await tx.mafiaRole.create({
          data: {
            name: roleNameForCreate,
            description: proposedDescription || request.description,
            alignment: proposedAlignment || "NEUTRAL",
            is_permanent: false,
            nightAbilities: Prisma.JsonNull,
          },
        });
        createdRoleId = role.id;
      }

      if (request.type === "CHANGE_ROLE") {
        if (!request.targetRoleId) throw new Error("نقش هدف برای اصلاح پیدا نشد.");
        await tx.mafiaRole.update({
          where: { id: request.targetRoleId },
          data: {
            ...(proposedName ? { name: proposedName } : {}),
            ...(proposedDescription ? { description: proposedDescription } : {}),
            ...(proposedAlignment ? { alignment: proposedAlignment } : {}),
          },
        });
      }

      if (request.type === "NEW_SCENARIO") {
        const scenario = await tx.scenario.create({
          data: {
            name: scenarioNameForCreate,
            description: `${proposedDescription || request.description}\n\nاین سناریو از درخواست کاربر تایید شده ساخته شده و ترکیب نقش‌ها باید توسط مدیر/گرداننده تکمیل شود.`,
            createdBy: request.userId,
          },
        });
        createdScenarioId = scenario.id;
      }

      if (request.type === "CHANGE_SCENARIO") {
        if (!request.targetScenarioId) throw new Error("سناریوی هدف برای اصلاح پیدا نشد.");
        await tx.scenario.update({
          where: { id: request.targetScenarioId },
          data: {
            ...(proposedName ? { name: proposedName } : {}),
            ...(proposedDescription ? { description: proposedDescription } : {}),
          },
        });
      }

      await tx.suggestionRequest.update({
        where: { id: request.id },
        data: {
          status: decision,
          adminNote,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          createdRoleId,
          createdScenarioId,
        },
      });
    });
  } else {
    await prisma.suggestionRequest.update({
      where: { id: request.id },
      data: {
        status: decision,
        adminNote,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
  }

  revalidateSuggestionPaths(request.userId);
  return { success: true, status: decision, typeLabel: TYPE_LABELS[request.type] };
}
