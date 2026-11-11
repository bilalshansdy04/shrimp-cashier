"use client";

import React, { useState, useEffect } from "react";
import { SalesReport } from "@/types";
import { formatRupiah, formatDateKey } from "@/lib/format";
import { playBeep } from "@/lib/audio";
import {
  TrendingUp,
  Receipt,
  Package,
  Calculator,
  Calendar,
  Banknote,
  QrCode,
  Building,
  Trophy,
} from "lucide-react";

export function ReportsView() {
  const [mode, setMode] = useState<"hari" | "bulan">("hari");
  const [date, setDate] = useState<string>(formatDateKey(new Date()));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/reports?mode=${mode}&date=${date}`);
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      }
    } catch (e) {
      console.error("Error loading report:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [mode, date]);

  const maxChartValue = React.useMemo(() => {
    if (!report?.chart || report.chart.length === 0) return 1;
    return Math.max(...report.chart.map((c) => c.value), 1);
  }, [report]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 lg:p-8 pb-40 sm:pb-44 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Laporan &amp; Analitik
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analisis penjualan, performa jam sibuk, dan produk terlaris
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Pill Toggle (No outline) */}
          <div className="flex bg-card p-1 rounded-full shadow-xs">
            <button
              type="button"
              onClick={() => {
                setMode("hari");
                playBeep();
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                mode === "hari"
                  ? "bg-primary text-white shadow-xs"
                  : "text-foreground/75 hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Harian (Per Jam)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("bulan");
                playBeep();
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                mode === "bulan"
                  ? "bg-primary text-white shadow-xs"
                  : "text-foreground/75 hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Bulanan (Per Tanggal)
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-xs text-xs">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent focus:outline-none text-foreground font-bold"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards (Clean surfaces, NO outlines) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-primary/10 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-primary">Omzet Penjualan</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-foreground tabular-nums">
            {formatRupiah(report?.omzet || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Penerimaan bersih</p>
        </div>

        <div className="p-5 rounded-3xl bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">Total Transaksi</span>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-foreground tabular-nums">
            {report?.trx || 0}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Struk berhasil</p>
        </div>

        <div className="p-5 rounded-3xl bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">Item Terjual</span>
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-foreground tabular-nums">
            {report?.item || 0}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Porsi / barang</p>
        </div>

        <div className="p-5 rounded-3xl bg-card shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">Rata-rata / Struk</span>
            <Calculator className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-foreground tabular-nums">
            {formatRupiah(report?.rata || 0)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Per transaksi</p>
        </div>
      </div>

      {/* Chart Section (No outlines) */}
      <div className="p-6 rounded-3xl bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-foreground">
              {mode === "hari" ? "Penjualan Per Jam (07:00 - 22:00)" : "Penjualan Per Tanggal"}
            </h3>
            <p className="text-xs text-muted-foreground">Grafik aktivitas transaksi</p>
          </div>
          <span className="text-xs font-bold text-primary font-mono">
            Puncak: {formatRupiah(maxChartValue)}
          </span>
        </div>

        <div className="h-56 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-2 overflow-x-auto">
          {report?.chart.map((c, i) => {
            const heightPct = maxChartValue > 0 ? (c.value / maxChartValue) * 100 : 0;
            const isPeak = c.value === maxChartValue && c.value > 0;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full min-w-[20px] group relative"
              >
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-full pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {c.label}: {formatRupiah(c.value)}
                </div>

                <div
                  style={{ height: `${Math.max(5, heightPct)}%` }}
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    c.value === 0
                      ? "bg-muted/40"
                      : isPeak
                      ? "bg-gradient-to-t from-primary to-amber-500 shadow-md shadow-primary/30"
                      : "bg-primary/75 hover:bg-primary"
                  }`}
                />

                <span className="text-[10px] text-muted-foreground mt-2 block truncate">
                  {mode === "bulan" && i % 3 !== 0 && i !== report.chart.length - 1 ? "" : c.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Top Selling and Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="p-6 rounded-3xl bg-card shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-black text-base text-foreground">Produk Terlaris</h4>
              <p className="text-xs text-muted-foreground">Paling banyak dipesan</p>
            </div>
          </div>

          <div className="space-y-2">
            {!report?.top || report.top.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Belum ada data penjualan pada periode ini.
              </p>
            ) : (
              report.top.map((p, idx) => {
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold">
                        {idx < 3 ? medals[idx] : `#${idx + 1}`}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-foreground block">{p.nama}</span>
                        <span className="text-[11px] text-muted-foreground">
                          Omzet: {formatRupiah(p.nilai)}
                        </span>
                      </div>
                    </div>

                    <span className="font-black text-sm text-primary tabular-nums">
                      {p.qty}x
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6 rounded-3xl bg-card shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-5 h-5 text-primary" />
            <div>
              <h4 className="font-black text-base text-foreground">Metode Pembayaran</h4>
              <p className="text-xs text-muted-foreground">Distribusi nilai omzet per channel</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "tunai",
                name: "Tunai",
                value: report?.metode.tunai || 0,
                icon: Banknote,
                color: "text-emerald-600 bg-emerald-500/10",
              },
              {
                id: "qris",
                name: "QRIS",
                value: report?.metode.qris || 0,
                icon: QrCode,
                color: "text-primary bg-primary/10",
              },
              {
                id: "transfer",
                name: "Transfer Bank",
                value: report?.metode.transfer || 0,
                icon: Building,
                color: "text-blue-600 bg-blue-500/10",
              },
            ].map((m) => {
              const Icon = m.icon;
              const pct =
                report && report.omzet > 0
                  ? Math.round((m.value / report.omzet) * 100)
                  : 0;

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-muted/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground">{pct}% omzet</span>
                    </div>
                  </div>

                  <span className="font-black text-base text-foreground tabular-nums">
                    {formatRupiah(m.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer Fisik Bawah agar konten tidak tertutup Bottom Nav */}
      <div className="h-32 w-full shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
