import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "rb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  username: string;
  exp: number;
};

function getAuthConfig() {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!username || !password || !secret) {
    throw new Error("APP_USERNAME, APP_PASSWORD and AUTH_SECRET are required");
  }
  return { username, password, secret };
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header
      .split(";")
      .map((segment) => segment.trim())
      .filter((segment) => segment.includes("="))
      .map((segment) => {
        const index = segment.indexOf("=");
        return [segment.slice(0, index), segment.slice(index + 1)];
      }),
  );
}

function encodeSession(payload: SessionPayload): string {
  const { secret } = getAuthConfig();
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

function decodeSession(value: string): SessionPayload | null {
  const { secret } = getAuthConfig();
  const [payloadB64, signature] = value.split(".");
  if (!payloadB64 || !signature) {
    return null;
  }

  const expected = signPayload(payloadB64, secret);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64)) as SessionPayload;
    if (!payload.username || !payload.exp || Date.now() > payload.exp * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyLoginCredentials(username: string, password: string): boolean {
  const config = getAuthConfig();
  return username === config.username && password === config.password;
}

export function createSessionToken(username: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return encodeSession({ username, exp });
}

export function getSessionFromRequest(request: Request): SessionPayload | null {
  const cookieValue = parseCookieHeader(request.headers.get("cookie"))[SESSION_COOKIE_NAME];
  if (!cookieValue) {
    return null;
  }
  return decodeSession(cookieValue);
}

export function requireSession(request: Request): boolean {
  return getSessionFromRequest(request) !== null;
}

export async function requirePageSession(): Promise<void> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE_NAME)?.value;
  if (!value || !decodeSession(value)) {
    throw new Error("UNAUTHENTICATED");
  }
}

export async function getPageSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE_NAME)?.value;
  if (!value) {
    return null;
  }
  return decodeSession(value);
}

export const sessionCookie = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
};
