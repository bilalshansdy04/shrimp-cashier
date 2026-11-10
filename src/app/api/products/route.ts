import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { Product } from "@/types";

export async function GET(req: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    const category = searchParams.get("kategori") || "";

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

    let products: Product[] = productsRes.rows.map((row) => {
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

    if (category && category !== "Semua") {
      products = products.filter((p) => p.kategori === category);
    }
    if (q) {
      products = products.filter((p) => p.nama.toLowerCase().includes(q));
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { nama, kategori, stok, foto, varian } = body;

    if (!nama || !kategori) {
      return NextResponse.json({ success: false, message: "Nama dan kategori produk wajib diisi" }, { status: 400 });
    }

    const pId = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: "INSERT INTO products (id, nama, kategori, stok, foto, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [pId, nama.trim(), kategori.trim(), Math.max(0, Number(stok) || 0), foto || "", now],
    });

    const parsedVariants = Array.isArray(varian) && varian.length > 0 ? varian : [{ nama: "Reguler", harga: 0 }];

    for (let i = 0; i < parsedVariants.length; i++) {
      const v = parsedVariants[i];
      await db.execute({
        sql: "INSERT INTO variants (id, product_id, nama, harga) VALUES (?, ?, ?, ?)",
        args: [`var_${pId}_${i + 1}`, pId, v.nama?.trim() || "Reguler", Math.max(0, Number(v.harga) || 0)],
      });
    }

    return NextResponse.json({ success: true, message: "Produk berhasil ditambahkan", id: pId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await initDb();
    const body = await req.json();
    const { id, nama, kategori, stok, foto, varian } = body;

    if (!id || !nama || !kategori) {
      return NextResponse.json({ success: false, message: "Data produk tidak lengkap" }, { status: 400 });
    }

    await db.execute({
      sql: "UPDATE products SET nama = ?, kategori = ?, stok = ?, foto = ? WHERE id = ?",
      args: [nama.trim(), kategori.trim(), Math.max(0, Number(stok) || 0), foto || "", id],
    });

    if (Array.isArray(varian) && varian.length > 0) {
      // Replace variants
      await db.execute({ sql: "DELETE FROM variants WHERE product_id = ?", args: [id] });
      for (let i = 0; i < varian.length; i++) {
        const v = varian[i];
        await db.execute({
          sql: "INSERT INTO variants (id, product_id, nama, harga) VALUES (?, ?, ?, ?)",
          args: [`var_${id}_${Date.now()}_${i + 1}`, id, v.nama?.trim() || "Reguler", Math.max(0, Number(v.harga) || 0)],
        });
      }
    }

    return NextResponse.json({ success: true, message: "Produk berhasil diperbarui" });
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
      return NextResponse.json({ success: false, message: "ID produk wajib diisi" }, { status: 400 });
    }

    await db.execute({ sql: "DELETE FROM variants WHERE product_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });

    return NextResponse.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
