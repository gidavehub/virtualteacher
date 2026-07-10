"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { StepDirective } from "./show-timeline";
import { getClipUrl, getPhotoUrl } from "./video-cache";

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
  const [poppedUpIndices, setPoppedUpIndices] = useState<number[]>([]);
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
    setPoppedUpIndices([]);
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
      // One pooled gallery — shuffle the order every scene and keep rotating
      // through all of them for as long as the clip runs.
      const order = Array.from({ length: count }, (_, k) => k);
      for (let k = order.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [order[k], order[j]] = [order[j], order[k]];
      }
      let i = 0;
      const show = () => {
        const current = order[i % count];
        setPhotoIdx(current);
        setPoppedUpIndices((prev) => {
          if (prev.includes(current)) return prev;
          return [...prev, current];
        });
        // Hold "in front" for a beat, then fade back to the scrolling ring.
        frontTimer.current = setTimeout(() => {
          setPhotoIdx(-1);
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

  // Photo URLs resolve through the offline cache (blob URLs) with the local
  // public copy as an instant fallback while they resolve.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  useEffect(() => {
    const folder = session?.photoFolder;
    const count = session?.photoCount ?? 0;
    if (!folder || count <= 0) {
      setPhotoUrls([]);
      return;
    }
    let alive = true;
    Promise.all(Array.from({ length: count }, (_, i) => getPhotoUrl(folder, i + 1))).then(
      (urls) => {
        if (alive) setPhotoUrls(urls);
      }
    );
    return () => {
      alive = false;
    };
  }, [session?.photoFolder, session?.photoCount]);

  const photoSrc = (i: number) =>
    photoUrls[i] ?? `/photos/${session?.photoFolder}/${i + 1}.jpeg`;

  // Remember the last photo shown "in front" so it can fade out gracefully
  // instead of vanishing the instant it docks.
  const lastFrontIdx = useRef(0);
  if (photoIdx >= 0) lastFrontIdx.current = photoIdx;
  const frontVisible = photoIdx >= 0;

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

      {/* ── Photo overlay: an infinite scrolling ring of the whole gallery
             along the top, plus the featured photo big in front ── */}
      {session?.photoFolder && (session.photoCount ?? 0) > 0 && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Infinite scroll ring — the full pool glides by continuously;
              the sequence is doubled so the loop is seamless */}
          {poppedUpIndices.length > 0 && (
            <div className="absolute top-6 left-0 right-0 overflow-hidden">
              <div
                className="flex items-center w-max animate-marquee"
                style={{
                  animationDuration: `${Math.max(30, poppedUpIndices.length * 3.5)}s`,
                  animationPlayState: session.paused ? "paused" : "running",
                }}
              >
                {[0, 1].map((rep) =>
                  poppedUpIndices.map((idx) => (
                    <img
                      key={`${rep}-${idx}`}
                      src={photoSrc(idx)}
                      alt=""
                      className="h-24 md:h-32 mr-3 rounded-lg object-cover border border-white/20 shadow-xl opacity-90"
                    />
                  ))
                )}
              </div>
            </div>
          )}
          {/* Featured photo — big, in front of Rohey, fades back into the ring */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
              frontVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.92]"
            }`}
          >
            <img
              key={frontVisible ? photoIdx : lastFrontIdx.current}
              src={photoSrc(frontVisible ? photoIdx : lastFrontIdx.current)}
              alt=""
              className="max-w-[62%] max-h-[68%] rounded-2xl object-contain border border-white/25 shadow-[0_30px_80px_rgba(0,0,0,0.7)] animate-photo-in"
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes photoIn {
          from { opacity: 0; transform: scale(0.92) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-photo-in { animation: photoIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee linear infinite; }
      ` }} />
    </div>
  );
}
