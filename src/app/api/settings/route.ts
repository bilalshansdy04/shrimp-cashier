import { NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { StoreSettings } from "@/types";

export async function GET() {
  try {
    await initDb();
    const res = await db.execute("SELECT * FROM settings WHERE id = 'default' LIMIT 1");
    const settings: StoreSettings = (res.rows[0] as unknown as StoreSettings) || {
      id: "default",
      nama: "ShrimpCashier",
      alamat: "",
      telp: "",
      footer: "Terima kasih sudah berbelanja!",
      rekening: "",
      theme_primary: "#f97316",
      theme_surface: "#1a1c22",
      custom_palettes: "[]",
    };
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await initDb();
    const body = await req.json();

    // Fetch existing settings first so partial updates don't overwrite other fields
    const currentRes = await db.execute("SELECT * FROM settings WHERE id = 'default' LIMIT 1");
    const existing = (currentRes.rows[0] as unknown as StoreSettings) || {
      id: "default",
      nama: "ShrimpCashier",
      alamat: "",
      telp: "",
      footer: "Terima kasih sudah berbelanja!",
      rekening: "",
      theme_primary: "#f97316",
      theme_surface: "#1a1c22",
      custom_palettes: "[]",
    };

    const nama = body.nama !== undefined ? body.nama : existing.nama;
    const alamat = body.alamat !== undefined ? body.alamat : existing.alamat;
    const telp = body.telp !== undefined ? body.telp : existing.telp;
    const footer = body.footer !== undefined ? body.footer : existing.footer;
    const rekening = body.rekening !== undefined ? body.rekening : existing.rekening;
    const theme_primary = body.theme_primary !== undefined ? body.theme_primary : (existing.theme_primary || "#f97316");
    const theme_surface = body.theme_surface !== undefined ? body.theme_surface : (existing.theme_surface || "#1a1c22");
    const custom_palettes = body.custom_palettes !== undefined ? body.custom_palettes : (existing.custom_palettes || "[]");

    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT OR REPLACE INTO settings 
            (id, nama, alamat, telp, footer, rekening, theme_primary, theme_surface, custom_palettes, updated_at) 
            VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nama,
        alamat,
        telp,
        footer,
        rekening,
        theme_primary,
        theme_surface,
        custom_palettes,
        now,
      ],
    });

    return NextResponse.json({ success: true, message: "Pengaturan berhasil disimpan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
