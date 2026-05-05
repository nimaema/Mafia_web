import { getMafiaRoles, getScenarios } from "@/actions/admin";
import { ScenariosManager } from "@/components/admin/ScenariosManager";
import { SectionHeader } from "@/components/CommandUI";

export default async function ModeratorScenariosPage() {
  const roles = await getMafiaRoles();
  const initialScenarios = await getScenarios();

  return (
    <div className="space-y-5">
      <SectionHeader title="کتابخانه سناریوها" eyebrow="Scenario Library" icon="account_tree" />
      <ScenariosManager initialRoles={roles} initialScenarios={initialScenarios} />
    </div>
  );
}
