import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "رمز عبور حداقل ۸ کاراکتر باشد")
    .regex(/[A-Z]/, "رمز عبور باید حداقل یک حرف بزرگ داشته باشد")
    .regex(/[0-9]/, "رمز عبور باید حداقل یک عدد داشته باشد"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "لینک بازیابی نامعتبر است" },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "لینک بازیابی منقضی شده است. دوباره درخواست دهید." },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password_hash },
      }),
      prisma.passwordResetToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: (err as any).errors[0].message },
        { status: 400 }
      );
    }
    console.error("[RESET_PASSWORD]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
