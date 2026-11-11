import { test, expect } from "@playwright/test";
import { loginAs, logoutCurrentSession, USERS } from "./helpers";

test.describe("Skenario 3: Kasir (clrkcsr) - Operasional POS & Restriksi Hak Akses", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.kasir);
  });

  test("3.1. Verifikasi Identitas & Pembatasan Menu (Security RBAC)", async ({ page }) => {
    // Profil header menunjukkan nama Kasir
    await expect(page.getByText("Siti Rahma (Shift Pagi)").first()).toBeVisible();
    await expect(page.getByText("Kasir", { exact: true }).first()).toBeVisible();

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
    // 1. Pastikan berada di tab Kasir
    await page.locator("nav").getByText("Kasir").click();

    // 2. Klik salah satu produk di katalog (tombol kartu produk)
    const productBtn = page.getByRole("button", { name: /Kopi Susu Gula Aren/i }).first();
    await expect(productBtn).toBeVisible();
    await productBtn.click();

    // 3. Jika muncul modal varian produk, pilih varian pertama
    const modalVarian = page.locator("div.fixed").filter({ hasText: "Pilih Varian" });
    if (await modalVarian.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modalVarian.locator("button").nth(1).click();
    }

    // 4. Verifikasi keranjang pesanan bertambah
    await expect(page.getByText(/Kopi Susu Gula Aren/i).first()).toBeVisible();

    // 5. Buka Modal Pembayaran (Klik tombol Bayar Sekarang)
    const payBtn = page.getByRole("button", { name: /Bayar Sekarang/i });
    await expect(payBtn).toBeEnabled();
    await payBtn.click();

    // 6. Verifikasi Modal Pembayaran Terbuka
    const modalPayment = page.locator("div.fixed").filter({ hasText: "Pembayaran" });
    await expect(modalPayment).toBeVisible();

    // Pilih Uang Pas
    const nominalPasBtn = modalPayment.getByRole("button", { name: /Uang Pas/i });
    await nominalPasBtn.click();

    // Selesaikan transaksi
    const submitBtn = modalPayment.getByRole("button", { name: /Selesaikan/i }).first();
    await submitBtn.click();

    // 7. Modal Sukses Transaksi Muncul
    await expect(page.getByText("Transaksi Berhasil!")).toBeVisible({ timeout: 10000 });

    // Klik Transaksi Baru untuk menutup modal
    const newTrxBtn = page.getByRole("button", { name: /Transaksi Baru/i });
    await newTrxBtn.click();
    await expect(page.getByText("Transaksi Berhasil!")).not.toBeVisible();
  });

  test("3.3. Peringatan Keranjang Aktif saat Mencoba Logout", async ({ page }) => {
    // 1. Tambah item ke keranjang
    const productBtn = page.getByRole("button", { name: /Americano Ice/i }).first();
    if (await productBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productBtn.click();
      const modalVarian = page.locator("div.fixed").filter({ hasText: "Pilih Varian" });
      if (await modalVarian.isVisible({ timeout: 1500 }).catch(() => false)) {
        await modalVarian.locator("button").nth(1).click();
      }
    }

    // 2. Klik tombol Logout di navigation dock saat masih ada keranjang
    const logoutBtn = page.locator('nav button[title*="Logout"]');
    await logoutBtn.click();

    // 3. Modal Konfirmasi Logout wajib menampilkan peringatan keranjang
    const modalConfirm = page.locator("div.fixed").filter({ hasText: "Konfirmasi Logout" });
    await expect(modalConfirm).toBeVisible();

    await expect(modalConfirm.getByText(/item di keranjang yang belum selesai dibayar/i)).toBeVisible();

    // 4. Klik Batal
    const batalBtn = modalConfirm.getByRole("button", { name: "Batal" });
    await batalBtn.click();
    await expect(modalConfirm).not.toBeVisible();
  });

  test("3.4. Logout Kasir", async ({ page }) => {
    await logoutCurrentSession(page);
  });
});
