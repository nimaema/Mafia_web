import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { prisma } from "@/lib/prisma";
import { profileImageUrl } from "@/lib/profileImage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const dbUser = session.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, image: true, role: true },
      })
    : null;
  const effectiveRole = dbUser?.role || session.user?.role;
  const isAdmin = effectiveRole === "ADMIN";
  const isModerator = effectiveRole === "MODERATOR" || isAdmin;
  const navigationImage = dbUser
    ? profileImageUrl(session.user.id, dbUser.image)
    : session.user?.image;

  // Simple server-side logout action
  const handleLogout = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="min-h-dvh bg-canvas pb-[calc(env(safe-area-inset-bottom)+5rem)] md:flex md:items-start md:pb-0" dir="rtl">
      <DashboardNavigation
        isAdmin={isAdmin}
        isModerator={isModerator}
        logoutAction={handleLogout}
        user={{
          id: session.user?.id,
          name: dbUser?.name || session.user?.name,
          image: navigationImage,
          role: effectiveRole,
        }}
      />

      <main className="relative w-full flex-1 overflow-x-hidden px-4 pb-6 pt-5 md:px-10 md:py-10">
        <div className="motion-page mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
