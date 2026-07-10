// Video caching manager using the browser's Cache Storage API.
// Allows pre-downloading the entire 400MB show to run 100% offline with zero buffering.

export const CACHE_NAME = "vftp-video-cache-v2";

// The 36 final v2 clips (audio baked in) to cache for offline playback
export const CLIPS_TO_CACHE = Array.from({ length: 36 }, (_, i) => i + 1);

// The site-visit photos shown during the Giga story — one pooled set, cached
// alongside the clips so the whole show runs offline, zero buffering.
export const PHOTO_SETS: { folder: string; count: number }[] = [
  { folder: "all", count: 16 },
];

const GCS_BASE = "https://storage.googleapis.com/virtual-teacher-project-501606.firebasestorage.app";

export function getGCSClipUrl(clipNum: number | string): string {
  return `${GCS_BASE}/rohey-clips-v2/${clipNum}.mp4`;
}

export function getGCSPhotoUrl(folder: string, n: number): string {
  return `${GCS_BASE}/photos/${folder}/${n}.jpeg`;
}

// Every asset the show needs, as {url, name} — clips first, then photos.
function allAssets(): { url: string; name: string }[] {
  const clips = CLIPS_TO_CACHE.map((n) => ({ url: getGCSClipUrl(n), name: `${n}.mp4` }));
  const photos = PHOTO_SETS.flatMap((s) =>
    Array.from({ length: s.count }, (_, i) => ({
      url: getGCSPhotoUrl(s.folder, i + 1),
      name: `${s.folder}/${i + 1}.jpeg`,
    }))
  );
  return [...clips, ...photos];
}

export const TOTAL_ASSETS = CLIPS_TO_CACHE.length + PHOTO_SETS.reduce((a, s) => a + s.count, 0);

export interface ProgressReport {
  filesDownloaded: number;
  totalFiles: number;
  percent: number;
  currentFileName: string;
  bytesDownloaded: number;
  totalBytes: number;
}

// Check if every show asset (clips + photos) is already cached
export async function checkCacheStatus(): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.length >= TOTAL_ASSETS;
  } catch (err) {
    console.error("Error checking cache status:", err);
    return false;
  }
}

// Download every show asset (clips + photos) and report progress
export async function downloadAndCacheAllVideos(
  onProgress: (progress: ProgressReport) => void
): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) {
    throw new Error("Caches API is not supported in this browser");
  }

  const cache = await caches.open(CACHE_NAME);
  const assets = allAssets();
  const totalFiles = assets.length;
  let filesDownloaded = 0;

  const report = (currentFileName: string) => {
    onProgress({
      filesDownloaded,
      totalFiles,
      percent: Math.round((filesDownloaded / totalFiles) * 100),
      currentFileName,
      bytesDownloaded: 0,
      totalBytes: 0,
    });
  };

  for (const asset of assets) {
    // Skip anything already in the cache
    const existing = await cache.match(asset.url);
    if (existing) {
      filesDownloaded++;
      report(asset.name);
      continue;
    }

    try {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      await cache.put(asset.url, response.clone());
      filesDownloaded++;
      report(asset.name);
    } catch (err) {
      console.error(`Failed to cache ${asset.name}:`, err);
      throw err;
    }
  }
}

// Get local Blob URL for a cached photo, or fallback to GCS URL
export async function getPhotoUrl(folder: string, n: number): Promise<string> {
  const gcsUrl = getGCSPhotoUrl(folder, n);
  if (typeof window === "undefined" || !("caches" in window)) return gcsUrl;
  try {
    const cache = await caches.open(CACHE_NAME);
    const matched = await cache.match(gcsUrl);
    if (matched) {
      if (blobUrlMap[gcsUrl]) return blobUrlMap[gcsUrl];
      const blob = await matched.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrlMap[gcsUrl] = blobUrl;
      return blobUrl;
    }
  } catch (err) {
    console.error(`Error resolving cached photo ${folder}/${n}:`, err);
  }
  return gcsUrl;
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
