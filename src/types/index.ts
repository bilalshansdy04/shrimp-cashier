export interface ColorPalette {
  id: string;
  name: string;
  primary: string; // Button & Accent color (ex: #f97316)
  surface: string; // Panel & Navbottom dark color (ex: #1a1c22)
  isCustom?: boolean;
}

export interface StoreSettings {
  id: string;
  nama: string;
  alamat: string;
  telp: string;
  footer: string;
  rekening: string;
  theme_primary?: string;
  theme_surface?: string;
  custom_palettes?: string;
  updated_at?: string;
}

export type UserRole = "spradmcsr" | "admmngrcsr" | "clrkcsr";

export const ROLE_LABELS: Record<UserRole, string> = {
  spradmcsr: "Super Admin",
  admmngrcsr: "Admin Toko",
  clrkcsr: "Kasir",
};

export interface AppUser {
  id: string;
  username: string;
  namaLengkap: string;
  role: UserRole;
  isActive: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Alias Cashier for backward compatibility in components
export interface Cashier {
  id: string;
  nama: string;
  username?: string;
  role?: UserRole;
  peran?: "admin" | "kasir";
  pin?: string;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  nama: string;
  harga: number;
}

export interface Product {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  foto?: string;
  varian: ProductVariant[];
  created_at?: string;
}

export interface CartItem {
  pid: string;
  nama: string;
  varian: string;
  harga: number;
  qty: number;
  foto?: string;
  kategori?: string;
}

export interface TransactionItem {
  id: string;
  transaction_id?: string;
  product_id: string;
  nama: string;
  varian: string;
  harga: number;
  qty: number;
}

export interface Transaction {
  id: string;
  waktu: string;
  kasir_nama: string;
  subtotal: number;
  diskon: number;
  total: number;
  metode: "tunai" | "qris" | "transfer";
  bayar: number;
  kembali: number;
  status: "selesai" | "dibatalkan";
  items: TransactionItem[];
  created_at?: string;
}

export interface SalesReport {
  omzet: number;
  trx: number;
  item: number;
  rata: number;
  top: { nama: string; qty: number; nilai: number }[];
  metode: { tunai: number; qris: number; transfer: number };
  chart: { label: string; value: number }[];
}
