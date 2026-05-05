import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DATA_IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/i;

function contentTypeFor(extension: string) {
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  return "image/webp";
}

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  const image = user?.image?.trim();
  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  if (/^https?:\/\//i.test(image)) {
    return NextResponse.redirect(image);
  }

  const match = image.match(DATA_IMAGE_PATTERN);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const bytes = Buffer.from(match[2], "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentTypeFor(match[1].toLowerCase()),
      "Cache-Control": "private, max-age=300",
    },
  });
}
