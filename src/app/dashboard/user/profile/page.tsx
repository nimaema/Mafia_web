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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 text-[var(--pm-text)]">
      <section className="pm-card overflow-hidden">
        <div className="relative border-b border-[var(--pm-line)] bg-[var(--pm-surface-strong)] p-5 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--pm-primary-soft),transparent_44%),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:auto,2.75rem_2.75rem] opacity-70 dark:bg-[linear-gradient(135deg,var(--pm-primary-soft),transparent_44%),linear-gradient(90deg,rgba(96,165,250,0.07)_1px,transparent_1px)]" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--pm-line)] bg-[var(--pm-surface)] text-3xl font-black shadow-[var(--pm-shadow-soft)]">
                {profileImage ? (
                  <img src={profileImage} alt="" className="size-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-[var(--pm-muted)]">person</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[var(--pm-primary)]">پروفایل بازیکن</p>
                <h1 className="mt-1 truncate text-3xl font-black text-[var(--pm-text)]">{userData.name || "بازیکن مافیا"}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                  <span className="pm-chip">{roleText}</span>
                  <span className={dbUser?.emailVerified ? "pm-chip pm-chip-success" : "pm-chip pm-chip-warning"}>
                    {dbUser?.emailVerified ? "ایمیل تایید شده" : "در انتظار تایید ایمیل"}
                  </span>
                  <span className="pm-chip pm-chip-primary">
                    {googleAccount ? "متصل به گوگل" : "ورود با ایمیل"}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/dashboard/user" className="pm-button pm-button-secondary min-h-[2.5rem]">
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
              بازگشت به داشبورد
            </Link>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {[
              ["badge", "سطح دسترسی", roleText, "text-[var(--pm-primary)]"],
              ["alternate_email", "وضعیت ایمیل", dbUser?.emailVerified ? "تایید شده" : "نیاز به تایید", dbUser?.emailVerified ? "text-[var(--pm-success)]" : "text-[var(--pm-warning)]"],
              ["vpn_key", "ورود با رمز", hasPassword ? "فعال" : "تنظیم نشده", hasPassword ? "text-[var(--pm-primary)]" : "text-[var(--pm-muted)]"],
              ["hub", "حساب گوگل", googleAccount ? "متصل" : "متصل نیست", googleAccount ? "text-[var(--pm-primary)]" : "text-[var(--pm-muted)]"],
            ].map(([icon, label, value, color]) => (
              <div key={label} className="pm-muted-card border border-[var(--pm-line)] flex items-center gap-3 p-3">
                <span className={`material-symbols-outlined flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--pm-surface)] text-xl shadow-[var(--pm-shadow-soft)] ${color}`}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[var(--pm-muted)]">{label}</p>
                  <p className="mt-1 truncate text-sm font-black text-[var(--pm-text)]">{value}</p>
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
