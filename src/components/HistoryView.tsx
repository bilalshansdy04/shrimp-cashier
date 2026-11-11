"use client";

import React, { useState, useEffect } from "react";
import { Transaction, Cashier } from "@/types";
import { formatRupiah, formatDateTime, downloadFile, escapeCSVCell } from "@/lib/format";
import { playBeep } from "@/lib/audio";
import {
  History,
  Calendar,
  Search,
  Printer,
  RotateCcw,
  Download,
} from "lucide-react";

interface HistoryViewProps {
  currentCashier: Cashier;
  onPrintTransaction: (trx: Transaction) => void;
}

export function HistoryView({
  currentCashier,
  onPrintTransaction,
}: HistoryViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const url = filterDate
        ? `/api/transactions?tanggal=${filterDate}`
        : `/api/transactions?limit=150`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
      }
    } catch (e) {
      console.error("Error loading transactions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterDate]);

  const handleCancelTransaction = async (trx: Transaction) => {
    if (
      !confirm(
        `Batalkan transaksi ${trx.id}? Stok barang dari transaksi ini akan dikembalikan ke persediaan.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions?id=${trx.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      playBeep();
      fetchTransactions();
    } catch (e: any) {
      alert(e.message || "Gagal membatalkan transaksi");
    }
  };

  const handleExportCSV = () => {
    playBeep();
    const rows = [
      [
        "id_transaksi",
        "waktu",
        "kasir",
        "produk",
        "varian",
        "qty",
        "harga",
        "subtotal_item",
        "diskon_transaksi",
        "total_transaksi",
        "metode_bayar",
        "status",
      ],
    ];

    transactions.forEach((t) => {
      t.items.forEach((item) => {
        rows.push([
          t.id,
          t.waktu,
          t.kasir_nama,
          item.nama,
          item.varian,
          String(item.qty),
          String(item.harga),
          String(item.qty * item.harga),
          String(t.diskon),
          String(t.total),
          t.metode,
          t.status,
        ]);
      });
    });

    const csvContent =
      "\uFEFF" + rows.map((r) => r.map(escapeCSVCell).join(",")).join("\n");
    const filename = `transaksi-${filterDate || "semua"}.csv`;
    downloadFile(filename, csvContent, "text/csv;charset=utf-8;");
  };

  const filteredList = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchId = t.id.toLowerCase().includes(q);
    const matchKasir = t.kasir_nama.toLowerCase().includes(q);
    const matchItems = t.items.some((i) => i.nama.toLowerCase().includes(q));
    return !q || matchId || matchKasir || matchItems;
  });

  const isAdmin = currentCashier.peran === "admin";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 lg:p-8 pb-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar penjualan, cetak ulang struk thermal, dan pembatalan pesanan
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-full bg-card shadow-xs text-foreground hover:bg-muted font-bold text-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar (No outline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-xs text-xs">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent focus:outline-none text-foreground font-semibold"
            />
          </div>

          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate("")}
              className="text-xs text-primary hover:underline font-bold"
            >
              Tampilkan Semua
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari No. TRX / produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-card shadow-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      {/* Transaction Cards List (No outlines) */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-36 sm:pb-40">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
            Memuat riwayat transaksi...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-3xl shadow-xs">
            <History className="w-8 h-8 opacity-40 mx-auto mb-2" />
            <p className="font-bold text-sm text-foreground">Tidak ada transaksi ditemukan</p>
            <p className="text-xs mt-1">Coba ubah tanggal atau kata kunci pencarian.</p>
          </div>
        ) : (
          filteredList.map((trx) => {
            const isCancelled = trx.status === "dibatalkan";
            const itemCount = trx.items.reduce((sum, item) => sum + item.qty, 0);

            return (
              <div
                key={trx.id}
                className={`p-5 rounded-3xl transition-all ${
                  isCancelled
                    ? "bg-muted/30 opacity-60"
                    : "bg-card shadow-xs hover:shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-foreground">
                        {trx.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-500/10 text-red-500"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isCancelled ? "Dibatalkan" : "Selesai"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted/60 text-muted-foreground">
                        {trx.metode}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{formatDateTime(trx.waktu)}</span>
                      <span>·</span>
                      <span>Kasir: <b className="text-foreground">{trx.kasir_nama}</b></span>
                      <span>·</span>
                      <span>{itemCount} item</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {trx.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-muted/50 text-[11px] font-semibold text-foreground"
                        >
                          {it.nama} {it.varian !== "Reguler" ? `(${it.varian})` : ""} ×{it.qty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-muted-foreground block font-bold">Total</span>
                      <span className="font-black text-lg text-primary tabular-nums">
                        {formatRupiah(trx.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playBeep();
                          onPrintTransaction(trx);
                        }}
                        className="px-3.5 py-2 rounded-full bg-muted/60 text-foreground hover:bg-muted font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-primary" />
                        <span>Cetak</span>
                      </button>

                      {isAdmin && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleCancelTransaction(trx)}
                          className="px-3.5 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Batal</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
