import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { deleteItem, updateItem } from "@/server/itemsRepo";
import { patchItemSchema } from "@/server/schemas";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("unique");
}

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parseResult = patchItemSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await context.params;

  try {
    const item = await updateItem(id, parseResult.data);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "An item with this name already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteItem(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
