"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Monitor, Sliders, ArrowRight, Database, Trash2 } from "lucide-react";
import PasswordGate from "./PasswordGate";
import VideoCacheDownloader from "./VideoCacheDownloader";
import { checkCacheStatus, clearVideoCache } from "./video-cache";

export default function HomeLauncher() {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [cached, setCached] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const isLocal = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1" || 
       window.location.hostname.startsWith("192.168."));

    if (isLocal) {
      setUnlocked(true);
      setCached(true);
      setChecking(false);
      return;
    }

    // Check local storage for existing unlock state
    const isUnlocked = localStorage.getItem("vftp_unlocked") === "true";
    setUnlocked(isUnlocked);

    // Check caching status
    async function checkCache() {
      const isCached = await checkCacheStatus();
      setCached(isCached);
      setChecking(false);
    }
    checkCache();
  }, []);

  const handleUnlock = () => {
    setUnlocked(true);
  };

  const handleCacheComplete = () => {
    setCached(true);
  };

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to delete all locally cached video assets? This will require a 400MB re-download on next start.")) {
      await clearVideoCache();
      setCached(false);
      alert("Cache cleared successfully.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center font-sans text-ink-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-ink-mute">
            Loading Platform...
          </span>
        </div>
      </div>
    );
  }

  // 1. Password Protection Gate
  if (!unlocked) {
    return <PasswordGate onUnlock={handleUnlock} />;
  }

  // 2. Local Video Caching Gate
  if (!cached) {
    return <VideoCacheDownloader onComplete={handleCacheComplete} />;
  }

  // 3. Fully Authenticated & Cached Selection Dashboard
  return (
    <div className="min-h-screen bg-[#faf9f7] text-ink-deep flex flex-col justify-between selection:bg-[#111111] selection:text-white font-sans">
      
      {/* Top Header bar with Thin Borders */}
      <header className="w-full flex justify-between items-center py-6 px-8 md:px-16 border-b border-rule bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <img
            src="/media/davelabslogo.png"
            alt="DaveLabs"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="leading-tight">
            <span className="block text-[14px] font-bold tracking-tight text-ink-deep">
              Virtual Teacher
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" /> Caching Active
          </span>
          <button
            onClick={handleClearCache}
            className="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-ink-mute hover:text-red-500 border border-rule cursor-pointer transition-all"
            title="Clear Cached Videos"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area - Generous Breathing Space */}
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-8 max-w-5xl mx-auto w-full">
        
        {/* Simple Minimal Title */}
        <div className="text-center mb-16 max-w-2xl">
          <span className="inline-block text-[10px] font-semibold text-ink-mute tracking-[0.2em] uppercase mb-4 font-mono">
            UNICEF Fundraising Launch
          </span>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-ink-deep mb-6 font-sans">
            AI Teacher Rohey
          </h1>
          <p className="text-ink-soft text-xs md:text-sm leading-relaxed max-w-md mx-auto font-normal font-sans">
            A premium, real-time presentation system. Coordinates highly polished, low-latency pre-downloaded animated scenes with a tactile operator console.
          </p>
        </div>

        {/* Choice Grid with Ultra-Thin, Precise Borders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl items-stretch">
          
          {/* Card 1: Stage Screen View */}
          <Link 
            href="/stage"
            className="group flex flex-col justify-between p-8 rounded-xl bg-white border border-rule hover:border-ink transition-all duration-300 relative shadow-2xs hover:shadow-lg"
          >
            <div>
              <div className="w-10 h-12 flex items-center mb-6 text-ink-soft">
                <Monitor className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-ink-deep mb-3 font-sans">Stage Screen</h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans font-normal">
                The full-screen presentation view for the main dining hall projector. Generates a low-latency RTDB sync session and displays a pairing code/QR code.
              </p>
            </div>

            <div className="border-t border-rule pt-5 mt-10 flex items-center justify-between text-[9px] font-mono text-ink-mute group-hover:text-ink-deep transition-all">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                LAUNCH VIEW <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span>1080P READY</span>
            </div>
          </Link>

          {/* Card 2: Operator Panel */}
          <Link 
            href="/operator"
            className="group flex flex-col justify-between p-8 rounded-xl bg-white border border-rule hover:border-ink transition-all duration-300 relative shadow-2xs hover:shadow-lg"
          >
            <div>
              <div className="w-10 h-12 flex items-center mb-6 text-ink-soft">
                <Sliders className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-ink-deep mb-3 font-sans">Operator Panel</h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans font-normal">
                A highly tactile, responsive control console. Connects directly to the Stage's RTDB PIN session to deliver instant, lag-free clip triggers and pauses.
              </p>
            </div>

            <div className="border-t border-rule pt-5 mt-10 flex items-center justify-between text-[9px] font-mono text-ink-mute group-hover:text-ink-deep transition-all">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                ENTER CONSOLE <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span>TACTILE ENGINE</span>
            </div>
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-rule py-10 px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-[10px] text-ink-mute font-mono tracking-[0.15em] uppercase">
            DaveLabs · vtp.davelabs.co © 2026
          </p>
          <p className="text-[9px] text-ink-soft">
            Supported by Kids Edutainment Labs & UNICEF The Gambia
          </p>
        </div>
        
        {/* Partner Logos */}
        <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-rule pt-6 md:pt-0 md:pl-8">
          <span className="font-sans text-[11px] font-bold text-ink-soft">
            Kids Edutainment Labs
          </span>
          <img
            src="https://thepoint.gm/assets/Featured-Articles/UNICEF.png"
            alt="UNICEF"
            className="h-8 object-contain opacity-90"
          />
        </div>
      </footer>

    </div>
  );
}
