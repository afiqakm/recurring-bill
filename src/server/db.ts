import "server-only";

import { createClient } from "@libsql/client";

let client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required");
  }

  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN is required");
  }

  if (!client) {
    client = createClient({
      url,
      authToken,
    });
  }

  return client;
}
