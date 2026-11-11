import { test, expect } from "@playwright/test";
import { loginAs, logoutCurrentSession, USERS } from "./helpers";

test.describe("Skenario 2: Admin Toko (admmngrcsr) - Kelola Toko & Kasir Saja", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin);
  });

  test("2.1. Verifikasi Identitas & Hak Akses Admin Toko", async ({ page }) => {
    // Profil header menunjukkan nama Admin Toko
    await expect(page.getByText("Bambang (Manajer Toko)")).toBeVisible();
    await expect(page.getByText("ADMIN", { exact: true })).toBeVisible();

    // Admin Toko dapat melihat menu operasional dan pengaturan toko
    const nav = page.locator("nav");
    await expect(nav.getByText("Kasir")).toBeVisible();
    await expect(nav.getByText("Produk")).toBeVisible();
    await expect(nav.getByText("Riwayat")).toBeVisible();
    await expect(nav.getByText("Laporan")).toBeVisible();
    await expect(nav.getByText("Atur")).toBeVisible();
    await expect(nav.getByText("Logout")).toBeVisible();
  });

  test("2.2. Verifikasi Batasan RBAC: Admin Toko Hanya Bisa Kelola Kasir", async ({ page }) => {
    // Buka menu Atur
    await page.locator("nav").getByText("Atur").click();

    // Verifikasi modul Manajemen Pengguna
    await expect(page.getByText("Manajemen Pengguna (RBAC)")).toBeVisible();

    // Admin Toko melihat peringatan atau batasan role kasir saja
    const roleSelect = page.locator('select').first();
    await expect(roleSelect).toBeVisible();

    // Admin Toko HANYA bisa membuat akun Kasir (tidak ada opsi membuat Super Admin atau Admin)
    const optionsText = await roleSelect.textContent();
    expect(optionsText).toContain("Kasir");
    expect(optionsText).not.toContain("Super Admin");

    // Di formulir Keamanan Akun: Admin Toko wajib mengisi password lama jika ingin ubah password
    await expect(page.getByText("Keamanan Akun Saya")).toBeVisible();
    await expect(page.getByPlaceholder("Password Anda saat ini")).toBeVisible();
  });

  test("2.3. Akses Menu Produk & Riwayat", async ({ page }) => {
    // Admin Toko memiliki hak mengelola katalog produk
    await page.locator("nav").getByText("Produk").click();
    await expect(page.getByText("Kelola Menu & Stok")).toBeVisible();

    // Admin Toko dapat melihat rekap riwayat
    await page.locator("nav").getByText("Riwayat").click();
    await expect(page.getByText("Riwayat Transaksi")).toBeVisible();
  });

  test("2.4. Logout Admin Toko", async ({ page }) => {
    await logoutCurrentSession(page);
  });
});
