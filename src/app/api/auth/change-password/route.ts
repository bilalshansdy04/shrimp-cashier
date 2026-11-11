import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, and, ne } from "drizzle-orm";
import { compareSync, hashSync } from "bcrypt-ts";

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { old_password, new_password, new_username, new_nama_lengkap } = body;

    // Ambil record pengguna dari database
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, currentUser.id))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const userRecord = users[0];
    const isSuperAdmin = currentUser.role === "spradmcsr";
    const updateData: Partial<typeof schema.users.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (new_nama_lengkap && new_nama_lengkap.trim()) {
      updateData.namaLengkap = new_nama_lengkap.trim();
    }

    // 1. Logika Pengubahan Username (Hanya Super Admin)
    if (new_username && new_username.trim()) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { success: false, message: "Hanya Super Admin yang diizinkan mengubah username." },
          { status: 403 }
        );
      }

      const trimmedUsername = new_username.trim().toLowerCase();
      // Pastikan username belum dipakai akun lain
      const existing = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.username, trimmedUsername),
            ne(schema.users.id, currentUser.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, message: `Username "${trimmedUsername}" sudah digunakan.` },
          { status: 400 }
        );
      }

      updateData.username = trimmedUsername;
    }

    // 2. Logika Pengubahan Password
    if (new_password) {
      if (new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      // Jika BUKAN Super Admin, WAJIB verifikasi password lama
      if (!isSuperAdmin) {
        if (!old_password) {
          return NextResponse.json(
            { success: false, message: "Password lama wajib diisi untuk verifikasi." },
            { status: 400 }
          );
        }

        const isOldValid = compareSync(old_password, userRecord.passwordHash);
        if (!isOldValid) {
          return NextResponse.json(
            { success: false, message: "Password lama salah." },
            { status: 400 }
          );
        }
      }

      updateData.passwordHash = hashSync(new_password, 12);
    }

    // Eksekusi update
    await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, currentUser.id));

    return NextResponse.json({
      success: true,
      message: "Profil dan keamanan akun berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
