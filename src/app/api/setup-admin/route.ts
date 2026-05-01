import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const adminEmail = "admin@mafia.com";
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "حساب مدیر از قبل وجود دارد" }, { status: 200 });
    }

    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        password_hash: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ 
      message: "حساب مدیر با موفقیت ساخته شد",
      email: adminEmail, 
      password: adminPassword 
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SETUP_ADMIN]", error);
    return NextResponse.json({ error: "راه‌اندازی حساب مدیر انجام نشد." }, { status: 500 });
  }
}
