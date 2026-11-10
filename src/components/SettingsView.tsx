"use client";

import React, { useState } from "react";
import { StoreSettings, Cashier } from "@/types";
import { downloadFile, formatDateKey, parseCSV, escapeCSVCell } from "@/lib/format";
import { playBeep } from "@/lib/audio";
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
          Profil toko, akun kasir PIN, dan pencadangan database
        </p>
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
              className="w-full py-3.5 rounded-full bg-primary text-white font-black text-sm hover:bg-orange-600 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
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
                className="px-5 py-2 rounded-full bg-primary text-white font-bold text-xs hover:bg-orange-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
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
