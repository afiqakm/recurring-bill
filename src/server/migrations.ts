import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { Client } from "@libsql/client";

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
    .map((statement) => `${statement};`);
}

export async function runMigrations(client: Client): Promise<void> {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = await readFile(filePath, "utf8");
    const statements = splitSqlStatements(sql);
    for (const statement of statements) {
      await client.execute(statement);
    }
  }
}
