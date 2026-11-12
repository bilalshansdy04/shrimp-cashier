"use client";

import React, { useRef, useState, useEffect } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const handleVideoEnd = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 450); // Durasi fade-out animasi halus
  };

  useEffect(() => {
    // Upayakan putar video saat komponen dipasang
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay terhalang oleh browser, lanjut ke aplikasi:", err);
        // Fallback jika browser memblokir video secara ketat
        setTimeout(handleVideoEnd, 2000);
      });
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background select-none transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Tombol Lewati / Skip Cepat */}
      <button
        type="button"
        onClick={handleVideoEnd}
        className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full bg-card/60 hover:bg-card border border-border/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs z-10"
      >
        Lewati
      </button>

      {/* Video Animasi Splash Screen */}
      <div className="relative w-full max-w-md sm:max-w-lg px-6 flex flex-col items-center">
        <video
          ref={videoRef}
          src="/splash.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          className="w-full h-auto max-h-[70vh] object-contain rounded-3xl shadow-2xl"
        />

        {/* Loading Indicator Halus di Bawah Video */}
        <div className="flex items-center gap-2 mt-6 text-xs font-bold text-muted-foreground">
          <img src="/logo.svg" alt="ShrimpCashier" className="w-4 h-4 object-contain animate-spin" />
          <span>Memuat sistem kasir...</span>
        </div>
      </div>
    </div>
  );
}
