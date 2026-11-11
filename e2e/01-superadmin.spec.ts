import { test, expect } from "@playwright/test";
import { loginAs, logoutCurrentSession, USERS } from "./helpers";

test.describe("Skenario 1: Super Admin (spradmcsr) - Akses Penuh & Kontrol Sistem", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.superadmin);
  });

  test("1.1. Verifikasi Identitas & Hak Akses Menu Lengkap", async ({ page }) => {
    // Header profil menunjukkan Super Admin
    await expect(page.getByText("Super Administrator").first()).toBeVisible();
    await expect(page.getByText("Super Admin").first()).toBeVisible();

    // Bottom Navigation menampilkan SEMUA menu (termasuk Produk & Atur)
    const nav = page.locator("nav");
    await expect(nav.getByText("Kasir")).toBeVisible();
    await expect(nav.getByText("Produk")).toBeVisible();
    await expect(nav.getByText("Riwayat")).toBeVisible();
    await expect(nav.getByText("Laporan")).toBeVisible();
    await expect(nav.getByText("Atur")).toBeVisible();
    await expect(nav.getByText("Logout")).toBeVisible();
  });

  test("1.2. Akses Menu Produk & Manajemen Stok", async ({ page }) => {
    // Klik menu Produk
    await page.locator("nav").getByText("Produk").click();

    // Verifikasi halaman manajemen produk aktif
    await expect(page.getByRole("heading", { name: /Produk & Stok/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tambah Produk/i })).toBeVisible();
  });

  test("1.3. Akses Menu Riwayat Transaksi & Laporan", async ({ page }) => {
    // Buka menu Riwayat
    await page.locator("nav").getByText("Riwayat").click();
    await expect(page.getByRole("heading", { name: /Riwayat Transaksi/i })).toBeVisible();

    // Buka menu Laporan
    await page.locator("nav").getByText("Laporan").click();
    await expect(page.getByRole("heading", { name: /Laporan & Analitik/i })).toBeVisible();
  });

  test("1.4. Manajemen Pengguna (RBAC) - Super Admin Mengelola Semua Role", async ({ page }) => {
    // Buka menu Atur
    await page.locator("nav").getByText("Atur").click();

    // Verifikasi bagian Manajemen Pengguna
    await expect(page.getByRole("heading", { name: /Pengaturan & Data/i })).toBeVisible();
    await expect(page.getByText(/Manajemen Pengguna & Tim/i)).toBeVisible();

    // Verifikasi Super Admin melihat akun dari semua role
    await expect(page.getByText("@spradmcsr").first()).toBeVisible();
    await expect(page.getByText("@adm_toko").first()).toBeVisible();
    await expect(page.getByText("@kasir_pagi").first()).toBeVisible();

    // Verifikasi form tambah user: Super Admin dapat memilih role Admin Toko atau Kasir
    const roleSelect = page.locator('select').first();
    await expect(roleSelect).toBeVisible();

    const optionsText = await roleSelect.textContent();
    expect(optionsText).toContain("Kasir");
    expect(optionsText).toContain("Admin Toko");

    // Verifikasi form Keamanan Akun
    await expect(page.getByText("Keamanan Akun Saya")).toBeVisible();
  });

  test("1.5. Interaksi Dialog Konfirmasi Logout", async ({ page }) => {
    // Klik tombol logout di dock navigasi
    const logoutBtn = page.locator('nav button[title*="Logout"]');
    await logoutBtn.click();

    // Dialog konfirmasi muncul utuh di tengah layar
    const modal = page.locator("div.fixed").filter({ hasText: "Konfirmasi Logout" });
    await expect(modal).toBeVisible();

    // Cek badge info Super Admin di dalam modal
    await expect(modal.getByText("Super Administrator")).toBeVisible();

    // Uji batal logout
    const batalBtn = modal.getByRole("button", { name: "Batal" });
    await batalBtn.click();
    await expect(modal).not.toBeVisible();

    // Lakukan logout sungguhan
    await logoutCurrentSession(page);
  });
});
