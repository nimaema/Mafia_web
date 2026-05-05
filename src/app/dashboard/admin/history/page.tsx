import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdminGameHistoryPage } from "@/actions/dashboard";
import { AdminHistoryClient } from "./AdminHistoryClient";

export default async function AdminHistoryPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard/user");
  const initialData = await getAdminGameHistoryPage(0, 10);
  return <AdminHistoryClient initialData={initialData} />;
}
