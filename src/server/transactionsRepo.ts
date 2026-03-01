import "server-only";

import { randomUUID } from "node:crypto";

import { getDb } from "@/server/db";
import { categorizeName } from "@/server/categorize";
import { ensureCategory } from "@/server/categoriesRepo";
import type {
  ListTransactionsParams,
  ListTransactionsResult,
  Transaction,
} from "@/types/item";

type DbTransactionRow = {
  id: string;
  item_id: string;
  item_name: string;
  category: string;
  month: string;
  amount: number;
  due_day: number | null;
  paid: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

function toBoundedNumber(value: number | undefined, fallback: number, max: number): number {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(max, value));
}

function mapRow(row: DbTransactionRow): Transaction {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    category: row.category,
    month: row.month,
    amount: Number(row.amount),
    dueDay: row.due_day,
    paid: row.paid,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePaid(value: string | undefined): string | null {
  if (!value || value.trim() === "") {
    return null;
  }
  return value.trim().toLowerCase();
}

function buildUniqueKey(input: {
  name: string;
  month: string;
  amount: number;
  dueDay: number | null;
  paid: string | null;
}) {
  return [
    input.name.trim().toLowerCase(),
    input.month.trim().toLowerCase(),
    input.amount.toFixed(2),
    input.dueDay === null ? "" : String(input.dueDay),
    input.paid ?? "",
  ].join("|");
}

async function ensureItemId(name: string, category: string, source: string): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  await ensureCategory(category);
  const lookup = await db.execute({
    sql: "SELECT id FROM items WHERE name = ?",
    args: [name],
  });

  if (lookup.rows.length > 0) {
    await db.execute({
      sql: "UPDATE items SET category = ?, updated_at = ? WHERE name = ?",
      args: [category, now, name],
    });
    return String(lookup.rows[0].id);
  }

  const id = randomUUID();
  await db.execute({
    sql: `
      INSERT INTO items (id, name, category, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, name, category, source, now, now],
  });
  return id;
}

export type ParsedImportTransactionRow = {
  name: string;
  category?: string;
  month?: string;
  amount?: string;
  dueDay?: string;
  paid?: string;
  source?: string;
};

export type TransactionImportSummary = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export async function upsertTransactions(
  rows: ParsedImportTransactionRow[],
): Promise<TransactionImportSummary> {
  const db = getDb();
  const summary: TransactionImportSummary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) {
      summary.skipped += 1;
      continue;
    }

    const amount = Number(row.amount);
    if (!Number.isFinite(amount)) {
      summary.errors.push(`name="${name}" missing/invalid amount`);
      continue;
    }

    const month = row.month?.trim() ?? "";
    if (!month) {
      summary.errors.push(`name="${name}" missing month`);
      continue;
    }

    const dueDayRaw = row.dueDay?.trim() ?? "";
    const dueDay = dueDayRaw === "" ? null : Number.parseInt(dueDayRaw, 10);
    if (dueDayRaw !== "" && !Number.isInteger(dueDay)) {
      summary.errors.push(`name="${name}" invalid dueDay "${dueDayRaw}"`);
      continue;
    }

    const paid = normalizePaid(row.paid);
    const category = row.category?.trim() || categorizeName(name);
    const itemId = await ensureItemId(name, category, row.source ?? "csv");
    const uniqueKey = buildUniqueKey({ name, month, amount, dueDay, paid });
    const now = new Date().toISOString();

    try {
      const existing = await db.execute({
        sql: "SELECT id FROM transactions WHERE unique_key = ?",
        args: [uniqueKey],
      });

      if (existing.rows.length > 0) {
        await db.execute({
          sql: `
            UPDATE transactions
            SET item_id = ?, month = ?, amount = ?, due_day = ?, paid = ?, source = ?, updated_at = ?
            WHERE unique_key = ?
          `,
          args: [itemId, month, amount, dueDay, paid, row.source ?? "csv", now, uniqueKey],
        });
        summary.updated += 1;
      } else {
        await db.execute({
          sql: `
            INSERT INTO transactions
            (id, item_id, unique_key, month, amount, due_day, paid, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            randomUUID(),
            itemId,
            uniqueKey,
            month,
            amount,
            dueDay,
            paid,
            row.source ?? "csv",
            now,
            now,
          ],
        });
        summary.inserted += 1;
      }
    } catch (error) {
      summary.errors.push(
        `name="${name}" month="${month}" failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

export async function listTransactions(
  params: ListTransactionsParams,
): Promise<ListTransactionsResult> {
  const db = getDb();
  const whereClauses: string[] = [];
  const args: Array<string | number> = [];

  if (params.category && params.category.trim() !== "") {
    whereClauses.push("i.category = ?");
    args.push(params.category.trim());
  }

  if (params.search && params.search.trim() !== "") {
    whereClauses.push("LOWER(i.name) LIKE ?");
    args.push(`%${params.search.trim().toLowerCase()}%`);
  }

  if (params.month && params.month.trim() !== "") {
    whereClauses.push("t.month = ?");
    args.push(params.month.trim());
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const limit = toBoundedNumber(params.limit, 100, 500);
  const offset = toBoundedNumber(params.offset, 0, 1_000_000);

  const [listResult, totalResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT
          t.id,
          t.item_id,
          i.name AS item_name,
          i.category AS category,
          t.month,
          t.amount,
          t.due_day,
          t.paid,
          t.source,
          t.created_at,
          t.updated_at
        FROM transactions t
        INNER JOIN items i ON i.id = t.item_id
        ${whereSql}
        ORDER BY t.month DESC, i.name ASC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    }),
    db.execute({
      sql: `
        SELECT COUNT(*) AS total
        FROM transactions t
        INNER JOIN items i ON i.id = t.item_id
        ${whereSql}
      `,
      args,
    }),
  ]);

  return {
    transactions: listResult.rows.map((row) => mapRow(row as unknown as DbTransactionRow)),
    total: Number(totalResult.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}
