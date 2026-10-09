import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { MaskAvatar } from "@/components/brand/MaskAvatar";
import { Tag } from "@/components/ui/Tag";
import { prisma } from "@/lib/prisma";
import { profileImageUrl } from "@/lib/profileImage";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const googleAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" }
  });
  const telegramAccount = await prisma.telegramAccount.findUnique({
    where: { userId: session.user.id },
    select: {
      username: true,
      firstName: true,
      lastName: true,
      linkedAt: true,
    },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true,
      email: true,
      image: true,
      password_hash: true,
      emailVerified: true,
    }
  });

  const hasPassword = !!dbUser?.password_hash;
  const role = session.user.role;
  const roleText = role === "ADMIN" ? "مدیر" : role === "MODERATOR" ? "گرداننده" : "بازیکن";
  const profileImage = dbUser ? profileImageUrl(session.user.id, dbUser.image) : session.user.image;
  const userData = {
    name: dbUser?.name || session.user.name || "",
    email: dbUser?.email || session.user.email || "",
    image: profileImage || null,
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="flex items-center gap-4">
        <MaskAvatar seed={session.user.id} size="xl" />
        <div className="min-w-0">
          <h1 className="nq-display truncate text-[2.4rem] leading-[1.15]">{userData.name || "بازیکن"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Tag tone="accent">{roleText}</Tag>
            {dbUser?.emailVerified ? <Tag tone="success">ایمیل تایید شده</Tag> : <Tag tone="warning">ایمیل تایید نشده</Tag>}
          </div>
        </div>
      </header>

      <ProfileForm
        user={userData}
        hasGoogleProvider={!!googleAccount}
        hasPassword={hasPassword}
        telegramAccount={telegramAccount ? {
          username: telegramAccount.username,
          firstName: telegramAccount.firstName,
          lastName: telegramAccount.lastName,
          linkedAt: telegramAccount.linkedAt.toISOString(),
        } : null}
      />
    </div>
  );
}
