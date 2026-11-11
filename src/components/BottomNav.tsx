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

        {/* Lock / switch cashier button */}
        <div className="w-[1px] h-6 bg-muted mx-1 shrink-0" />
        <button
          type="button"
          onClick={() => {
            playBeep();
            onLock();
          }}
          title={`Kasir: ${currentCashier.nama} (Klik untuk ganti)`}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-2.5 rounded-2xl text-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 font-black"
        >
          <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
          <span className="text-[11px] sm:text-xs font-extrabold max-w-[70px] truncate">
            {currentCashier.nama}
          </span>
        </button>
      </nav>
    </div>
  );
}
