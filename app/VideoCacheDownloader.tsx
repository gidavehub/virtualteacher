"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle, Database } from "lucide-react";
import { downloadAndCacheAllVideos, checkCacheStatus, CLIPS_TO_CACHE, ProgressReport } from "./video-cache";

interface Props {
  onComplete: () => void;
}

export default function VideoCacheDownloader({ onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressReport | null>(null);

  useEffect(() => {
    async function checkExisting() {
      const alreadyCached = await checkCacheStatus();
      if (alreadyCached) {
        onComplete();
      } else {
        setLoading(false);
      }
    }
    checkExisting();
  }, [onComplete]);

  const startPreDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadAndCacheAllVideos((report) => {
        setProgress(report);
      });
      // Complete!
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err: any) {
      console.error("Cache download error:", err);
      setError("Download was interrupted. Please check your internet connection and try again.");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center font-sans text-ink-deep">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-ink-deep border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-ink-mute">
            Verifying Cache Status...
          </span>
        </div>
      </div>
    );
  }

  const isComplete = progress && progress.filesDownloaded === progress.totalFiles;

  return (
    <main className="min-h-screen bg-base-warm text-ink-deep flex flex-col justify-between font-sans">
      
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
            <div className="font-sans text-[14px] font-bold tracking-tight text-ink-deep">
              DaveLabs
            </div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ink-mute">
              Virtual Teacher
            </div>
          </div>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ink-mute flex items-center gap-1.5">
          <Database size={12} /> Local Cache
        </span>
      </header>

      {/* Main Download Manager */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-md w-full text-center space-y-8">
          
          <div className="mx-auto w-12 h-12 flex items-center justify-center bg-white border border-rule rounded-xl text-ink-soft">
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <Download className={`w-5 h-5 ${downloading ? "animate-pulse" : ""}`} />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink-deep">
              {isComplete ? "Assets Caching Complete" : downloading ? "Pre-Downloading Assets" : "Pre-Download Required"}
            </h2>
            <p className="text-xs text-ink-soft leading-relaxed max-w-sm mx-auto font-normal">
              To guarantee zero buffering, instant latency-free scene shifting, and perfect presentation delivery before live audiences, we download all 26 high-fidelity video clips (~400MB) directly to your local browser cache storage.
            </p>
          </div>

          {!downloading && !isComplete ? (
            <div className="space-y-4 pt-4">
              <button
                onClick={startPreDownload}
                className="w-full py-3.5 px-6 rounded-lg bg-ink-deep text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs active:scale-[0.99] cursor-pointer"
              >
                Download Assets (400MB)
              </button>
              {error && (
                <p className="text-xs text-red-500 font-mono font-medium max-w-xs mx-auto">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-4 bg-white border border-rule p-6 rounded-xl shadow-2xs">
              <div className="flex justify-between items-center text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                <span className="font-semibold">
                  {isComplete ? "Cached successfully" : `Caching file ${progress?.filesDownloaded ?? 0} of ${progress?.totalFiles ?? CLIPS_TO_CACHE.length}`}
                </span>
                <span className="font-bold text-ink-deep">
                  {progress?.percent ?? 0}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-emerald-500" : "bg-ink-deep"}`}
                  style={{ width: `${progress?.percent ?? 0}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono text-ink-mute">
                <span>
                  {progress?.currentFileName ? `Loading ${progress.currentFileName}...` : "Initializing connection..."}
                </span>
                <span>
                  {progress?.percent === 100 ? "Ready to launch" : "Downloading... Please keep window active"}
                </span>
              </div>
            </div>
          )}

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
