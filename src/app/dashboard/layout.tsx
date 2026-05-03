import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { prisma } from "@/lib/prisma";
import { profileImageUrl } from "@/lib/profileImage";


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
    <div className="min-h-screen pb-20 md:pb-0 md:flex md:items-start bg-[#0e0e0e] text-[#e5e2e1] font-sans selection:bg-[#98000b] selection:text-white" dir="rtl">
      
      <DashboardNavigation
        isAdmin={isAdmin}
        isModerator={isModerator}
        logoutAction={handleLogout}
        user={{
          name: dbUser?.name || session.user?.name,
          image: navigationImage,
          role: effectiveRole,
        }}
      />

      <main className="relative z-10 w-full flex-1 overflow-x-hidden p-4 md:p-10">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
