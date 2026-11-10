import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { id, delta, newStock } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID produk wajib diisi" }, { status: 400 });
    }

    if (newStock !== undefined) {
      await db.execute({
        sql: "UPDATE products SET stok = ? WHERE id = ?",
        args: [Math.max(0, Number(newStock) || 0), id],
      });
    } else if (delta !== undefined) {
      await db.execute({
        sql: "UPDATE products SET stok = MAX(0, stok + ?) WHERE id = ?",
        args: [Number(delta) || 0, id],
      });
    }

    const updated = await db.execute({
      sql: "SELECT id, nama, stok FROM products WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: "Stok berhasil diperbarui",
      data: updated.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
