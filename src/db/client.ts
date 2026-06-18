import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

export interface EnvWithDb {
  DB?: D1Database;
}

export function getDb(contextOrEnv?: EnvWithDb | { env?: EnvWithDb }) {
  const candidate = contextOrEnv as { env?: EnvWithDb; DB?: D1Database } | undefined;
  const env = candidate?.env ?? candidate;
  if (env?.DB) return drizzleD1(env.DB);
  const url = process.env.LOCAL_DB_URL ?? "file:local.db";
  return drizzleLibsql(createClient({ url }));
}
