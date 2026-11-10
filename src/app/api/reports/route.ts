import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { SalesReport } from "@/types";

export async function GET(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "hari"; // 'hari' | 'bulan'
    const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const targetDate = new Date(`${dateParam}T00:00:00`);
    const datePrefix = mode === "hari" ? dateParam : dateParam.slice(0, 7);

    // Fetch active transactions for period
    const trxsRes = await db.execute({
      sql: `SELECT * FROM transactions 
            WHERE substr(waktu, 1, ${mode === "hari" ? 10 : 7}) = ? 
            AND status = 'selesai' 
            ORDER BY waktu ASC`,
      args: [datePrefix],
    });

    const trxList = trxsRes.rows;
    let omzet = 0;
    const metode = { tunai: 0, qris: 0, transfer: 0 };

    for (const trx of trxList) {
      const tot = Number(trx.total);
      omzet += tot;
      const m = String(trx.metode) as "tunai" | "qris" | "transfer";
      if (metode[m] !== undefined) {
        metode[m] += tot;
      }
    }

    // Fetch item counts and top products
    let itemsSold = 0;
    const productStats: Record<string, { nama: string; qty: number; nilai: number }> = {};

    if (trxList.length > 0) {
      const trxIds = trxList.map((t) => `'${t.id}'`).join(",");
      const itemsRes = await db.execute(`
        SELECT nama, harga, qty FROM transaction_items WHERE transaction_id IN (${trxIds})
      `);

      for (const row of itemsRes.rows) {
        const name = String(row.nama);
        const qty = Number(row.qty);
        const price = Number(row.harga);
        itemsSold += qty;

        if (!productStats[name]) {
          productStats[name] = { nama: name, qty: 0, nilai: 0 };
        }
        productStats[name].qty += qty;
        productStats[name].nilai += qty * price;
      }
    }

    const top = Object.values(productStats).sort((a, b) => b.qty - a.qty || b.nilai - a.nilai);

    // Generate Chart data
    const chart: { label: string; value: number }[] = [];

    if (mode === "hari") {
      // 07:00 to 22:00
      for (let h = 7; h <= 22; h++) {
        const label = `${h < 10 ? "0" : ""}${h}:00`;
        chart.push({ label, value: 0 });
      }

      for (const trx of trxList) {
        const hour = new Date(String(trx.waktu)).getHours();
        if (hour >= 7 && hour <= 22) {
          const idx = hour - 7;
          chart[idx].value += Number(trx.total);
        }
      }
    } else {
      // Monthly: Day 1 to end of month
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        chart.push({ label: String(d), value: 0 });
      }

      for (const trx of trxList) {
        const day = new Date(String(trx.waktu)).getDate();
        if (day >= 1 && day <= daysInMonth) {
          chart[day - 1].value += Number(trx.total);
        }
      }
    }

    const report: SalesReport = {
      omzet,
      trx: trxList.length,
      item: itemsSold,
      rata: trxList.length > 0 ? Math.round(omzet / trxList.length) : 0,
      top: top.slice(0, 10),
      metode,
      chart,
    };

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
