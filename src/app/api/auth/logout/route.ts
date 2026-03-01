import { NextResponse } from "next/server";

import { sessionCookie } from "@/server/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: sessionCookie.name,
    value: "",
    path: "/",
    httpOnly: true,
    maxAge: 0,
  });
  return response;
}
