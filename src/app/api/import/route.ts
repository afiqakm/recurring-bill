import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { parseCsvRows } from "@/server/csv";
import { upsertTransactions } from "@/server/transactionsRepo";

async function readSampleCsv(): Promise<string> {
  const preferred = path.join(process.cwd(), "samples", "normalized_with_categories.csv");
  const fallback = path.join(process.cwd(), "sample", "normalized_with_categories.csv");

  try {
    return await readFile(preferred, "utf8");
  } catch {
    return readFile(fallback, "utf8");
  }
}

export async function POST(request: Request) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const source = String(formData.get("source") ?? "").toLowerCase();
  let csvText = "";

  if (source === "sample") {
    csvText = await readSampleCsv();
  } else {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }
    csvText = await file.text();
  }

  let rows: ReturnType<typeof parseCsvRows>;
  try {
    rows = parseCsvRows(csvText);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid CSV" },
      { status: 400 },
    );
  }

  const rowsWithSource = rows.map((row) => ({
    name: row.name,
    category: row.category,
    month: row.month,
    amount: row.amount,
    dueDay: row.dueDay,
    paid: row.paid,
    source: source === "sample" ? "csv" : "upload",
  }));
  const summary = await upsertTransactions(rowsWithSource);

  return NextResponse.json({
    ...summary,
    totalRows: rowsWithSource.length,
  });
}
