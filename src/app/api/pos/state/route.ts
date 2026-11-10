import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { Product, StoreSettings, Cashier } from "@/types";

export async function GET() {
  try {
    await initDb();

    // 1. Settings
    const settingsRes = await db.execute("SELECT * FROM settings WHERE id = 'default' LIMIT 1");
    const settings: StoreSettings = (settingsRes.rows[0] as unknown as StoreSettings) || {
      id: "default",
      nama: "ShrimpCashier",
      alamat: "",
      telp: "",
      footer: "Terima kasih sudah berbelanja!",
      rekening: "",
    };

    // 2. Cashiers (safe list for picker, pin included for local offline-like validation or verify)
    const cashiersRes = await db.execute("SELECT id, nama, pin, peran FROM cashiers ORDER BY id ASC");
    const cashiers = cashiersRes.rows as unknown as Cashier[];

    // 3. Categories with counts
    const categoriesRes = await db.execute(`
      SELECT c.id, c.nama, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON p.kategori = c.nama 
      GROUP BY c.id, c.nama 
      ORDER BY c.sort_order ASC, c.nama ASC
    `);

    // 4. Products with Variants
    const productsRes = await db.execute("SELECT * FROM products ORDER BY rowid DESC");
    const variantsRes = await db.execute("SELECT * FROM variants ORDER BY harga ASC");

    const variantsByProduct: Record<string, any[]> = {};
    for (const row of variantsRes.rows) {
      const pid = String(row.product_id);
      if (!variantsByProduct[pid]) variantsByProduct[pid] = [];
      variantsByProduct[pid].push({
        id: String(row.id),
        product_id: pid,
        nama: String(row.nama),
        harga: Number(row.harga),
      });
    }

    const products: Product[] = productsRes.rows.map((row) => {
      const pid = String(row.id);
      return {
        id: pid,
        nama: String(row.nama),
        kategori: String(row.kategori),
        stok: Number(row.stok),
        foto: String(row.foto || ""),
        varian: variantsByProduct[pid] || [{ id: `v_${pid}`, nama: "Reguler", harga: 0 }],
      };
    });

    // 5. Transaction count today
    const today = new Date().toISOString().slice(0, 10);
    const todayTrxRes = await db.execute({
      sql: "SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as omzet FROM transactions WHERE substr(waktu, 1, 10) = ? AND status = 'selesai'",
      args: [today],
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        cashiers,
        categories: categoriesRes.rows.map((r) => ({
          id: String(r.id),
          nama: String(r.nama),
          count: Number(r.product_count || 0),
        })),
        products,
        todaySummary: {
          trxCount: Number(todayTrxRes.rows[0]?.count || 0),
          omzet: Number(todayTrxRes.rows[0]?.omzet || 0),
        },
      },
    });
  } catch (error: any) {
    console.error("Error in /api/pos/state:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
