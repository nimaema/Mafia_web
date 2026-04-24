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
      return NextResponse.json({ message: "Admin already exists" }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        password_hash: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ message: "Admin user created successfully", email: adminEmail, password: "admin123" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
