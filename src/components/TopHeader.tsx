"use client";

import React, { useState, useEffect } from "react";
import { Cashier, StoreSettings } from "@/types";
import { isSoundEnabled, setSoundEnabled, playBeep } from "@/lib/audio";
import { Volume2, VolumeX, Sun, Moon, ShieldCheck, User } from "lucide-react";

interface TopHeaderProps {
  settings: StoreSettings;
  currentCashier: Cashier;
  onLock: () => void;
}

export function TopHeader({ settings, currentCashier, onLock }: TopHeaderProps) {
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const darkTheme = document.documentElement.getAttribute("data-theme") === "dark";
    setIsDark(darkTheme);

    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
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

  return (
    <header className="px-4 lg:px-8 py-3.5 flex items-center justify-between shrink-0 bg-card/60 backdrop-blur-md">
      {/* Brand & Store Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-card border border-border/40 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
          <img src="/logo.svg" alt="ShrimpCashier Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight leading-none truncate max-w-[180px] sm:max-w-xs">
            {settings.nama || "ShrimpCashier"}
          </h1>
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Kasir Online · {timeStr}
          </span>
        </div>
      </div>

      {/* Right controls: Cashier pill, Audio, Theme */}
      <div className="flex items-center gap-2">
        {/* Cashier Badge */}
        <button
          type="button"
          onClick={onLock}
          title="Klik untuk ganti kasir / kunci layar"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">
            {currentCashier.nama.charAt(0).toUpperCase()}
          </div>
          <span className="truncate max-w-[100px]">{currentCashier.nama}</span>
          <span className="text-[10px] uppercase font-bold text-muted-foreground hidden sm:inline-block">
            {currentCashier.role === "spradmcsr"
              ? "Super Admin"
              : currentCashier.role === "admmngrcsr"
              ? "Admin"
              : "Kasir"}
          </span>
        </button>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={toggleSound}
          title={soundOn ? "Matikan Suara" : "Nyalakan Suara"}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDark ? "Mode Terang" : "Mode Gelap"}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
