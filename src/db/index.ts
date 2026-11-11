import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

// Auto-load environment file jika script dieksekusi mandiri (di luar Next.js runtime)
if (!process.env.TURSO_DATABASE_URL) {
  const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  } else if (typeof process.loadEnvFile === "function" && fs.existsSync(path.resolve(process.cwd(), ".env"))) {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  }
}

const dbUrl = process.env.TURSO_DATABASE_URL || "file:shrimpcashier-dev.db";
const dbAuthToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const rawClient = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

export const db = drizzle(rawClient, { schema });

export { schema };
