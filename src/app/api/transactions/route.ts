import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { Transaction, TransactionItem } from "@/types";

function padTwo(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function generateTrxId(d: Date, n: number) {
  const yy = String(d.getFullYear()).slice(2);
  const mm = padTwo(d.getMonth() + 1);
  const dd = padTwo(d.getDate());
  const num = String(n).padStart(4, "0");
  return `TRX${yy}${mm}${dd}-${num}`;
}

export async function GET(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("tanggal");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let sql = "SELECT * FROM transactions ";
    const args: any[] = [];

    if (date) {
      sql += "WHERE substr(waktu, 1, 10) = ? ";
      args.push(date);
    }

    sql += "ORDER BY waktu DESC LIMIT ?";
    args.push(limit);

    const trxsRes = await db.execute({ sql, args });

    // Fetch items for these transactions
    const trxIds = trxsRes.rows.map((r) => `'${r.id}'`).join(",");
    let itemsByTrx: Record<string, TransactionItem[]> = {};

    if (trxsRes.rows.length > 0) {
      const itemsRes = await db.execute(`
        SELECT * FROM transaction_items WHERE transaction_id IN (${trxIds})
      `);
      for (const row of itemsRes.rows) {
        const tid = String(row.transaction_id);
        if (!itemsByTrx[tid]) itemsByTrx[tid] = [];
        itemsByTrx[tid].push({
          id: String(row.id),
          transaction_id: tid,
          product_id: String(row.product_id),
          nama: String(row.nama),
          varian: String(row.varian),
          harga: Number(row.harga),
          qty: Number(row.qty),
        });
      }
    }

    const transactions: Transaction[] = trxsRes.rows.map((row) => {
      const id = String(row.id);
      return {
        id,
        waktu: String(row.waktu),
        kasir_nama: String(row.kasir_nama),
        subtotal: Number(row.subtotal),
        diskon: Number(row.diskon),
        total: Number(row.total),
        metode: row.metode as any,
        bayar: Number(row.bayar),
        kembali: Number(row.kembali),
        status: (row.status as any) || "selesai",
        items: itemsByTrx[id] || [],
      };
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { items, kasir_nama, subtotal, diskon, total, metode, bayar } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Keranjang pesanan kosong" }, { status: 400 });
    }

    if (metode === "tunai" && bayar < total) {
      return NextResponse.json({ success: false, message: "Uang pembayaran kurang dari total tagihan" }, { status: 400 });
    }

    const now = new Date();
    // Get total count of transactions to generate sequence number
    const countRes = await db.execute("SELECT COUNT(*) as count FROM transactions");
    const count = Number(countRes.rows[0]?.count || 0) + 1;
    const trxId = generateTrxId(now, count);
    const kembali = bayar - total;

    // 1. Insert Transaction
    await db.execute({
      sql: `INSERT INTO transactions 
            (id, waktu, kasir_nama, subtotal, diskon, total, metode, bayar, kembali, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        trxId,
        now.toISOString(),
        kasir_nama || "Kasir",
        Number(subtotal),
        Number(diskon || 0),
        Number(total),
        metode,
        Number(bayar),
        Number(kembali),
        "selesai",
        now.toISOString(),
      ],
    });

    // 2. Insert items and decrement stock
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const tiId = `ti_${trxId}_${i + 1}`;

      await db.execute({
        sql: `INSERT INTO transaction_items (id, transaction_id, product_id, nama, varian, harga, qty)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          tiId,
          trxId,
          it.pid || it.product_id,
          it.nama,
          it.varian || "Reguler",
          Number(it.harga),
          Number(it.qty),
        ],
      });

      // Decrement product stock
      if (it.pid || it.product_id) {
        await db.execute({
          sql: "UPDATE products SET stok = MAX(0, stok - ?) WHERE id = ?",
          args: [Number(it.qty), it.pid || it.product_id],
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil diselesaikan",
      data: {
        id: trxId,
        waktu: now.toISOString(),
        kasir_nama: kasir_nama || "Kasir",
        subtotal: Number(subtotal),
        diskon: Number(diskon || 0),
        total: Number(total),
        metode,
        bayar: Number(bayar),
        kembali: Number(kembali),
        status: "selesai",
        items,
      },
    });
  } catch (error: any) {
    console.error("Error in transaction POST:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID transaksi wajib diisi" }, { status: 400 });
    }

    // Check transaction status
    const trxRes = await db.execute({
      sql: "SELECT * FROM transactions WHERE id = ?",
      args: [id],
    });

    if (trxRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const trx = trxRes.rows[0];
    if (trx.status === "dibatalkan") {
      return NextResponse.json({ success: false, message: "Transaksi sudah dibatalkan sebelumnya" }, { status: 400 });
    }

    // Fetch items to refund stock
    const itemsRes = await db.execute({
      sql: "SELECT * FROM transaction_items WHERE transaction_id = ?",
      args: [id],
    });

    for (const item of itemsRes.rows) {
      await db.execute({
        sql: "UPDATE products SET stok = stok + ? WHERE id = ?",
        args: [Number(item.qty), String(item.product_id)],
      });
    }

    // Mark as cancelled
    await db.execute({
      sql: "UPDATE transactions SET status = 'dibatalkan' WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi dibatalkan dan stok produk telah dikembalikan",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
