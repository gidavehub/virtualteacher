"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, Trash2, ArrowLeftRight, Film, Check, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { subscribePhotosForSegment, savePhotosForSegment, DEFAULT_PHOTOS } from "../db-helpers";
import { CLIP } from "../show-timeline";

interface SegmentInfo {
  id: string;
  title: string;
  videoClip: number;
  description: string;
}

const SEGMENTS: SegmentInfo[] = [
  {
    id: "sierra_leone",
    title: "Sierra Leone Giga Story",
    videoClip: 18,
    description: "Features connectivity cost dropping from $12,000 to just $1,500 per school per year.",
  },
  {
    id: "kenya",
    title: "Kenya Giga Story",
    videoClip: 19,
    description: "Features Darlene learning to code in Kakuma refugee camp to become an engineer.",
  },
  {
    id: "the_gambia",
    title: "The Gambia Giga Story",
    videoClip: 20,
    description: "Features the full mapping of all 1,978 Gambian schools and scaling beyond education.",
  },
];

export default function PhotoUploadDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Photos state for all 3 segments
  const [photosBySegment, setPhotosBySegment] = useState<Record<string, string[]>>({
    sierra_leone: [],
    kenya: [],
    the_gambia: [],
  });

  const [activeSegment, setActiveSegment] = useState<string>("sierra_leone");
  const [uploadingSegment, setUploadingSegment] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security & local unlock verification
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
        setLoading(false);
      }
    }
  }, []);

  // Listen to RTDB for the three segments
  useEffect(() => {
    if (!authorized) return;

    const unsubscribers = SEGMENTS.map((seg) => {
      return subscribePhotosForSegment(seg.id, (list) => {
        setPhotosBySegment((prev) => ({
          ...prev,
          [seg.id]: list,
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [authorized]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Resize and compress image using canvas before storing (tiny size, super fast RTDB sync)
  const compressImage = (file: File, maxWidth = 800, maxHeight = 600): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8)); // 80% JPEG quality
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (segmentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingSegment(segmentId);

    try {
      const files = Array.from(e.target.files);
      const newImagesBase64 = await Promise.all(
        files.map((file) => compressImage(file))
      );

      const currentList = photosBySegment[segmentId] || [];
      const updatedList = [...currentList, ...newImagesBase64];

      await savePhotosForSegment(segmentId, updatedList);
      showToast(`Successfully uploaded ${files.length} photo(s) to ${SEGMENTS.find(s => s.id === segmentId)?.title}`);
    } catch (err) {
      console.error("Failed to upload photos:", err);
      showToast("Error uploading images. Please try again.");
    } finally {
      setUploadingSegment(null);
      e.target.value = ""; // reset file input
    }
  };

  const handleDeletePhoto = async (segmentId: string, index: number) => {
    const currentList = photosBySegment[segmentId] || [];
    const updatedList = currentList.filter((_, i) => i !== index);

    try {
      await savePhotosForSegment(segmentId, updatedList);
      showToast("Photo removed successfully");
    } catch (err) {
      console.error("Failed to delete photo:", err);
      showToast("Error deleting photo");
    }
  };

  const handleMovePhoto = async (fromSegmentId: string, toSegmentId: string, index: number) => {
    if (fromSegmentId === toSegmentId) return;

    const fromList = photosBySegment[fromSegmentId] || [];
    const targetPhoto = fromList[index];
    if (!targetPhoto) return;

    try {
      // 1. Remove from source
      const updatedFromList = fromList.filter((_, i) => i !== index);
      // 2. Add to destination
      const toList = photosBySegment[toSegmentId] || [];
      const updatedToList = [...toList, targetPhoto];

      await savePhotosForSegment(fromSegmentId, updatedFromList);
      await savePhotosForSegment(toSegmentId, updatedToList);

      showToast(`Moved photo to ${SEGMENTS.find(s => s.id === toSegmentId)?.title}`);
    } catch (err) {
      console.error("Failed to move photo:", err);
      showToast("Error moving photo");
    }
  };

  const handleResetToDefaults = async (segmentId: string) => {
    if (!window.confirm(`Are you sure you want to reset ${SEGMENTS.find(s => s.id === segmentId)?.title} to its original default gallery?`)) {
      return;
    }
    try {
      const defaults = DEFAULT_PHOTOS[segmentId] || [];
      await savePhotosForSegment(segmentId, defaults);
      showToast("Reset to default photos complete");
    } catch (err) {
      console.error("Failed to reset photos:", err);
      showToast("Error resetting photos");
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-400 font-medium animate-pulse">Initializing Dashboard Secure Handshake...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ── Premium Top Header Banner ── */}
      <header className="border-b border-zinc-900/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/operator"
              className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all duration-200"
              title="Return to Operator Console"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Content Engine</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">
                Event Photo Manager
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Handshake Secure
            </span>
            <div className="h-4 w-[1px] bg-zinc-800 hidden md:block" />
            <Link
              href="/operator"
              className="text-sm font-semibold text-zinc-400 hover:text-white bg-zinc-900/40 px-4 py-2 rounded-xl border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
            >
              Operator Console
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Segment Cards Sidebar */}
        <div className="w-full lg:w-[360px] flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Segments ({SEGMENTS.length})</h2>
          </div>

          <div className="flex flex-col gap-4">
            {SEGMENTS.map((seg) => {
              const isActive = activeSegment === seg.id;
              const photoCount = photosBySegment[seg.id]?.length || 0;

              return (
                <div
                  key={seg.id}
                  onClick={() => setActiveSegment(seg.id)}
                  className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive
                      ? "border-emerald-500 bg-zinc-900/60 shadow-[0_0_25px_rgba(16,185,129,0.1)]"
                      : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 hover:bg-zinc-950/80"
                  }`}
                >
                  {/* Subtle Video Loop Backdrop for Premium feel */}
                  <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none">
                    <video
                      src={CLIP(seg.videoClip)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>

                  {/* Glassmorphism content overlay */}
                  <div className="relative p-5 flex flex-col gap-3 backdrop-blur-[2px]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>
                          <Film className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">
                          {seg.title}
                        </h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-900 text-zinc-400"
                      }`}>
                        {photoCount} {photoCount === 1 ? "photo" : "photos"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {seg.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                      <span>Clip {seg.videoClip} preview loop</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Segment Photos Grid Dashboard */}
        <div className="flex-1 flex flex-col gap-6">
          {SEGMENTS.map((seg) => {
            if (seg.id !== activeSegment) return null;
            const photoList = photosBySegment[seg.id] || [];

            return (
              <div key={seg.id} className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                {/* Segment Heading Details */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900/60 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">{seg.title}</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      Manage photo queue sequence for clip scene {seg.videoClip}. These photos scroll dynamically in real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleResetToDefaults(seg.id)}
                      className="text-xs font-semibold bg-zinc-900/40 text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
                    >
                      Reset to defaults
                    </button>
                    
                    <label className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-lg shadow-emerald-500/10">
                      <Upload className="h-4 w-4 stroke-[2.5px]" />
                      Add Photos
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(seg.id, e)}
                        disabled={uploadingSegment !== null}
                      />
                    </label>
                  </div>
                </div>

                {/* Main Photos Grid */}
                {photoList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 p-12 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-zinc-900/50 rounded-2xl text-zinc-500">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">No photos in this segment</h3>
                      <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        Add event photos to trigger the scrolling conveyor-belt overlay once Rohey reaches this part of the classroom story.
                      </p>
                    </div>
                    <label className="text-xs font-bold bg-zinc-900 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer transition-all duration-200">
                      Upload Photos
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(seg.id, e)}
                        disabled={uploadingSegment !== null}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {photoList.map((url, index) => {
                      const isLocalFile = url.startsWith("/photos/");
                      return (
                        <div
                          key={index}
                          className="group relative aspect-[4/3] rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden hover:border-zinc-700 hover:shadow-2xl transition-all duration-300"
                        >
                          {/* Image rendering */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Top-right queue position badge */}
                          <div className="absolute top-3 left-3 px-2 py-1 text-[10px] font-black uppercase bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-400/20 rounded-lg">
                            Slot {index + 1}
                          </div>

                          {/* Hover action bar overlay */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-between p-4 z-10 backdrop-blur-[2px]">
                            {/* Top action row: Move selection */}
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                                <ArrowLeftRight className="h-3 w-3" /> Move photo to segment:
                              </span>
                              <div className="flex flex-col gap-1 mt-0.5">
                                {SEGMENTS.map((otherSeg) => {
                                  if (otherSeg.id === seg.id) return null;
                                  return (
                                    <button
                                      key={otherSeg.id}
                                      onClick={() => handleMovePhoto(seg.id, otherSeg.id, index)}
                                      className="text-left text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg border border-white/5 transition-all duration-150 truncate"
                                    >
                                      {otherSeg.title.split(" ")[0]}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Bottom action row: Delete/source details */}
                            <div className="flex items-center justify-between border-t border-white/10 pt-3">
                              <span className="text-[10px] text-zinc-500 font-semibold">
                                {isLocalFile ? "Default" : "Uploaded"}
                              </span>
                              <button
                                onClick={() => handleDeletePhoto(seg.id, index)}
                                className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                title="Remove photo from segment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Dynamic Upload Status Spinner Overlay ── */}
      {uploadingSegment && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-10 flex flex-col items-center text-center gap-4 max-w-sm shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
            <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
            <h3 className="font-black text-white text-lg">Compressing & Syncing Photos</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Downscaling image dimensions to optimize low-latency real-time synchronization on the Live Stage...
            </p>
          </div>
        </div>
      )}

      {/* ── Micro toast message ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-zinc-950 border border-zinc-800 text-emerald-400 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-normal text-zinc-100">{toastMessage}</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
