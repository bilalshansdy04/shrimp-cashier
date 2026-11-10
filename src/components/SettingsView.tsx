"use client";

import React, { useState } from "react";
import { StoreSettings, Cashier, ColorPalette } from "@/types";
import { downloadFile, formatDateKey, parseCSV, escapeCSVCell } from "@/lib/format";
import { playBeep } from "@/lib/audio";
import { DEFAULT_PALETTES, applyPalette } from "@/lib/theme";
import {
  Store,
  Users,
  ShieldCheck,
  User,
  Plus,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Palette,
  Check,
  Sparkles,
} from "lucide-react";

interface SettingsViewProps {
  settings: StoreSettings;
  cashiers: Cashier[];
  currentCashier: Cashier;
  onRefreshAll: () => void;
}

export function SettingsView({
  settings,
  cashiers,
  currentCashier,
  onRefreshAll,
}: SettingsViewProps) {
  const [nama, setNama] = useState<string>(settings.nama || "");
  const [alamat, setAlamat] = useState<string>(settings.alamat || "");
  const [telp, setTelp] = useState<string>(settings.telp || "");
  const [footer, setFooter] = useState<string>(settings.footer || "");
  const [rekening, setRekening] = useState<string>(settings.rekening || "");
  const [isSavingStore, setIsSavingStore] = useState<boolean>(false);
  const [storeSavedMsg, setStoreSavedMsg] = useState<string>("");

  const [newCashierName, setNewCashierName] = useState<string>("");
  const [newCashierPin, setNewCashierPin] = useState<string>("");
  const [newCashierRole, setNewCashierRole] = useState<"admin" | "kasir">("kasir");
  const [isAddingCashier, setIsAddingCashier] = useState<boolean>(false);

  // Palette & Color States
  const [activePrimary, setActivePrimary] = useState<string>(settings.theme_primary || "#f97316");
  const [activeSurface, setActiveSurface] = useState<string>(settings.theme_surface || "#1a1c22");
  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>(() => {
    try {
      return settings.custom_palettes ? JSON.parse(settings.custom_palettes) : [];
    } catch {
      return [];
    }
  });
  const [newPaletteName, setNewPaletteName] = useState<string>("");
  const [paletteSavedMsg, setPaletteSavedMsg] = useState<string>("");
  const [isSavingPalette, setIsSavingPalette] = useState<boolean>(false);

  const handleSelectPalette = async (palette: ColorPalette) => {
    try {
      setActivePrimary(palette.primary);
      setActiveSurface(palette.surface);
      applyPalette(palette.primary, palette.surface);

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_primary: palette.primary,
          theme_surface: palette.surface,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playBeep();
      setPaletteSavedMsg(`Palet "${palette.name}" aktif`);
      setTimeout(() => setPaletteSavedMsg(""), 3000);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menerapkan palet");
    }
  };

  const handleColorChange = (primary: string, surface: string) => {
    setActivePrimary(primary);
    setActiveSurface(surface);
    applyPalette(primary, surface);
  };

  const handleSaveCurrentColors = async () => {
    try {
      setIsSavingPalette(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_primary: activePrimary,
          theme_surface: activeSurface,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playBeep();
      setPaletteSavedMsg("Warna tema berhasil disimpan");
      setTimeout(() => setPaletteSavedMsg(""), 3000);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan warna tema");
    } finally {
      setIsSavingPalette(false);
    }
  };

  const handleAddCustomPalette = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaletteName.trim()) {
      alert("Masukkan nama set palet terlebih dahulu");
      return;
    }

    const newPal: ColorPalette = {
      id: `custom-${Date.now()}`,
      name: newPaletteName.trim(),
      primary: activePrimary,
      surface: activeSurface,
      isCustom: true,
    };

    const updated = [...customPalettes, newPal];
    try {
      setIsSavingPalette(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_primary: activePrimary,
          theme_surface: activeSurface,
          custom_palettes: JSON.stringify(updated),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setCustomPalettes(updated);
      setNewPaletteName("");
      playBeep();
      setPaletteSavedMsg(`Set palet "${newPal.name}" berhasil ditambahkan!`);
      setTimeout(() => setPaletteSavedMsg(""), 3000);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan set palet");
    } finally {
      setIsSavingPalette(false);
    }
  };

  const handleDeleteCustomPalette = async (paletteId: string) => {
    if (!confirm("Hapus set palet kustom ini?")) return;

    const updated = customPalettes.filter((p) => p.id !== paletteId);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_palettes: JSON.stringify(updated),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setCustomPalettes(updated);
      playBeep();
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus palet kustom");
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingStore(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, alamat, telp, footer, rekening }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playBeep();
      setStoreSavedMsg("Pengaturan toko berhasil disimpan");
      setTimeout(() => setStoreSavedMsg(""), 3000);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan pengaturan");
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCashierName.trim() || newCashierPin.length < 4) {
      alert("Nama dan PIN minimal 4 angka wajib diisi");
      return;
    }

    try {
      setIsAddingCashier(true);
      const res = await fetch("/api/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newCashierName.trim(),
          pin: newCashierPin,
          peran: newCashierRole,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playBeep();
      setNewCashierName("");
      setNewCashierPin("");
      setNewCashierRole("kasir");
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan kasir");
    } finally {
      setIsAddingCashier(false);
    }
  };

  const handleDeleteCashier = async (id: string, name: string) => {
    if (!confirm(`Hapus akun kasir "${name}"?`)) return;

    try {
      const res = await fetch(`/api/cashiers?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playBeep();
      onRefreshAll();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus kasir");
    }
  };

  const handleDownloadBackup = async () => {
    try {
      playBeep();
      const res = await fetch("/api/backup");
      const json = await res.json();
      const filename = `backup-shrimpcashier-${formatDateKey(new Date())}.json`;
      downloadFile(filename, JSON.stringify(json, null, 2), "application/json");
    } catch (e) {
      alert("Gagal mengunduh backup");
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "PERINGATAN: Memulihkan backup akan menimpa seluruh data saat ini. Lanjutkan?"
      )
    ) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);

        playBeep();
        alert("Backup berhasil dipulihkan!");
        onRefreshAll();
      } catch (err: any) {
        alert("File backup tidak valid atau gagal dipulihkan");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportProductCSV = async () => {
    try {
      playBeep();
      const res = await fetch("/api/products");
      const json = await res.json();
      const products = json.data || [];

      const rows = [["nama", "kategori", "stok", "varian"]];
      products.forEach((p: any) => {
        const varStr = p.varian.map((v: any) => `${v.nama}:${v.harga}`).join("|");
        rows.push([p.nama, p.kategori, String(p.stok), varStr]);
      });

      const csvContent =
        "\uFEFF" + rows.map((r) => r.map(escapeCSVCell).join(",")).join("\n");
      downloadFile("produk.csv", csvContent, "text/csv;charset=utf-8;");
    } catch (e) {
      alert("Gagal ekspor produk");
    }
  };

  const handleImportProductCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = String(reader.result).replace(/^\uFEFF/, "");
        const rows = parseCSV(text);
        if (rows.length && /nama/i.test(rows[0][0])) rows.shift();

        let imported = 0;
        for (const r of rows) {
          const nama = (r[0] || "").trim();
          if (!nama) continue;
          const kategori = (r[1] || "Umum").trim();
          const stok = Math.max(0, parseInt(r[2], 10) || 0);
          const varian = (r[3] || "Reguler:0").split("|").map((s) => {
            const parts = s.split(":");
            return {
              nama: (parts[0] || "Reguler").trim(),
              harga: Math.max(0, parseInt(parts[1], 10) || 0),
            };
          });

          await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nama, kategori, stok, varian }),
          });
          imported++;
        }

        playBeep();
        alert(`${imported} produk berhasil diimpor!`);
        onRefreshAll();
      } catch (err: any) {
        alert("Gagal membaca file CSV");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetData = async (action: "demo" | "empty") => {
    const msg =
      action === "demo"
        ? "Ganti semua data dengan data contoh kedai + riwayat 30 hari?"
        : "PERINGATAN: Yakin ingin menghapus SEMUA data dan mulai dari nol? (Backup dulu bila perlu). PIN admin default: 1234.";

    if (!confirm(msg)) return;

    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      playBeep();
      alert(json.message);
      onRefreshAll();
    } catch (e: any) {
      alert(e.message || "Gagal mengatur ulang data");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 lg:p-8 pb-28 space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">
          Pengaturan &amp; Data
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Palet warna kustom, profil toko, akun kasir PIN, dan pencadangan database
        </p>
      </div>

      {/* Color Palette & Customizer Section (Anti-Slop, No Harsh Outlines) */}
      <div className="p-6 rounded-3xl bg-card shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-black text-base text-foreground">
                Kustomisasi Warna &amp; Palet Kasir
              </h3>
              <p className="text-xs text-muted-foreground">
                Pilih tema preset, atur warna tombol &amp; panel, atau tambah set palet kustom
              </p>
            </div>
          </div>

          {paletteSavedMsg && (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{paletteSavedMsg}</span>
            </div>
          )}
        </div>

        {/* Info Box: Neutral background rule */}
        <div className="p-4 rounded-2xl bg-muted/40 text-xs text-muted-foreground flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>
            Warna latar utama layar (canvas background) tetap dipertahankan putih bersih pada light mode dan gelap natural pada dark mode demi keterbacaan kasir yang tajam dan nyaman di mata.
          </span>
        </div>

        {/* 1. Palette Collection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Koleksi Set Palet Tersedia
            </span>
            <span className="text-[11px] text-muted-foreground">
              Klik untuk langsung mengaktifkan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...DEFAULT_PALETTES, ...customPalettes].map((pal) => {
              const isSelected =
                activePrimary.toLowerCase() === pal.primary.toLowerCase() &&
                activeSurface.toLowerCase() === pal.surface.toLowerCase();

              return (
                <div
                  key={pal.id}
                  onClick={() => handleSelectPalette(pal)}
                  className={`group relative p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-muted ring-2 ring-primary shadow-xs"
                      : "bg-muted/40 hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-foreground truncate pr-1">
                      {pal.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Visual Swatch Preview */}
                  <div
                    className="h-10 rounded-xl p-2 flex items-center justify-between shadow-2xs"
                    style={{ backgroundColor: pal.surface }}
                  >
                    <span className="text-[10px] font-semibold text-white/75 px-1 truncate">
                      Panel
                    </span>
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shadow-xs text-white"
                      style={{ backgroundColor: pal.primary }}
                      title={`Aksen: ${pal.primary}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    </div>
                  </div>

                  {/* Custom Palette Delete Button */}
                  {pal.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomPalette(pal.id);
                      }}
                      className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                      title="Hapus set palet ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Color Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Picker 1: Button / Accent */}
          <div className="p-4 rounded-2xl bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Warna Tombol &amp; Aksen
              </label>
              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                {activePrimary}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={activePrimary}
                onChange={(e) => handleColorChange(e.target.value, activeSurface)}
                className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={activePrimary}
                onChange={(e) => handleColorChange(e.target.value, activeSurface)}
                placeholder="#f97316"
                maxLength={7}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="pt-1">
              <button
                type="button"
                style={{ backgroundColor: activePrimary }}
                className="w-full py-2.5 rounded-full text-white font-bold text-xs shadow-xs transition-opacity hover:opacity-90 cursor-default"
              >
                Pratinjau Tombol Aksen ({activePrimary})
              </button>
            </div>
          </div>

          {/* Picker 2: Panel & Navbottom */}
          <div className="p-4 rounded-2xl bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Warna Panel &amp; Navbottom
              </label>
              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                {activeSurface}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={activeSurface}
                onChange={(e) => handleColorChange(activePrimary, e.target.value)}
                className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={activeSurface}
                onChange={(e) => handleColorChange(activePrimary, e.target.value)}
                placeholder="#1a1c22"
                maxLength={7}
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="pt-1">
              <div
                style={{ backgroundColor: activeSurface }}
                className="w-full py-2.5 px-4 rounded-2xl text-white font-bold text-xs shadow-xs flex items-center justify-between"
              >
                <span>Pratinjau Panel / Navbottom</span>
                <span className="text-[10px] opacity-75 font-mono">{activeSurface}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Actions: Tambah Set Palet Baru / Simpan Aktif */}
        <div className="p-4 rounded-2xl bg-muted/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <form
            onSubmit={handleAddCustomPalette}
            className="flex-1 w-full flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nama set baru (cth: Kedai Hijau, Neon Malam)..."
              value={newPaletteName}
              onChange={(e) => setNewPaletteName(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <button
              type="submit"
              disabled={!newPaletteName.trim()}
              className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Set Palet</span>
            </button>
          </form>

          <button
            type="button"
            onClick={handleSaveCurrentColors}
            disabled={isSavingPalette}
            className="w-full md:w-auto px-6 py-2.5 rounded-full bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Save className="w-3.5 h-3.5 text-primary" />
            <span>Simpan Warna Aktif</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Profile Form (No outline) */}
        <div className="p-6 rounded-3xl bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Store className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-black text-base text-foreground">Profil Toko</h3>
              <p className="text-xs text-muted-foreground">Informasi tercetak pada struk</p>
            </div>
          </div>

          {storeSavedMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{storeSavedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Nama Toko / Usaha
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama toko"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Alamat Toko
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Alamat toko"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={telp}
                onChange={(e) => setTelp(e.target.value)}
                placeholder="Nomor kontak"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Nomor Rekening Bank (Transfer)
              </label>
              <input
                type="text"
                value={rekening}
                onChange={(e) => setRekening(e.target.value)}
                placeholder="Contoh: BCA 1234567890 a.n. Toko"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Catatan Kaki Struk (Footer)
              </label>
              <input
                type="text"
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="Pesan penutup struk"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingStore}
              className="w-full py-3.5 rounded-full bg-primary text-white font-black text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingStore ? "Menyimpan..." : "Simpan Profil Toko"}</span>
            </button>
          </form>
        </div>

        {/* Cashier Accounts Management */}
        <div className="p-6 rounded-3xl bg-card shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-black text-base text-foreground">Multi-Kasir &amp; PIN</h3>
              <p className="text-xs text-muted-foreground">Admin akses penuh; Kasir hanya penjualan</p>
            </div>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {cashiers.map((c) => {
              const isCurrent = c.id === currentCashier.id;
              const isAdmin = c.peran === "admin";

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {c.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        {c.nama}{" "}
                        {isCurrent && (
                          <span className="text-[10px] text-primary font-semibold">
                            (Sedang Masuk)
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                        {isAdmin ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {c.peran} · PIN: {c.pin}
                      </span>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCashier(c.id, c.nama)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddCashier} className="pt-2 space-y-3">
            <span className="text-xs font-bold text-foreground block">Tambah Kasir Baru</span>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama kasir"
                required
                value={newCashierName}
                onChange={(e) => setNewCashierName(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <input
                type="password"
                maxLength={6}
                placeholder="PIN (4-6 angka)"
                required
                value={newCashierPin}
                onChange={(e) => setNewCashierPin(e.target.value.replace(/\D/g, ""))}
                className="px-3.5 py-2 text-xs rounded-xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={newCashierRole}
                onChange={(e) => setNewCashierRole(e.target.value as any)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-semibold"
              >
                <option value="kasir">Kasir (Transaksi)</option>
                <option value="admin">Admin (Akses Penuh)</option>
              </select>

              <button
                type="submit"
                disabled={isAddingCashier}
                className="px-5 py-2 rounded-full bg-primary text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Data Management & Backup Tools (No outline) */}
      <div className="p-6 rounded-3xl bg-card shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-black text-base text-foreground">
              Manajemen Data, CSV &amp; Backup
            </h3>
            <p className="text-xs text-muted-foreground">
              Cadangkan data ke JSON atau gunakan CSV spreadsheet
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-muted/30 flex flex-col justify-between">
            <div>
              <span className="font-bold text-sm text-foreground block">Backup Seluruh Data</span>
              <p className="text-xs text-muted-foreground mt-1">
                Unduh file JSON cadangan berisi semua produk, kasir, dan transaksi.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="mt-4 w-full py-2.5 rounded-full bg-card font-bold text-xs hover:bg-muted text-foreground flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Unduh Backup JSON</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 flex flex-col justify-between">
            <div>
              <span className="font-bold text-sm text-foreground block">Pulihkan Backup</span>
              <p className="text-xs text-muted-foreground mt-1">
                Pulihkan seluruh database dari file cadangan JSON.
              </p>
            </div>
            <label className="mt-4 w-full py-2.5 rounded-full bg-card font-bold text-xs hover:bg-muted text-foreground flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-center">
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Pilih File Backup</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 flex flex-col justify-between">
            <div>
              <span className="font-bold text-sm text-foreground block">Katalog Produk (CSV)</span>
              <p className="text-xs text-muted-foreground mt-1">
                Ekspor atau impor produk massal via file spreadsheet CSV.
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleExportProductCSV}
                className="flex-1 py-2 rounded-full bg-card font-bold text-xs hover:bg-muted text-foreground shadow-xs"
              >
                Ekspor
              </button>
              <label className="flex-1 py-2 rounded-full bg-card font-bold text-xs hover:bg-muted text-foreground text-center cursor-pointer shadow-xs">
                <span>Impor</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportProductCSV}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 flex flex-col justify-between">
            <div>
              <span className="font-bold text-sm text-foreground block">Atur Ulang Database</span>
              <p className="text-xs text-muted-foreground mt-1">
                Muat ulang data sampel kafe atau reset kosong.
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleResetData("demo")}
                className="flex-1 py-2 rounded-full bg-card font-bold text-xs hover:bg-muted text-foreground shadow-xs"
              >
                Data Contoh
              </button>
              <button
                type="button"
                onClick={() => handleResetData("empty")}
                className="flex-1 py-2 rounded-full bg-red-500/10 font-bold text-xs text-red-500 hover:bg-red-500/20"
              >
                Reset Nol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
