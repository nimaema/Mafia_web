import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardIndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin/users");
  }

  if (session.user.role === "MODERATOR") {
    redirect("/dashboard/moderator");
  }

  redirect("/dashboard/user");
}
