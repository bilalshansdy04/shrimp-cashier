import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { compareSync, hashSync } from "bcrypt-ts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const recoveryKey = (body.recovery_key || "").trim().toUpperCase();
    const newUsername = (body.new_username || "").trim().toLowerCase();
    const newPassword = body.new_password || "";

    if (!recoveryKey || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Kunci pemulihan dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Ambil hash recovery key dari system_meta
    const metaRows = await db
      .select()
      .from(schema.systemMeta)
      .where(eq(schema.systemMeta.key, "emergency_recovery_key_hash"))
      .limit(1);

    if (metaRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kunci pemulihan darurat belum diaktifkan pada sistem ini. Gunakan terminal CLI (npm run admin:reset).",
        },
        { status: 400 }
      );
    }

    const keyHash = metaRows[0].value;
    const isValidKey = compareSync(recoveryKey, keyHash);

    if (!isValidKey) {
      return NextResponse.json(
        { success: false, message: "Kunci Pemulihan Darurat tidak valid." },
        { status: 401 }
      );
    }

    // Cari akun super admin
    const superadmins = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, "spradmcsr"))
      .limit(1);

    const now = new Date().toISOString();
    const passwordHash = hashSync(newPassword, 12);

    if (superadmins.length > 0) {
      const sa = superadmins[0];
      await db
        .update(schema.users)
        .set({
          username: newUsername || sa.username,
          passwordHash,
          isActive: true,
          updatedAt: now,
        })
        .where(eq(schema.users.id, sa.id));
    } else {
      // Buat baru jika terhapus
      await db.insert(schema.users).values({
        id: "usr_superadmin_recovered",
        username: newUsername || "spradmcsr",
        namaLengkap: "Super Administrator",
        passwordHash,
        role: "spradmcsr",
        isActive: true,
        createdBy: "emergency_recovery",
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Akun Super Admin berhasil dipulihkan! Silakan login dengan password baru.",
    });
  } catch (error: any) {
    console.error("Emergency recovery error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses pemulihan darurat." },
      { status: 500 }
    );
  }
}
