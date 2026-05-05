import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DatabaseBackupPanel } from "@/components/admin/DatabaseBackupPanel";

export default async function AdminBackupsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard/user");
  return <DatabaseBackupPanel />;
}
