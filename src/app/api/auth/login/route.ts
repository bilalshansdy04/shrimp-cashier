import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { id, pin } = body;

    if (!id || !pin) {
      return NextResponse.json({ success: false, message: "ID dan PIN wajib diisi" }, { status: 400 });
    }

    const res = await db.execute({
      sql: "SELECT id, nama, peran FROM cashiers WHERE id = ? AND pin = ? LIMIT 1",
      args: [id, String(pin)],
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, message: "PIN kasir salah" }, { status: 401 });
    }

    const cashier = res.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: String(cashier.id),
        nama: String(cashier.nama),
        peran: String(cashier.peran),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
