import path from "path";
import fs from "fs";

// Load .env.development explicitly for this script
const envPath = path.resolve(process.cwd(), ".env.development");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

import { db, rawClient, schema } from "./index";
import { hashSync } from "bcrypt-ts";
import { eq } from "drizzle-orm";

async function runDevMigrationAndSeed() {
  console.log("🌱 Menjalankan Seeder Lingkungan DEV...");

  // 1. Terapkan DDL Skema Tabel jika belum ada
  await rawClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id text PRIMARY KEY NOT NULL,
      nama text NOT NULL UNIQUE,
      created_at text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY NOT NULL,
      nama text NOT NULL,
      kategori text NOT NULL,
      stok integer DEFAULT 0 NOT NULL,
      foto text,
      created_at text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id text PRIMARY KEY NOT NULL,
      product_id text NOT NULL,
      nama text NOT NULL,
      harga integer NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL UNIQUE,
      nama_lengkap text NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL,
      is_active integer DEFAULT 1 NOT NULL,
      created_by text,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      token text NOT NULL UNIQUE,
      expires_at text NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_meta (
      key text PRIMARY KEY NOT NULL,
      value text NOT NULL,
      updated_at text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id text PRIMARY KEY NOT NULL,
      nama text NOT NULL,
      alamat text,
      telp text,
      footer text,
      rekening text,
      theme_primary text,
      theme_surface text,
      custom_palettes text,
      updated_at text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id text PRIMARY KEY NOT NULL,
      waktu text NOT NULL,
      kasir_id text,
      kasir_nama text NOT NULL,
      subtotal integer NOT NULL,
      diskon integer DEFAULT 0 NOT NULL,
      total integer NOT NULL,
      metode text NOT NULL,
      bayar integer NOT NULL,
      kembali integer NOT NULL,
      status text DEFAULT 'selesai' NOT NULL,
      created_at text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id text PRIMARY KEY NOT NULL,
      transaction_id text NOT NULL,
      product_id text NOT NULL,
      nama text NOT NULL,
      varian text NOT NULL,
      harga integer NOT NULL,
      qty integer NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE VIEW IF NOT EXISTS variants AS SELECT * FROM product_variants;
    CREATE VIEW IF NOT EXISTS cashiers AS SELECT id, nama_lengkap as nama, '1234' as pin, CASE WHEN role = 'clrkcsr' THEN 'kasir' ELSE 'admin' END as peran, created_at FROM users;
  `);

  console.log("✓ Tabel database berhasil diverifikasi.");

  // 2. Bersihkan data dev lama
  await rawClient.executeMultiple(`
    DELETE FROM transaction_items;
    DELETE FROM transactions;
    DELETE FROM product_variants;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM sessions;
    DELETE FROM users;
    DELETE FROM system_meta;
  `);

  const now = new Date().toISOString();
  const defaultPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || "shrimpchasier406";
  const passwordHash = hashSync(defaultPassword, 10);

  // 3. Seed Users (Super Admin, Admin, 2 Kasir)
  console.log("👤 Membuat akun pengguna pengujian...");
  const devUsers = [
    {
      id: "usr_superadmin",
      username: process.env.DEFAULT_SUPERADMIN_USERNAME || "spradmcsr",
      namaLengkap: "Super Administrator",
      passwordHash,
      role: "spradmcsr" as const,
      isActive: true,
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_admin",
      username: "adm_toko",
      namaLengkap: "Bambang (Manajer Toko)",
      passwordHash,
      role: "admmngrcsr" as const,
      isActive: true,
      createdBy: "usr_superadmin",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_kasir_pagi",
      username: "kasir_pagi",
      namaLengkap: "Siti Rahma (Shift Pagi)",
      passwordHash,
      role: "clrkcsr" as const,
      isActive: true,
      createdBy: "usr_admin",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_kasir_sore",
      username: "kasir_sore",
      namaLengkap: "Budi Santoso (Shift Sore)",
      passwordHash,
      role: "clrkcsr" as const,
      isActive: true,
      createdBy: "usr_admin",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const u of devUsers) {
    await db.insert(schema.users).values(u);
  }

  // 4. Seed Settings Toko & Palet
  console.log("⚙️ Membuat pengaturan toko...");
  await db
    .insert(schema.settings)
    .values({
      id: "default",
      nama: "ShrimpCashier Cafe & Resto",
      alamat: "Jl. Laut Biru No. 88, Kawasan Kuliner, Jakarta",
      telp: "0812-3456-7890",
      footer: "Terima kasih atas kunjungan Anda! Follow IG @shrimpcashier",
      rekening: "BCA 8820-123-456 a.n. ShrimpCashier Resto",
      themePrimary: "#f97316",
      themeSurface: "#1a1c22",
      customPalettes: "[]",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.settings.id,
      set: {
        nama: "ShrimpCashier Cafe & Resto",
        updatedAt: now,
      },
    });

  // 5. Seed Kategori Produk
  console.log("📦 Menambahkan kategori dan produk gudang...");
  const devCategories = [
    { id: "cat_kopi", nama: "Kopi", createdAt: now },
    { id: "cat_nonkopi", nama: "Non-Kopi", createdAt: now },
    { id: "cat_makanan", nama: "Makanan", createdAt: now },
    { id: "cat_camilan", nama: "Camilan", createdAt: now },
  ];
  for (const c of devCategories) {
    await db.insert(schema.categories).values(c);
  }

  // 6. Seed Produk & Varian (11 Produk Lengkap)
  const devProducts = [
    {
      id: "p_kopi_susu",
      nama: "Kopi Susu Gula Aren",
      kategori: "Kopi",
      stok: 50,
      foto: "",
      varian: [
        { nama: "Reguler", harga: 18000 },
        { nama: "Large", harga: 22000 },
      ],
    },
    {
      id: "p_americano",
      nama: "Americano Ice",
      kategori: "Kopi",
      stok: 40,
      foto: "",
      varian: [
        { nama: "Hot", harga: 15000 },
        { nama: "Ice", harga: 17000 },
      ],
    },
    {
      id: "p_cappuccino",
      nama: "Cappuccino Classic",
      kategori: "Kopi",
      stok: 35,
      foto: "",
      varian: [
        { nama: "Hot", harga: 20000 },
        { nama: "Ice", harga: 22000 },
      ],
    },
    {
      id: "p_matcha",
      nama: "Matcha Latte",
      kategori: "Non-Kopi",
      stok: 25,
      foto: "",
      varian: [
        { nama: "Reguler", harga: 22000 },
        { nama: "Oatmilk", harga: 27000 },
      ],
    },
    {
      id: "p_cokelat",
      nama: "Cokelat Panas Artisan",
      kategori: "Non-Kopi",
      stok: 20,
      foto: "",
      varian: [{ nama: "Hot", harga: 18000 }],
    },
    {
      id: "p_lemon_tea",
      nama: "Teh Lemon Segar",
      kategori: "Non-Kopi",
      stok: 60,
      foto: "",
      varian: [{ nama: "Ice", harga: 10000 }],
    },
    {
      id: "p_nasi_goreng",
      nama: "Nasi Goreng Spesial Udang",
      kategori: "Makanan",
      stok: 15,
      foto: "",
      varian: [
        { nama: "Sedang", harga: 22000 },
        { nama: "Pedas", harga: 24000 },
      ],
    },
    {
      id: "p_mie_goreng",
      nama: "Mie Goreng Kampung",
      kategori: "Makanan",
      stok: 4,
      foto: "",
      varian: [{ nama: "Porsi Jumbo", harga: 18000 }],
    },
    {
      id: "p_roti_bakar",
      nama: "Roti Bakar Cokelat Keju",
      kategori: "Camilan",
      stok: 18,
      foto: "",
      varian: [
        { nama: "Cokelat", harga: 15000 },
        { nama: "Keju", harga: 17000 },
        { nama: "Komplit", harga: 20000 },
      ],
    },
    {
      id: "p_kentang",
      nama: "Kentang Goreng Krispi",
      kategori: "Camilan",
      stok: 22,
      foto: "",
      varian: [{ nama: "Original", harga: 14000 }],
    },
    {
      id: "p_pisang",
      nama: "Pisang Goreng Wijen",
      kategori: "Camilan",
      stok: 0,
      foto: "",
      varian: [{ nama: "Porsi 5 Pcs", harga: 12000 }],
    },
  ];

  for (const prod of devProducts) {
    await db.insert(schema.products).values({
      id: prod.id,
      nama: prod.nama,
      kategori: prod.kategori,
      stok: prod.stok,
      foto: prod.foto,
      createdAt: now,
    });

    for (let i = 0; i < prod.varian.length; i++) {
      const v = prod.varian[i];
      await db.insert(schema.productVariants).values({
        id: `v_${prod.id}_${i + 1}`,
        productId: prod.id,
        nama: v.nama,
        harga: v.harga,
      });
    }
  }

  // 7. Seed Simulasi Transaksi 30 Hari (150+ transaksi)
  console.log("📊 Menghasilkan 150+ riwayat transaksi realistis selama 30 hari...");
  const paymentMethods: ("tunai" | "qris" | "transfer")[] = ["tunai", "qris", "transfer"];
  const cashiers = [
    { id: "usr_kasir_pagi", nama: "Siti Rahma" },
    { id: "usr_kasir_sore", nama: "Budi Santoso" },
  ];

  let trxCounter = 1;
  const today = new Date();

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - dayOffset);

    // 4 sampai 8 transaksi per hari
    const dailyCount = 4 + Math.floor(Math.random() * 5);

    for (let c = 0; c < dailyCount; c++) {
      const trxHour = 9 + Math.floor(Math.random() * 12);
      const trxMin = Math.floor(Math.random() * 60);
      const trxDate = new Date(targetDate);
      trxDate.setHours(trxHour, trxMin, 0, 0);

      const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
      const trxId = `TRX-${trxDate.getFullYear()}${String(trxDate.getMonth() + 1).padStart(2, "0")}${String(trxDate.getDate()).padStart(2, "0")}-${String(trxCounter++).padStart(4, "0")}`;

      // Ambil 1-3 produk acak
      const numItems = 1 + Math.floor(Math.random() * 3);
      const selectedProducts = [...devProducts].sort(() => 0.5 - Math.random()).slice(0, numItems);

      let subtotal = 0;
      const itemsToInsert = [];

      for (let itemIdx = 0; itemIdx < selectedProducts.length; itemIdx++) {
        const prod = selectedProducts[itemIdx];
        const varian = prod.varian[Math.floor(Math.random() * prod.varian.length)];
        const qty = 1 + Math.floor(Math.random() * 2);
        const itemSubtotal = varian.harga * qty;
        subtotal += itemSubtotal;

        itemsToInsert.push({
          id: `item_${trxId}_${itemIdx + 1}`,
          transactionId: trxId,
          productId: prod.id,
          nama: prod.nama,
          varian: varian.nama,
          harga: varian.harga,
          qty,
        });
      }

      const diskon = Math.random() > 0.8 ? 5000 : 0;
      const total = Math.max(0, subtotal - diskon);
      const metode = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const bayar = metode === "tunai" ? Math.ceil(total / 10000) * 10000 : total;
      const kembali = bayar - total;

      await db.insert(schema.transactions).values({
        id: trxId,
        waktu: trxDate.toISOString(),
        kasirId: cashier.id,
        kasirNama: cashier.nama,
        subtotal,
        diskon,
        total,
        metode,
        bayar,
        kembali,
        status: "selesai",
        createdAt: trxDate.toISOString(),
      });

      for (const item of itemsToInsert) {
        await db.insert(schema.transactionItems).values(item);
      }
    }
  }

  console.log(`✓ Berhasil membuat ${trxCounter - 1} riwayat transaksi.`);
  console.log("\n==========================================");
  console.log("🎉 SEEDER DEV SELESAI!");
  console.log("==========================================");
  console.log(`Database File : ${process.env.TURSO_DATABASE_URL}`);
  console.log(`Super Admin   : ${process.env.DEFAULT_SUPERADMIN_USERNAME || "spradmcsr"} / ${defaultPassword} (Role: spradmcsr)`);
  console.log(`Admin Toko    : adm_toko / ${defaultPassword} (Role: admmngrcsr)`);
  console.log(`Kasir Pagi    : kasir_pagi / ${defaultPassword} (Role: clrkcsr)`);
  console.log(`Kasir Sore    : kasir_sore / ${defaultPassword} (Role: clrkcsr)`);
  console.log("==========================================\n");
}

runDevMigrationAndSeed().catch((err) => {
  console.error("❌ Gagal menjalankan seeder dev:", err);
  process.exit(1);
});
