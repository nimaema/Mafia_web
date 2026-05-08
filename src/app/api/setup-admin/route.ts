import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getInitialAdminConfig, isBootstrapRequestAuthorized, validateBootstrapPassword } from "@/lib/bootstrap";

export async function POST(request: Request) {
  if (!isBootstrapRequestAuthorized(request)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است" }, { status: 403 });
  }

  try {
    const { email: adminEmail, password: adminPassword } = getInitialAdminConfig();
    const passwordError = adminPassword ? validateBootstrapPassword(adminPassword) : "INITIAL_ADMIN_PASSWORD is required.";

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "حساب مدیر از قبل وجود دارد" }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        emailVerified: new Date(),
        password_hash: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ 
      message: "حساب مدیر با موفقیت ساخته شد",
      email: adminEmail,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[SETUP_ADMIN]", error);
    return NextResponse.json({ error: "راه‌اندازی حساب مدیر انجام نشد." }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
