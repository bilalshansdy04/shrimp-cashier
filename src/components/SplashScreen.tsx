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
    }, 450); // Transisi fade-out lembut
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay dicegah browser, melanjutkan:", err);
        setTimeout(handleVideoEnd, 3000);
      });
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white select-none transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Tombol Lewati Minimalis */}
      <button
        type="button"
        onClick={handleVideoEnd}
        className="absolute top-6 right-6 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 transition-all cursor-pointer shadow-xs z-10"
      >
        Lewati
      </button>

      {/* Video Animasi Penuh Tanpa Wadah / Kartu */}
      <div className="w-full max-w-2xl px-4 flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          src="/splash.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          className="w-full h-auto max-h-[80vh] object-contain"
        />

        {/* Status Loading Tipis */}
        <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-gray-400">
          <img src="/logo.svg" alt="ShrimpCashier" className="w-4 h-4 object-contain animate-spin" />
          <span>Menyiapkan sistem kasir...</span>
        </div>
      </div>
    </div>
  );
}
