"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Maximize, Sparkles } from "lucide-react";

interface SessionState {
  currentSegmentId: string;
  mode: "video" | "avatar";
  gesture: string;
  subtitles: string;
  isPlaying: boolean;
  activeVisual?: "none" | "map" | "kenya" | "unicef";
  updatedAt: number;
}

export default function StageProjection() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // References to our double-buffered video elements
  const preRecordedVideoRef = useRef<HTMLVideoElement>(null);
  const standbyVideoRef = useRef<HTMLVideoElement>(null);

  // Sync state via local high-frequency polling (every 300ms)
  useEffect(() => {
    let active = true;

    async function pollState() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) throw new Error("Local session API fetch failed");
        const data = await res.json();
        if (active) {
          setSession(data);
        }
      } catch (error) {
        console.error("Local session polling error:", error);
      }
    }

    pollState();
    const interval = setInterval(pollState, 300);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Monitor video mappings based on active segment
  const getVideoSrc = (segmentId: string) => {
    switch (segmentId) {
      case "welcome":
        return "/media/rohey-hello.mp4";
      case "giga":
        return "/media/rohey-giga.mp4";
      case "feedback":
        return "/media/connected-classroom.mp4";
      case "closing":
        return "/media/rohey-closing.mp4";
      default:
        return "/media/rohey-hello.mp4";
    }
  };

  // Sync HTML5 video play/pause/mute states based on real-time database state
  useEffect(() => {
    if (!unlocked || !session) return;

    const mainVid = preRecordedVideoRef.current;
    const standbyVid = standbyVideoRef.current;

    if (session.mode === "video") {
      // Pre-recorded active segment
      if (standbyVid) {
        standbyVid.pause();
      }

      if (mainVid) {
        // Swap src only if it actually changed
        const targetSrc = getVideoSrc(session.currentSegmentId);
        if (!mainVid.src.endsWith(targetSrc)) {
          mainVid.src = targetSrc;
          mainVid.load();
        }

        mainVid.muted = isMuted;
        if (session.isPlaying) {
          mainVid.play().catch((err) => console.log("Play blocked:", err));
        } else {
          mainVid.pause();
        }
      }
    } else {
      // Live Avatar Mode (Standby Listening loop active)
      if (mainVid) {
        mainVid.pause();
      }

      if (standbyVid) {
        standbyVid.muted = true; // Standby is always silent nodding
        if (session.isPlaying) {
          standbyVid.play().catch((err) => console.log("Play blocked:", err));
        } else {
          standbyVid.pause();
        }
      }
    }
  }, [session, unlocked, isMuted]);

  // Request fullscreen presentation
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error going fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Safe activation click to unlock HTML5 browser audio
  const handleUnlock = () => {
    setUnlocked(true);
    // Trigger quick audio buffer playback if possible
    const mainVid = preRecordedVideoRef.current;
    const standbyVid = standbyVideoRef.current;
    if (mainVid) mainVid.play().then(() => mainVid.pause()).catch(() => {});
    if (standbyVid) standbyVid.play().then(() => standbyVid.pause()).catch(() => {});
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6 text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0,transparent_65%)] pointer-events-none filter blur-3xl" />
        
        <div className="relative z-10 max-w-lg p-10 rounded-2xl bg-white border border-slate-100 backdrop-blur-xl flex flex-col items-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-8 text-indigo-500">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-3">UNICEF Dinner Projection</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-xs font-normal">
            Unlock high-fidelity vocal tracks and initialize sub-second live database streams for the main dining room projector screen.
          </p>

          <button
            onClick={handleUnlock}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/10 text-white text-sm font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            INITIALIZE STAGE SYSTEM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-hidden select-none">
      
      {/* ── TOP UTILITY CONTROL OVERLAY (fades in on hover) ── */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-50 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300">
        <span className="text-xs font-mono text-slate-400 bg-black/60 px-3.5 py-1.5 rounded-full border border-white/[0.06] backdrop-blur-md">
          PROJECTOR WINDOW // {session?.mode === "video" ? "PRE-RECORDED CHAPTER" : "LIVE INTERACTIVE FEED"}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-black/60 border border-white/[0.06] backdrop-blur-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-black/60 border border-white/[0.06] backdrop-blur-md hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>

      {/* ── DOUBLE-BUFFERED VIDEO RENDERING PIPELINE ── */}
      <div className="absolute inset-0 z-0">
        {/* Buffer A: Pre-Recorded Lecture Segment */}
        <video
          ref={preRecordedVideoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            session?.mode === "video" ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          playsInline
          loop
          muted={isMuted}
        />

        {/* Buffer B: Standby Node Nodding Loop */}
        <video
          ref={standbyVideoRef}
          src="/media/rohey-listening.mp4"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            session?.mode === "avatar" ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          playsInline
          loop
          muted // nodding is strictly silent
        />
      </div>

      {/* ── SIDE-SLIDE HIGH-RESOLUTION VISUAL OVERLAYS ── */}
      {session && session.activeVisual && session.activeVisual !== "none" && (
        <div className="absolute top-10 bottom-10 right-10 w-[42%] z-30 rounded-3xl overflow-hidden border border-white/[0.08] bg-black/65 backdrop-blur-xl shadow-2xl animate-fade-in-right flex flex-col items-center justify-center p-6">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {session.activeVisual === "map" && (
              <img
                src="/media/giga-gambia-map.png"
                alt="UNICEF Giga Map"
                className="w-full h-full object-contain animate-scale-up"
              />
            )}
            {session.activeVisual === "kenya" && (
              <img
                src="/media/darlene-coding.jpg"
                alt="Darlene coding in Kakuma"
                className="w-full h-full object-cover rounded-2xl animate-scale-up"
              />
            )}
            {session.activeVisual === "unicef" && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 p-8 text-center">
                <img
                  src="/rohey-avatar.jpg"
                  alt="UNICEF Gambia Logo"
                  className="w-40 h-40 object-cover rounded-full mb-8 border-2 border-white/10"
                />
                <h3 className="text-xl font-semibold mb-3">UNICEF The Gambia</h3>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
                  Access to affordable, sustainable, safe and resilient connectivity for every child.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GESTURE ACTION HUD BANNER ── */}
      {session && session.mode === "avatar" && session.gesture && session.gesture !== "none" && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-black/55 backdrop-blur-md border border-white/[0.08] rounded-full px-5 py-2 flex items-center gap-2.5 text-xs font-mono tracking-widest text-purple-300 uppercase animate-bounce shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          <span>ROHEY ACTION: POINTING {session.gesture}</span>
        </div>
      )}

      {/* ── CINEMATIC GLASS-BLACK SUBTITLES OVERLAY ── */}
      {session && session.subtitles && (
        <div className="w-full flex justify-center pb-12 px-12 z-40 relative mt-auto">
          <div className="max-w-4xl bg-black/75 backdrop-blur-md border border-white/[0.06] shadow-[0_24px_50px_rgba(0,0,0,0.85)] px-10 py-5 rounded-2xl text-center flex flex-col items-center gap-1.5">
            {session.mode === "avatar" && (
              <span className="text-[9px] font-mono text-purple-400 tracking-[0.2em] font-bold uppercase animate-pulse">
                LIVE INTERACTION FEED
              </span>
            )}
            <p className="text-2xl md:text-[28px] font-serif text-white leading-relaxed tracking-wide font-normal drop-shadow-md">
              &ldquo;{session.subtitles}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Embedded micro-animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0.8;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-up {
          animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }} />

    </div>
  );
}
