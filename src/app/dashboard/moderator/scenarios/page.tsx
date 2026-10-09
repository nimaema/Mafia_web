import { getMafiaRoles, getScenarios } from "@/actions/admin";
import { ScenariosManager } from "@/components/admin/ScenariosManager";

export default async function ModeratorScenariosPage() {
  const roles = await getMafiaRoles();
  const initialScenarios = await getScenarios();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="nq-display text-[2.6rem] leading-[1.15]">سناریوها</h1>
        <p className="mt-1 max-w-xl font-medium leading-7 text-muted">
          {`${initialScenarios.length.toLocaleString("fa-IR")} سناریو در کتابخانه. بسازید، ویرایش کنید یا از یک سناریوی آماده نسخه بگیرید.`}
        </p>
      </header>
      <ScenariosManager initialRoles={roles} initialScenarios={initialScenarios} />
    </div>
  );
}
