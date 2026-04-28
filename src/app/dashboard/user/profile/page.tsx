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
      password_hash: true,
      emailVerified: true,
    }
  });

  const hasPassword = !!dbUser?.password_hash;
  const role = session.user.role;
  const roleText = role === "ADMIN" ? "مدیر سیستم" : role === "MODERATOR" ? "گرداننده" : "بازیکن";
  const userData = {
    name: dbUser?.name || session.user.name || "",
    email: dbUser?.email || session.user.email || ""
  };
  const profileImage = dbUser?.image || session.user.image;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="ui-card overflow-hidden">
        <div className="relative border-b border-zinc-200 bg-zinc-950 p-5 text-white dark:border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.24),transparent_34rem)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/10 text-3xl font-black shadow-2xl shadow-black/20">
                {profileImage ? (
                  <img src={profileImage} alt="" className="size-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-white/60">person</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-lime-300">پروفایل بازیکن</p>
                <h1 className="mt-1 truncate text-3xl font-black text-white">{userData.name || "بازیکن مافیا"}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-white">{roleText}</span>
                  <span className="rounded-lg border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-lime-200">
                    {dbUser?.emailVerified ? "ایمیل تایید شده" : "در انتظار تایید ایمیل"}
                  </span>
                  <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-sky-200">
                    {googleAccount ? "متصل به گوگل" : "ورود با ایمیل"}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/dashboard/user" className="ui-button-secondary min-h-11 border-white/10 bg-white/10 px-4 text-white hover:bg-white hover:text-zinc-950 dark:border-white/10 dark:bg-white/10">
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
              بازگشت به داشبورد
            </Link>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {[
              ["badge", "سطح دسترسی", roleText, "text-lime-600 dark:text-lime-300"],
              ["alternate_email", "وضعیت ایمیل", dbUser?.emailVerified ? "تایید شده" : "نیاز به تایید", dbUser?.emailVerified ? "text-lime-600 dark:text-lime-300" : "text-amber-600 dark:text-amber-300"],
              ["vpn_key", "ورود با رمز", hasPassword ? "فعال" : "تنظیم نشده", hasPassword ? "text-sky-600 dark:text-sky-300" : "text-zinc-500 dark:text-zinc-400"],
              ["hub", "حساب گوگل", googleAccount ? "متصل" : "متصل نیست", googleAccount ? "text-lime-600 dark:text-lime-300" : "text-zinc-500 dark:text-zinc-400"],
            ].map(([icon, label, value, color]) => (
              <div key={label} className="ui-muted flex items-center gap-3 p-3">
                <span className={`material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm shadow-zinc-950/5 dark:bg-zinc-950 ${color}`}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
                  <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">{value}</p>
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
      </section>
    </div>
  );
}
