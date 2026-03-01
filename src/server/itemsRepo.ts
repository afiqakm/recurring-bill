import "server-only";

import { randomUUID } from "node:crypto";

import { getDb } from "@/server/db";
import { categorizeName } from "@/server/categorize";
import { ensureCategory, listCategories } from "@/server/categoriesRepo";
import type {
  ImportSummary,
  Item,
  ListItemsParams,
  ListItemsResult,
  UpsertRow,
} from "@/types/item";

type DbItemRow = {
  id: string;
  name: string;
  category: string;
  source: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBoundedNumber(value: number | undefined, fallback: number, max: number): number {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(max, value));
}

export async function listItems(params: ListItemsParams): Promise<ListItemsResult> {
  const db = getDb();
  const whereClauses: string[] = [];
  const args: Array<string | number> = [];

  if (params.category && params.category.trim() !== "") {
    whereClauses.push("category = ?");
    args.push(params.category.trim());
  }

  if (params.search && params.search.trim() !== "") {
    whereClauses.push("LOWER(name) LIKE ?");
    args.push(`%${params.search.trim().toLowerCase()}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const limit = toBoundedNumber(params.limit, 25, 100);
  const offset = toBoundedNumber(params.offset, 0, 1_000_000);

  const [itemsResult, totalResult, categoriesResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT id, name, category, source, created_at, updated_at
        FROM items
        ${whereSql}
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS total FROM items ${whereSql}`,
      args,
    }),
    listCategories(),
  ]);

  const total = Number(totalResult.rows[0]?.total ?? 0);
  const items = itemsResult.rows.map((row) => mapRow(row as unknown as DbItemRow));
  const categories = categoriesResult.map((row) => row.name);

  return {
    items,
    categories,
    total,
    limit,
    offset,
  };
}

export async function createItem(input: {
  name: string;
  category?: string;
  source?: string;
}): Promise<Item> {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  const name = input.name.trim();
  const category = input.category?.trim() || categorizeName(name);
  const source = input.source ?? "manual";
  await ensureCategory(category);

  await db.execute({
    sql: `
      INSERT INTO items (id, name, category, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, name, category, source, now, now],
  });

  return {
    id,
    name,
    category,
    source,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateItem(
  id: string,
  input: { name?: string; category?: string },
): Promise<Item | null> {
  const db = getDb();
  const existingResult = await db.execute({
    sql: `SELECT id, name, category, source, created_at, updated_at FROM items WHERE id = ?`,
    args: [id],
  });

  if (existingResult.rows.length === 0) {
    return null;
  }

  const existing = mapRow(existingResult.rows[0] as unknown as DbItemRow);
  const nextName = input.name?.trim() || existing.name;
  const nextCategory =
    input.category?.trim() ||
    (input.name && !input.category ? categorizeName(nextName) : existing.category);
  const updatedAt = new Date().toISOString();
  await ensureCategory(nextCategory);

  await db.execute({
    sql: `
      UPDATE items
      SET name = ?, category = ?, updated_at = ?
      WHERE id = ?
    `,
    args: [nextName, nextCategory, updatedAt, id],
  });

  return {
    ...existing,
    name: nextName,
    category: nextCategory,
    updatedAt,
  };
}

export async function deleteItem(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: `DELETE FROM items WHERE id = ?`,
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function upsertMany(rows: UpsertRow[]): Promise<ImportSummary> {
  const db = getDb();
  const summary: ImportSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const seenNames = new Set<string>();

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) {
      summary.skipped += 1;
      continue;
    }

    const stableName = name.toLowerCase();
    if (seenNames.has(stableName)) {
      summary.skipped += 1;
      continue;
    }
    seenNames.add(stableName);

    const category = row.category?.trim() || categorizeName(name);
    const now = new Date().toISOString();
    await ensureCategory(category);

    try {
      const existing = await db.execute({
        sql: "SELECT id FROM items WHERE name = ?",
        args: [name],
      });

      if (existing.rows.length > 0) {
        await db.execute({
          sql: "UPDATE items SET category = ?, updated_at = ? WHERE name = ?",
          args: [category, now, name],
        });
        summary.updated += 1;
      } else {
        await db.execute({
          sql: `
            INSERT INTO items (id, name, category, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          args: [randomUUID(), name, category, row.source ?? "csv", now, now],
        });
        summary.inserted += 1;
      }
    } catch (error) {
      summary.errors.push(
        `name="${name}" failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}
