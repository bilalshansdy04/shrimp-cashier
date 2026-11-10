import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { StoreSettings } from "@/types";

export async function GET() {
  try {
    await initDb();
    const res = await db.execute("SELECT * FROM settings WHERE id = 'default' LIMIT 1");
    const settings: StoreSettings = (res.rows[0] as unknown as StoreSettings) || {
      id: "default",
      nama: "ShrimpCashier",
      alamat: "",
      telp: "",
      footer: "Terima kasih sudah berbelanja!",
      rekening: "",
    };
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { nama, alamat, telp, footer, rekening } = body;

    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT OR REPLACE INTO settings (id, nama, alamat, telp, footer, rekening, updated_at) 
            VALUES ('default', ?, ?, ?, ?, ?, ?)`,
      args: [nama || "ShrimpCashier", alamat || "", telp || "", footer || "", rekening || "", now],
    });

    return NextResponse.json({ success: true, message: "Pengaturan toko berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
