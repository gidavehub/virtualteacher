"use client";

import React, { useEffect, useRef, useState } from "react";
import { CLIP, IDLE_CLIP } from "./show-timeline";
import { getClipUrl } from "./video-cache";

export interface Directive {
  started: boolean;
  mode: "idle" | "segment" | "freeze";
  stepIndex: number;
  mainClip: number | null;
  overlayClip: number | null;
  audioDelayMs: number;
  endAlign?: boolean; // delay the shorter of main/overlay so both clips end together
  caption: string;
  token: number;
  updatedAt?: number;
  paused?: boolean;
}

interface Props {
  session: Directive | null;
  active: boolean; // audio unlocked / preview running
  muted: boolean; // stage: user-controlled; operator: always true
  onProgress?: (currentTime: number, duration: number, playing: boolean) => void;
  onContentEnded?: (token: number) => void; // content finished → caller advances or idles (token = the directive that ended)
}

// The 3-layer video engine: idle loop (bottom) · main script w/ audio · silent
// action overlay (top). Overlays fade in over the script and fade out to reveal
// it; the walk-out "freeze" holds its last frame (empty room).
export default function StageEngine({
  session,
  active,
  muted,
  onProgress,
  onContentEnded,
}: Props) {
  const idleRef = useRef<HTMLVideoElement>(null);
  const mainRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLVideoElement>(null);

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);
  const [mapOverlayVisible, setMapOverlayVisible] = useState(false);

  const lastToken = useRef<number>(-1);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alignCleanup = useRef<(() => void)[]>([]);
  const prevPaused = useRef<boolean | undefined>(undefined);

  // React to a new directive.
  useEffect(() => {
    if (!active || !session) return;
    const changed = session.token !== lastToken.current;
    lastToken.current = session.token;

    const idle = idleRef.current;
    const main = mainRef.current;
    const overlay = overlayRef.current;

    // Cancel pending delayed starts / end-align listeners. Only on an actual
    // directive change (or drop to idle) — the session poll re-runs this
    // effect every few hundred ms and must NOT kill a pending audio-delay
    // timer mid-wait.
    const cancelScheduled = () => {
      if (audioTimer.current) {
        clearTimeout(audioTimer.current);
        audioTimer.current = null;
      }
      alignCleanup.current.forEach((fn) => fn());
      alignCleanup.current = [];
    };
    if (changed) {
      setMapOverlayVisible(false);
      cancelScheduled();
    }

    async function loadAssets() {
      // Idle loop keeps running underneath.
      if (idle) {
        const idleSrc = await getClipUrl(IDLE_CLIP);
        if (idle.src !== idleSrc) {
          idle.src = idleSrc;
          idle.load();
        }
        idle.muted = true;
        idle.play().catch(() => {});
      }

      // Wait on standby if show hasn't started, or in idle mode.
      if (!session || !session.started || session.mode === "idle") {
        cancelScheduled();
        setOverlayVisible(false);
        setMainVisible(false);
        main?.pause();
        overlay?.pause();
        return;
      }

      if (!changed) return;

      const endAlign =
        !!session.endAlign && session.mainClip != null && session.overlayClip != null;

      // Main (audio) clip.
      let startMain: (() => void) | null = null;
      if (main) {
        if (session.mainClip != null) {
          const src = await getClipUrl(session.mainClip);
          if (main.src !== src) {
            main.src = src;
            main.load();
          }
          main.currentTime = 0;
          main.muted = muted;
          main.volume = 1.0;
          startMain = () => {
            main.muted = muted;
            main.volume = 1.0;
            main.play().catch(() => {});

            // Cross-fade immediately if her speech starts under an overlay
            // (walk-in delay, simultaneous play, or end-aligned steps) — the overlay stays on top.
            if (endAlign) {
              setMainVisible(true);
            } else if (session.audioDelayMs && session.overlayClip != null) {
              setMainVisible(true);
            } else if (session.overlayClip == null) {
              setMainVisible(true);
            } else {
              // Simultaneous play from the start
              setMainVisible(true);
            }
          };
          if (endAlign) {
            // Start order is decided below once both clip durations are known.
            setMainVisible(false);
          } else if (session.audioDelayMs && session.overlayClip != null) {
            setMainVisible(false);
            audioTimer.current = setTimeout(startMain, session.audioDelayMs);
          } else {
            startMain();
          }
        } else {
          main.pause();
          setMainVisible(false);
        }
      }

      // Overlay (silent action) clip.
      if (overlay) {
        if (session.overlayClip != null) {
          const src = await getClipUrl(session.overlayClip);
          if (overlay.src !== src) {
            overlay.src = src;
            overlay.load();
          }
          overlay.currentTime = 0;
          overlay.muted = true;
          overlay.volume = 0;
          if (endAlign) {
            // Start order is decided below once both clip durations are known.
            setOverlayVisible(false);
          } else {
            overlay.play().catch(() => {});
            setOverlayVisible(true);
          }
        } else {
          overlay.pause();
          setOverlayVisible(false);
        }
      }

      // End-aligned steps: the longer clip starts now; the shorter one starts
      // once the leader reaches (leaderDuration − followerDuration), so both
      // clips END together. The trigger rides on timeupdate rather than a
      // timer, so pausing the show pauses the countdown too.
      if (endAlign && main && overlay && startMain) {
        const start = startMain;
        const begin = () => {
          const mainDur = main.duration;
          const overlayDur = overlay.duration;
          if (!isFinite(mainDur) || mainDur <= 0 || !isFinite(overlayDur) || overlayDur <= 0) {
            return false;
          }
          const overlayLeads = overlayDur >= mainDur;
          const leader = overlayLeads ? overlay : main;
          const followerDelay = Math.abs(overlayDur - mainDur);
          if (overlayLeads) {
            overlay.play().catch(() => {});
            setOverlayVisible(true);
          } else {
            start();
          }
          const onTime = () => {
            if (leader.currentTime >= followerDelay) {
              leader.removeEventListener("timeupdate", onTime);
              if (overlayLeads) {
                start();
              } else {
                overlay.play().catch(() => {});
                setOverlayVisible(true);
              }
            }
          };
          leader.addEventListener("timeupdate", onTime);
          alignCleanup.current.push(() => leader.removeEventListener("timeupdate", onTime));
          return true;
        };
        if (!begin()) {
          // Durations not known yet — wait for both clips' metadata.
          let started = false;
          const onMeta = () => {
            if (!started && begin()) {
              started = true;
              cleanup();
            }
          };
          const cleanup = () => {
            main.removeEventListener("loadedmetadata", onMeta);
            overlay.removeEventListener("loadedmetadata", onMeta);
            main.removeEventListener("durationchange", onMeta);
            overlay.removeEventListener("durationchange", onMeta);
            if (fallbackInterval) clearInterval(fallbackInterval);
          };
          main.addEventListener("loadedmetadata", onMeta);
          overlay.addEventListener("loadedmetadata", onMeta);
          main.addEventListener("durationchange", onMeta);
          overlay.addEventListener("durationchange", onMeta);

          const fallbackInterval = setInterval(() => {
            if (!started && begin()) {
              started = true;
              cleanup();
            }
          }, 100);

          // Clear fallback check after 5 seconds to prevent leak
          setTimeout(() => clearInterval(fallbackInterval), 5000);

          alignCleanup.current.push(cleanup);
        }
      }
    }

    loadAssets();
  }, [session, active, muted]);

  // Dedicated Play / Pause Effect reacting to session state pause changes.
  useEffect(() => {
    if (!active || !session) return;
    const isPaused = !!session.paused;
    const wasPaused = prevPaused.current;
    prevPaused.current = isPaused;

    const idle = idleRef.current;
    const main = mainRef.current;
    const overlay = overlayRef.current;

    if (isPaused) {
      if (audioTimer.current) {
        clearTimeout(audioTimer.current);
        audioTimer.current = null;
      }
      idle?.pause();
      main?.pause();
      overlay?.pause();
    } else {
      // NOTE: never call play() on a video whose `ended` flag is set — play()
      // on an ended element restarts it from 0. That replayed the walk-out
      // clip a second time while it was frozen on the empty-room frame.
      if (wasPaused === true) {
        // We are resuming from an explicit paused state
        if (idle && !overlayVisible && !mainVisible) {
          idle.play().catch(() => {});
        }
        if (main && session.mainClip != null && !mainVisible && overlayVisible && !session.endAlign && !main.ended) {
          // If main is not visible yet but should be, and overlay is active, start speech immediately on resume.
          main.muted = muted;
          main.volume = 1.0;
          main.play().catch(() => {});
          setOverlayVisible(false);
          setMainVisible(true);
        } else if (main && mainVisible && !main.ended) {
          main.play().catch(() => {});
        }
        if (overlay && overlayVisible && !overlay.ended) {
          overlay.play().catch(() => {});
        }
      } else {
        // First start or non-resume playback sync
        if (idle && !overlayVisible && !mainVisible) {
          idle.play().catch(() => {});
        }
        if (main && mainVisible && !main.ended) {
          main.play().catch(() => {});
        }
        if (overlay && overlayVisible && !overlay.ended) {
          overlay.play().catch(() => {});
        }
      }
    }
  }, [session?.paused, active, overlayVisible, mainVisible, muted, session?.mainClip, session?.stepIndex, session?.endAlign]);

  // Live mute changes.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.muted = muted;
      mainRef.current.volume = 1.0;
    }
  }, [muted]);

  // Progress reporting from whichever clip is the "content" of this directive.
  useEffect(() => {
    const main = mainRef.current;
    const overlay = overlayRef.current;
    if (!onProgress) return;

    const report = (v: HTMLVideoElement, isOverlay: boolean) => {
      const preferredIsOverlay = session?.mainClip == null && session?.overlayClip != null;
      if (preferredIsOverlay === isOverlay) {
        onProgress(v.currentTime, v.duration || 0, !v.paused);
      }
    };

    const onMainTime = () => report(main!, false);
    const onOverlayTime = () => report(overlay!, true);

    if (main) main.addEventListener("timeupdate", onMainTime);
    if (overlay) overlay.addEventListener("timeupdate", onOverlayTime);

    return () => {
      if (main) main.removeEventListener("timeupdate", onMainTime);
      if (overlay) overlay.removeEventListener("timeupdate", onOverlayTime);
    };
  }, [session, onProgress, overlayVisible, mainVisible]);

  // Handle custom timeline triggers (like map image overlay at first 5s + 30s onwards)
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const handleCustomTriggers = () => {
      // Giga Map step: the map image only appears from the 30-second mark of
      // the speech onward — never at the start of the scene.
      if (session?.mainClip === 4 && session?.overlayClip === 3) {
        setMapOverlayVisible(main.currentTime >= 30.0);
      } else {
        setMapOverlayVisible(false);
      }
    };

    main.addEventListener("timeupdate", handleCustomTriggers);
    return () => main.removeEventListener("timeupdate", handleCustomTriggers);
  }, [session]);

  const handleOverlayEnded = () => {
    if (session?.mode === "freeze") return; // hold the empty-room frame
    setOverlayVisible(false);
    
    if (session?.mainClip != null) {
      // simultaneous play: let the main clip continue playing underneath
    } else {
      // overlay-only content (point / write) is done
      onContentEnded?.(lastToken.current);
    }
  };

  const handleMainEnded = () => {
    setMainVisible(false);
    if (session?.mode === "freeze") return; // walk-out: hold the overlay's empty-room frame
    setOverlayVisible(false);
    setMapOverlayVisible(false);
    onContentEnded?.(lastToken.current);
  };

  return (
    <div className="absolute inset-0 bg-black">
      {/* Idle loop stays fully opaque at the bottom of the stack — overlay and
          main fades always reveal live video underneath, never black. */}
      <video
        ref={idleRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        loop
        muted
      />
      <video
        ref={mainRef}
        onEnded={handleMainEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          mainVisible ? "opacity-100" : "opacity-0"
        }`}
        playsInline
      />
      <video
        ref={overlayRef}
        onEnded={handleOverlayEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          overlayVisible ? "opacity-100" : "opacity-0"
        }`}
        playsInline
        muted
      />

      {/* Map Image Overlay */}
      {session?.stepIndex === 1 && (
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-40 transition-all duration-1000 ${
            mapOverlayVisible ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95"
          }`}
        >
          <div className="relative max-w-[90%] max-h-[90%] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src="/media/giga-map.png"
              alt="Giga Map Gambia"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
