import AdminConfigPanel from "@/components/admin/AdminConfigPanel";
import { redirect } from "next/navigation";

type AdminDashboardPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;

  if (params?.tab === "users") {
    redirect("/dashboard/admin/users");
  }

  return <AdminConfigPanel />;
}
