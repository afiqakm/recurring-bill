import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { runMigrations } from "@/server/migrations";

export async function POST(request: Request) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runMigrations(getDb());
  return NextResponse.json({ ok: true });
}
