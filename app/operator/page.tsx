"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";

interface SessionState {
  currentSegmentId: string;
  mode: "video" | "avatar";
  gesture: string;
  subtitles: string;
  isPlaying: boolean;
  activeVisual?: "none" | "map" | "kenya" | "unicef";
  updatedAt: number;
}

export default function OperatorConsole() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // References to our double-buffered video elements for live preview replication
  const preRecordedVideoRef = useRef<HTMLVideoElement>(null);
  const standbyVideoRef = useRef<HTMLVideoElement>(null);

  // Poll current session state from Next.js local API
  useEffect(() => {
    let active = true;

    async function pollState() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) throw new Error("Local session API failed");
        const data = await res.json();
        if (active) {
          setSession(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Local session watch failed:", error);
      }
    }

    pollState();
    const interval = setInterval(pollState, 400);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Sync state with local API via POST
  const updateSession = async (updates: Partial<SessionState>) => {
    setSyncing(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Local session API POST failed");
      const data = await res.json();
      setSession(data.state);
    } catch (err) {
      console.error("Error syncing operator state:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Video assets mappings to match /stage exactly
  const getVideoSrc = (segmentId: string) => {
    switch (segmentId) {
      case "walk_in":
        return "/media/rohey-walk-in.mp4";
      case "welcome":
        return "/media/rohey-hello.mp4";
      case "breaks_heart":
        return "/media/rohey-breaks-heart.mp4";
      case "redesign_question":
        return "/media/rohey-question.mp4";
      case "listening":
        return "/media/rohey-listening.mp4";
      case "pointing_left":
        return "/media/rohey-pointing-left.mp4";
      case "pointing_center":
        return "/media/rohey-looking-center.mp4";
      case "pointing_right":
        return "/media/rohey-pointing-right.mp4";
      case "interactive_feedback":
        return "/media/rohey-feedback.mp4";
      case "giga_story":
        return "/media/rohey-giga.mp4";
      case "gambia_mapping":
        return "/media/rohey-gambia.mp4";
      case "classroom_transformed":
        return "/media/connected-classroom.mp4";
      case "turning_point":
        return "/media/rohey-turning-point.mp4";
      case "final_commitment":
        return "/media/rohey-commitment.mp4";
      case "class_dismissed":
        return "/media/rohey-closing.mp4";
      default:
        return "/media/rohey-listening.mp4";
    }
  };

  const getStandbySrc = (gesture: string) => {
    switch (gesture) {
      case "left":
        return "/media/rohey-pointing-left.mp4";
      case "right":
        return "/media/rohey-pointing-right.mp4";
      case "center":
        return "/media/rohey-looking-center.mp4";
      default:
        return "/media/rohey-listening.mp4";
    }
  };

  // Sync operator's unadorned preview video buffers with active session state (muted for convenience)
  useEffect(() => {
    if (!session) return;

    const mainVid = preRecordedVideoRef.current;
    const standbyVid = standbyVideoRef.current;

    if (session.mode === "video") {
      if (standbyVid) {
        standbyVid.pause();
      }

      if (mainVid) {
        const targetSrc = getVideoSrc(session.currentSegmentId);
        if (!mainVid.src.endsWith(targetSrc)) {
          mainVid.src = targetSrc;
          mainVid.load();
        }
        mainVid.muted = true;
        if (session.isPlaying) {
          mainVid.play().catch(() => {});
        } else {
          mainVid.pause();
        }
      }
    } else {
      if (mainVid) {
        mainVid.pause();
      }

      if (standbyVid) {
        const targetStandbySrc = getStandbySrc(session.gesture);
        if (!standbyVid.src.endsWith(targetStandbySrc)) {
          standbyVid.src = targetStandbySrc;
          standbyVid.load();
        }
        standbyVid.muted = true;
        if (session.isPlaying) {
          standbyVid.play().catch(() => {});
        } else {
          standbyVid.pause();
        }
      }
    }
  }, [session]);

  // Helper triggers
  const triggerSegment = (segmentId: string, subtitles: string) => {
    updateSession({
      currentSegmentId: segmentId,
      mode: "video",
      subtitles: subtitles,
      isPlaying: true,
      activeVisual: "none"
    });
  };

  const triggerStandby = () => {
    updateSession({
      currentSegmentId: "listening",
      mode: "avatar",
      gesture: "none",
      subtitles: "(Rohey stands silently, nodding and listening attentively...)",
      isPlaying: true,
      activeVisual: "none"
    });
  };

  const triggerGesture = (gesture: string) => {
    let sub = "(Listening and nodding attentively...)";
    if (gesture === "left") sub = "*Points left toward tables 1 & 2*";
    else if (gesture === "right") sub = "*Points right toward tables 3 & 4*";
    else if (gesture === "center") sub = "*Looks and gestures center class*";

    updateSession({
      currentSegmentId: "listening",
      mode: "avatar",
      gesture: gesture,
      subtitles: sub,
      isPlaying: true
    });
  };

  // Phase layout transitions
  const handleStepTransition = (stepNum: number) => {
    setActiveStep(stepNum);
    if (stepNum === 1) {
      triggerSegment("walk_in", "Good evening, class. Right, everyone, settle down please...");
    } else if (stepNum === 2) {
      triggerStandby();
    } else if (stepNum === 3) {
      triggerStandby();
    } else if (stepNum === 4) {
      triggerSegment("redesign_question", "So tonight, I am not going to lecture you...");
    } else if (stepNum === 5) {
      triggerStandby();
    } else if (stepNum === 6) {
      triggerSegment("class_dismissed", "Thank you all, and class is officially dismissed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-[#1f2023] font-sans">
        <span className="text-[10px] font-mono text-[#888888] tracking-widest animate-pulse">CONNECTING CONTROL CONSOLE...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row w-screen overflow-hidden selection:bg-neutral-100 selection:text-neutral-900 font-sans">
      
      {/* ── LEFT / TOP HALF: PURE UNADORNED VIDEO STREAM VIEW ── */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-screen bg-black flex items-center justify-center border-b md:border-b-0 md:border-r border-[#eaeaea] relative overflow-hidden">
        {/* Double-buffered video engine replica (always playing muted) */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            ref={preRecordedVideoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              session?.mode === "video" ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            playsInline
            loop
            muted
          />
          <video
            ref={standbyVideoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              session?.mode === "avatar" ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            playsInline
            loop
            muted
          />
        </div>
      </div>

      {/* ── RIGHT / BOTTOM HALF: MINIMALIST CONTROLS PANEL ── */}
      <div className="w-full md:w-1/2 h-[55vh] md:h-screen overflow-y-auto flex flex-col justify-between bg-white p-6 md:p-12">
        
        {/* Simple Header */}
        <header className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#111111] transition-colors font-mono uppercase tracking-wider">
            <ArrowLeft size={13} /> Exit
          </Link>
          <span className="text-[9px] font-mono text-[#888888] tracking-widest uppercase">
            {syncing ? "syncing..." : "synced"}
          </span>
        </header>

        {/* Dynamic Controls Content (Space everywhere to breathe) */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-6">
          
          {/* Subtle Stepping Indicator to Jump States */}
          <div className="flex items-center justify-between border-b border-[#eaeaea] pb-6 mb-10 w-full">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => handleStepTransition(num)}
                className={`w-7 h-7 rounded-full text-[11px] font-mono border flex items-center justify-center transition-all cursor-pointer ${
                  activeStep === num
                    ? "bg-[#111111] text-white border-[#111111] font-semibold"
                    : "bg-white text-[#888888] border-[#eaeaea] hover:text-[#111111] hover:border-[#999999]"
                }`}
                title={`Jump to Phase ${num}`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Core Controls Section (Maximum 3 Main Buttons) */}
          <div className="space-y-6">
            
            {activeStep === 1 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-2">Phase 1: Welcome & Intro</span>
                <button
                  onClick={() => triggerSegment("walk_in", "Good evening, class. Right, everyone, settle down please... Sshh, settle down.")}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>1. Trigger Walk In</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
                <button
                  onClick={() => triggerSegment("welcome", "Good evening, my lovely class! Oh, look at this! Welcome, welcome, everyone.")}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>2. Trigger Welcome Address</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-2">Phase 2: Observation standby</span>
                <button
                  onClick={() => triggerStandby()}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>Trigger Standby Loop</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
                <button
                  onClick={() => handleStepTransition(3)}
                  className="w-full py-4 px-6 rounded-lg bg-[#111111] text-white hover:bg-[#222222] text-xs font-medium transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>Continue to Pointing</span>
                  <ChevronRight size={13} className="text-white/60" />
                </button>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-2">Phase 3: Pointing gestures</span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => triggerGesture("left")}
                    className="py-4 px-4 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-center"
                  >
                    Point Left
                  </button>
                  <button
                    onClick={() => triggerGesture("center")}
                    className="py-4 px-4 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-center"
                  >
                    Point Center
                  </button>
                  <button
                    onClick={() => triggerGesture("right")}
                    className="py-4 px-4 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-center"
                  >
                    Point Right
                  </button>
                </div>
                <button
                  onClick={() => handleStepTransition(4)}
                  className="w-full py-4 px-6 rounded-lg bg-[#111111] text-white hover:bg-[#222222] text-xs font-medium transition-all cursor-pointer text-left flex justify-between items-center mt-2"
                >
                  <span>Continue to Question</span>
                  <ChevronRight size={13} className="text-white/60" />
                </button>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-2">Phase 4: Asking questions</span>
                <button
                  onClick={() => triggerSegment("redesign_question", "So tonight, I am not going to lecture you. If every child in The Gambia had internet access at school, how would you re-design education?")}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>1. Ask Redesign Question</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
                <button
                  onClick={() => triggerSegment("final_commitment", "What concrete, actionable thing can you and your organization do right now to help connect every single school, health facility, and technical training center in The Gambia?")}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>2. Ask Commitment Question</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
              </div>
            )}

            {activeStep === 5 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-2">Phase 5: Observation standby</span>
                <button
                  onClick={() => triggerStandby()}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>Trigger Standby Loop</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
                <button
                  onClick={() => handleStepTransition(6)}
                  className="w-full py-4 px-6 rounded-lg bg-[#111111] text-white hover:bg-[#222222] text-xs font-medium transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>Continue to Dismissal</span>
                  <ChevronRight size={13} className="text-white/60" />
                </button>
              </div>
            )}

            {activeStep === 6 && (
              <div className="space-y-4">
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider mb-2">Phase 6: Dismissal</span>
                <button
                  onClick={() => triggerSegment("class_dismissed", "Thank you all, and class is officially dismissed.")}
                  className="w-full py-4 px-6 rounded-lg bg-white border border-[#eaeaea] hover:border-[#111111] text-xs font-medium text-[#111111] transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span>Trigger Class Dismissal</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
                <button
                  onClick={() => handleStepTransition(1)}
                  className="w-full py-4 px-6 rounded-lg bg-[#fafafa] border border-[#eaeaea] hover:border-[#111111] text-[#666666] hover:text-[#111111] text-xs font-medium transition-all cursor-pointer text-left flex justify-between items-center"
                >
                  <span className="flex items-center gap-1.5"><RotateCcw size={13} /> Reset Lesson Session</span>
                  <ChevronRight size={13} className="text-[#888888]" />
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Minimal Footer */}
        <footer className="text-center">
          <p className="text-[8px] text-[#888888] font-mono uppercase tracking-[0.15em]">
            supported by kids edutainment labs & unicef gambia © 2026
          </p>
        </footer>

      </div>

    </div>
  );
}
