import { getAdminGameHistoryPage } from "@/actions/dashboard";
import { AdminHistoryClient } from "./AdminHistoryClient";

export default async function AdminHistoryPage() {
  const initialData = await getAdminGameHistoryPage(0, 10);
  return <AdminHistoryClient initialData={initialData} />;
}
