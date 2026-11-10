import { NextResponse } from "next/server";
import { db, initDb, seedDemoData } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { action } = body; // 'demo' | 'empty'

    // Clear all
    await db.execute("DELETE FROM transaction_items");
    await db.execute("DELETE FROM transactions");
    await db.execute("DELETE FROM variants");
    await db.execute("DELETE FROM products");
    await db.execute("DELETE FROM categories");
    await db.execute("DELETE FROM cashiers");
    await db.execute("DELETE FROM settings");

    if (action === "demo") {
      await seedDemoData();
      return NextResponse.json({ success: true, message: "Data contoh berhasil dimuat ulang" });
    } else {
      // Empty mode: create 1 default admin cashier and initial settings
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO settings (id, nama, alamat, telp, footer, rekening, updated_at) 
              VALUES ('default', 'ShrimpCashier', '', '', 'Terima kasih!', '', ?)`,
        args: [now],
      });
      await db.execute({
        sql: "INSERT INTO cashiers (id, nama, pin, peran, created_at) VALUES ('k1', 'Admin', '1234', 'admin', ?)",
        args: [now],
      });
      return NextResponse.json({ success: true, message: "Semua data dikosongkan. PIN Admin: 1234" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
