import { NextResponse } from "next/server";

import { requireSession } from "@/server/auth";
import { listCategories } from "@/server/categoriesRepo";

export async function GET(request: Request) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await listCategories();
  return NextResponse.json({
    categories,
    total: categories.length,
  });
}
