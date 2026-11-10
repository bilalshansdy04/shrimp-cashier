import { createClient } from "@libsql/client";
import path from "path";

// Support both remote Turso and local SQLite file database
const isProduction = process.env.NODE_ENV === "production";
const defaultLocalDb = path.join(process.cwd(), "shrimpcashier.db");
const url = process.env.TURSO_DATABASE_URL || `file:${defaultLocalDb}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  // 1. Settings Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      alamat TEXT,
      telp TEXT,
      footer TEXT,
      rekening TEXT,
      theme_primary TEXT DEFAULT '#f97316',
      theme_surface TEXT DEFAULT '#1a1c22',
      custom_palettes TEXT DEFAULT '[]',
      updated_at TEXT
    )
  `);

  try {
    await db.execute("ALTER TABLE settings ADD COLUMN theme_primary TEXT DEFAULT '#f97316'");
  } catch (e) {}
  try {
    await db.execute("ALTER TABLE settings ADD COLUMN theme_surface TEXT DEFAULT '#1a1c22'");
  } catch (e) {}
  try {
    await db.execute("ALTER TABLE settings ADD COLUMN custom_palettes TEXT DEFAULT '[]'");
  } catch (e) {}

  // 2. Cashiers Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cashiers (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      pin TEXT NOT NULL,
      peran TEXT NOT NULL DEFAULT 'kasir',
      created_at TEXT
    )
  `);

  // 3. Categories Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT
    )
  `);

  // 4. Products Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      kategori TEXT NOT NULL,
      stok INTEGER NOT NULL DEFAULT 0,
      foto TEXT DEFAULT '',
      created_at TEXT
    )
  `);

  // 5. Product Variants Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      nama TEXT NOT NULL,
      harga INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // 6. Transactions Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      waktu TEXT NOT NULL,
      kasir_nama TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      diskon INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      metode TEXT NOT NULL,
      bayar INTEGER NOT NULL,
      kembali INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'selesai',
      created_at TEXT
    )
  `);

  // 7. Transaction Items Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      nama TEXT NOT NULL,
      varian TEXT NOT NULL,
      harga INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )
  `);

  // Check if we need to seed
  const cashiersCount = await db.execute("SELECT COUNT(*) as count FROM cashiers");
  const count = Number(cashiersCount.rows[0]?.count || 0);

  if (count === 0) {
    await seedDemoData();
  }

  isInitialized = true;
}

function seededRandom(s: number) {
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

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

export async function seedDemoData() {
  const now = new Date().toISOString();

  // Seed default settings
  await db.execute({
    sql: `INSERT OR REPLACE INTO settings (id, nama, alamat, telp, footer, rekening, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "default",
      "ShrimpCashier Cafe & Resto",
      "Jl. Merdeka No. 12, Bandung",
      "0812-0000-1234",
      "Terima kasih sudah berbelanja di ShrimpCashier!",
      "BCA 1234567890 a.n. ShrimpCashier",
      now,
    ],
  });

  // Seed cashiers
  await db.execute({
    sql: "INSERT OR REPLACE INTO cashiers (id, nama, pin, peran, created_at) VALUES (?, ?, ?, ?, ?)",
    args: ["k1", "Admin", "1234", "admin", now],
  });
  await db.execute({
    sql: "INSERT OR REPLACE INTO cashiers (id, nama, pin, peran, created_at) VALUES (?, ?, ?, ?, ?)",
    args: ["k2", "Sari", "1111", "kasir", now],
  });

  // Seed categories
  const categories = ["Kopi", "Non-Kopi", "Makanan", "Camilan"];
  for (let i = 0; i < categories.length; i++) {
    await db.execute({
      sql: "INSERT OR REPLACE INTO categories (id, nama, sort_order, created_at) VALUES (?, ?, ?, ?)",
      args: [`c${i + 1}`, categories[i], i, now],
    });
  }

  // Seed products & variants
  const rawProducts: [string, string, number, [string, number][]][] = [
    ["Kopi Susu Gula Aren", "Kopi", 40, [["Reguler", 18000], ["Large", 23000]]],
    ["Americano", "Kopi", 50, [["Hot", 15000], ["Ice", 17000]]],
    ["Cappuccino", "Kopi", 30, [["Reguler", 22000]]],
    ["Matcha Latte", "Non-Kopi", 25, [["Reguler", 22000], ["Large", 27000]]],
    ["Cokelat Panas", "Non-Kopi", 20, [["Reguler", 18000]]],
    ["Teh Lemon", "Non-Kopi", 60, [["Reguler", 10000]]],
    ["Nasi Goreng Kampung", "Makanan", 15, [["Biasa", 22000], ["Spesial", 28000]]],
    ["Mie Goreng", "Makanan", 4, [["Biasa", 18000]]],
    ["Roti Bakar", "Camilan", 18, [["Cokelat", 15000], ["Keju", 17000], ["Campur", 19000]]],
    ["Kentang Goreng", "Camilan", 22, [["Reguler", 14000]]],
    ["Pisang Goreng", "Camilan", 0, [["Isi 5", 12000]]],
  ];

  for (let i = 0; i < rawProducts.length; i++) {
    const pId = `p${i + 1}`;
    const [nama, kategori, stok, variants] = rawProducts[i];

    await db.execute({
      sql: "INSERT OR REPLACE INTO products (id, nama, kategori, stok, foto, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [pId, nama, kategori, stok, "", now],
    });

    for (let v = 0; v < variants.length; v++) {
      const [vNama, vHarga] = variants[v];
      await db.execute({
        sql: "INSERT OR REPLACE INTO variants (id, product_id, nama, harga) VALUES (?, ?, ?, ?)",
        args: [`var_${pId}_${v + 1}`, pId, vNama, vHarga],
      });
    }
  }

  // Seed sample transactions for past 30 days
  const random = seededRandom(7);
  const currentDate = new Date();
  let trxSeq = 0;

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const numTrx = 3 + Math.floor(random() * 6); // 3-8 transactions per day

    for (let t = 0; t < numTrx; t++) {
      const trxTime = new Date(currentDate);
      trxTime.setDate(trxTime.getDate() - dayOffset);
      trxTime.setHours(8 + Math.floor(random() * 13), Math.floor(random() * 60), 0, 0);

      if (trxTime > currentDate) continue;

      trxSeq++;
      const trxId = generateTrxId(trxTime, trxSeq);
      const cashierName = random() > 0.5 ? "Sari" : "Admin";

      // Pick 1-3 items
      const numItems = 1 + Math.floor(random() * 3);
      let subtotal = 0;
      const itemsToInsert: { pId: string; nama: string; varian: string; harga: number; qty: number }[] = [];

      for (let j = 0; j < numItems; j++) {
        const prodIdx = Math.floor(random() * rawProducts.length);
        const [pName, , , pVariants] = rawProducts[prodIdx];
        const vIdx = Math.floor(random() * pVariants.length);
        const [vName, vPrice] = pVariants[vIdx];
        const qty = 1 + Math.floor(random() * 2);

        subtotal += vPrice * qty;
        itemsToInsert.push({
          pId: `p${prodIdx + 1}`,
          nama: pName,
          varian: vName,
          harga: vPrice,
          qty,
        });
      }

      const methods = ["tunai", "tunai", "qris", "transfer"];
      const metode = methods[Math.floor(random() * methods.length)];
      const bayar = metode === "tunai" ? Math.ceil(subtotal / 10000) * 10000 : subtotal;
      const kembali = bayar - subtotal;

      await db.execute({
        sql: `INSERT INTO transactions 
              (id, waktu, kasir_nama, subtotal, diskon, total, metode, bayar, kembali, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          trxId,
          trxTime.toISOString(),
          cashierName,
          subtotal,
          0,
          subtotal,
          metode,
          bayar,
          kembali,
          "selesai",
          trxTime.toISOString(),
        ],
      });

      for (let k = 0; k < itemsToInsert.length; k++) {
        const item = itemsToInsert[k];
        await db.execute({
          sql: `INSERT INTO transaction_items 
                (id, transaction_id, product_id, nama, varian, harga, qty)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `ti_${trxId}_${k + 1}`,
            trxId,
            item.pId,
            item.nama,
            item.varian,
            item.harga,
            item.qty,
          ],
        });
      }
    }
  }
}
