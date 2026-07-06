"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX, Maximize, Sparkles, Tv, Smartphone } from "lucide-react";
import StageEngine from "../StageEngine";
import { STEPS, Step, buildStepDirective, StepDirective } from "../show-timeline";
import { createStageSession, subscribeToSession, updateSessionState } from "../db-helpers";

// Generates a clean 6-digit session pin
function generateSessionPin(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing characters like I, O, 0, 1
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function StageProjection() {
  const [session, setSession] = useState<StepDirective | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [pin, setPin] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [authorized, setAuthorized] = useState(false);
  const hasInitializedSession = useRef(false);

  // Route security check with localhost/offline bypass
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || 
                      window.location.hostname === "127.0.0.1" || 
                      window.location.hostname.startsWith("192.168.");
      const isUnlocked = localStorage.getItem("vftp_unlocked") === "true";
      
      if (!isLocal && !isUnlocked) {
        window.location.href = "/";
      } else {
        setAuthorized(true);
        if (isLocal) {
          setUnlocked(true); // Auto-unlock audio overlay on localhost
        }
      }
    }
  }, []);

  // Load custom timeline dynamically on mount
  useEffect(() => {
    async function loadTimeline() {
      try {
        const res = await fetch("/api/show-timeline");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSteps(data);
          }
        }
      } catch (err) {
        console.error("Failed to load timeline:", err);
      }
    }
    loadTimeline();
    
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Initialize and register Stage Session on RTDB
  useEffect(() => {
    if (!unlocked || hasInitializedSession.current) return;
    hasInitializedSession.current = true;

    const isLocal = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1" || 
       window.location.hostname.startsWith("192.168."));

    const newPin = isLocal ? "LOCAL" : generateSessionPin();
    setPin(newPin);

    async function registerSession() {
      try {
        await createStageSession(newPin);
        console.log(`[Stage] Registered PIN session: ${newPin}`);
      } catch (err) {
        console.error("Failed to create Stage session on Firestore/RTDB:", err);
      }
    }
    registerSession();
  }, [unlocked]);

  // Subscribe LIVE to Realtime Database session state
  useEffect(() => {
    if (!pin) return;

    const unsubscribe = subscribeToSession(pin, (rtdbState) => {
      if (rtdbState) {
        setSession(rtdbState);
      }
    });

    return () => unsubscribe();
  }, [pin]);

  // Sync state back to RTDB on self-healing ends
  const post = useCallback(async (partial: Partial<StepDirective>) => {
    if (!pin) return;
    try {
      await updateSessionState(pin, partial);
    } catch (err) {
      console.error("Failed to push state to Realtime Database:", err);
    }
  }, [pin]);

  // Self-healing state transition: when content ends, auto-advance flow on Stage Screen.
  // Instantly pushes the next Step directive to Realtime Database.
  const handleStageContentEnded = useCallback(
    (token: number) => {
      if (!session || session.token !== token) return;
      const cur = steps[session.stepIndex];
      if (session.mode === "segment" && cur?.autoAdvance && session.stepIndex + 1 < steps.length) {
        post(buildStepDirective(steps, session.stepIndex + 1, session.token + 1));
      } else if (session.mode !== "freeze") {
        post({ mode: "idle", mainClip: null, overlayClip: null });
      }
    },
    [post, session, steps]
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const handleUnlock = () => {
    // Unlocks browser video elements
    const videos = document.querySelectorAll("video");
    videos.forEach((v) => {
      try {
        const p = v.play();
        if (p !== undefined) {
          p.then(() => {
            try { v.pause(); } catch {}
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Pre-play unlock error:", err);
      }
    });
    setUnlocked(true);
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center font-sans text-ink-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-ink-mute">
            Verifying Access...
          </span>
        </div>
      </div>
    );
  }

  const operatorUrl = `${origin}/operator?pin=${pin}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(operatorUrl)}`;

  return (
    <div className="min-h-screen bg-[#faf9f7] text-white relative flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* INITIALIZE AUDIO SYSTEM Gated Modal */}
      {!unlocked && (
        <div className="fixed inset-0 bg-base-warm flex flex-col items-center justify-center text-center p-6 z-[100] text-ink-deep">
          <div className="max-w-md p-10 rounded-2xl bg-white border border-rule flex flex-col items-center shadow-xl">
            <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-rule flex items-center justify-center mb-8 text-ink-soft">
              <Tv className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink-deep mb-3">
              UNICEF Dinner Projection
            </h2>
            <p className="text-xs text-ink-soft leading-relaxed mb-8 max-w-xs font-normal">
              Unlock local browser audio and register this screen's projection session with the DaveLabs network.
            </p>
            <button
              onClick={handleUnlock}
              className="w-full py-4 px-6 rounded-lg bg-ink-deep hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              INITIALIZE STAGE SYSTEM
            </button>
          </div>
        </div>
      )}

      {/* PAIRING AND STANDBY SCREEN (Shown before Operator launches show) */}
      {unlocked && pin && (!session || !session.started) && (
        <div className="fixed inset-0 bg-base-warm flex flex-col items-center justify-center text-ink-deep z-40 p-6">
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <img
              src="/media/davelabslogo.png"
              alt="DaveLabs"
              width={28}
              height={28}
              className="object-contain"
            />
            <div className="leading-tight">
              <span className="block text-[12px] font-bold text-ink-deep">DaveLabs</span>
              <span className="block text-[8px] font-mono tracking-[0.2em] text-ink-mute uppercase font-bold">Virtual Teacher</span>
            </div>
          </div>

          <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-white border border-rule flex flex-col items-center shadow-md space-y-8 text-center">
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-ink-mute uppercase tracking-widest bg-neutral-50 border border-rule px-2 py-0.5 rounded">
                Stage stand-by
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-ink-deep">Connect Operator Console</h2>
              <p className="text-xs text-ink-soft max-w-xs mx-auto leading-relaxed font-normal">
                To connect and drive Rohey on this projection screen, input the passcode below on your control device, or scan the QR code to auto-connect instantly.
              </p>
            </div>

            {/* Session PIN Box */}
            <div className="py-4 px-8 bg-neutral-50 border-2 border-dashed border-rule rounded-xl">
              <span className="block text-[10px] font-mono text-ink-mute uppercase tracking-widest mb-1 font-bold">Connection Passcode</span>
              <span className="text-4xl font-mono font-black tracking-wider text-ink-deep">{pin}</span>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-white border border-rule rounded-xl shadow-xs">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for operator connect: ${operatorUrl}`}
                  className="w-[160px] h-[160px] object-contain"
                />
              </div>
              <span className="text-[10px] font-mono text-ink-mute flex items-center gap-1.5 font-bold">
                <Smartphone size={12} /> SCAN TO PAIR AND OPERATE
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Utility Overlay Controls (visible on hover) */}
      {unlocked && session && session.started && (
        <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-4 py-1.5 rounded-full border border-white/[0.06] backdrop-blur-md uppercase tracking-wider font-bold">
            STAGE SESSION: {pin} // LIVE
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-full bg-black/60 border border-white/[0.06] backdrop-blur-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-full bg-black/60 border border-white/[0.06] backdrop-blur-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <Maximize size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Layered video engine connected LIVE to RTDB state */}
      <div className="absolute inset-0 z-0 bg-black">
        {unlocked && session && session.started && (
          <StageEngine
            session={session}
            active={unlocked}
            muted={isMuted}
            onContentEnded={handleStageContentEnded}
          />
        )}
      </div>
    </div>
  );
}
