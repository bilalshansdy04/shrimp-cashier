import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, and, ne } from "drizzle-orm";
import { hashSync } from "bcrypt-ts";
import { UserRole } from "@/types";

// GET: Ambil daftar user sesuai hak akses role
export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === "clrkcsr") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Kasir tidak memiliki akses manajemen pengguna." },
        { status: 403 }
      );
    }

    let rows;
    if (currentUser.role === "spradmcsr") {
      // Super Admin melihat semua pengguna
      rows = await db.select().from(schema.users);
    } else {
      // Admin hanya melihat pengguna dengan role kasir (clrkcsr)
      rows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, "clrkcsr"));
    }

    const data = rows.map((u) => ({
      id: u.id,
      username: u.username,
      namaLengkap: u.namaLengkap,
      role: u.role as UserRole,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Buat user baru sesuai hierarki role
export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === "clrkcsr") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Kasir tidak dapat membuat pengguna." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const username = (body.username || "").trim().toLowerCase();
    const namaLengkap = (body.namaLengkap || body.nama || "").trim();
    const password = body.password || "";
    const targetRole = body.role as UserRole;

    if (!username || !namaLengkap || !password || !targetRole) {
      return NextResponse.json(
        { success: false, message: "Username, Nama Lengkap, Password, dan Role wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Pengecekan hierarki role:
    if (currentUser.role === "admmngrcsr") {
      if (targetRole !== "clrkcsr") {
        return NextResponse.json(
          { success: false, message: "Admin hanya diizinkan membuat akun dengan role Kasir." },
          { status: 403 }
        );
      }
    } else if (currentUser.role === "spradmcsr") {
      if (targetRole === "spradmcsr") {
        return NextResponse.json(
          { success: false, message: "Super Admin hanya boleh dibuat melalui CLI / Inisialisasi awal." },
          { status: 400 }
        );
      }
    }

    // Cek username unik
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: `Username "${username}" sudah digunakan.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const passwordHash = hashSync(password, 10);
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(schema.users).values({
      id: newId,
      username,
      namaLengkap,
      passwordHash,
      role: targetRole,
      isActive: true,
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna "${namaLengkap}" berhasil ditambahkan.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT: Edit user & langsung ubah password tanpa butuh password lama
export async function PUT(req: Request) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === "clrkcsr") {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const body = await req.json();
    const { id, namaLengkap, password, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengguna diperlukan." }, { status: 400 });
    }

    // Ambil data user target
    const targetUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (targetUsers.length === 0) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const targetUser = targetUsers[0];

    // Validasi hierarki:
    // Admin hanya boleh mengedit Kasir (clrkcsr)
    if (currentUser.role === "admmngrcsr" && targetUser.role !== "clrkcsr") {
      return NextResponse.json(
        { success: false, message: "Admin hanya berhak mengedit data akun Kasir." },
        { status: 403 }
      );
    }

    // Super Admin tidak boleh mengedit sesama superadmin lewat rute ini (harus via change-password diri sendiri)
    if (targetUser.role === "spradmcsr" && targetUser.id !== currentUser.id) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat memodifikasi akun Super Admin lain." },
        { status: 403 }
      );
    }

    const updateFields: Partial<typeof schema.users.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (namaLengkap && namaLengkap.trim()) {
      updateFields.namaLengkap = namaLengkap.trim();
    }

    if (typeof isActive === "boolean") {
      updateFields.isActive = isActive;
    }

    // Jika ingin langsung override password bawahan:
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { success: false, message: "Password baru minimal 6 karakter." },
          { status: 400 }
        );
      }
      updateFields.passwordHash = hashSync(password.trim(), 10);
    }

    await db
      .update(schema.users)
      .set(updateFields)
      .where(eq(schema.users.id, id));

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hapus user sesuai hierarki
export async function DELETE(req: Request) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === "clrkcsr") {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID pengguna diperlukan." }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." },
        { status: 400 }
      );
    }

    const targetUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (targetUsers.length === 0) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const targetUser = targetUsers[0];

    // Admin hanya boleh menghapus Kasir
    if (currentUser.role === "admmngrcsr" && targetUser.role !== "clrkcsr") {
      return NextResponse.json(
        { success: false, message: "Admin hanya berhak menghapus akun Kasir." },
        { status: 403 }
      );
    }

    if (targetUser.role === "spradmcsr") {
      return NextResponse.json(
        { success: false, message: "Akun Super Admin tidak dapat dihapus." },
        { status: 403 }
      );
    }

    await db.delete(schema.users).where(eq(schema.users.id, id));

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
