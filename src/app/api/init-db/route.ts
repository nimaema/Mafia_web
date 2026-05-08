import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getInitialAdminConfig, isBootstrapRequestAuthorized, validateBootstrapPassword } from "@/lib/bootstrap";
import { Alignment, Role } from "@prisma/client";
import { NextResponse } from "next/server";

const defaultRoles = [
  { name: "کارآگاه", alignment: Alignment.CITIZEN, description: "استعلام هویت بازیکنان" },
  { name: "دکتر", alignment: Alignment.CITIZEN, description: "نجات بازیکنان از شلیک شب" },
  { name: "روئین تن", alignment: Alignment.CITIZEN, description: "یک جان اضافی در شب دارد" },
  { name: "شهروند ساده", alignment: Alignment.CITIZEN, description: "کمک به شهروندان با رای" },
  { name: "پدرخوانده", alignment: Alignment.MAFIA, description: "رئیس مافیا، استعلام منفی" },
  { name: "دکتر لکتر", alignment: Alignment.MAFIA, description: "نجات اعضای مافیا" },
  { name: "مافیا ساده", alignment: Alignment.MAFIA, description: "اعضای تیم مافیا" },
];

export async function POST(request: Request) {
  if (!isBootstrapRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "دسترسی غیرمجاز است" }, { status: 403 });
  }

  try {
    const { email: adminEmail, password: adminPassword } = getInitialAdminConfig();
    const passwordError = adminPassword ? validateBootstrapPassword(adminPassword) : null;
    let adminCreated = false;

    if (passwordError) {
      return NextResponse.json({ success: false, error: passwordError }, { status: 400 });
    }

    if (adminPassword) {
      const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
          email: adminEmail,
          name: "مدیر سیستم",
          emailVerified: new Date(),
          password_hash: await hashPassword(adminPassword),
          role: Role.ADMIN,
        },
      });
      adminCreated = !existingAdmin;
    }

    for (const role of defaultRoles) {
      await prisma.mafiaRole.upsert({
        where: { name: role.name },
        update: {},
        create: {
          name: role.name,
          alignment: role.alignment,
          description: role.description,
          is_permanent: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "دیتابیس با موفقیت راه‌اندازی شد",
      adminCreated,
      adminEmail: adminPassword ? adminEmail : null,
    });
  } catch (error: any) {
    console.error("[INIT_DB]", error);
    return NextResponse.json({ success: false, error: "راه‌اندازی دیتابیس انجام نشد." }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
