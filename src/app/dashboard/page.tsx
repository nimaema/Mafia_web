import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardIndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  redirect("/dashboard/user");
}
