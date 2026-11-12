"use client";

import React, { useState } from "react";
import { AppUser, StoreSettings } from "@/types";
import { playBeep, playCashChime, playErrorBuzz } from "@/lib/audio";
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, KeyRound, CheckCircle2, X } from "lucide-react";

interface LoginModalProps {
  settings: StoreSettings;
  onLoginSuccess: (user: AppUser) => void;
}

export function LoginModal({ settings, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorShake, setErrorShake] = useState<boolean>(false);

  // Emergency Recovery Modal State
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [recoveryKey, setRecoveryKey] = useState<string>("");
  const [recoveryUsername, setRecoveryUsername] = useState<string>("spradmcsr");
  const [recoveryPassword, setRecoveryPassword] = useState<string>("");
  const [recoveryLoading, setRecoveryLoading] = useState<boolean>(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string>("");
  const [recoveryErrorMsg, setRecoveryErrorMsg] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Username dan password wajib diisi");
      playErrorBuzz();
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 450);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Username atau password salah");
      }

      playCashChime();
      onLoginSuccess(json.data.user);
    } catch (err: any) {
      playErrorBuzz();
      setErrorShake(true);
      setErrorMessage(err.message || "Gagal masuk");
      setTimeout(() => setErrorShake(false), 450);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryKey.trim() || !recoveryPassword) {
      setRecoveryErrorMsg("Kunci pemulihan dan password baru wajib diisi");
      playErrorBuzz();
      return;
    }

    try {
      setRecoveryLoading(true);
      setRecoveryErrorMsg("");
      setRecoverySuccessMsg("");

      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recovery_key: recoveryKey.trim(),
          new_username: recoveryUsername.trim(),
          new_password: recoveryPassword,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Kunci pemulihan tidak valid");
      }

      playBeep();
      setRecoverySuccessMsg(json.message);
      setUsername(recoveryUsername.trim());
      setPassword(recoveryPassword);

      setTimeout(() => {
        setIsRecoveryOpen(false);
        setRecoverySuccessMsg("");
      }, 2000);
    } catch (err: any) {
      playErrorBuzz();
      setRecoveryErrorMsg(err.message || "Gagal memulihkan akun");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4 select-none">
      <div
        className={`w-full max-w-md bg-card rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-200 ${
          errorShake ? "animate-shake" : "animate-pop-in"
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/logo.svg" alt="ShrimpCashier Logo" className="w-16 h-16 object-contain mb-3.5" />
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {settings.nama || "ShrimpCashier"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Masuk dengan akun Super Admin, Admin, atau Kasir
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth: spradmcsr atau kasir_pagi"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password akun"
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold text-foreground placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: "var(--primary)" }}
            className="w-full py-3.5 rounded-full text-white font-black text-sm hover:opacity-90 active:scale-98 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isLoading ? "Memeriksa Kredensial..." : "Masuk ke Sistem Kasir"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer & Emergency Recovery Link */}
        <div className="mt-6 pt-4 border-t border-muted/50 flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={() => {
              playBeep();
              setIsRecoveryOpen(true);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Lupa Password Super Admin? (Pemulihan Darurat)</span>
          </button>
          <span className="text-[10px] text-muted-foreground/70">
            Akses server terminal: <code>npm run admin:reset</code>
          </span>
        </div>
      </div>

      {/* Emergency Recovery Modal */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-3xl p-6 sm:p-8 shadow-2xl animate-pop-in space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">Pemulihan Darurat Super Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Masukkan <strong>Emergency Master Recovery Key</strong> yang dicetak saat inisialisasi database awal.
            </p>

            {recoverySuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{recoverySuccessMsg}</span>
              </div>
            )}

            {recoveryErrorMsg && (
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{recoveryErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRecoverySubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Kunci Pemulihan Darurat (24 Karakter)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SHRIMP-AB12-CD34-EF56"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 font-mono text-xs font-bold text-foreground uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Username Super Admin Baru (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="spradmcsr"
                  value={recoveryUsername}
                  onChange={(e) => setRecoveryUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Password Baru Super Admin
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={recoveryPassword}
                  onChange={(e) => setRecoveryPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-muted/60 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  style={{ backgroundColor: "var(--primary)" }}
                  className="flex-2 py-2.5 rounded-full text-white text-xs font-black hover:opacity-90"
                >
                  {recoveryLoading ? "Memulihkan..." : "Pulihkan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
