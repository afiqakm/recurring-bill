import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { createItem, listItems } from "@/server/itemsRepo";
import { createItemSchema, listItemsQuerySchema } from "@/server/schemas";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("unique");
}

export async function GET(request: Request) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parseResult = listItemsQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const result = await listItems(parseResult.data);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parseResult = createItemSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const item = await createItem(parseResult.data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "An item with this name already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create item" },
      { status: 500 },
    );
  }
}
