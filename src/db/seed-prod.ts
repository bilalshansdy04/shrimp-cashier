import path from "path";
import fs from "fs";
import crypto from "crypto";

// Load .env.production explicitly for this script
const envPath = path.resolve(process.cwd(), ".env.production");
if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

import { db, rawClient, schema } from "./index";
import { hashSync } from "bcrypt-ts";

async function runProdMigrationAndSeed() {
  console.log("🚀 Menjalankan Inisialisasi Database Lingkungan PRODUCTION...");

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

  console.log("✓ Tabel database production siap.");

  const now = new Date().toISOString();
  const superadminUsername =
    process.env.DEFAULT_SUPERADMIN_USERNAME || "spradmcsr";
  const superadminPassword =
    process.env.DEFAULT_SUPERADMIN_PASSWORD || "shrimpcashier406";
  const passwordHash = hashSync(superadminPassword, 12);

  // 2. Generate 24-character Emergency Master Recovery Key
  const rawKeyParts = [
    crypto.randomBytes(3).toString("hex").toUpperCase(),
    crypto.randomBytes(3).toString("hex").toUpperCase(),
    crypto.randomBytes(3).toString("hex").toUpperCase(),
  ];
  const emergencyRecoveryKey = `SHRIMP-${rawKeyParts.join("-")}`;
  const recoveryKeyHash = hashSync(emergencyRecoveryKey, 10);

  // 3. Simpan hash recovery key ke system_meta
  await db
    .insert(schema.systemMeta)
    .values({
      key: "emergency_recovery_key_hash",
      value: recoveryKeyHash,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.systemMeta.key,
      set: {
        value: recoveryKeyHash,
        updatedAt: now,
      },
    });

  // 4. Inisialisasi Akun Super Admin Tunggal
  await db
    .insert(schema.users)
    .values({
      id: "usr_superadmin_prod",
      username: superadminUsername,
      namaLengkap: "Super Administrator",
      passwordHash,
      role: "spradmcsr",
      isActive: true,
      createdBy: "system_init",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.users.username,
      set: {
        passwordHash,
        role: "spradmcsr",
        isActive: true,
        updatedAt: now,
      },
    });

  // 5. Inisialisasi Profil Toko Standar
  await db
    .insert(schema.settings)
    .values({
      id: "default",
      nama: "ShrimpCashier Store",
      alamat: "",
      telp: "",
      footer: "Terima kasih atas kunjungan Anda!",
      rekening: "",
      themePrimary: "#f97316",
      themeSurface: "#1a1c22",
      customPalettes: "[]",
      updatedAt: now,
    })
    .onConflictDoNothing();

  console.log("\n============================================================");
  console.log("🛡️  INISIALISASI PRODUCTION SELESAI");
  console.log("============================================================");
  console.log(`Database Target      : ${process.env.TURSO_DATABASE_URL}`);
  console.log(`Super Admin Username : ${superadminUsername}`);
  console.log(`Super Admin Password : ${superadminPassword}`);
  console.log(`Role Identifier      : spradmcsr`);
  console.log("------------------------------------------------------------");
  console.log("🚨 SIMPAN EMERGENCY RECOVERY KEY BERIKUT DI TEMPAT AMAN:");
  console.log(`🔑 RECOVERY KEY       : ${emergencyRecoveryKey}`);
  console.log("Gunakan kunci di atas jika Super Admin lupa password.");
  console.log("============================================================\n");
}

runProdMigrationAndSeed().catch((err) => {
  console.error("❌ Gagal inisialisasi production:", err);
  process.exit(1);
});
