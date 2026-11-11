import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { compareSync } from "bcrypt-ts";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { UserRole } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Cari user berdasarkan username
    const foundUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah." },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Akun ini telah dinonaktifkan. Hubungi Administrator." },
        { status: 403 }
      );
    }

    const isMatch = compareSync(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah." },
        { status: 401 }
      );
    }

    // Buat token sesi
    const token = await createSession(user.id);

    // Set HTTP-Only Cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          namaLengkap: user.namaLengkap,
          role: user.role as UserRole,
        },
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Terjadi kesalahan server saat login." },
      { status: 500 }
    );
  }
}
