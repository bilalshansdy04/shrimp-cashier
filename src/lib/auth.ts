import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import { AppUser, UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "shrimpcashier_session";

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 hari

  await db.insert(schema.sessions).values({
    id: `sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });

  return token;
}

export async function getSessionUser(req?: Request): Promise<AppUser | null> {
  try {
    let token: string | undefined;

    // 1. Ambil dari header Authorization (jika ada)
    if (req) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Ambil dari Cookie HTTP
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const now = new Date().toISOString();
    const rows = await db
      .select({
        user: schema.users,
        session: schema.sessions,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(
        and(
          eq(schema.sessions.token, token),
          gt(schema.sessions.expiresAt, now),
          eq(schema.users.isActive, true)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;

    const u = rows[0].user;
    return {
      id: u.id,
      username: u.username,
      namaLengkap: u.namaLengkap,
      role: u.role as UserRole,
      isActive: u.isActive,
      createdBy: u.createdBy,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  } catch (error) {
    console.error("Error getSessionUser:", error);
    return null;
  }
}

export async function destroySession(token: string): Promise<void> {
  try {
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  } catch (e) {}
}
