import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 3 Role Codes: spradmcsr (Super Admin), admmngrcsr (Admin), clrkcsr (Kasir)
export const ROLE_CODES = ["spradmcsr", "admmngrcsr", "clrkcsr"] as const;
export type UserRole = (typeof ROLE_CODES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  spradmcsr: "Super Admin",
  admmngrcsr: "Admin Toko",
  clrkcsr: "Kasir",
};

// Tabel Pengguna
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  namaLengkap: text("nama_lengkap").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLE_CODES }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Tabel Sesi Login
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// Tabel Metadata Sistem (Emergency Recovery Key, Seeder info)
export const systemMeta = sqliteTable("system_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Tabel Pengaturan Toko & Palet Warna
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("default"),
  nama: text("nama").notNull().default("ShrimpCashier"),
  alamat: text("alamat").default(""),
  telp: text("telp").default(""),
  footer: text("footer").default("Terima kasih sudah berbelanja!"),
  rekening: text("rekening").default(""),
  themePrimary: text("theme_primary").default("#f97316"),
  themeSurface: text("theme_surface").default("#1a1c22"),
  customPalettes: text("custom_palettes").default("[]"),
  updatedAt: text("updated_at").notNull(),
});

// Tabel Kategori Produk
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

// Tabel Produk
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  kategori: text("kategori").notNull(),
  stok: integer("stok").notNull().default(0),
  foto: text("foto"),
  createdAt: text("created_at").notNull(),
});

// Tabel Varian Produk
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  nama: text("nama").notNull(),
  harga: integer("harga").notNull(),
});

// Tabel Transaksi Penjualan
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  waktu: text("waktu").notNull(),
  kasirId: text("kasir_id").references(() => users.id),
  kasirNama: text("kasir_nama").notNull(),
  subtotal: integer("subtotal").notNull(),
  diskon: integer("diskon").notNull().default(0),
  total: integer("total").notNull(),
  metode: text("metode", { enum: ["tunai", "qris", "transfer"] }).notNull(),
  bayar: integer("bayar").notNull(),
  kembali: integer("kembali").notNull(),
  status: text("status", { enum: ["selesai", "dibatalkan"] })
    .notNull()
    .default("selesai"),
  createdAt: text("created_at").notNull(),
});

// Tabel Item Transaksi
export const transactionItems = sqliteTable("transaction_items", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  nama: text("nama").notNull(),
  varian: text("varian").notNull(),
  harga: integer("harga").notNull(),
  qty: integer("qty").notNull(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type StoreSetting = typeof settings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type TransactionItemRow = typeof transactionItems.$inferSelect;
