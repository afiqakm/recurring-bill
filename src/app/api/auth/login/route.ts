import { NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, sessionCookie, verifyLoginCredentials } from "@/server/auth";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  if (!verifyLoginCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = createSessionToken(username);
  const response = NextResponse.json({ ok: true, username });
  response.cookies.set({
    name: sessionCookie.name,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });
  return response;
}
