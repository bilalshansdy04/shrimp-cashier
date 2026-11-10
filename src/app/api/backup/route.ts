import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();

    // 1. Toko / Settings
    const sRes = await db.execute("SELECT * FROM settings WHERE id = 'default' LIMIT 1");
    const s = sRes.rows[0] || {};
    const toko = {
      nama: String(s.nama || "ShrimpCashier"),
      alamat: String(s.alamat || ""),
      telp: String(s.telp || ""),
      footer: String(s.footer || ""),
      rekening: String(s.rekening || ""),
    };

    // 2. Kategori
    const kRes = await db.execute("SELECT nama FROM categories ORDER BY sort_order ASC");
    const kategori = kRes.rows.map((r) => String(r.nama));

    // 3. Produk & Varian
    const pRes = await db.execute("SELECT * FROM products ORDER BY rowid ASC");
    const vRes = await db.execute("SELECT * FROM variants ORDER BY rowid ASC");

    const vMap: Record<string, any[]> = {};
    for (const v of vRes.rows) {
      const pid = String(v.product_id);
      if (!vMap[pid]) vMap[pid] = [];
      vMap[pid].push({ nama: String(v.nama), harga: Number(v.harga) });
    }

    const produk = pRes.rows.map((p) => {
      const id = String(p.id);
      return {
        id,
        nama: String(p.nama),
        kategori: String(p.kategori),
        stok: Number(p.stok),
        foto: String(p.foto || ""),
        varian: vMap[id] || [{ nama: "Reguler", harga: 0 }],
      };
    });

    // 4. Kasir
    const kasirRes = await db.execute("SELECT id, nama, pin, peran FROM cashiers ORDER BY id ASC");
    const kasir = kasirRes.rows.map((k) => ({
      id: String(k.id),
      nama: String(k.nama),
      pin: String(k.pin),
      peran: String(k.peran),
    }));

    // 5. Transaksi & Items
    const tRes = await db.execute("SELECT * FROM transactions ORDER BY waktu ASC");
    const tiRes = await db.execute("SELECT * FROM transaction_items ORDER BY rowid ASC");

    const tiMap: Record<string, any[]> = {};
    for (const ti of tiRes.rows) {
      const tid = String(ti.transaction_id);
      if (!tiMap[tid]) tiMap[tid] = [];
      tiMap[tid].push({
        pid: String(ti.product_id),
        nama: String(ti.nama),
        varian: String(ti.varian),
        harga: Number(ti.harga),
        qty: Number(ti.qty),
      });
    }

    const transaksi = tRes.rows.map((t) => {
      const id = String(t.id);
      return {
        id,
        waktu: String(t.waktu),
        kasir: String(t.kasir_nama),
        items: tiMap[id] || [],
        subtotal: Number(t.subtotal),
        diskon: Number(t.diskon),
        total: Number(t.total),
        metode: String(t.metode),
        bayar: Number(t.bayar),
        kembali: Number(t.kembali),
      };
    });

    const backupData = {
      toko,
      kategori,
      produk,
      transaksi,
      kasir,
      nomor: transaksi.length,
    };

    return NextResponse.json(backupData);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const data = await req.json();

    if (!data.produk || !data.kasir) {
      return NextResponse.json({ success: false, message: "Format backup tidak valid" }, { status: 400 });
    }

    // Clear existing data
    await db.execute("DELETE FROM transaction_items");
    await db.execute("DELETE FROM transactions");
    await db.execute("DELETE FROM variants");
    await db.execute("DELETE FROM products");
    await db.execute("DELETE FROM categories");
    await db.execute("DELETE FROM cashiers");

    const now = new Date().toISOString();

    // 1. Toko
    if (data.toko) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO settings (id, nama, alamat, telp, footer, rekening, updated_at) 
              VALUES ('default', ?, ?, ?, ?, ?, ?)`,
        args: [
          data.toko.nama || "ShrimpCashier",
          data.toko.alamat || "",
          data.toko.telp || "",
          data.toko.footer || "",
          data.toko.rekening || "",
          now,
        ],
      });
    }

    // 2. Kasir
    if (Array.isArray(data.kasir)) {
      for (const k of data.kasir) {
        await db.execute({
          sql: "INSERT INTO cashiers (id, nama, pin, peran, created_at) VALUES (?, ?, ?, ?, ?)",
          args: [k.id || `k_${Math.random()}`, k.nama || "Kasir", String(k.pin || "1234"), k.peran || "kasir", now],
        });
      }
    }

    // 3. Kategori
    if (Array.isArray(data.kategori)) {
      for (let i = 0; i < data.kategori.length; i++) {
        await db.execute({
          sql: "INSERT OR REPLACE INTO categories (id, nama, sort_order, created_at) VALUES (?, ?, ?, ?)",
          args: [`c_${i + 1}`, data.kategori[i], i, now],
        });
      }
    }

    // 4. Produk & Varian
    if (Array.isArray(data.produk)) {
      for (let i = 0; i < data.produk.length; i++) {
        const p = data.produk[i];
        const pId = p.id || `p_${i + 1}`;
        await db.execute({
          sql: "INSERT INTO products (id, nama, kategori, stok, foto, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          args: [pId, p.nama, p.kategori || "Umum", Number(p.stok) || 0, p.foto || "", now],
        });

        const varianList = Array.isArray(p.varian) ? p.varian : [{ nama: "Reguler", harga: 0 }];
        for (let j = 0; j < varianList.length; j++) {
          const v = varianList[j];
          await db.execute({
            sql: "INSERT INTO variants (id, product_id, nama, harga) VALUES (?, ?, ?, ?)",
            args: [`var_${pId}_${j + 1}`, pId, v.nama || "Reguler", Number(v.harga) || 0],
          });
        }
      }
    }

    // 5. Transaksi
    if (Array.isArray(data.transaksi)) {
      for (const t of data.transaksi) {
        await db.execute({
          sql: `INSERT INTO transactions 
                (id, waktu, kasir_nama, subtotal, diskon, total, metode, bayar, kembali, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            t.id,
            t.waktu || now,
            t.kasir || "Kasir",
            Number(t.subtotal) || 0,
            Number(t.diskon) || 0,
            Number(t.total) || 0,
            t.metode || "tunai",
            Number(t.bayar) || Number(t.total) || 0,
            Number(t.kembali) || 0,
            "selesai",
            t.waktu || now,
          ],
        });

        if (Array.isArray(t.items)) {
          for (let k = 0; k < t.items.length; k++) {
            const it = t.items[k];
            await db.execute({
              sql: `INSERT INTO transaction_items (id, transaction_id, product_id, nama, varian, harga, qty)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
              args: [
                `ti_${t.id}_${k + 1}`,
                t.id,
                it.pid || it.product_id || "",
                it.nama,
                it.varian || "Reguler",
                Number(it.harga) || 0,
                Number(it.qty) || 1,
              ],
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Backup data berhasil dipulihkan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
