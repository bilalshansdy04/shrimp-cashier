import path from "path";
import fs from "fs";

// Load environment (checks .env.production first, then .env.development, then .env)
const envProd = path.resolve(process.cwd(), ".env.production");
const envDev = path.resolve(process.cwd(), ".env.development");
if (fs.existsSync(envProd) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envProd);
} else if (fs.existsSync(envDev) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envDev);
}

import { db, schema } from "./index";
import { hashSync } from "bcrypt-ts";
import { eq } from "drizzle-orm";

async function resetSuperadminCLI() {
  console.log("🛠️  MEMULIHKAN AKUN SUPER ADMIN VIA CLI (SHRIMP CASHIER)...");

  const newUsername =
    process.argv[2] || process.env.DEFAULT_SUPERADMIN_USERNAME || "spradmcsr";
  const newPassword =
    process.argv[3] ||
    process.env.DEFAULT_SUPERADMIN_PASSWORD ||
    "shrimpcashier406";
  const now = new Date().toISOString();
  const passwordHash = hashSync(newPassword, 12);

  // Cari apakah ada akun dengan role 'spradmcsr'
  const existingSuperadmins = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, "spradmcsr"))
    .limit(1);

  if (existingSuperadmins.length > 0) {
    const admin = existingSuperadmins[0];
    await db
      .update(schema.users)
      .set({
        username: newUsername,
        passwordHash,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(schema.users.id, admin.id));

    console.log("✓ Akun Super Admin yang ada berhasil direset!");
  } else {
    // Jika belum ada, buat baru
    await db.insert(schema.users).values({
      id: "usr_superadmin_reset",
      username: newUsername,
      namaLengkap: "Super Administrator",
      passwordHash,
      role: "spradmcsr",
      isActive: true,
      createdBy: "cli_reset",
      createdAt: now,
      updatedAt: now,
    });
    console.log("✓ Akun Super Admin baru berhasil dibuat!");
  }

  console.log("\n============================================================");
  console.log("✅ RESET SUPER ADMIN BERHASIL");
  console.log("============================================================");
  console.log(
    `Database Target : ${process.env.TURSO_DATABASE_URL || "file:shrimpcashier-dev.db"}`,
  );
  console.log(`Username Baru   : ${newUsername}`);
  console.log(`Password Baru   : ${newPassword}`);
  console.log(`Role            : spradmcsr (Super Admin)`);
  console.log("Silakan login kembali melalui layar login web.");
  console.log("============================================================\n");
}

resetSuperadminCLI().catch((err) => {
  console.error("❌ Gagal mereset super admin:", err);
  process.exit(1);
});
