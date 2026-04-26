import { getMafiaRoles, getScenarios } from "@/actions/admin";
import { ScenariosManager } from "@/components/admin/ScenariosManager";

export default async function ModeratorScenariosPage() {
  const roles = await getMafiaRoles();
  const initialScenarios = await getScenarios();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black">مدیریت سناریوها</h1>
        <p className="text-zinc-500">ایجاد و ویرایش سناریوهای بازی برای استفاده در لابی‌ها</p>
      </div>

      <ScenariosManager initialRoles={roles} initialScenarios={initialScenarios} />
    </div>
  );
}
