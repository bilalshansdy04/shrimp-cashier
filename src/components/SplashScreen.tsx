"use client";

import React, { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleVideoEnd = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 450); // Transisi fade-out lembut
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Coba putar langsung dengan suara
    video.muted = false;
    video
      .play()
      .then(() => {
        setIsMuted(false);
      })
      .catch((err) => {
        // Jika browser memblokir autoplay bersuara, beralih otomatis ke muted autoplay
        console.warn("Autoplay bersuara dicegah kebijakan browser, beralih ke muted:", err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch((playErr) => {
          console.warn("Autoplay muted dicegah:", playErr);
          setTimeout(handleVideoEnd, 3000);
        });
      });
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const next = !videoRef.current.muted;
      videoRef.current.muted = next;
      setIsMuted(next);
      if (!next && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleContainerClick = () => {
    // Jika masih muted karena blokir autoplay browser, klik layar otomatis membunyikan
    if (videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white select-none transition-opacity duration-500 cursor-pointer ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Tombol Kontrol di Pojok Kanan Atas */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? "Nyalakan Suara Video" : "Matikan Suara"}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
            isMuted
              ? "bg-amber-100 hover:bg-amber-200 text-amber-800 animate-pulse"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 shrink-0" />
              <span>Bunyikan</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>Suara Aktif</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleVideoEnd();
          }}
          className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 transition-all cursor-pointer shadow-xs"
        >
          Lewati
        </button>
      </div>

      {/* Video Animasi Penuh Tanpa Wadah / Kartu */}
      <div className="w-full max-w-2xl px-4 flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          src="/splash.mp4"
          autoPlay
          playsInline
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          className="w-full h-auto max-h-[80vh] object-contain mix-blend-multiply outline-none border-none pointer-events-none"
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
