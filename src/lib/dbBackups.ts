import "server-only";

import { execFile } from "node:child_process";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BACKUP_PREFIX = "mafia-db";
const BACKUP_EXTENSION = ".dump";
const BACKUP_NAME_PATTERN = /^mafia-db-(auto|manual|pre-restore)-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.dump$/;
const DEFAULT_BACKUP_DIR = path.join(process.cwd(), "data", "db-backups");
const SAFETY_BACKUP_REUSE_WINDOW_MS = 15 * 60 * 1000;

export type DatabaseBackupRecord = {
  fileName: string;
  kind: "auto" | "manual" | "pre-restore";
  createdAt: string;
  sizeBytes: number;
};

export type DatabaseRestoreMode = "full" | "data-only";

function backupDirectory() {
  return process.env.DB_BACKUP_DIR || DEFAULT_BACKUP_DIR;
}

function retentionDays() {
  return Math.max(1, Math.min(30, Number(process.env.DB_BACKUP_RETENTION_DAYS) || 7));
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
}

function backupFileName(kind: DatabaseBackupRecord["kind"]) {
  return `${BACKUP_PREFIX}-${kind}-${timestampForFile()}${BACKUP_EXTENSION}`;
}

function assertDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("متغیر DATABASE_URL برای بکاپ دیتابیس تنظیم نشده است.");
  }
  return databaseUrl;
}

function assertSafeBackupName(fileName: string) {
  const baseName = path.basename(fileName);
  if (baseName !== fileName || !BACKUP_NAME_PATTERN.test(baseName)) {
    throw new Error("نام فایل بکاپ معتبر نیست.");
  }
  return baseName;
}

function backupPath(fileName: string) {
  return path.join(backupDirectory(), assertSafeBackupName(fileName));
}

function kindFromFileName(fileName: string): DatabaseBackupRecord["kind"] {
  if (fileName.includes("-pre-restore-")) return "pre-restore";
  if (fileName.includes("-manual-")) return "manual";
  return "auto";
}

async function ensureBackupDirectory() {
  await mkdir(backupDirectory(), { recursive: true });
}

async function runPgTool(command: "pg_dump" | "pg_restore", args: string[]) {
  try {
    await execFileAsync(command, args, {
      env: process.env,
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch (error: any) {
    const stderr = typeof error?.stderr === "string" ? error.stderr.trim() : "";
    const message = stderr || error?.message || `${command} اجرا نشد.`;
    throw new Error(message);
  }
}

async function validateDatabaseBackupArchive(filePath: string) {
  await runPgTool("pg_restore", ["--list", filePath]);
}

async function latestReusableSafetyBackup(excludeFileName: string): Promise<DatabaseBackupRecord | null> {
  const backups = await listDatabaseBackupFiles();
  const cutoff = Date.now() - SAFETY_BACKUP_REUSE_WINDOW_MS;
  return (
    backups.find(
      (backup) =>
        backup.kind === "pre-restore" &&
        backup.fileName !== excludeFileName &&
        Date.parse(backup.createdAt) >= cutoff
    ) || null
  );
}

export async function pruneOldDatabaseBackups() {
  await ensureBackupDirectory();
  const cutoff = Date.now() - retentionDays() * 24 * 60 * 60 * 1000;
  const fileNames = await readdir(backupDirectory());

  await Promise.allSettled(
    fileNames
      .filter((fileName) => BACKUP_NAME_PATTERN.test(fileName))
      .map(async (fileName) => {
        const filePath = backupPath(fileName);
        const fileStat = await stat(filePath);
        if (fileStat.mtime.getTime() < cutoff) {
          await unlink(filePath).catch(() => undefined);
        }
      })
  );
}

export async function listDatabaseBackupFiles(): Promise<DatabaseBackupRecord[]> {
  await ensureBackupDirectory();
  await pruneOldDatabaseBackups();
  const fileNames = await readdir(backupDirectory());
  const backups = await Promise.all(
    fileNames
      .filter((fileName) => BACKUP_NAME_PATTERN.test(fileName))
      .map(async (fileName) => {
        const fileStat = await stat(backupPath(fileName));
        return {
          fileName,
          kind: kindFromFileName(fileName),
          createdAt: fileStat.mtime.toISOString(),
          sizeBytes: fileStat.size,
        };
      })
  );

  return backups.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export async function createDatabaseBackupFile(kind: DatabaseBackupRecord["kind"] = "manual") {
  await ensureBackupDirectory();
  const databaseUrl = assertDatabaseUrl();
  const fileName = backupFileName(kind);
  const filePath = backupPath(fileName);

  try {
    await runPgTool("pg_dump", [databaseUrl, "-Fc", "--no-owner", "--no-acl", "-f", filePath]);
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
  await pruneOldDatabaseBackups();

  const fileStat = await stat(filePath);
  return {
    fileName,
    kind,
    createdAt: fileStat.mtime.toISOString(),
    sizeBytes: fileStat.size,
  };
}

export async function deleteDatabaseBackupFile(fileName: string) {
  await unlink(backupPath(fileName));
}

export async function restoreDatabaseBackupFile(fileName: string, mode: DatabaseRestoreMode = "full") {
  const databaseUrl = assertDatabaseUrl();
  const safeFileName = assertSafeBackupName(fileName);
  const filePath = backupPath(safeFileName);

  await stat(filePath);
  await validateDatabaseBackupArchive(filePath);
  const reusableSafetyBackup = await latestReusableSafetyBackup(safeFileName);
  const safetyBackup = reusableSafetyBackup || await createDatabaseBackupFile("pre-restore");

  const restoreArgs =
    mode === "data-only"
      ? [
          "--data-only",
          "--clean",
          "--if-exists",
          "--disable-triggers",
          "--no-owner",
          "--no-acl",
          "--exit-on-error",
          "--single-transaction",
          "--dbname",
          databaseUrl,
          filePath,
        ]
      : [
          "--clean",
          "--if-exists",
          "--no-owner",
          "--no-acl",
          "--exit-on-error",
          "--single-transaction",
          "--dbname",
          databaseUrl,
          filePath,
        ];

  await runPgTool("pg_restore", restoreArgs);

  return { restoredFileName: safeFileName, safetyBackup, safetyBackupReused: Boolean(reusableSafetyBackup), mode };
}

export async function restoreDatabaseBackupDataOnlyFile(fileName: string) {
  return restoreDatabaseBackupFile(fileName, "data-only");
}
