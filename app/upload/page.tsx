"use client";

import React, { useState, useEffect } from "react";
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
      showToast(`Uploaded ${files.length} photo(s) to ${SEGMENTS.find(s => s.id === segmentId)?.title}`);
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
      showToast("Photo removed");
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
      const updatedFromList = fromList.filter((_, i) => i !== index);
      const toList = photosBySegment[toSegmentId] || [];
      const updatedToList = [...toList, targetPhoto];

      await savePhotosForSegment(fromSegmentId, updatedFromList);
      await savePhotosForSegment(toSegmentId, updatedToList);

      showToast(`Moved to ${SEGMENTS.find(s => s.id === toSegmentId)?.title}`);
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
      showToast("Reset to default complete");
    } catch (err) {
      console.error("Failed to reset photos:", err);
      showToast("Error resetting photos");
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-base-warm text-ink-deep flex flex-col items-center justify-center p-6">
        <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-ink-mute">Initializing Handshake...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-warm text-ink-deep flex flex-col font-sans select-none">
      
      {/* ── Premium Minimalist Light Header ── */}
      <header className="border-b border-rule bg-white sticky top-0 z-40 px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/operator"
              className="p-2 rounded-lg border border-rule hover:border-ink-soft text-ink-soft hover:text-ink-deep transition-all duration-200"
              title="Return to Operator Console"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="leading-tight">
              <span className="block text-xs font-mono font-bold uppercase tracking-widest text-ink-mute">GIGA PHOTO ENGINE</span>
              <h1 className="text-lg font-bold tracking-tight text-ink-deep mt-0.5">
                Event Photo Manager
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono font-bold bg-neutral-100 border border-rule text-ink-soft px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3px]" /> RTDB SYNC ACTIVE
            </span>
            <div className="h-4 w-[1px] bg-rule hidden md:block" />
            <Link
              href="/operator"
              className="text-xs font-bold font-mono tracking-wider text-ink-mute hover:text-ink-deep uppercase transition-colors duration-200"
            >
              Operator Console
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Layout ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-10 flex flex-col lg:flex-row gap-10">
        
        {/* Left Sidebar: Segment Panels */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink-mute px-1">Segments</h2>

          <div className="flex flex-col gap-3">
            {SEGMENTS.map((seg) => {
              const isActive = activeSegment === seg.id;
              const photoCount = photosBySegment[seg.id]?.length || 0;

              return (
                <div
                  key={seg.id}
                  onClick={() => setActiveSegment(seg.id)}
                  className={`group rounded-xl border p-5 flex flex-col gap-2 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "border-ink-deep bg-white shadow-sm"
                      : "border-rule bg-white/40 hover:border-ink-mute hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${isActive ? "text-ink-deep bg-neutral-100" : "text-ink-mute"}`}>
                        <Film className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-ink-deep group-hover:text-black transition-colors duration-200">
                        {seg.title.replace(" Giga Story", "")}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 border border-rule text-ink-soft px-2 py-0.5 rounded">
                      {photoCount}
                    </span>
                  </div>

                  <p className="text-xs text-ink-soft leading-relaxed font-normal">
                    {seg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Dashboard Area */}
        <div className="flex-1 flex flex-col gap-6">
          {SEGMENTS.map((seg) => {
            if (seg.id !== activeSegment) return null;
            const photoList = photosBySegment[seg.id] || [];

            return (
              <div key={seg.id} className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
                
                {/* Header Actions row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-ink-deep">{seg.title}</h2>
                    <p className="text-xs text-ink-soft mt-0.5 font-normal">
                      The dynamic conveyor overlay will load these photo slots on scene {seg.videoClip}.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleResetToDefaults(seg.id)}
                      className="text-xs font-bold font-mono tracking-wider text-ink-soft hover:text-ink-deep bg-white hover:bg-neutral-50 px-4 py-2.5 rounded-lg border border-rule transition-all duration-200 uppercase"
                    >
                      Reset
                    </button>
                    
                    <label className="text-xs font-bold font-mono tracking-wider bg-ink-deep hover:bg-neutral-800 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-sm uppercase">
                      <Upload className="h-3.5 w-3.5 stroke-[2.5px]" />
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

                {/* Photo Grid container */}
                {photoList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-rule bg-white/40 p-12 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-3 bg-neutral-100 rounded-xl text-ink-mute">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink-deep">No photos assigned</h3>
                      <p className="text-xs text-ink-soft mt-1 leading-relaxed font-normal">
                        Upload some pictures to show them scrolling along the top during this segment!
                      </p>
                    </div>
                    <label className="text-xs font-bold font-mono bg-white text-ink-soft hover:text-ink-deep px-4 py-2.5 rounded-lg border border-rule hover:bg-neutral-50 cursor-pointer transition-all duration-200 uppercase">
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
                          className="group relative aspect-[4/3] rounded-xl border border-rule bg-white overflow-hidden hover:border-ink-soft transition-all duration-200 shadow-xs"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                          />

                          {/* Queue Badge */}
                          <div className="absolute top-3 left-3 px-2 py-1 text-[9px] font-bold font-mono uppercase bg-white/90 border border-rule text-ink-deep rounded-md">
                            Slot {index + 1}
                          </div>

                          {/* Action Overlay */}
                          <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 z-10">
                            
                            {/* Move category drop options */}
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-ink-mute flex items-center gap-1">
                                <ArrowLeftRight className="h-3 w-3" /> Move To Segment:
                              </span>
                              <div className="flex flex-col gap-1.5">
                                {SEGMENTS.map((otherSeg) => {
                                  if (otherSeg.id === seg.id) return null;
                                  return (
                                    <button
                                      key={otherSeg.id}
                                      onClick={() => handleMovePhoto(seg.id, otherSeg.id, index)}
                                      className="text-left text-xs font-semibold text-ink-soft hover:text-ink-deep hover:bg-neutral-100 border border-rule bg-white px-2.5 py-1.5 rounded-md transition-all duration-150 truncate"
                                    >
                                      {otherSeg.title.replace(" Giga Story", "")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Bottom row deletion */}
                            <div className="flex items-center justify-between border-t border-rule pt-3">
                              <span className="text-[9px] font-mono font-bold uppercase text-ink-mute">
                                {isLocalFile ? "Default" : "User Add"}
                              </span>
                              <button
                                onClick={() => handleDeletePhoto(seg.id, index)}
                                className="p-1.5 bg-neutral-100 hover:bg-red-50 hover:text-red-600 border border-rule rounded-md text-ink-soft transition-all duration-150"
                                title="Delete photo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-rule rounded-xl p-8 flex flex-col items-center text-center gap-3 max-w-sm shadow-xl">
            <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin" />
            <h3 className="font-bold text-ink-deep text-sm">Optimizing & Syncing Photos</h3>
            <p className="text-xs text-ink-soft leading-relaxed font-normal">
              Syncing downscaled photo sequence to the RTDB node...
            </p>
          </div>
        </div>
      )}

      {/* ── Micro toast message ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-white border border-rule text-ink-deep px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-[slideUp_0.2s_ease-out]">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-ink-soft">{toastMessage}</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
