// Video caching manager using the browser's Cache Storage API.
// Allows pre-downloading the entire 400MB show to run 100% offline with zero buffering.

export const CACHE_NAME = "vftp-video-cache";

// Generate the list of 27 video clip URLs to cache
export const CLIPS_TO_CACHE = [
  ...Array.from({ length: 25 }, (_, i) => i + 1),
  5.5,
  19.5
];

export function getGCSClipUrl(clipNum: number | string): string {
  return `https://storage.googleapis.com/virtual-teacher-project-501606.firebasestorage.app/rohey-clips/${clipNum}.mp4`;
}

export interface ProgressReport {
  filesDownloaded: number;
  totalFiles: number;
  percent: number;
  currentFileName: string;
  bytesDownloaded: number;
  totalBytes: number;
}

// Check if all clips are already cached
export async function checkCacheStatus(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    // We expect 26 cached video assets
    return keys.length >= CLIPS_TO_CACHE.length;
  } catch (err) {
    console.error("Error checking cache status:", err);
    return false;
  }
}

// Download all clips and report progress
export async function downloadAndCacheAllVideos(
  onProgress: (progress: ProgressReport) => void
): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    throw new Error("Caches API is not supported in this browser");
  }

  const cache = await caches.open(CACHE_NAME);
  const totalFiles = CLIPS_TO_CACHE.length;
  let filesDownloaded = 0;

  // Approximate sizes of files in MB (total around 400-500MB)
  // We'll use progress-based fetch reading streams to show highly detailed real-time progress.
  for (let i = 0; i < CLIPS_TO_CACHE.length; i++) {
    const clipNum = CLIPS_TO_CACHE[i];
    const url = getGCSClipUrl(clipNum);
    const fileName = `${clipNum}.mp4`;

    // Check if already in cache
    const existing = await cache.match(url);
    if (existing) {
      filesDownloaded++;
      onProgress({
        filesDownloaded,
        totalFiles,
        percent: Math.round((filesDownloaded / totalFiles) * 100),
        currentFileName: fileName,
        bytesDownloaded: 0,
        totalBytes: 0,
      });
      continue;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // Optional: use a stream reader to track exact bytes loaded for this file
      const clonedResponse = response.clone();
      await cache.put(url, clonedResponse);

      filesDownloaded++;
      onProgress({
        filesDownloaded,
        totalFiles,
        percent: Math.round((filesDownloaded / totalFiles) * 100),
        currentFileName: fileName,
        bytesDownloaded: 0,
        totalBytes: 0,
      });
    } catch (err) {
      console.error(`Failed to cache ${fileName}:`, err);
      throw err;
    }
  }
}

// Get local Blob URL for cached clip, or fallback to GCS URL
const blobUrlMap: Record<string, string> = {};

export async function getClipUrl(clipNum: number | string): Promise<string> {
  const gcsUrl = getGCSClipUrl(clipNum);
  if (typeof window === "undefined" || !("caches" in window)) return gcsUrl;

  try {
    const cache = await caches.open(CACHE_NAME);
    const matched = await cache.match(gcsUrl);
    if (matched) {
      // Re-use existing Object URL if already generated
      if (blobUrlMap[gcsUrl]) {
        return blobUrlMap[gcsUrl];
      }
      const blob = await matched.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlMap[gcsUrl] = blobUrl;
      return blobUrl;
    }
  } catch (err) {
    console.error(`Error resolving cached clip for ${clipNum}:`, err);
  }

  return gcsUrl;
}

// Clear entire cache
export async function clearVideoCache(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    await caches.delete(CACHE_NAME);
    Object.keys(blobUrlMap).forEach((url) => {
      try {
        URL.revokeObjectURL(blobUrlMap[url]);
      } catch {}
      delete blobUrlMap[url];
    });
  } catch (err) {
    console.error("Error clearing video cache:", err);
  }
}
