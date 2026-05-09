import { getMafiaRoles, getScenarios } from "@/actions/admin";
import { ScenariosManager } from "@/components/admin/ScenariosManager";

export default async function ModeratorScenariosPage() {
  const roles = await getMafiaRoles();
  const initialScenarios = await getScenarios();

  return (
    <div className="space-y-5 text-white">
      <header className="pm-command pm-aurora p-5">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="material-symbols-outlined grid size-14 place-items-center rounded-2xl bg-[var(--pm-primary)] text-3xl text-zinc-950">account_tree</span>
            <div>
              <p className="pm-kicker">کتابخانه سناریو</p>
              <h1 className="mt-1 text-3xl font-black">مدیریت سناریوها</h1>
              <p className="mt-1 text-sm font-bold leading-6 text-white/52">ساخت، ویرایش، تکثیر و مرتب‌سازی سناریوهای قابل استفاده در لابی‌ها.</p>
            </div>
          </div>
          <span className="pm-chip pm-chip-primary">{initialScenarios.length} سناریو</span>
        </div>
      </header>

      <ScenariosManager initialRoles={roles} initialScenarios={initialScenarios} />
    </div>
  );
}
