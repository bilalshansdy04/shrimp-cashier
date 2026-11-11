"use client";

import React, { useEffect } from "react";
import { Cashier } from "@/types";
import { playBeep } from "@/lib/audio";
import { LogOut, AlertTriangle, X } from "lucide-react";

interface LogoutConfirmModalProps {
  currentCashier: Cashier;
  cartCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({
  currentCashier,
  cartCount,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-pop-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playBeep();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-sm bg-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-border/40 space-y-4 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playBeep();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Danger Icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto shadow-xs">
          <LogOut className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="font-black text-xl text-foreground tracking-tight">
            Konfirmasi Logout
          </h3>
          <p className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin keluar dari sesi akun ini?
          </p>
        </div>

        {/* Account Info Pill */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-between text-xs text-left">
          <div className="min-w-0 pr-2">
            <span className="font-extrabold text-foreground block truncate">
              {currentCashier.nama}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground block truncate">
              @{currentCashier.username || "kasir"}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase tracking-wider shrink-0">
            {currentCashier.role === "spradmcsr"
              ? "Super Admin"
              : currentCashier.role === "admmngrcsr"
              ? "Admin Toko"
              : "Kasir"}
          </span>
        </div>

        {/* Warning if active cart exists */}
        {cartCount > 0 && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Perhatian: Masih ada {cartCount} item di keranjang yang belum selesai dibayar.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              playBeep();
              onClose();
            }}
            className="flex-1 py-3 rounded-full bg-muted/70 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              playBeep();
              onConfirm();
            }}
            className="flex-1 py-3 rounded-full bg-red-500 text-white text-xs font-black hover:bg-red-600 active:scale-98 shadow-md shadow-red-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Ya, Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
