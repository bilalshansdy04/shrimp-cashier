import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const res = await db.execute("SELECT id, nama, pin, peran FROM cashiers ORDER BY created_at ASC");
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { nama, pin, peran } = body;

    if (!nama || !pin || pin.length < 4) {
      return NextResponse.json({ success: false, message: "Nama dan PIN (minimal 4 angka) wajib diisi" }, { status: 400 });
    }

    const id = `k_${Date.now().toString(36)}`;
    await db.execute({
      sql: "INSERT INTO cashiers (id, nama, pin, peran, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [id, nama.trim(), String(pin), peran || "kasir", new Date().toISOString()],
    });

    return NextResponse.json({ success: true, message: "Kasir berhasil ditambahkan", id });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID kasir wajib diisi" }, { status: 400 });
    }

    // Ensure we don't delete the last admin
    const adminCount = await db.execute("SELECT COUNT(*) as count FROM cashiers WHERE peran = 'admin'");
    const target = await db.execute({ sql: "SELECT peran FROM cashiers WHERE id = ?", args: [id] });

    if (target.rows[0]?.peran === "admin" && Number(adminCount.rows[0]?.count || 0) <= 1) {
      return NextResponse.json({ success: false, message: "Tidak dapat menghapus admin terakhir" }, { status: 400 });
    }

    await db.execute({ sql: "DELETE FROM cashiers WHERE id = ?", args: [id] });
    return NextResponse.json({ success: true, message: "Kasir berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
