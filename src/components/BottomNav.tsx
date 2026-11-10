"use client";

import React from "react";
import { Cashier } from "@/types";
import { playBeep } from "@/lib/audio";
import {
  ShoppingBag,
  Package,
  History,
  BarChart3,
  Settings,
  Lock,
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
  const isAdmin = currentCashier.peran === "admin";

  const tabs = [
    { id: "kasir", label: "Kasir", icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: "produk", label: "Produk", icon: Package, adminOnly: true },
    { id: "riwayat", label: "Riwayat", icon: History },
    { id: "laporan", label: "Laporan", icon: BarChart3 },
    { id: "atur", label: "Atur", icon: Settings, adminOnly: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1a1c22]/95 backdrop-blur-xl shadow-[0_-6px_25px_rgba(0,0,0,0.08)] py-2 px-3 sm:px-6">
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
              className={`flex-1 relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-102 font-extrabold"
                  : "text-slate-700 dark:text-slate-200 hover:text-orange-600 hover:bg-orange-50/70 dark:hover:bg-neutral-800 font-bold"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs ${
                      isActive ? "bg-white text-orange-600" : "bg-orange-500 text-white"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Lock / switch cashier button */}
        <div className="w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800 mx-1 shrink-0" />
        <button
          type="button"
          onClick={() => {
            playBeep();
            onLock();
          }}
          title={`Kasir: ${currentCashier.nama} (Klik untuk ganti)`}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
        >
          <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[11px] sm:text-xs font-bold max-w-[70px] truncate">
            {currentCashier.nama}
          </span>
        </button>
      </nav>
    </div>
  );
}
