import { getAllUsers } from "@/actions/admin";
import { UsersTable } from "@/components/admin/UsersTable";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard/user");
  }

  const users = await getAllUsers();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black">مدیریت کاربران</h1>
        <p className="text-zinc-500">مشاهده، تغییر سطح دسترسی و حذف کاربران سیستم</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <UsersTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
