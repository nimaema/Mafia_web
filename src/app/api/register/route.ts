import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "این ایمیل قبلا ثبت شده است" }, { status: 400 });
    }

    const hashedPassword = await saltAndHashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    return NextResponse.json({ message: "خطای سرور" }, { status: 500 });
  }
}
