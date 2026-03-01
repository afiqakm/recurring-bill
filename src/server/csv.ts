import "server-only";

import { parse } from "csv-parse/sync";

export type ParsedImportRow = {
  name: string;
  category?: string;
  month?: string;
  amount?: string;
  dueDay?: string;
  paid?: string;
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

export function parseCsvRows(input: string): ParsedImportRow[] {
  const rows = parse(input, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string | undefined>>;

  if (rows.length === 0) {
    return [];
  }

  const headers = Object.keys(rows[0]).map((key) => normalizeHeader(key));
  if (!headers.includes("name")) {
    throw new Error('CSV must contain a "name" column');
  }

  return rows.map((row) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), value ?? ""]),
    );

    const name = (normalizedRow.name ?? "").trim();
    const category = (normalizedRow.category ?? "").trim();
    const month = (normalizedRow.month ?? "").trim();
    const amount = (normalizedRow.amount ?? "").trim();
    const dueDay = (normalizedRow.dueday ?? normalizedRow.due_day ?? "").trim();
    const paid = (normalizedRow.paid ?? "").trim();

    return {
      name,
      category: category || undefined,
      month: month || undefined,
      amount: amount || undefined,
      dueDay: dueDay || undefined,
      paid: paid || undefined,
    };
  });
}
