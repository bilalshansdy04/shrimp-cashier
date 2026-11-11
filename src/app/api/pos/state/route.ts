import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";
import { Product, StoreSettings, Cashier, UserRole } from "@/types";

export async function GET(req: Request) {
  try {
    const currentUser = await getSessionUser(req);

    // 1. Settings Toko
    const settingsRows = await db.select().from(schema.settings).where(eq(schema.settings.id, "default")).limit(1);
    const settings: StoreSettings = settingsRows[0]
      ? {
          id: settingsRows[0].id,
          nama: settingsRows[0].nama,
          alamat: settingsRows[0].alamat || "",
          telp: settingsRows[0].telp || "",
          footer: settingsRows[0].footer || "Terima kasih sudah berbelanja!",
          rekening: settingsRows[0].rekening || "",
          theme_primary: settingsRows[0].themePrimary || "#f97316",
          theme_surface: settingsRows[0].themeSurface || "#1a1c22",
          custom_palettes: settingsRows[0].customPalettes || "[]",
        }
      : {
          id: "default",
          nama: "ShrimpCashier",
          alamat: "",
          telp: "",
          footer: "Terima kasih sudah berbelanja!",
          rekening: "",
          theme_primary: "#f97316",
          theme_surface: "#1a1c22",
          custom_palettes: "[]",
        };

    // 2. Daftar Pengguna (untuk User Management)
    let userList: any[] = [];
    if (currentUser) {
      if (currentUser.role === "spradmcsr") {
        userList = await db.select().from(schema.users);
      } else if (currentUser.role === "admmngrcsr") {
        userList = await db.select().from(schema.users).where(eq(schema.users.role, "clrkcsr"));
      }
    }

    const cashiers: Cashier[] = userList.map((u) => ({
      id: u.id,
      nama: u.namaLengkap,
      username: u.username,
      role: u.role as UserRole,
      peran: u.role === "clrkcsr" ? "kasir" : "admin",
      created_at: u.createdAt,
    }));

    // 3. Kategori dengan Jumlah Produk
    const allCategories = await db.select().from(schema.categories);
    const allProducts = await db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
    const allVariants = await db.select().from(schema.productVariants);

    const variantsByProduct: Record<string, any[]> = {};
    for (const v of allVariants) {
      if (!variantsByProduct[v.productId]) variantsByProduct[v.productId] = [];
      variantsByProduct[v.productId].push({
        id: v.id,
        product_id: v.productId,
        nama: v.nama,
        harga: v.harga,
      });
    }

    const products: Product[] = allProducts.map((p) => ({
      id: p.id,
      nama: p.nama,
      kategori: p.kategori,
      stok: p.stok,
      foto: p.foto || "",
      varian: variantsByProduct[p.id] || [{ id: `v_${p.id}`, nama: "Reguler", harga: 0 }],
    }));

    const categoryCounts: Record<string, number> = {};
    for (const p of allProducts) {
      categoryCounts[p.kategori] = (categoryCounts[p.kategori] || 0) + 1;
    }

    const categories = allCategories.map((c) => ({
      id: c.id,
      nama: c.nama,
      count: categoryCounts[c.nama] || 0,
    }));

    // 4. Ringkasan Transaksi Hari Ini
    const today = new Date().toISOString().slice(0, 10);
    const todayTransactions = await db
      .select({
        count: sql<number>`count(*)`,
        omzet: sql<number>`coalesce(sum(${schema.transactions.total}), 0)`,
      })
      .from(schema.transactions)
      .where(
        sql`substr(${schema.transactions.waktu}, 1, 10) = ${today} AND ${schema.transactions.status} = 'selesai'`
      );

    return NextResponse.json({
      success: true,
      data: {
        currentUser,
        settings,
        cashiers,
        categories,
        products,
        todaySummary: {
          trxCount: Number(todayTransactions[0]?.count || 0),
          omzet: Number(todayTransactions[0]?.omzet || 0),
        },
      },
    });
  } catch (error: any) {
    console.error("Error in /api/pos/state:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
