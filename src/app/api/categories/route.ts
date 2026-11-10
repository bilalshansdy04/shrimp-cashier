import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const categoriesRes = await db.execute(`
      SELECT c.id, c.nama, COUNT(p.id) as count 
      FROM categories c 
      LEFT JOIN products p ON p.kategori = c.nama 
      GROUP BY c.id, c.nama 
      ORDER BY c.sort_order ASC, c.nama ASC
    `);

    return NextResponse.json({
      success: true,
      data: categoriesRes.rows.map((r) => ({
        id: String(r.id),
        nama: String(r.nama),
        count: Number(r.count || 0),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const nama = (body.nama || "").trim();

    if (!nama) {
      return NextResponse.json({ success: false, message: "Nama kategori tidak boleh kosong" }, { status: 400 });
    }

    const cId = `c_${Date.now().toString(36)}`;
    await db.execute({
      sql: "INSERT INTO categories (id, nama, sort_order, created_at) VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories), ?)",
      args: [cId, nama, new Date().toISOString()],
    });

    return NextResponse.json({ success: true, message: "Kategori berhasil ditambahkan", id: cId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const nama = searchParams.get("nama");

    if (!id && !nama) {
      return NextResponse.json({ success: false, message: "Parameter kategori tidak valid" }, { status: 400 });
    }

    let targetName = nama;
    if (!targetName && id) {
      const row = await db.execute({ sql: "SELECT nama FROM categories WHERE id = ?", args: [id] });
      targetName = String(row.rows[0]?.nama || "");
    }

    // Check if any product is using this category
    const inUse = await db.execute({
      sql: "SELECT COUNT(*) as count FROM products WHERE kategori = ?",
      args: [targetName],
    });

    if (Number(inUse.rows[0]?.count || 0) > 0) {
      return NextResponse.json({
        success: false,
        message: `Kategori "${targetName}" masih digunakan oleh ${inUse.rows[0]?.count} produk`,
      }, { status: 400 });
    }

    if (id) {
      await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
    } else {
      await db.execute({ sql: "DELETE FROM categories WHERE nama = ?", args: [targetName] });
    }

    return NextResponse.json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
