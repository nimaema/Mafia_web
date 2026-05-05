import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const schema = z.object({
  name: z.string().min(2, "نام حداقل ۲ کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z
    .string()
    .min(8, "رمز عبور حداقل ۸ کاراکتر باشد")
    .regex(/[A-Z]/, "رمز عبور باید حداقل یک حرف بزرگ داشته باشد")
    .regex(/[0-9]/, "رمز عبور باید حداقل یک عدد داشته باشد"),
});

function getBaseUrl(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const configured = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  if (configured) return configured;
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password_hash },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await sendVerificationEmail(email, token, getBaseUrl(request));

    return NextResponse.json({ user, needsVerification: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "اطلاعات وارد شده معتبر نیست" },
        { status: 400 }
      );
    }
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
