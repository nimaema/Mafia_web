import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import Link from "next/link";
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
  const roleText = role === "ADMIN" ? "مدیر سیستم" : role === "MODERATOR" ? "گرداننده" : "بازیکن";
  const profileImage = dbUser ? profileImageUrl(session.user.id, dbUser.image) : session.user.image;
  const userData = {
    name: dbUser?.name || session.user.name || "",
    email: dbUser?.email || session.user.email || "",
    image: profileImage || null,
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 font-sans">
      <section className="relative border border-zinc-200 bg-zinc-900 text-white shadow-2xl dark:border-white/10 dark:bg-black">
        <div className="absolute inset-x-0 top-0 h-1 bg-red-600" />
        <div className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-6">
              <div className="relative flex size-24 shrink-0 items-center justify-center border border-white/20 bg-white/5 p-1">
                {profileImage ? (
                  <img src={profileImage} alt="" className="size-full object-cover filter grayscale" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-red-600">person</span>
                )}
                <span className="absolute -bottom-1 -right-1 size-4 border-2 border-black bg-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">پروفایل کاربری</p>
                <h1 className="mt-2 truncate text-3xl font-black uppercase tracking-tight text-white">{userData.name || "بازیکن مافیا"}</h1>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                  <span className="border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">{roleText}</span>
                  <span className={`border px-2.5 py-1 ${dbUser?.emailVerified ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
                    {dbUser?.emailVerified ? "تایید شده" : "در انتظار تایید"}
                  </span>
                  <span className="border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-400">
                    {googleAccount ? "GOOGLE AUTH" : "EMAIL AUTH"}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/dashboard/user" className="group relative flex h-12 items-center justify-center gap-2 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-zinc-200">
              <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
              بازگشت به داشبورد
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          {[
            ["badge", "سطح دسترسی", roleText, "text-red-500"],
            ["alternate_email", "وضعیت ایمیل", dbUser?.emailVerified ? "تایید شده" : "نیاز به تایید", dbUser?.emailVerified ? "text-green-500" : "text-red-500"],
            ["vpn_key", "ورود با رمز", hasPassword ? "فعال" : "تنظیم نشده", hasPassword ? "text-sky-500" : "text-zinc-500"],
            ["hub", "حساب گوگل", googleAccount ? "متصل" : "متصل نیست", googleAccount ? "text-green-500" : "text-zinc-500"],
          ].map(([icon, label, value, color]) => (
            <div key={label} className="relative border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#0e0e0e]">
              <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined flex size-10 shrink-0 items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-black text-xl ${color}`}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
                  <p className="mt-1 truncate text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </aside>

        <ProfileForm
          user={userData}
          hasGoogleProvider={!!googleAccount}
          hasPassword={hasPassword}
        />
      </div>
    </div>
  );
}
