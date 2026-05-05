import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { prisma } from "@/lib/prisma";
import { CommandSurface, SectionHeader, StatusChip } from "@/components/CommandUI";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const googleAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password_hash: true },
  });

  const hasPassword = !!dbUser?.password_hash;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionHeader title="پروفایل و امنیت" eyebrow="Account Console" icon="person" />

      <CommandSurface className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-3xl border border-cyan-300/20 bg-cyan-300/10">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined grid h-full w-full place-items-center text-4xl text-cyan-100">person</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-zinc-50">{dbUser?.name || session.user.name}</h1>
              <p className="mt-1 truncate text-sm text-zinc-400">{dbUser?.email || session.user.email}</p>
              <div className="mt-2 flex gap-2">
                <StatusChip tone="violet">{session.user.role === "ADMIN" ? "مدیر" : session.user.role === "MODERATOR" ? "گرداننده" : "بازیکن"}</StatusChip>
                {googleAccount && <StatusChip tone="emerald">گوگل متصل</StatusChip>}
              </div>
            </div>
          </div>
        </div>
      </CommandSurface>

      <CommandSurface className="p-5">
        <ProfileForm
          user={{
            name: dbUser?.name || session.user.name || "",
            email: dbUser?.email || session.user.email || "",
          }}
          hasGoogleProvider={!!googleAccount}
          hasPassword={hasPassword}
        />
      </CommandSurface>
    </div>
  );
}
