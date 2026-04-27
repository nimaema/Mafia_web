import { getUserHistoryPage } from "@/actions/dashboard";
import { HistoryClient } from "./HistoryClient";

export default async function UserHistoryPage() {
  const initialData = await getUserHistoryPage(0, 10);

  return <HistoryClient initialData={initialData} />;
}
