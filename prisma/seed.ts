import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  mergeRoleDefinitions,
  STANDARD_ROLE_DEFINITIONS,
  STANDARD_SCENARIO_DEFINITIONS,
  type RoleDefinition,
  type ScenarioDefinition,
} from "./scenario-data";
import { readScenarioBackupFile } from "./scenario-backup";

const prisma = new PrismaClient();

async function seedUsers() {
  console.log("🔐 Seeding users...");
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123";

  await prisma.user.upsert({
    where: { email: "admin@mafia.com" },
    update: {},
    create: {
      email: "admin@mafia.com",
      name: "مدیر سیستم",
      password_hash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "mod@mafia.com" },
    update: {},
    create: {
      email: "mod@mafia.com",
      name: "گرداننده",
      password_hash: await bcrypt.hash("mod123", 10),
      role: "MODERATOR",
    },
  });
}

async function migrateLegacyRoleNames() {
  console.log("🔄 Migrating legacy role names...");
  const renames: [string, string][] = [
    ["پدرخوانده", "رئیس مافیا"],
    ["روئین تن", "رویین‌تن"],
    ["زره ساز", "زره‌ساز"],
  ];

  for (const [oldName, newName] of renames) {
    const existing = await prisma.mafiaRole.findUnique({ where: { name: oldName } });
    const conflict = await prisma.mafiaRole.findUnique({ where: { name: newName } });

    if (existing && !conflict) {
      await prisma.mafiaRole.update({ where: { name: oldName }, data: { name: newName } });
      console.log(`  ✅ Renamed "${oldName}" → "${newName}"`);
    }
  }
}

async function syncRoles(roleDefinitions: RoleDefinition[]) {
  console.log("🎭 Seeding roles...");

  const nightAbilitiesData = (role: RoleDefinition) =>
    role.nightAbilities === undefined
      ? {}
      : { nightAbilities: role.nightAbilities === null ? Prisma.JsonNull : role.nightAbilities };

  for (const role of roleDefinitions) {
    await prisma.mafiaRole.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        alignment: role.alignment,
        is_permanent: role.is_permanent ?? true,
        ...nightAbilitiesData(role),
      },
      create: {
        name: role.name,
        alignment: role.alignment,
        description: role.description,
        is_permanent: role.is_permanent ?? true,
        ...nightAbilitiesData(role),
      },
    });
  }

  console.log(`  ✅ ${roleDefinitions.length} roles synced`);
}

async function syncScenarios(scenarios: ScenarioDefinition[]) {
  console.log("📋 Seeding scenarios...");

  const dbRoles = await prisma.mafiaRole.findMany();
  const roleId = (name: string) => {
    const role = dbRoles.find((item) => item.name === name);
    if (!role) console.warn(`  ⚠️ Role not found: ${name}`);
    return role?.id;
  };

  for (const scenario of scenarios) {
    const roleLinks = scenario.roles
      .map((role) => ({ roleId: roleId(role.name), count: role.count }))
      .filter((role): role is { roleId: string; count: number } => role.roleId != null);

    if (roleLinks.length === 0) {
      console.warn(`  ⚠️ Skipping ${scenario.name}: no valid roles`);
      continue;
    }

    const existing = await prisma.scenario.findUnique({ where: { name: scenario.name } });

    if (existing) {
      await prisma.scenarioRole.deleteMany({ where: { scenarioId: existing.id } });
      await prisma.scenario.update({
        where: { id: existing.id },
        data: {
          description: scenario.description,
          roles: {
            create: roleLinks.map((role) => ({
              count: role.count,
              role: { connect: { id: role.roleId } },
            })),
          },
        },
      });
      console.log(`  🔄 Updated: ${scenario.name}`);
    } else {
      await prisma.scenario.create({
        data: {
          name: scenario.name,
          description: scenario.description,
          roles: {
            create: roleLinks.map((role) => ({
              count: role.count,
              role: { connect: { id: role.roleId } },
            })),
          },
        },
      });
      console.log(`  ✅ Created: ${scenario.name}`);
    }
  }
}

async function markLegacyRoles(roleDefinitions: RoleDefinition[]) {
  const currentNames = new Set(roleDefinitions.map((role) => role.name));
  const legacyRoles = await prisma.mafiaRole.findMany({ where: { is_permanent: true } });

  for (const legacyRole of legacyRoles) {
    if (!currentNames.has(legacyRole.name)) {
      await prisma.mafiaRole.update({ where: { id: legacyRole.id }, data: { is_permanent: false } });
      console.log(`  📌 Marked as non-permanent: ${legacyRole.name}`);
    }
  }
}

async function main() {
  await seedUsers();
  await migrateLegacyRoleNames();

  const backup = await readScenarioBackupFile();
  const roleDefinitions = mergeRoleDefinitions(STANDARD_ROLE_DEFINITIONS, backup?.roles || []);
  const scenarioDefinitions = backup?.scenarios?.length ? backup.scenarios : STANDARD_SCENARIO_DEFINITIONS;

  if (backup?.scenarios?.length) {
    console.log(`📦 Scenario backup found. Restoring ${backup.scenarios.length} scenarios from file.`);
  }

  await syncRoles(roleDefinitions);
  await syncScenarios(scenarioDefinitions);
  await markLegacyRoles(roleDefinitions);

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
