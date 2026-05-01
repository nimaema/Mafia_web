import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { Alignment, Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const adminEmail = "admin@mafia.com";
    
    // 1. Create Admin if doesn't exist
    const adminPassword = await hashPassword("admin123");
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: "مدیر سیستم",
        password_hash: adminPassword,
        role: Role.ADMIN,
      },
    });

    // 2. Create Roles if they don't exist
    const defaultRoles = [
      { name: "کارآگاه", alignment: Alignment.CITIZEN, description: "استعلام هویت بازیکنان" },
      { name: "دکتر", alignment: Alignment.CITIZEN, description: "نجات بازیکنان از شلیک شب" },
      { name: "روئین تن", alignment: Alignment.CITIZEN, description: "یک جان اضافی در شب دارد" },
      { name: "شهروند ساده", alignment: Alignment.CITIZEN, description: "کمک به شهروندان با رای" },
      { name: "پدرخوانده", alignment: Alignment.MAFIA, description: "رئیس مافیا، استعلام منفی" },
      { name: "دکتر لکتر", alignment: Alignment.MAFIA, description: "نجات اعضای مافیا" },
      { name: "مافیا ساده", alignment: Alignment.MAFIA, description: "اعضای تیم مافیا" },
    ];

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

    return NextResponse.json({ success: true, message: "دیتابیس با موفقیت راه‌اندازی شد" });
  } catch (error: any) {
    console.error("[INIT_DB]", error);
    return NextResponse.json({ success: false, error: "راه‌اندازی دیتابیس انجام نشد." }, { status: 500 });
  }
}
