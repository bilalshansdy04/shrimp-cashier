"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFinishedRef = useRef<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const handleVideoEnd = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 450); // Transisi fade-out lembut
  }, [onFinish]);

  // Handle tombol Spasi untuk skip splash screen tanpa menampilkan hint
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleVideoEnd();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleVideoEnd]);

  // Autoplay video dengan audio selalu aktif
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = false;
    video.muted = false;
    video.volume = 1.0;

    video
      .play()
      .catch((err) => {
        // Jika browser memblokir autoplay bersuara sebelum ada user gesture
        console.warn("Autoplay audio dicegah kebijakan browser, memutar sementara muted:", err);
        video.muted = true;
        video.play().catch((playErr) => {
          console.warn("Autoplay muted dicegah:", playErr);
          setTimeout(handleVideoEnd, 3000);
        });
      });

    // Otomatis bunyikan pada sentuhan/interaksi pertama apa pun
    const forceUnmute = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
    };

    window.addEventListener("pointerdown", forceUnmute, { capture: true, passive: true });
    window.addEventListener("touchstart", forceUnmute, { capture: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", forceUnmute, { capture: true });
      window.removeEventListener("touchstart", forceUnmute, { capture: true });
    };
  }, [handleVideoEnd]);

  // Klik di mana saja pada layar untuk mengaktifkan suara jika sempat di-mute browser
  const handleContainerClick = () => {
    if (videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white select-none transition-opacity duration-500 cursor-pointer ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
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
