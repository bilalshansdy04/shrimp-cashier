import { Page, expect } from "@playwright/test";

export interface TestUserCredentials {
  username: string;
  password: string;
  namaLengkap: string;
  roleLabel: string;
}

export const USERS = {
  superadmin: {
    username: "spradmcsr",
    password: "shrimpchasier406",
    namaLengkap: "Super Administrator",
    roleLabel: "Super Admin",
  },
  admin: {
    username: "adm_toko",
    password: "shrimpchasier406",
    namaLengkap: "Bambang (Manajer Toko)",
    roleLabel: "Admin",
  },
  kasir: {
    username: "kasir_pagi",
    password: "shrimpchasier406",
    namaLengkap: "Siti Rahma (Shift Pagi)",
    roleLabel: "Kasir",
  },
};

/**
 * Melakukan proses login dengan kredensial tertentu.
 * Selalu membersihkan cookies sesi terlebih dahulu agar dimulai dari halaman login bersih.
 */
export async function loginAs(page: Page, user: TestUserCredentials) {
  // Bersihkan cookies browser agar selalu mulai dari login modal
  await page.context().clearCookies();
  await page.goto("/");

  const loginBtn = page.getByRole("button", { name: "Masuk ke Sistem Kasir" });
  await expect(loginBtn).toBeVisible({ timeout: 20000 });

  // Isi form login
  await page.getByPlaceholder("cth: spradmcsr atau kasir_pagi").fill(user.username);
  await page.getByPlaceholder("Masukkan password akun").fill(user.password);

  // Klik tombol login
  await loginBtn.click();

  // Pastikan berhasil masuk ke dashboard kasir
  const kasirHeader = page.getByText("Kasir Online");
  await expect(kasirHeader).toBeVisible({ timeout: 15000 });
}

/**
 * Melakukan logout bersih melalui dialog konfirmasi
 */
export async function logoutCurrentSession(page: Page) {
  const logoutNavBtn = page.locator('nav button[title*="Logout"]');
  await expect(logoutNavBtn).toBeVisible();
  await logoutNavBtn.click();

  const confirmModal = page.getByText("Konfirmasi Logout");
  await expect(confirmModal).toBeVisible();

  const yaLogoutBtn = page.getByRole("button", { name: "Ya, Logout" });
  await yaLogoutBtn.click();

  // Pastikan form login muncul kembali
  const loginBtn = page.getByRole("button", { name: "Masuk ke Sistem Kasir" });
  await expect(loginBtn).toBeVisible({ timeout: 10000 });
}
