"use client";

import React, { useState, useEffect } from "react";
import { Cashier, StoreSettings } from "@/types";
import { isSoundEnabled, setSoundEnabled, playBeep } from "@/lib/audio";
import {
  ShoppingBag,
  Package,
  History,
  BarChart3,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ShieldCheck,
  User,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentCashier: Cashier;
  settings: StoreSettings;
  onLogout: () => void;
  cartCount: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  currentCashier,
  settings,
  onLogout,
  cartCount,
}: SidebarProps) {
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const darkTheme = document.documentElement.getAttribute("data-theme") === "dark";
    setIsDark(darkTheme);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playBeep();
  };

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("shrimpcashier_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("shrimpcashier_theme", "light");
    }
    playBeep();
  };

  const isAdmin = currentCashier.peran === "admin";

  const navItems = [
    { id: "kasir", label: "Kasir", icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: "produk", label: "Produk", icon: Package, adminOnly: true },
    { id: "riwayat", label: "Riwayat", icon: History },
    { id: "laporan", label: "Laporan", icon: BarChart3 },
    { id: "atur", label: "Pengaturan", icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar Rail */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-card border-r border-border shrink-0 select-none transition-all">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 p-4 lg:p-5 border-b border-border">
          <img src="/logo.svg" alt="ShrimpCashier Logo" className="w-9 h-9 object-contain shrink-0" />
          <div className="hidden lg:block min-w-0">
            <h1 className="font-extrabold text-base tracking-tight truncate text-foreground">
              {settings.nama || "ShrimpCashier"}
            </h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              POS Aktif
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-2.5 lg:px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playBeep();
                  onTabChange(item.id);
                }}
                className={`w-full flex items-center justify-center lg:justify-start gap-3.5 px-3 py-3 rounded-2xl font-medium text-sm transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline-block truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-auto hidden lg:inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold ${
                      isActive ? "bg-white text-primary" : "bg-primary text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Mobile badge indicator */}
                {item.badge !== undefined && (
                  <span className="lg:hidden absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-card" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom controls: theme, audio, user status, logout */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Audio & Dark Mode mini buttons */}
          <div className="flex items-center justify-center lg:justify-between px-2 gap-2">
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? "Matikan Suara" : "Nyalakan Suara"}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDark ? "Mode Terang" : "Mode Gelap"}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User profile card */}
          <div className="p-2.5 rounded-2xl bg-muted/50 border border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {currentCashier.nama.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="font-semibold text-xs truncate text-foreground">
                  {currentCashier.nama}
                </p>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                  {isAdmin ? <ShieldCheck className="w-3 h-3 text-emerald-500" /> : <User className="w-3 h-3" />}
                  {currentCashier.peran}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playBeep();
                onLogout();
              }}
              title="Kunci / Ganti Kasir"
              className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 py-2 shadow-lg">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playBeep();
                onTabChange(item.id);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            playBeep();
            onLogout();
          }}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Kunci</span>
        </button>
      </nav>
    </>
  );
}
