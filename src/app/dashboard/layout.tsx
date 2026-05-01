import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const isAdmin = session.user?.role === "ADMIN";
  const isModerator = session.user?.role === "MODERATOR" || isAdmin;

  // Simple server-side logout action
  const handleLogout = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="app-page min-h-screen pb-28 md:pb-0 md:flex md:items-start" dir="rtl">
      <DashboardNavigation
        isAdmin={isAdmin}
        isModerator={isModerator}
        logoutAction={handleLogout}
        user={{
          name: session.user?.name,
          image: session.user?.image,
          role: session.user?.role,
        }}
      />

      <main className="relative z-10 w-full flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
