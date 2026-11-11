import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright untuk ShrimpCashier
 * Menggunakan 1 worker agar skenario diuji satu per satu (step-by-step)
 * dan hanya membuka 1 jendela browser agar tidak tabrakan/membuka banyak jendela.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Jalankan tes satu per satu secara berurutan, BUKAN paralel */
  fullyParallel: false,
  /* Pastikan hanya 1 browser yang aktif pada satu waktu */
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  /* Reporter */
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // viewport standar desktop kasir
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
