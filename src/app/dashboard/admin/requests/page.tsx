import { auth } from "@/auth";
import { AdminSuggestionRequestsPanel } from "@/components/suggestions/AdminSuggestionRequestsPanel";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminSuggestionRequestsPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, isBanned: true },
      })
    : null;

  if (!user || user.isBanned || user.role !== "ADMIN") {
    redirect(user?.role === "MODERATOR" ? "/dashboard/moderator" : "/dashboard/user");
  }

  return <AdminSuggestionRequestsPanel />;
}
