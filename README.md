# 🦐 ShrimpCashier — Modern Interactive POS (Next.js + Turso)

Aplikasi kasir (Point of Sale) modern, interaktif, responsif, dan siap cetak struk thermal 58mm. Dibuat dengan **Next.js (App Router)**, **Tailwind CSS**, dan **Turso LibSQL Database** (Local-first / Remote Cloud).

Aplikasi ini mereplikasi **100% fungsionalitas backend** dari `kasir-umkm-main` dengan desain antarmuka baru yang segar, taktil, dan kaya interaksi sesuai pedoman **UI/UX Pro Max**.

---

## ✨ Fitur Utama

- ⚡ **Next.js App Router**: Arsitektur cepat dengan Server API Routes terintegrasi.
- 🗄️ **Turso LibSQL Local-First**: Otomatis membuat database SQLite lokal `shrimpcashier.db` tanpa butuh cloud/internet. Siap beralih ke Turso Cloud kapan saja melalui environment variable.
- 🎨 **Desain UI/UX Segar & Interaktif**:
  - Palet Modern Coastal Slate & Coral Shrimp dengan mode Gelap / Terang (Dark/Light).
  - Feedback Audio taktil via Web Audio API (beep scan, cash drawer chime, error shake) dengan tombol mute instan.
  - Efek konfeti perayaan kemenangan saat transaksi berhasil diselesaikan.
  - Kartu produk interaktif dengan ilustrasi tema makanan/minuman otomatis atau foto kustom, badge peringatan stok tipis (< 5), dan badge status habis.
- 🛒 **POS Cepat & Keyboard Friendly**:
  - Tombol pintas keyboard: `/` atau `F1` (Cari produk), `F2` (Bayar), `Esc` (Tutup dialog), `Enter` (Selesaikan/Konfirmasi).
  - Popover pemilih varian dinamis (misal Reguler / Large, Hot / Ice).
  - Tiket pesanan dengan stepper penambah/pengurang kuantitas.
  - Diskon fleksibel (Rupiah atau Persentase %).
- 💳 **Metode Pembayaran Lengkap**:
  - **Tunai**: Numpad virtual interaktif, tombol uang cepat (*Uang pas*, Rp20rb, Rp50rb, Rp100rb), dan kalkulasi kembalian otomatis dengan deteksi uang kurang.
  - **QRIS**: Tampilan kode QRIS statis siap pindai.
  - **Transfer Bank**: Salin nomor rekening toko dengan 1 klik.
- 🖨️ **Struk Thermal 58mm**: Siap cetak ke printer thermal (Bluetooth/USB) dengan dialog print browser (`Ctrl+P` otomatis).
- 📦 **Manajemen Produk & Kategori**:
  - Tambah, edit, dan hapus produk dengan banyak varian harga.
  - Tombol cepat `+Stok` untuk *restock* kilat.
  - Kompresi foto otomatis di browser saat upload.
  - Kelola kategori produk dengan proteksi kategori yang masih digunakan.
- 📜 **Riwayat & Pembatalan Transaksi**:
  - Filter riwayat per tanggal dan pencarian.
  - Cetak ulang struk transaksi lama.
  - Batalkan transaksi dengan pengembalian stok barang otomatis.
  - Ekspor riwayat transaksi ke CSV untuk Excel / Google Sheets.
- 📊 **Laporan & Analitik**:
  - Mode harian (grafik penjualan per jam 07:00–22:00) dan mode bulanan (grafik per tanggal).
  - Kartu metrik KPI: Omzet, Total Transaksi, Item Terjual, Rata-rata per struk.
  - Papan peringkat produk terlaris dengan medali 🥇 🥈 🥉.
  - Distribusi persentase per metode pembayaran.
- 🔐 **Multi-Kasir dengan PIN**:
  - Login layar kunci PIN 4-6 angka.
  - Kasir contoh: **Admin** (PIN `1234`), **Sari** (PIN `1111`).
  - Pemisahan hak akses: Peran *Admin* dapat mengelola produk dan pengaturan; peran *Kasir* hanya memproses pesanan.
