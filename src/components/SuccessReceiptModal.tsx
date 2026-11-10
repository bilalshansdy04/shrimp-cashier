"use client";

import React, { useEffect } from "react";
import { Transaction } from "@/types";
import { formatRupiah } from "@/lib/format";
import confetti from "canvas-confetti";
import { CheckCircle2, Printer, PlusCircle } from "lucide-react";

interface SuccessReceiptModalProps {
  transaction: Transaction;
  onPrint: () => void;
  onNewTransaction: () => void;
}

export function SuccessReceiptModal({
  transaction,
  onPrint,
  onNewTransaction,
}: SuccessReceiptModalProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#ea580c", "#f97316", "#0284c7", "#10b981"],
      });
    } catch (e) {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl p-6 sm:p-8 text-center animate-pop-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 animate-bump" />
        </div>

        <h3 className="text-xl font-black text-foreground tracking-tight">
          Transaksi Berhasil!
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          {transaction.id}
        </p>

        {/* Amount summary (no outline, soft background well) */}
        <div className="p-4 rounded-2xl bg-muted/40 my-5 space-y-2 text-left">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Metode</span>
            <span className="font-bold uppercase text-foreground">{transaction.metode}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Total Tagihan</span>
            <span className="font-black text-sm text-foreground tabular-nums">
              {formatRupiah(transaction.total)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Uang Diterima</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatRupiah(transaction.bayar)}
            </span>
          </div>
          {transaction.metode === "tunai" && (
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                Kembalian
              </span>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatRupiah(transaction.kembali)}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons (rounded-full, no outline) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onPrint}
            className="w-full py-3.5 rounded-full bg-muted/60 font-bold text-xs text-foreground hover:bg-muted active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>Cetak Struk (58mm)</span>
          </button>

          <button
            type="button"
            onClick={onNewTransaction}
            className="w-full py-3.5 rounded-full bg-primary text-white font-black text-sm hover:bg-orange-600 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Transaksi Baru (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
