"use client";

import React, { useState, useEffect } from "react";
import { CartItem, StoreSettings } from "@/types";
import { formatRupiah } from "@/lib/format";
import { playBeep, playErrorBuzz } from "@/lib/audio";
import {
  Banknote,
  QrCode,
  Building,
  CheckCircle2,
  X,
  Delete,
  Copy,
  Check,
} from "lucide-react";

interface PaymentModalProps {
  cart: CartItem[];
  subtotal: number;
  diskon: number;
  total: number;
  settings: StoreSettings;
  cashierName: string;
  onClose: () => void;
  onSubmit: (data: {
    metode: "tunai" | "qris" | "transfer";
    bayar: number;
  }) => Promise<void>;
}

export function PaymentModal({
  cart,
  subtotal,
  diskon,
  total,
  settings,
  cashierName,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const [metode, setMetode] = useState<"tunai" | "qris" | "transfer">("tunai");
  const [cashInput, setCashInput] = useState<string>(String(total));
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorShake, setErrorShake] = useState<boolean>(false);

  const cashReceived = parseFloat(cashInput) || 0;
  const changeAmount = cashReceived - total;
  const isCashShort = cashReceived < total;

  const quickCashOptions = React.useMemo(() => {
    const list = [
      total,
      Math.ceil(total / 5000) * 5000,
      Math.ceil(total / 10000) * 10000,
      Math.ceil(total / 50000) * 50000,
      100000,
    ];
    return Array.from(new Set(list.filter((val) => val >= total))).slice(0, 4);
  }, [total]);

  const handleNumpad = (val: string) => {
    playBeep();
    if (val === "clear") {
      setCashInput("0");
    } else if (val === "del") {
      setCashInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    } else if (val === "000") {
      if (cashInput !== "0" && cashInput.length < 9) {
        setCashInput((prev) => prev + "000");
      }
    } else {
      setCashInput((prev) => (prev === "0" ? val : prev.length < 10 ? prev + val : prev));
    }
  };

  const handleCopyAccount = () => {
    if (settings.rekening) {
      navigator.clipboard.writeText(settings.rekening);
      setIsCopied(true);
      playBeep();
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleComplete = async () => {
    if (metode === "tunai" && isCashShort) {
      playErrorBuzz();
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 450);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        metode,
        bayar: metode === "tunai" ? cashReceived : total,
      });
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !isSubmitting) {
        handleComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [metode, cashReceived, total, isSubmitting]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-pop-in my-auto">
        {/* Left Column: Bill Summary and Method Selection */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Kasir: {cashierName}
                </span>
                <h3 className="text-xl font-black text-foreground">Pembayaran</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display (Soft tone, no outline) */}
            <div className="p-4 rounded-2xl bg-primary/10 mb-5">
              <span className="text-xs font-bold text-primary block mb-0.5">
                Total Tagihan
              </span>
              <div className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                {formatRupiah(total)}
              </div>
              {diskon > 0 && (
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  Diskon: {formatRupiah(diskon)}
                </span>
              )}
            </div>

            {/* Method Tabs (Soft pills, no outlines) */}
            <div className="space-y-2 mb-5">
              <span className="text-xs font-bold text-muted-foreground block">
                Metode Pembayaran
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "tunai", label: "Tunai", icon: Banknote },
                  { id: "qris", label: "QRIS", icon: QrCode },
                  { id: "transfer", label: "Transfer", icon: Building },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = metode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMetode(item.id as any);
                        playBeep();
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white shadow-md shadow-primary/20 font-bold scale-102"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QRIS View */}
            {metode === "qris" && (
              <div className="flex flex-col items-center p-4 rounded-2xl bg-muted/30 text-center animate-pop-in">
                <div className="p-3 bg-white rounded-2xl shadow-sm mb-2">
                  <div className="w-36 h-36 flex items-center justify-center bg-slate-50 rounded-xl">
                    <QrCode className="w-28 h-28 text-slate-800" />
                  </div>
                </div>
                <p className="text-xs font-bold text-foreground">Scan QRIS Toko</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Minta pelanggan memindai kode QRIS di atas.
                </p>
              </div>
            )}

            {/* Transfer Bank View */}
            {metode === "transfer" && (
              <div className="p-4 rounded-2xl bg-muted/30 space-y-3 animate-pop-in">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Rekening Bank</span>
                  <p className="font-extrabold text-sm text-foreground mt-0.5">
                    {settings.rekening || "Belum diatur (Menu Pengaturan)"}
                  </p>
                </div>

                {settings.rekening && (
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-card shadow-xs text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Tersalin ke Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-primary" />
                        <span>Salin Rekening</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Cash Kembalian Indicator */}
            {metode === "tunai" && (
              <div
                className={`p-3.5 rounded-2xl transition-all ${
                  errorShake ? "animate-shake" : ""
                } ${
                  isCashShort
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">
                    {isCashShort ? "Uang Masih Kurang" : "Kembalian Pelanggan"}
                  </span>
                  <span className="font-black text-lg tabular-nums">
                    {formatRupiah(Math.abs(changeAmount))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop action buttons */}
          <div className="hidden md:flex items-center gap-2.5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-muted/60 font-bold text-xs text-muted-foreground hover:bg-muted"
            >
              Batal (Esc)
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleComplete}
              className="flex-2 py-3 rounded-full bg-primary text-white font-black text-sm hover:bg-orange-600 active:scale-98 shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan (Enter)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Numpad for Tunai (No outlines) */}
        {metode === "tunai" && (
          <div className="w-full md:w-72 p-6 sm:p-8 bg-muted/20 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Uang Diterima
                </span>
                <div className="flex items-center bg-card rounded-2xl px-4 py-2.5 shadow-sm">
                  <span className="font-bold text-muted-foreground mr-1">Rp</span>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="w-full font-black text-xl text-foreground bg-transparent focus:outline-none tabular-nums text-right"
                  />
                </div>
              </div>

              {/* Quick Cash Chips */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickCashOptions.map((amount, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playBeep();
                      setCashInput(String(amount));
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all tabular-nums cursor-pointer ${
                      cashReceived === amount
                        ? "bg-primary text-white shadow-xs"
                        : "bg-card text-foreground hover:bg-muted shadow-2xs"
                    }`}
                  >
                    {amount === total ? "Uang Pas" : formatRupiah(amount)}
                  </button>
                ))}
              </div>

              {/* Virtual Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "del"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleNumpad(k)}
                    className="h-12 rounded-xl bg-card font-bold text-base text-foreground hover:bg-primary/10 hover:text-primary active:scale-95 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                  >
                    {k === "del" ? <Delete className="w-4 h-4 text-muted-foreground" /> : k}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile bottom actions */}
            <div className="md:hidden flex gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-muted/60 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleComplete}
                className="flex-2 py-3 rounded-full bg-primary text-white font-black text-sm"
              >
                {isSubmitting ? "Memproses..." : "Selesaikan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
