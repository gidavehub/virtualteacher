"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Play, Pause, Hand, RotateCcw, Smartphone, Sliders } from "lucide-react";
import Link from "next/link";
import StageEngine, { Directive } from "../StageEngine";
import { STEPS, Step, buildStepDirective, getStepVideos } from "../show-timeline";
import { verifyStageSessionPin, subscribeToSession, updateSessionState } from "../db-helpers";

export default function OperatorConsole() {
  const [session, setSession] = useState<Directive | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ t: 0, d: 0, playing: false });
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [authorized, setAuthorized] = useState(false);
  
  // Handshake PIN States
  const [pin, setPin] = useState<string>("");
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState(false);

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
        console.error("Failed to load timeline from API:", err);
      }
    }
    loadTimeline();
  }, []);

  // Parse `?pin=...` query parameter from window URL on mount (QR Code scanning fallback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.hostname.startsWith("192.168.");
    
    if (isLocal) {
      setPin("LOCAL");
      setPinInput("LOCAL");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const queryPin = params.get("pin");
    if (queryPin) {
      const cleanPin = queryPin.trim().toUpperCase();
      setPin(cleanPin);
      setPinInput(cleanPin);
    } else {
      setLoading(false); // Enable manual PIN entry form
    }
  }, []);

  // SubscribeLIVE to Realtime Database using the pairing PIN
  useEffect(() => {
    if (!pin) return;
    setLoading(true);

    const unsubscribe = subscribeToSession(pin, (rtdbState) => {
      if (rtdbState) {
        setSession(rtdbState);
        setPinError(null);
      } else {
        setPinError("The Stage session has disconnected. Please check the PIN.");
        setPin(""); // Fallback to PIN entry
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pin]);

  // Synchronous State Push to Realtime Database
  const post = useCallback(async (partial: Partial<Directive>) => {
    if (!pin) return;
    try {
      await updateSessionState(pin, partial);
    } catch (err) {
      console.error("Failed to update Realtime Database session:", err);
    }
  }, [pin]);

  // Handle manual PIN submit
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.trim().toUpperCase();
    if (!cleanPin) {
      setPinError("Please enter a valid 6-character connection passcode.");
      return;
    }
    setVerifyingPin(true);
    setPinError(null);

    try {
      const isValid = await verifyStageSessionPin(cleanPin);
      if (isValid) {
        setPin(cleanPin);
        // Persist query in browser history without full reload
        const newUrl = `${window.location.pathname}?pin=${cleanPin}`;
        window.history.pushState({ path: newUrl }, "", newUrl);
      } else {
        setPinError("Passcode didn't match any active Stage. Please check the Stage screen and try again.");
      }
    } catch {
      setPinError("Network error. Please try again.");
    } finally {
      setVerifyingPin(false);
    }
  };

  // Build + send the directive for a given step index.
  const playStep = useCallback(
    (i: number) => {
      if (!steps[i]) return;
      post(buildStepDirective(steps, i, Date.now()));
    },
    [post, steps]
  );

  const stepIndex = session?.stepIndex ?? 0;
  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const startShow = () => playStep(0);
  const next = () => {
    if (!isLast) playStep(stepIndex + 1);
  };
  const prev = () => {
    if (stepIndex > 0) playStep(stepIndex - 1);
  };

  // Point at someone (question steps): overlay the point clip, then auto-idle.
  const pointOut = () => {
    if (step?.pointClip == null) return;
    post({
      mode: "segment",
      overlayClip: step.pointClip,
      mainClip: null,
      audioDelayMs: 0,
      token: Date.now(),
      caption: "(Pointing — you, go ahead and answer.)",
      paused: false,
    });
  };

  // Choose one of the three live responses.
  const chooseOption = (clip: number, caption: string) => {
    post({ mode: "segment", overlayClip: null, mainClip: clip, audioDelayMs: 0, token: Date.now(), caption, paused: false });
  };

  const togglePause = () => {
    if (!session) return;
    post({ paused: !session.paused });
  };

  // Content ended triggers next auto-advance sequences
  const handleContentEnded = useCallback(
    (token: number) => {
      if (!session || session.token !== token) return;
      const cur = steps[session.stepIndex];
      if (session.mode === "segment" && cur?.autoAdvance && session.stepIndex + 1 < steps.length) {
        post(buildStepDirective(steps, session.stepIndex + 1, session.token + 1));
      } else if (session.mode !== "freeze") {
        post({ mode: "idle", mainClip: null, overlayClip: null, paused: false });
      }
    },
    [post, session, steps]
  );

  const pct = progress.d > 0 ? Math.min(100, (progress.t / progress.d) * 100) : 0;
  const endingSoon = progress.playing && progress.d > 0 && pct > 78;

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

  // 1. Loading screen
  if (loading && pin) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center text-ink-deep font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-ink-mute tracking-widest uppercase font-bold">
            Connecting Realtime Console...
          </span>
        </div>
      </div>
    );
  }

  // 2. PIN Handshake Gate (Operator hasn't paired with Stage yet)
  if (!pin) {
    return (
      <main className="min-h-screen bg-base-warm text-ink-deep flex flex-col justify-between font-sans select-none">
        
        {/* Brand Header */}
        <header className="w-full flex justify-between items-center py-6 px-8 md:px-16 border-b border-rule bg-white">
          <div className="flex items-center gap-3">
            <img
              src="/media/davelabslogo.png"
              alt="DaveLabs"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="leading-tight">
              <span className="block text-[14px] font-bold text-ink-deep">DaveLabs</span>
              <span className="block text-[9px] font-mono tracking-[0.3em] text-ink-mute uppercase font-bold">Virtual Teacher</span>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink-deep transition-colors font-mono uppercase tracking-wider font-bold">
            <ArrowLeft size={13} /> Exit
          </Link>
        </header>

        {/* Pairing Box Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-white border border-rule flex flex-col items-center shadow-md space-y-6">
            
            <div className="w-12 h-12 flex items-center justify-center bg-[#faf9f7] border border-rule rounded-xl text-ink-soft mb-2">
              <Sliders size={20} className="stroke-[1.5]" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-ink-deep">Connect to Stage</h2>
              <p className="text-xs text-ink-soft leading-relaxed max-w-xs mx-auto font-normal">
                To operate and trigger video scenes on the Stage screen, enter the 6-character passcode displayed on the main projection monitor.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4 pt-4">
              <div className="space-y-1.5">
                <label htmlFor="pin" className="block text-[10px] font-mono text-ink-soft uppercase tracking-widest font-bold">
                  Connection Passcode
                </label>
                <input
                  id="pin"
                  type="text"
                  placeholder="E.G. A5X8B2"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                  disabled={verifyingPin}
                  className="w-full h-12 px-4 border-2 border-rule rounded-lg font-mono text-center text-lg font-black tracking-widest text-ink-deep outline-none focus:border-ink uppercase transition-all"
                />
              </div>

              {pinError && (
                <p className="text-xs text-red-500 font-mono font-medium leading-relaxed">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={verifyingPin || !pinInput.trim()}
                className="w-full py-3.5 px-6 rounded-lg bg-ink-deep hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
              >
                {verifyingPin ? "Connecting..." : "ESTABLISH RTDB LINK"}
              </button>
            </form>

            <div className="pt-4 border-t border-rule w-full text-center">
              <p className="text-[10px] text-ink-mute flex items-center justify-center gap-1 font-bold">
                <Smartphone size={12} /> SCANNING STAGE QR CODE WILL AUTO-CONNECT
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-rule bg-white py-6 text-center">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ink-mute">
            DaveLabs · vtp.davelabs.co © 2026
          </span>
        </footer>

      </main>
    );
  }

  const started = session?.started;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col md:flex-row w-screen overflow-hidden font-sans">
      
      {/* ── LEFT: Muted Stage Preview (Mirror) ── */}
      <div className="w-full md:w-1/2 h-[42vh] md:h-screen bg-black relative border-b md:border-b-0 md:border-r border-rule overflow-hidden">
        <StageEngine
          session={session}
          active={true}
          muted={true}
          onProgress={(t, d, playing) => setProgress({ t, d, playing })}
          onContentEnded={handleContentEnded}
        />
        
        {/* Caption + progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/80 to-transparent">
          {session?.caption && (
            <p className="text-white/90 text-xs font-medium leading-relaxed mb-3 line-clamp-2">
              &ldquo;{session.caption}&rdquo;
            </p>
          )}
          <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-150 ${endingSoon ? "bg-amber-400" : "bg-white/80"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 font-bold">
              PREVIEW MODE // {session?.mode}
            </span>
            {endingSoon && (
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 animate-pulse font-bold">
                clip ending — ready next
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Controls Panel ── */}
      <div className="w-full md:w-1/2 h-[58vh] md:h-screen overflow-y-auto flex flex-col justify-between bg-white p-6 md:p-12">
        <header className="flex justify-between items-center mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink-deep transition-colors font-mono uppercase tracking-wider font-bold">
            <ArrowLeft size={13} /> Exit
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              LINK: {pin}
            </span>
            <span className="text-[9px] font-mono text-ink-mute tracking-widest uppercase font-bold">
              {started ? getStepVideos(step) : "Not started"}
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-4">
          {!started ? (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-ink-deep">Rohey — Live Show</h2>
              <p className="text-xs text-ink-soft leading-relaxed max-w-xs mx-auto font-normal">
                Press start to begin the live presentation. Once started, the opening scenes flow automatically, pre-downloaded and loaded natively from local browser cache for flawless buffering-free sync.
              </p>
              <button
                onClick={startShow}
                className="w-full py-4 px-6 rounded-lg bg-ink-deep text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Play size={13} className="fill-current" /> Start Live Show
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current step details */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[10px] font-mono text-ink-mute uppercase tracking-wider mb-1 font-bold">
                    Now Playing — {getStepVideos(step)}
                  </span>
                  <h2 className="text-xl font-bold text-ink-deep tracking-tight">{step.label}</h2>
                </div>
              </div>

              {/* Real-time active scene progress bar */}
              {progress.d > 0 && progress.playing && (
                <div className="bg-neutral-50 border border-rule p-4 rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-ink-soft">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-ink-deep rounded-full animate-pulse" />
                      Scene Progress
                    </span>
                    <span className="font-bold text-ink-deep">
                      {Math.floor(progress.t / 60)}:{(Math.floor(progress.t) % 60).toString().padStart(2, "0")} / {Math.floor(progress.d / 60)}:{(Math.floor(progress.d) % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-150 ${endingSoon ? "bg-amber-500 animate-pulse" : "bg-ink-deep"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="uppercase tracking-widest text-ink-mute font-bold">
                      {pct > 99 ? "Clip Completed" : `Progress: ${Math.round(pct)}%`}
                    </span>
                    {endingSoon && (
                      <span className="text-[9px] font-medium text-amber-600 uppercase tracking-wide flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        Next Scene Ready
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Step-specific controls */}
              {step.kind === "question" && (
                <div className="space-y-3">
                  <div className="bg-neutral-50 border border-rule p-4 rounded-xl">
                    <span className="block text-[10px] font-mono text-ink-mute uppercase tracking-wider mb-1.5 font-bold">
                      💡 Operator Action Required
                    </span>
                    <p className="text-xs text-ink-soft leading-relaxed font-normal">
                      Rohey is in the silent listening loop. Once a guest raises their hand to answer, click the tactile pointing gesture button below:
                    </p>
                  </div>
                  <button
                    onClick={pointOut}
                    className="w-full py-4 px-6 rounded-lg bg-white border border-rule hover:border-ink text-xs font-bold text-ink-deep uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between shadow-2xs hover:shadow-xs"
                  >
                    <span className="flex items-center gap-2"><Hand size={16} /> Point Out a Guest</span>
                    <span className="text-[9px] font-mono text-ink-mute uppercase bg-neutral-50 px-2 py-0.5 rounded border border-rule font-bold">Tactile Gesture</span>
                  </button>
                </div>
              )}

              {step.kind === "options" && (
                <div className="space-y-4">
                  <div className="bg-neutral-50 border border-rule p-4 rounded-xl">
                    <span className="block text-[10px] font-mono text-ink-mute uppercase tracking-wider mb-1.5 font-bold">
                      💡 Choose the Best Match
                    </span>
                    <p className="text-xs text-ink-soft leading-relaxed font-normal">
                      Listen to the guest response, then click the corresponding button to trigger Rohey's tailored voice response:
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {step.options?.map((opt, k) => {
                      const colors = [
                        "hover:bg-[#f5f8fc] hover:border-blue-300 border-l-4 border-l-blue-400",
                        "hover:bg-[#fcfbf5] hover:border-amber-300 border-l-4 border-l-amber-400",
                        "hover:bg-[#f5fbf7] hover:border-emerald-300 border-l-4 border-l-emerald-400"
                      ];
                      return (
                        <button
                          key={opt.clip}
                          onClick={() => chooseOption(opt.clip, opt.caption)}
                          className={`w-full py-4 px-5 rounded-lg bg-white border border-rule text-left transition-all duration-300 shadow-2xs cursor-pointer group ${colors[k % colors.length]}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-ink-deep uppercase tracking-wider">
                              {String.fromCharCode(65 + k)}. {opt.label}
                            </span>
                            <span className="text-[9px] font-mono text-ink-mute uppercase bg-neutral-50 px-2 py-0.5 rounded border border-rule font-bold">
                              Trigger Clip {opt.clip}
                            </span>
                          </div>
                          <span className="block text-xs text-ink-soft mt-2 leading-relaxed font-normal normal-case">
                            {opt.guidance}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Controls layout */}
              <div className="flex gap-3">
                {/* Back Button */}
                <button
                  onClick={prev}
                  disabled={stepIndex === 0}
                  className={`py-4 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center border ${
                    stepIndex === 0
                      ? "bg-neutral-50 text-neutral-300 border-rule cursor-not-allowed"
                      : "bg-white text-ink-soft border-rule hover:bg-neutral-50 active:scale-[0.99] hover:border-ink shadow-2xs"
                  }`}
                  title="Previous Step"
                >
                  <ArrowLeft size={15} />
                </button>

                {/* Pause / Resume Button */}
                <button
                  onClick={togglePause}
                  className={`flex-1 py-4 px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                    session?.paused
                      ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 active:scale-[0.99]"
                      : "bg-white text-ink-soft border-rule hover:bg-neutral-50 active:scale-[0.99] hover:border-ink shadow-2xs"
                  }`}
                >
                  {session?.paused ? (
                    <>
                      <Play size={14} className="fill-current" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause size={14} className="fill-current" /> Pause
                    </>
                  )}
                </button>

                {/* Next Button */}
                <button
                  onClick={next}
                  disabled={isLast}
                  className={`py-4 px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between ${
                    isLast
                      ? "bg-[#f2f2f2] text-[#aaaaaa] cursor-not-allowed w-1/3"
                      : "bg-ink-deep text-white hover:bg-neutral-800 active:scale-[0.99] shadow-sm w-2/5 flex-1"
                  }`}
                >
                  <span>{isLast ? "End" : step.nextLabel ?? "Next"}</span>
                  {!isLast && <ChevronRight size={15} className="text-white/60" />}
                </button>
              </div>

              {/* Restart */}
              <button
                onClick={startShow}
                className="w-full py-2.5 px-6 rounded-lg bg-neutral-50 border border-rule hover:border-ink text-ink-soft hover:text-ink-deep text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={12} /> Restart from beginning
              </button>
            </div>
          )}
        </div>

        <footer className="text-center pt-4">
          <p className="text-[8px] text-ink-mute font-mono uppercase tracking-[0.15em] font-bold">
            supported by kids edutainment labs & unicef gambia © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
