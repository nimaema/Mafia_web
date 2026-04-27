import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const googleAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" }
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true,
      email: true,
      image: true,
      password_hash: true 
    }
  });

  const hasPassword = !!dbUser?.password_hash;
  const userData = {
    name: dbUser?.name || session.user.name || "",
    email: dbUser?.email || session.user.email || ""
  };
  const profileImage = dbUser?.image || session.user.image;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/user" className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          <span className="material-symbols-outlined text-zinc-500">arrow_forward</span>
        </Link>
        <h1 className="text-2xl font-bold">ویرایش پروفایل</h1>
      </div>
      
      <section className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl text-zinc-400">person</span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg">{dbUser?.name || session.user.name}</h2>
            <p className="text-zinc-500 text-sm">{session.user.role === 'ADMIN' ? 'مدیر' : session.user.role === 'MODERATOR' ? 'گرداننده' : 'بازیکن'}</p>
          </div>
        </div>

        <ProfileForm 
          user={userData} 
          hasGoogleProvider={!!googleAccount}
          hasPassword={hasPassword}
        />
      </section>
    </div>
  );
}
