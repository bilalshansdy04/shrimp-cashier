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
 * Jika sudah ada sesi aktif, akan melakukan logout terlebih dahulu.
 */
export async function loginAs(page: Page, user: TestUserCredentials) {
  await page.goto("/");

  const loginBtn = page.getByRole("button", { name: "Masuk ke Sistem Kasir" });
  const kasirHeader = page.getByText("Kasir Online");

  // Tunggu layar selesai loading
  await expect(loginBtn.or(kasirHeader)).toBeVisible({ timeout: 20000 });

  // Jika sudah terlanjur login dengan user lain, lakukan logout dulu
  if (await kasirHeader.isVisible()) {
    const userPill = page.locator('button[title*="Logout / Ganti Akun"], button[title*="Logout"]');
    if (await userPill.isVisible()) {
      await userPill.first().click();
      const yaLogoutBtn = page.getByRole("button", { name: "Ya, Logout" });
      if (await yaLogoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await yaLogoutBtn.click();
        await expect(loginBtn).toBeVisible({ timeout: 10000 });
      }
    }
  }

  // Isi formulir login
  if (await loginBtn.isVisible()) {
    await page.getByPlaceholder("cth: spradmcsr atau kasir_pagi").fill(user.username);
    await page.getByPlaceholder("Masukkan password akun").fill(user.password);
    await loginBtn.click();
  }

  // Pastikan berhasil masuk ke dashboard
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
