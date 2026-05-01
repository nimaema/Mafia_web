import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { Alignment } from "@prisma/client";
import {
  type BackupAuthor,
  ROLE_BACKUP_VERSION,
  SCENARIO_BACKUP_VERSION,
  type RoleBackupFile,
  type RoleDefinition,
  type ScenarioBackupFile,
  type ScenarioDefinition,
} from "./scenario-data";

const SCENARIO_BACKUP_DIR = "data";
const SCENARIO_BACKUP_FILE = "data/scenario-backup.json";
const ROLE_BACKUP_FILE = "data/role-backup.json";

export function scenarioBackupPath() {
  return SCENARIO_BACKUP_FILE;
}

export function roleBackupPath() {
  return ROLE_BACKUP_FILE;
}

export async function scenarioBackupExists() {
  try {
    await access(scenarioBackupPath());
    return true;
  } catch {
    return false;
  }
}

export async function roleBackupExists() {
  try {
    await access(roleBackupPath());
    return true;
  } catch {
    return false;
  }
}

function normalizeAlignment(value: unknown): Alignment | null {
  if (value === Alignment.CITIZEN || value === Alignment.MAFIA || value === Alignment.NEUTRAL) return value;
  return null;
}

function normalizeBackupRole(role: any): RoleDefinition | null {
  const name = typeof role?.name === "string" ? role.name.trim() : "";
  const alignment = normalizeAlignment(role?.alignment);
  if (!name || !alignment) return null;

  return {
    name,
    alignment,
    description: typeof role.description === "string" ? role.description.trim() : "",
    is_permanent: Boolean(role.is_permanent),
    nightAbilities: role.nightAbilities ?? null,
  };
}

function normalizeBackupScenario(scenario: any): ScenarioDefinition | null {
  const name = typeof scenario?.name === "string" ? scenario.name.trim() : "";
  if (!name || !Array.isArray(scenario.roles)) return null;

  const roles = scenario.roles
    .map((role: any) => ({
      name: typeof role?.name === "string" ? role.name.trim() : "",
      count: Math.max(1, Math.min(99, Number(role?.count) || 1)),
    }))
    .filter((role: { name: string; count: number }) => role.name);

  if (roles.length === 0) return null;

  return {
    name,
    description: typeof scenario.description === "string" ? scenario.description.trim() : "",
    roles,
  };
}

function normalizeBackupAuthor(author: any): BackupAuthor | null {
  const id = typeof author?.id === "string" ? author.id.trim() : "";
  if (!id) return null;

  return {
    id,
    name: typeof author.name === "string" && author.name.trim() ? author.name.trim() : null,
    email: typeof author.email === "string" && author.email.trim() ? author.email.trim() : null,
  };
}

export async function readScenarioBackupFile(): Promise<ScenarioBackupFile | null> {
  try {
    const raw = await readFile(scenarioBackupPath(), "utf8");
    const parsed = JSON.parse(raw);
    const roles = Array.isArray(parsed.roles) ? parsed.roles.map(normalizeBackupRole).filter(Boolean) : [];
    const scenarios = Array.isArray(parsed.scenarios) ? parsed.scenarios.map(normalizeBackupScenario).filter(Boolean) : [];

    if (scenarios.length === 0) return null;

    return {
      version: SCENARIO_BACKUP_VERSION,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      exportedBy: normalizeBackupAuthor(parsed.exportedBy),
      roles: roles as RoleDefinition[],
      scenarios: scenarios as ScenarioDefinition[],
    };
  } catch {
    return null;
  }
}

export async function readRoleBackupFile(): Promise<RoleBackupFile | null> {
  try {
    const raw = await readFile(roleBackupPath(), "utf8");
    const parsed = JSON.parse(raw);
    const roles = Array.isArray(parsed.roles) ? parsed.roles.map(normalizeBackupRole).filter(Boolean) : [];

    if (roles.length === 0) return null;

    return {
      version: ROLE_BACKUP_VERSION,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      exportedBy: normalizeBackupAuthor(parsed.exportedBy),
      roles: roles as RoleDefinition[],
    };
  } catch {
    return null;
  }
}

export async function writeScenarioBackupFile(backup: ScenarioBackupFile) {
  const target = scenarioBackupPath();
  await mkdir(SCENARIO_BACKUP_DIR, { recursive: true });
  await writeFile(target, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  return target;
}

export async function writeRoleBackupFile(backup: RoleBackupFile) {
  const target = roleBackupPath();
  await mkdir(SCENARIO_BACKUP_DIR, { recursive: true });
  await writeFile(target, `${JSON.stringify(backup, null, 2)}\n`, "utf8");
  return target;
}
