import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { listTransactionsQuerySchema } from "@/server/schemas";
import { listTransactions } from "@/server/transactionsRepo";

export async function GET(request: Request) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parseResult = listTransactionsQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const result = await listTransactions(parseResult.data);
  return NextResponse.json(result);
}
