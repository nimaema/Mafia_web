import { auth } from "@/auth";
import { getAdminGameHistoryPage } from "@/actions/dashboard";
import { AdminHistoryClient } from "./AdminHistoryClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminHistoryPage() {
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

  const initialData = await getAdminGameHistoryPage(0, 10);
  return <AdminHistoryClient initialData={initialData} />;
}
