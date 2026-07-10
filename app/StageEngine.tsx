"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { StepDirective } from "./show-timeline";
import { getClipUrl } from "./video-cache";

// Back-compat alias — operator/stage import this name.
export type Directive = StepDirective;

interface Props {
  session: StepDirective | null;
  active: boolean; // audio unlocked / preview running
  muted: boolean; // stage: user-controlled; operator preview: always true
  preloadClip?: number | null; // the NEXT scene's clip — loaded into the spare buffer ahead of time
  onProgress?: (currentTime: number, duration: number, playing: boolean) => void;
  onContentEnded?: (token: number) => void; // clip finished (non-freeze) → caller advances or idles
}

// ── The v2 engine ──────────────────────────────────────────────────────────
// Clips are final self-contained files (audio baked in). Layers:
//   1. BASE (bottom) — clip 1 held on its very first frame: the empty
//      classroom before Rohey walks in. This is the default screen (before
//      the show starts and behind every fade) — never the nodding loop.
//   2. two clip buffers (A/B) that alternate per scene so consecutive clips
//      CROSS-FADE into each other instead of hard-cutting. During the live
//      discussions the idle-nod loop plays IN a buffer like any other scene,
//      so it enters and leaves through the same seamless fade.
//   3. photo overlay (top) — site-visit photos: big in front briefly, then
//      docked to a background strip, one by one.
// freeze mode holds the clip's last frame (walk-outs, the closing card) and
// the next scene cross-fades straight over it — nothing in between.
// PAUSE freezes the current frame in place. No scene swap.
export default function StageEngine({
  session,
  active,
  muted,
  preloadClip = null,
  onProgress,
  onContentEnded,
}: Props) {
  const baseRef = useRef<HTMLVideoElement>(null);
  const bufARef = useRef<HTMLVideoElement>(null);
  const bufBRef = useRef<HTMLVideoElement>(null);

  // Which buffer currently carries the active scene: "A" | "B" | null (base).
  const [activeBuf, setActiveBuf] = useState<"A" | "B" | null>(null);
  const activeBufRef = useRef<"A" | "B" | null>(null);
  activeBufRef.current = activeBuf;

  const lastToken = useRef<number>(-1);

  // ── Photo overlay state ──
  const [photoIdx, setPhotoIdx] = useState(-1); // index currently "in front"
  const [docked, setDocked] = useState<number[]>([]); // indices docked behind
  const photoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const frontTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bufEl = (which: "A" | "B" | null) =>
    which === "A" ? bufARef.current : which === "B" ? bufBRef.current : null;

  const stopPhotos = useCallback(() => {
    if (photoTimer.current) clearInterval(photoTimer.current);
    if (frontTimer.current) clearTimeout(frontTimer.current);
    photoTimer.current = null;
    frontTimer.current = null;
    setPhotoIdx(-1);
    setDocked([]);
  }, []);

  // ── Base layer: the empty classroom (first frame of clip 1), loaded once ──
  useEffect(() => {
    if (!active) return;
    const base = baseRef.current;
    if (!base || base.src) return;
    (async () => {
      base.src = await getClipUrl(1);
      base.load();
      base.currentTime = 0;
      base.muted = true;
      base.pause(); // a still frame — never plays
    })();
  }, [active]);

  // ── React to a new directive ──
  useEffect(() => {
    if (!active || !session) return;
    const changed = session.token !== lastToken.current;
    lastToken.current = session.token;

    async function apply() {
      if (!session) return;

      // What should be on screen for this directive?
      //  · not started      → nothing (base empty classroom shows)
      //  · mode "idle"      → the act's idle-nod loop (live discussions)
      //  · segment / freeze → the scene clip
      const targetClip = !session.started
        ? null
        : session.mode === "idle"
          ? session.idleClip
          : session.clip;

      if (targetClip == null) {
        const cur = bufEl(activeBufRef.current);
        cur?.pause();
        setActiveBuf(null);
        stopPhotos();
        return;
      }

      if (!changed) return;

      // New scene: load into the INACTIVE buffer and cross-fade over the
      // current one (or over the base / a frozen last frame).
      stopPhotos();
      const next: "A" | "B" = activeBufRef.current === "A" ? "B" : "A";
      const nextEl = bufEl(next);
      const prevEl = bufEl(activeBufRef.current);
      if (!nextEl) return;

      const src = await getClipUrl(targetClip);
      if (nextEl.src !== src) {
        nextEl.src = src;
        nextEl.load();
      }
      nextEl.currentTime = 0;
      nextEl.loop = session.mode === "idle"; // idle nod loops seamlessly
      nextEl.muted = session.mode === "idle" ? true : muted;
      nextEl.volume = 1.0;
      if (!session.paused) nextEl.play().catch(() => {});
      setActiveBuf(next);

      // Let the old buffer finish its fade-out, then silence it.
      if (prevEl && prevEl !== nextEl) {
        setTimeout(() => {
          prevEl.pause();
        }, 750);
      }
    }

    apply();
  }, [session, active, muted, stopPhotos]);

  // ── Preload the NEXT scene into the spare buffer while this one plays ──
  // apply() finds the src already set and starts it instantly — no stall at
  // the start of the next video, even on slow networks.
  useEffect(() => {
    if (!active || preloadClip == null) return;
    const t = setTimeout(async () => {
      const spare: "A" | "B" = activeBufRef.current === "A" ? "B" : "A";
      const el = bufEl(spare);
      if (!el || activeBufRef.current === null) return;
      const src = await getClipUrl(preloadClip);
      if (el.src !== src) {
        el.pause();
        el.src = src;
        el.load();
      }
    }, 900); // let the crossfade finish before touching the spare buffer
    return () => clearTimeout(t);
  }, [session?.token, preloadClip, active]);

  // ── Pause / resume: freeze exactly where it is — no scene swap ──
  useEffect(() => {
    if (!active || !session) return;
    const cur = bufEl(activeBufRef.current);
    if (!cur) return;
    if (session.paused) {
      cur.pause();
      if (photoTimer.current) clearInterval(photoTimer.current);
      photoTimer.current = null;
    } else if (!cur.ended) {
      cur.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.paused, active]);

  // ── Live mute changes (idle-nod buffers stay muted — they're silent) ──
  useEffect(() => {
    const cur = bufEl(activeBufRef.current);
    if (cur && !cur.loop) cur.muted = muted;
  }, [muted, activeBuf]);

  // ── Photo overlay cycle, timed across the clip's duration ──
  useEffect(() => {
    if (!active || !session || session.mode !== "segment") return;
    if (!session.photoFolder || session.photoCount <= 0) return;
    if (session.token !== lastToken.current) return; // wait for apply()

    const cur = bufEl(activeBuf);
    if (!cur || session.paused) return;

    const count = session.photoCount;
    const startCycle = () => {
      const dur = isFinite(cur.duration) && cur.duration > 0 ? cur.duration : count * 6;
      const interval = Math.max(4000, Math.min(9000, (dur * 1000) / (count + 1)));
      let i = 0;
      const show = () => {
        if (i >= count) {
          if (photoTimer.current) clearInterval(photoTimer.current);
          return;
        }
        const current = i;
        setPhotoIdx(current);
        // After a beat "in front", dock it to the background strip.
        frontTimer.current = setTimeout(() => {
          setPhotoIdx(-1);
          setDocked((d) => [...d, current].slice(-6));
        }, Math.min(3000, interval * 0.45));
        i += 1;
      };
      show();
      photoTimer.current = setInterval(show, interval);
    };

    if (isFinite(cur.duration) && cur.duration > 0) {
      startCycle();
    } else {
      const onMeta = () => startCycle();
      cur.addEventListener("loadedmetadata", onMeta, { once: true });
      return () => cur.removeEventListener("loadedmetadata", onMeta);
    }

    return () => {
      if (photoTimer.current) clearInterval(photoTimer.current);
      if (frontTimer.current) clearTimeout(frontTimer.current);
      photoTimer.current = null;
      frontTimer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token, activeBuf, active, session?.paused]);

  // ── Progress reporting from the active buffer ──
  useEffect(() => {
    const cur = bufEl(activeBuf);
    if (!cur || !onProgress) return;
    const onTime = () => onProgress(cur.currentTime, cur.duration || 0, !cur.paused);
    cur.addEventListener("timeupdate", onTime);
    return () => cur.removeEventListener("timeupdate", onTime);
  }, [activeBuf, onProgress]);

  // ── Clip finished ──
  const handleEnded = (which: "A" | "B") => () => {
    if (activeBufRef.current !== which) return; // stale buffer
    if (!session) return;
    if (session.mode === "freeze") return; // hold the last frame
    if (session.mode === "idle") return; // looping nod never advances
    onContentEnded?.(lastToken.current);
  };

  const photoSrc = (i: number) => `/photos/${session?.photoFolder}/${i + 1}.jpeg`;

  // Remember the last photo shown "in front" so it can fade out gracefully
  // instead of vanishing the instant it docks.
  const lastFrontIdx = useRef(0);
  if (photoIdx >= 0) lastFrontIdx.current = photoIdx;
  const frontVisible = photoIdx >= 0;

  // Gentle alternating tilts — the docked strip reads like polaroids pinned
  // along the top of the frame, not a rigid filmstrip.
  const DOCK_TILT = [-5, 3.5, -2.5, 4.5, -3.5, 2.5];

  const bufClass = (mine: "A" | "B") =>
    `absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
      activeBuf === mine ? "opacity-100" : "opacity-0"
    }`;

  return (
    <div className="absolute inset-0 bg-black">
      {/* Base: the empty classroom, first frame of clip 1 — the default
          screen before the show and beneath every fade. Always opaque. */}
      <video
        ref={baseRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
      />

      {/* Alternating scene buffers — consecutive scenes cross-fade. */}
      <video ref={bufARef} onEnded={handleEnded("A")} className={bufClass("A")} playsInline />
      <video ref={bufBRef} onEnded={handleEnded("B")} className={bufClass("B")} playsInline />

      {/* ── Photo overlay: a polaroid presented in front of Rohey, then
             pinned into a gallery along the top — one by one ── */}
      {session?.photoFolder && (docked.length > 0 || frontVisible) && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Soft vignette behind the featured photo so it glows over the
              scene without hiding Rohey */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              frontVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 75%)",
            }}
          />

          {/* Docked gallery — tilted polaroids pinned along the top */}
          <div className="absolute top-5 md:top-8 left-1/2 -translate-x-1/2 flex items-start">
            {docked.map((i, k) => (
              <div
                key={i}
                className="-ml-3 first:ml-0"
                style={{
                  transform: `rotate(${DOCK_TILT[k % DOCK_TILT.length]}deg)`,
                  zIndex: k,
                }}
              >
                <div className="animate-dock-in bg-white p-1 md:p-1.5 pb-2 md:pb-3 rounded-[4px] shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                  <img
                    src={photoSrc(i)}
                    alt=""
                    className="h-20 md:h-28 max-w-[180px] object-cover rounded-[2px]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Featured photo — presented big in front, then fades away as it
              takes its place in the gallery */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
              frontVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.88]"
            }`}
          >
            <div
              key={frontVisible ? photoIdx : lastFrontIdx.current}
              className="bg-white p-2 md:p-3 pb-6 md:pb-9 rounded-md shadow-[0_40px_120px_rgba(0,0,0,0.75)] rotate-[-1.2deg] animate-photo-in"
            >
              <img
                src={photoSrc(frontVisible ? photoIdx : lastFrontIdx.current)}
                alt=""
                className="max-w-[56vw] max-h-[56vh] object-contain rounded-[3px]"
              />
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes photoIn {
          from { opacity: 0; transform: scale(0.9) translateY(22px) rotate(-3deg); }
          to   { opacity: 1; transform: scale(1) translateY(0) rotate(-1.2deg); }
        }
        .animate-photo-in { animation: photoIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes dockIn {
          from { opacity: 0; transform: translateY(-18px) scale(1.12); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dock-in {
          animation: dockIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      ` }} />
    </div>
  );
}
