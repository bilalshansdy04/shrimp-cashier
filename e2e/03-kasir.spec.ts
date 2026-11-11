import { test, expect } from "@playwright/test";
import { loginAs, logoutCurrentSession, USERS } from "./helpers";

test.describe("Skenario 3: Kasir (clrkcsr) - Operasional POS & Restriksi Hak Akses", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.kasir);
  });

  test("3.1. Verifikasi Identitas & Pembatasan Menu (Security RBAC)", async ({ page }) => {
    // Profil header menunjukkan nama Kasir
    await expect(page.getByText("Siti Rahma (Shift Pagi)")).toBeVisible();
    await expect(page.getByText("KASIR", { exact: true })).toBeVisible();

    // Navigasi Bawah: Menu "Produk" dan "Atur" WAJIB DISEMBUNYIKAN untuk Kasir
    const nav = page.locator("nav");
    await expect(nav.getByText("Kasir")).toBeVisible();
    await expect(nav.getByText("Riwayat")).toBeVisible();
    await expect(nav.getByText("Laporan")).toBeVisible();
    await expect(nav.getByText("Logout")).toBeVisible();

    // Pastikan Kasir TIDAK memiliki akses ke menu Produk dan Atur
    await expect(nav.getByText("Produk")).not.toBeVisible();
    await expect(nav.getByText("Atur")).not.toBeVisible();
  });

  test("3.2. Alur Transaksi Penjualan POS Kasir Lengkap", async ({ page }) => {
    // 1. Pastikan berada di halaman POS (Kasir)
    await page.locator("nav").getByText("Kasir").click();

    // 2. Klik salah satu produk yang tersedia di katalog (misal: Kopi Susu Gula Aren)
    const productCard = page.locator('div:has-text("Kopi Susu Gula Aren")').first();
    await expect(productCard).toBeVisible();

    // Klik tombol tambah ke keranjang (+ atau kartu produk)
    const addBtn = productCard.locator('button').first();
    await addBtn.click();

    // Jika ada modal pilihan varian, pilih varian pertama
    const modalVarian = page.getByText("Pilih Varian");
    if (await modalVarian.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.locator('button:has-text("Tambah ke Keranjang")').first().click();
    }

    // 3. Verifikasi item masuk ke panel pesanan keranjang
    await expect(page.getByText("Kopi Susu Gula Aren").first()).toBeVisible();

    // 4. Buka Modal Pembayaran (Klik tombol Bayar Sekarang)
    const payBtn = page.getByRole("button", { name: /Bayar Sekarang/i });
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    // 5. Verifikasi Modal Pembayaran Terbuka
    await expect(page.getByText("Pembayaran")).toBeVisible();

    // Masukkan uang tunai pas atau nominal cepat
    const nominalPasBtn = page.locator('button:has-text("Uang Pas")');
    if (await nominalPasBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nominalPasBtn.click();
    } else {
      // Isi manual nominal pembayaran
      const inputBayar = page.locator('input[type="number"], input[placeholder*="bayar" i]').first();
      await inputBayar.fill("50000");
    }

    // 6. Konfirmasi Proses Transaksi
    const submitPayBtn = page.getByRole("button", { name: /Selesaikan Pembayaran|Proses Transaksi|Simpan & Cetak/i }).first();
    await submitPayBtn.click();

    // 7. Modal Sukses Transaksi Muncul
    await expect(page.getByText(/Transaksi Berhasil|Pembayaran Sukses/i)).toBeVisible({ timeout: 10000 });

    // Tutup modal transaksi baru
    const newTrxBtn = page.getByRole("button", { name: /Transaksi Baru|Tutup/i }).first();
    if (await newTrxBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newTrxBtn.click();
    }
  });

  test("3.3. Peringatan Keranjang Aktif saat Mencoba Logout", async ({ page }) => {
    // Tambah item ke keranjang
    const productCard = page.locator('div:has-text("Americano Ice")').first();
    if (await productCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productCard.click();
      const addVariantBtn = page.locator('button:has-text("Tambah ke Keranjang")');
      if (await addVariantBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await addVariantBtn.click();
      }
    }

    // Klik tombol Logout saat masih ada item di keranjang
    const logoutBtn = page.locator('nav button[title*="Logout"]');
    await logoutBtn.click();

    // Modal Konfirmasi Logout wajib menampilkan peringatan keranjang
    const modalConfirm = page.getByText("Konfirmasi Logout");
    await expect(modalConfirm).toBeVisible();

    // Cek ada pesan peringatan keranjang
    await expect(page.getByText(/item di keranjang yang belum selesai dibayar/i)).toBeVisible();

    // Klik Batal agar kasir dapat menyelesaikan pesanannya
    const batalBtn = page.getByRole("button", { name: "Batal" });
    await batalBtn.click();
    await expect(modalConfirm).not.toBeVisible();
  });

  test("3.4. Logout Kasir", async ({ page }) => {
    await logoutCurrentSession(page);
  });
});
