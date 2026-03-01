import "server-only";

import { randomUUID } from "node:crypto";

import { getDb } from "@/server/db";

export type CategoryRow = {
  id: string;
  name: string;
  itemCount: number;
  transactionCount: number;
};

export async function ensureCategory(name: string): Promise<void> {
  const db = getDb();
  const normalized = name.trim();
  if (!normalized) {
    return;
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO categories (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET updated_at = excluded.updated_at
    `,
    args: [randomUUID(), normalized, now, now],
  });
}

export async function listCategories(): Promise<CategoryRow[]> {
  const db = getDb();
  const result = await db.execute(`
    SELECT
      c.id,
      c.name,
      COALESCE(ic.item_count, 0) AS item_count,
      COALESCE(tc.transaction_count, 0) AS transaction_count
    FROM categories c
    LEFT JOIN (
      SELECT category, COUNT(*) AS item_count
      FROM items
      GROUP BY category
    ) ic ON ic.category = c.name
    LEFT JOIN (
      SELECT i.category, COUNT(*) AS transaction_count
      FROM transactions t
      INNER JOIN items i ON i.id = t.item_id
      GROUP BY i.category
    ) tc ON tc.category = c.name
    ORDER BY c.name ASC
  `);

  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    itemCount: Number(row.item_count ?? 0),
    transactionCount: Number(row.transaction_count ?? 0),
  }));
}