- 💾 **Backup & Pemulihan Data**:
  - Ekspor & Impor produk format CSV.
  - Backup seluruh data ke JSON dan pemulihan backup 1-klik (100% kompatibel dengan data `kasir-umkm-main`).
  - Tombol muat data contoh (30 hari riwayat transaksi) atau reset mulai dari nol.

---

## 🚀 Cara Menjalankan

### 1. Masuk ke folder proyek
```bash
cd "d:\Projects\Shrimp Kasir\shrimpcashier"
```

### 2. Jalankan server dev
```bash
npm run dev
```

Buka browser di:
👉 **http://localhost:3000**

Pilih **Admin** dan masukkan PIN **1234** (atau **Sari** dengan PIN **1111**).

---

## 🗄️ Konfigurasi Turso DB

Secara bawaan, aplikasi berjalan dalam **Mode Lokal** menggunakan database file SQLite/LibSQL di `./shrimpcashier.db`.

Jika ingin menghubungkan ke database Turso di cloud:
1. Buat database di Turso CLI: `turso db create shrimpcashier`
2. Dapatkan token autentikasi: `turso db tokens create shrimpcashier`
3. Buat file `.env.local` di folder `shrimpcashier/`:
```env
TURSO_DATABASE_URL=libsql://shrimpcashier-username.turso.io
TURSO_AUTH_TOKEN=your_auth_token_here
```
Aplikasi akan otomatis menyambung ke remote Turso tanpa perlu perubahan kode!

---

## 📁 Struktur Folder

```
shrimpcashier/
├── public/                 # Aset statis (qris.svg, ikon.svg)
├── src/
│   ├── app/
│   │   ├── api/            # Server Backend API Routes
│   │   │   ├── auth/login/ # Verifikasi PIN Kasir
│   │   │   ├── backup/     # Backup & Restore JSON
│   │   │   ├── cashiers/   # CRUD Kasir
│   │   │   ├── categories/ # CRUD Kategori
│   │   │   ├── pos/state/  # Fetch state awal POS
│   │   │   ├── products/   # CRUD Produk & Varian
│   │   │   ├── reports/    # Laporan & Analitik Penjualan
│   │   │   ├── reset/      # Reset data atau muat ulang demo
│   │   │   ├── settings/   # Profil Toko
│   │   │   └── transactions/# Transaksi & Pengembalian Stok
│   │   ├── globals.css     # Tailwind v4, tema terang/gelap & styling struk cetak
│   │   ├── layout.tsx      # Root HTML Layout
│   │   └── page.tsx        # Halaman Utama POS
│   ├── components/         # Komponen UI Interaktif
│   │   ├── HistoryView.tsx # Riwayat transaksi & ekspor CSV
│   │   ├── PaymentModal.tsx# Dialog bayar + Numpad & Quick cash
│   │   ├── PinLoginModal.tsx# Layar masuk kasir dengan PIN
│   │   ├── POSView.tsx     # Katalog menu & tiket pesanan
│   │   ├── ProductsManagement.tsx # Kelola produk, varian & stok
│   │   ├── ReportsView.tsx # Grafik jam sibuk, metrik & leaderboard
│   │   ├── SettingsView.tsx# Profil toko, kasir & alat data
│   │   ├── Sidebar.tsx     # Navigasi rel samping & kontrol tema
│   │   ├── SuccessReceiptModal.tsx # Sukses transaksi + konfeti
│   │   └── ThermalReceipt.tsx      # Format struk thermal 58mm
│   ├── lib/
│   │   ├── audio.ts        # Sintesis efek suara Web Audio API
│   │   ├── db.ts           # Koneksi Turso LibSQL & auto-seed
│   │   └── format.ts       # Format rupiah, tanggal & utilitas CSV
│   └── types/
│       └── index.ts        # TypeScript Interfaces
├── .env.example            # Contoh konfigurasi Turso
├── package.json
└── tsconfig.json
```
