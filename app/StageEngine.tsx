"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { StepDirective } from "./show-timeline";
import { getClipUrl } from "./video-cache";
import { subscribePhotosForSegment } from "./db-helpers";

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
//   3. photo overlay (top) — at the timed moments (photoGroups), the segment's
//      photos POP UP ALL TOGETHER around Rohey for ~5 seconds, then settle
//      into the scrolling ring. ONLY popped-up photos ever ride the ring, and
//      the ring persists across the Giga-story segments until a clear trigger.
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

  // ── Photos for the current segment (managed live via /upload) ──
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  useEffect(() => {
    const folder = session?.photoFolder;
    if (!folder) {
      setPhotoUrls([]);
      return;
    }
    const unsubscribe = subscribePhotosForSegment(folder, (urls) => {
      setPhotoUrls(urls);
    });
    return () => {
      unsubscribe();
    };
  }, [session?.photoFolder]);
  const photoUrlsRef = useRef<string[]>([]);
  photoUrlsRef.current = photoUrls;

  // ── Photo overlay state ──
  // popup: URLs currently popped up all together around Rohey.
  // popped: URLs that have popped up so far — ONLY these ride the ring, and
  // they persist across segments (stored as URLs, not per-folder indices)
  // until a clear trigger fires or a photo-less step arrives.
  const [popup, setPopup] = useState<string[]>([]);
  const [popped, setPopped] = useState<string[]>([]);
  const firedGroups = useRef<Set<number>>(new Set());
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Giga map intro: the map large in front of Rohey for the first 3s ──
  const [mapIntroVisible, setMapIntroVisible] = useState(false);
  const mapIntroTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const lastTimeRef = useRef<number | null>(null);

  const pausedRef = useRef(session?.paused ?? false);
  pausedRef.current = session?.paused ?? false;

  const poppedCountRef = useRef(0);
  poppedCountRef.current = popped.length;

  // ── Scroll animation loop ──
  useEffect(() => {
    if (!active) {
      lastTimeRef.current = null;
      return;
    }

    const itemWidth = 176; // IMAGE_WIDTH (160) + MARGIN_RIGHT (16)
    const secondsPerItem = 6;
    let frameId: number;

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const dt = (now - lastTimeRef.current) / 1000; // in seconds

        // Only scroll if not paused and we have items
        if (!pausedRef.current && poppedCountRef.current > 0) {
          const speed = itemWidth / secondsPerItem; // pixels per second
          setScrollOffset((prev) => prev - speed * dt);
        }
      }
      lastTimeRef.current = now;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      lastTimeRef.current = null;
    };
  }, [active]);

  // ── Sync scroll offset with first item ──
  useEffect(() => {
    if (popped.length === 1) {
      setScrollOffset(-80); // -IMAGE_WIDTH / 2 (160 / 2)
    } else if (popped.length === 0) {
      setScrollOffset(0);
    }
  }, [popped.length]);

  const bufEl = (which: "A" | "B" | null) =>
    which === "A" ? bufARef.current : which === "B" ? bufBRef.current : null;

  // Clears the popup + trigger timers for a new scene. The ring is NOT
  // cleared here — it persists across the Giga-story segments.
  const stopPhotos = useCallback(() => {
    if (popupTimer.current) clearTimeout(popupTimer.current);
    popupTimer.current = null;
    firedGroups.current = new Set();
    setPopup([]);
  }, []);

  // ── One-time buffer setup: start invisible, stacked beneath the active ──
  useEffect(() => {
    [bufARef.current, bufBRef.current].forEach((el) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.zIndex = "21";
    });
  }, []);

  // ── Base layer: the empty classroom (first frame of clip 1), loaded once ──
  // Pinned hard to frame 0 — if anything ever plays it (e.g. the browser
  // audio unlock), it snaps straight back so Rohey can never be caught
  // mid-entrance on the backdrop.
  useEffect(() => {
    if (!active) return;
    const base = baseRef.current;
    if (!base || base.src) return;
    const pin = () => {
      base.pause();
      base.currentTime = 0;
    };
    base.addEventListener("play", pin);
    base.addEventListener("loadeddata", pin, { once: true });
    (async () => {
      base.src = await getClipUrl(1);
      base.load();
      base.muted = true;
    })();
    return () => base.removeEventListener("play", pin);
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
        // Fade the scene away to reveal the empty-classroom base.
        [bufARef.current, bufBRef.current].forEach((el) => {
          if (!el) return;
          el.style.transition = "opacity 700ms ease";
          el.style.opacity = "0";
          setTimeout(() => el.pause(), 750);
        });
        setActiveBuf(null);
        stopPhotos();
        setPopped([]); // no scene, no ring
        setMapIntroVisible(false);
        return;
      }

      if (!changed) return;

      // New scene: reset popups/triggers. The ring survives as long as the
      // incoming step still carries photos; otherwise it clears.
      stopPhotos();
      if (!session.photoFolder) setPopped([]);

      // Giga map intro: hold the map large in front of Rohey for 3 seconds.
      if (mapIntroTimer.current) clearTimeout(mapIntroTimer.current);
      if (session.mapIntro && session.mode === "segment") {
        setMapIntroVisible(true);
        mapIntroTimer.current = setTimeout(() => setMapIntroVisible(false), 3000);
      } else {
        setMapIntroVisible(false);
      }

      // Load into the INACTIVE buffer and cross-fade over the current one
      // (or over the base / a frozen last frame).
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
      // Idle loops and live gesture triggers are ALWAYS silent — the gesture
      // clip only moves Rohey's mouth; Fatou provides the voice live.
      nextEl.muted = session.mode === "idle" || !!session.silent ? true : muted;
      nextEl.volume = 1.0;
      if (!session.paused) nextEl.play().catch(() => {});

      // TRUE cross-fade: the outgoing scene stays FULLY OPAQUE underneath
      // while the incoming one fades in on top. Nothing behind them (the
      // base frame with Rohey at the edge of the shot) can ever bleed
      // through mid-fade — that was the split-second "walk-in" ghost.
      if (prevEl && prevEl !== nextEl) {
        prevEl.style.transition = "none";
        prevEl.style.opacity = "1";
        prevEl.style.zIndex = "21";
      }
      nextEl.style.transition = "none";
      nextEl.style.opacity = "0";
      nextEl.style.zIndex = "22";

      // Start the fade only once the incoming clip can actually paint a
      // frame — the old scene holds until then (no black flash either).
      const startFade = () => {
        // force a style flush so the fade animates from 0
        void nextEl.offsetWidth;
        nextEl.style.transition = "opacity 700ms ease";
        nextEl.style.opacity = "1";
      };
      if (nextEl.readyState >= 2) {
        startFade();
      } else {
        nextEl.addEventListener("canplay", startFade, { once: true });
      }

      setActiveBuf(next);

      // Silence the covered buffer once the fade has fully landed.
      if (prevEl && prevEl !== nextEl) {
        setTimeout(() => {
          prevEl.pause();
        }, 900);
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
    } else if (!cur.ended) {
      cur.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.paused, active]);

  // ── Live mute changes (idle-nod buffers and silent gesture triggers stay
  //    muted regardless of the stage's mute toggle) ──
  useEffect(() => {
    const cur = bufEl(activeBufRef.current);
    if (cur && !cur.loop && !session?.silent) cur.muted = muted;
  }, [muted, activeBuf, session?.silent]);

  // ── Timed photo pop-ups: each group fires as the clip crosses its `at` ──
  // The group pops up all together around Rohey for ~5 seconds, then settles
  // into the ring. A `clear` group removes everything (popups + ring).
  useEffect(() => {
    if (!active || !session || session.mode !== "segment") return;
    const groups = session.photoGroups ?? [];
    if (!session.photoFolder || groups.length === 0) return;
    if (session.token !== lastToken.current) return; // wait for apply()

    const cur = bufEl(activeBuf);
    if (!cur) return;

    const onTime = () => {
      const t = cur.currentTime;
      groups.forEach((g, gi) => {
        if (firedGroups.current.has(gi) || t < g.at) return;
        firedGroups.current.add(gi);

        if (g.clear) {
          if (popupTimer.current) clearTimeout(popupTimer.current);
          setPopup([]);
          setPopped([]);
          return;
        }

        // Resolve the group to URLs: the configured indices when they exist,
        // otherwise every photo currently in the segment (managed via /upload).
        const urls = photoUrlsRef.current;
        const groupUrls =
          g.photos && g.photos.length > 0
            ? g.photos.map((i) => urls[i]).filter(Boolean)
            : urls;
        if (groupUrls.length === 0) return;

        setPopup(groupUrls);
        if (popupTimer.current) clearTimeout(popupTimer.current);
        popupTimer.current = setTimeout(() => {
          setPopup([]);
          setPopped((prev) => {
            const merged = [...prev];
            for (const u of groupUrls) if (!merged.includes(u)) merged.push(u);
            return merged;
          });
        }, 5000);
      });
    };

    cur.addEventListener("timeupdate", onTime);
    return () => cur.removeEventListener("timeupdate", onTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token, activeBuf, active]);

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

  // Keep the last popup group around while it fades out.
  const lastPopup = useRef<string[]>([]);
  if (popup.length > 0) lastPopup.current = popup;
  const popupVisible = popup.length > 0;
  const popupPhotos = popupVisible ? popup : lastPopup.current;
  const popupLeft = popupPhotos.slice(0, Math.ceil(popupPhotos.length / 2));
  const popupRight = popupPhotos.slice(Math.ceil(popupPhotos.length / 2));

  // Buffer opacity/stacking is driven imperatively in apply() — the class
  // stays static so React re-renders never fight the fade styles.
  const bufClass = () => "absolute inset-0 w-full h-full object-cover";

  return (
    <div className="absolute inset-0 bg-black">
      {/* Base: the empty classroom, first frame of clip 1 — the default
          screen before the show and beneath every fade. Always opaque. */}
      <video
        ref={baseRef}
        data-role="base"
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
      />

      {/* Alternating scene buffers — consecutive scenes cross-fade. */}
      <video ref={bufARef} onEnded={handleEnded("A")} className={bufClass()} playsInline />
      <video ref={bufBRef} onEnded={handleEnded("B")} className={bufClass()} playsInline />

      {/* ── Giga map intro: large in front of Rohey for the first 3 seconds,
             then it lives on the board behind her (baked into the video) ── */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-all duration-700 ease-out ${
          mapIntroVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.92]"
        }`}
      >
        <img
          src="/media/giga-map.png"
          alt=""
          className="max-w-[80%] max-h-[80%] rounded-2xl object-contain border border-white/25 shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        />
      </div>

      {/* ── Photo overlay ── */}
      {(popped.length > 0 || popupPhotos.length > 0) && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {/* Scroll ring queue — ONLY popped-up photos, moving continuously */}
          {popped.length > 0 && (
            <div className="absolute top-6 left-0 right-0 overflow-hidden h-36">
              <div
                className="flex items-center absolute left-0"
                style={{
                  transform: `translateX(calc(50vw + ${scrollOffset}px))`,
                  width: "max-content",
                }}
              >
                {popped.map((url, k) => {
                  const isLatest = k === popped.length - 1;
                  return (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className={`h-24 md:h-32 rounded-lg object-cover border border-white/20 shadow-xl opacity-90 ${
                        isLatest ? "animate-join-ring" : "mr-4"
                      }`}
                      style={{
                        width: "160px",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Pop-up group — all photos together around Rohey for ~5 seconds,
              flanking her on both sides, then they settle into the ring */}
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              popupVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.94]"
            }`}
          >
            <div className="absolute left-[4%] inset-y-0 w-[26%] flex flex-col items-center justify-center gap-4">
              {popupLeft.map((url, k) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full max-h-[26vh] rounded-xl object-cover border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-photo-in"
                  style={{ animationDelay: `${k * 0.12}s` }}
                />
              ))}
            </div>
            <div className="absolute right-[4%] inset-y-0 w-[26%] flex flex-col items-center justify-center gap-4">
              {popupRight.map((url, k) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full max-h-[26vh] rounded-xl object-cover border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-photo-in"
                  style={{ animationDelay: `${(k + popupLeft.length) * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes photoIn {
          from { opacity: 0; transform: scale(0.92) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-photo-in { animation: photoIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes joinRing {
          0% {
            opacity: 0;
            transform: scale(0) translateY(-40px) rotate(-10deg);
            max-width: 0;
            margin-right: 0;
            filter: brightness(2) blur(4px);
          }
          50% {
            opacity: 0.5;
            max-width: 160px;
            margin-right: 16px;
          }
          100% {
            opacity: 0.95;
            transform: scale(1) translateY(0) rotate(0deg);
            max-width: 160px;
            margin-right: 16px;
            filter: brightness(1) blur(0);
          }
        }
        .animate-join-ring {
          animation: joinRing 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: center center;
        }
      ` }} />
    </div>
  );
}
