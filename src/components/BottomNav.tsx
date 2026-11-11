"use client";

import React, { useState } from "react";
import { Cashier } from "@/types";
import { playBeep } from "@/lib/audio";
import {
  ShoppingBag,
  Package,
  History,
  BarChart3,
  Settings,
  LogOut,
  AlertTriangle,
  X,
} from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentCashier: Cashier;
  cartCount: number;
  onLock: () => void;
}

export function BottomNav({
  activeTab,
  onTabChange,
  currentCashier,
  cartCount,
  onLock,
}: BottomNavProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const isAdmin = currentCashier.role !== "clrkcsr" && currentCashier.peran !== "kasir";

  const tabs = [
    { id: "kasir", label: "Kasir", icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: "produk", label: "Produk", icon: Package, adminOnly: true },
    { id: "riwayat", label: "Riwayat", icon: History },
    { id: "laporan", label: "Laporan", icon: BarChart3 },
    { id: "atur", label: "Atur", icon: Settings, adminOnly: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl shadow-[0_-6px_25px_rgba(0,0,0,0.08)] py-2 px-3 sm:px-6">
      <nav className="max-w-2xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {tabs.map((tab) => {
          if (tab.adminOnly && !isAdmin) return null;
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playBeep();
                onTabChange(tab.id);
              }}
              style={isActive ? { backgroundColor: "var(--primary)" } : undefined}
              className={`flex-1 relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? "text-white shadow-lg shadow-black/10 scale-102 font-black"
                  : "text-foreground hover:text-primary hover:bg-muted/70 font-black"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.4]" />
                {tab.badge !== undefined && (
                  <span
                    style={
                      isActive
                        ? { color: "var(--primary)" }
                        : { backgroundColor: "var(--primary)" }
                    }
                    className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs ${
                      isActive ? "bg-white" : "text-white"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight font-extrabold">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Logout Button with interactive confirmation */}
        <div className="w-[1px] h-6 bg-muted mx-1 shrink-0" />
        <button
          type="button"
          onClick={() => {
            playBeep();
            setIsConfirmOpen(true);
          }}
          title={`Logout (${currentCashier.nama})`}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-3 rounded-2xl text-red-500/90 hover:text-red-600 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer shrink-0 font-black"
        >
          <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
          <span className="text-[11px] sm:text-xs font-black tracking-tight">
            Logout
          </span>
        </button>
      </nav>

      {/* Interactive Logout Validation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-pop-in">
          <div className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl animate-pop-in space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto shadow-xs">
              <LogOut className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-lg text-foreground">
                Konfirmasi Logout
              </h3>
              <p className="text-xs text-muted-foreground">
                Apakah Anda yakin ingin keluar dari sesi akun ini?
              </p>
            </div>

            {/* Account Info Badge */}
            <div className="p-3 rounded-2xl bg-muted/40 flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="font-extrabold text-foreground block truncate max-w-[170px]">
                  {currentCashier.nama}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  @{currentCashier.username || "user"}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase">
                {currentCashier.role === "spradmcsr"
                  ? "Super Admin"
                  : currentCashier.role === "admmngrcsr"
                  ? "Admin Toko"
                  : "Kasir"}
              </span>
            </div>

            {/* Warning if cart has items */}
            {cartCount > 0 && (
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Perhatian: Masih ada {cartCount} item di keranjang yang belum selesai dibayar.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playBeep();
                  setIsConfirmOpen(false);
                }}
                className="flex-1 py-3 rounded-full bg-muted/60 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  playBeep();
                  setIsConfirmOpen(false);
                  onLock();
                }}
                className="flex-1 py-3 rounded-full bg-red-500 text-white text-xs font-black hover:bg-red-600 active:scale-98 shadow-md shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
