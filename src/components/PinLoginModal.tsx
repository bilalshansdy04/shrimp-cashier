"use client";

import React, { useState, useEffect } from "react";
import { Cashier, StoreSettings } from "@/types";
import { playBeep, playErrorBuzz } from "@/lib/audio";
import { Delete, Sparkles } from "lucide-react";

interface PinLoginModalProps {
  cashiers: Cashier[];
  settings: StoreSettings;
  onSuccess: (cashier: Cashier) => void;
}

export function PinLoginModal({ cashiers, settings, onSuccess }: PinLoginModalProps) {
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(cashiers[0] || null);
  const [pin, setPin] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!selectedCashier && cashiers.length > 0) {
      setSelectedCashier(cashiers[0]);
    }
  }, [cashiers, selectedCashier]);

  const handleKeyClick = (digit: string) => {
    if (pin.length < 4) {
      playBeep();
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      playBeep();
      setPin(pin.slice(0, -1));
      setIsError(false);
      setErrorMsg("");
    }
  };

  const verifyPin = (inputPin: string) => {
    if (!selectedCashier) return;

    if (selectedCashier.pin === inputPin) {
      onSuccess(selectedCashier);
    } else {
      playErrorBuzz();
      setIsError(true);
      setErrorMsg("PIN salah, silakan coba lagi.");
      setTimeout(() => {
        setPin("");
        setIsError(false);
      }, 450);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyClick(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, selectedCashier]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-card shadow-2xl p-6 sm:p-8 animate-pop-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner">
            <span className="text-2xl">🦐</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {settings.nama || "ShrimpCashier"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Pilih kasir dan ketik PIN 4 angka
          </p>
        </div>

        {/* Cashier selection cards without outline */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {cashiers.map((c) => {
            const isSelected = selectedCashier?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCashier(c);
                  setPin("");
                  setIsError(false);
                  setErrorMsg("");
                  playBeep();
                }}
                className={`flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-102 font-bold"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.nama.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate">{c.nama}</p>
                  <span
                    className={`text-[10px] uppercase font-semibold ${
                      isSelected ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    {c.peran}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* PIN Indicators */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className={`flex items-center gap-3 py-1 ${isError ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  pin.length > idx
                    ? isError
                      ? "bg-red-500 scale-125"
                      : "bg-primary scale-125"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          {errorMsg ? (
            <p className="text-xs font-semibold text-red-500 mt-2">{errorMsg}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-2">
              PIN Bawaan: Admin <span className="font-mono font-bold text-foreground">1234</span> · Sari <span className="font-mono font-bold text-foreground">1111</span>
            </p>
          )}
        </div>

        {/* Numpad (No borders, soft elevated pills) */}
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key, i) => {
            if (key === "") {
              return <div key={i} />;
            }
            if (key === "del") {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={handleDelete}
                  aria-label="Hapus digit"
                  className="h-13 rounded-2xl flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground active:scale-95 transition-transform cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleKeyClick(key)}
                className="h-13 rounded-2xl flex items-center justify-center font-bold text-lg bg-muted/40 hover:bg-primary/10 hover:text-primary active:scale-95 text-foreground transition-all cursor-pointer"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
