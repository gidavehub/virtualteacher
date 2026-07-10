import { db, rtdb } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, set, update, onValue, off } from "firebase/database";
import { StepDirective } from "./show-timeline";

// Generate random 8-character alphanumeric code
function generateAlphanumericCode(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const hn = window.location.hostname;
  return (
    hn === "localhost" ||
    hn === "127.0.0.1" ||
    hn.startsWith("192.168.") ||
    hn.startsWith("10.") ||
    hn.startsWith("172.")
  );
}

// ── MASTER PASSCODE (Firestore) ───────────────────────────────────────────

export async function getOrGenerateMasterPasscode(): Promise<string> {
  if (isLocalhost()) {
    return "davelabs";
  }
  const configDocRef = doc(db, "config", "master");
  try {
    const snap = await getDoc(configDocRef);
    if (snap.exists() && snap.data().passcode) {
      return snap.data().passcode;
    } else {
      const newCode = generateAlphanumericCode(8);
      await setDoc(configDocRef, { passcode: newCode, createdAt: Date.now() });
      console.log(`[DaveLabs] New 8-character master passcode generated & saved in Firestore: ${newCode}`);
      return newCode;
    }
  } catch (err) {
    console.error("Error reading master passcode configuration:", err);
    // Fallback safe fallback if permission issue during local offline dev
    return "davelabs";
  }
}

export async function verifyMasterPasscode(entered: string): Promise<boolean> {
  if (isLocalhost()) {
    return true;
  }
  const code = await getOrGenerateMasterPasscode();
  return entered.toLowerCase().trim() === code.toLowerCase().trim();
}

// ── STAGE & OPERATOR HANDSHAKE (Firestore + RTDB) ─────────────────────────

// Create a unique Stage session in Firestore and RTDB
export async function createStageSession(pin: string): Promise<void> {
  const cleanedPin = pin.trim().toUpperCase();

  if (isLocalhost()) {
    const initialState = {
      started: false,
      mode: "idle",
      stepIndex: 0,
      clip: null,
      idleClip: 14,
      photoFolder: null,
      photoCount: 0,
      caption: "",
      token: Date.now(),
      paused: false,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(`vtp_local_state_${cleanedPin}`, JSON.stringify(initialState));
      const channel = new BroadcastChannel("vtp_rtdb_sync");
      channel.postMessage({ pin: cleanedPin, state: initialState });
      channel.close();
    } catch (err) {
      console.error("Local storage error on createStageSession:", err);
    }
    return;
  }

  const sessionDocRef = doc(db, "sessions", cleanedPin);
  
  // Save registration in Firestore
  await setDoc(sessionDocRef, {
    pin: cleanedPin,
    createdAt: Date.now(),
    active: true,
  });

  // Initialize state in Realtime Database for low latency
  const rtdbRef = ref(rtdb, `sessions/${cleanedPin}`);
  await set(rtdbRef, {
    started: false,
    mode: "idle",
    stepIndex: 0,
    clip: null,
    idleClip: 14,
    photoFolder: null,
    photoCount: 0,
    caption: "",
    token: Date.now(),
    paused: false,
    updatedAt: Date.now(),
  });
}

// Verify Stage PIN from Operator Console
export async function verifyStageSessionPin(pin: string): Promise<boolean> {
  if (isLocalhost()) {
    return true;
  }
  const cleanedPin = pin.trim().toUpperCase();
  if (!cleanedPin) return false;
  const sessionDocRef = doc(db, "sessions", cleanedPin);
  try {
    const snap = await getDoc(sessionDocRef);
    return snap.exists();
  } catch {
    return false;
  }
}

// Sync step state updates (from Operator to RTDB)
export async function updateSessionState(pin: string, state: Partial<StepDirective>): Promise<void> {
  const cleanedPin = pin.trim().toUpperCase();
  
  if (isLocalhost()) {
    const key = `vtp_local_state_${cleanedPin}`;
    let current: any = {};
    try {
      const existing = localStorage.getItem(key);
      if (existing) current = JSON.parse(existing);
    } catch {}
    const merged = { ...current, ...state, updatedAt: Date.now() };
    try {
      localStorage.setItem(key, JSON.stringify(merged));
      const channel = new BroadcastChannel("vtp_rtdb_sync");
      channel.postMessage({ pin: cleanedPin, state: merged });
      channel.close();
    } catch (err) {
      console.error("Local storage/BroadcastChannel error in updateSessionState:", err);
    }
    return;
  }

  const rtdbRef = ref(rtdb, `sessions/${cleanedPin}`);

  // Merge state with timestamp
  const payload = {
    ...state,
    updatedAt: Date.now(),
  };

  // update() MERGES into the existing session node. set() would replace the
  // whole node with this partial (a lone { paused } post would wipe
  // clip/token/etc. mid-show on the live network).
  await update(rtdbRef, payload);
}

// Listen to RTDB updates (for Stage and Operator sync)
export function subscribeToSession(pin: string, callback: (state: any) => void): () => void {
  const cleanedPin = pin.trim().toUpperCase();
  
  if (isLocalhost()) {
    const key = `vtp_local_state_${cleanedPin}`;
    let initial: any = null;
    try {
      const existing = localStorage.getItem(key);
      if (existing) initial = JSON.parse(existing);
    } catch {}
    
    callback(initial);

    if (typeof window === "undefined") {
      return () => {};
    }

    try {
      const channel = new BroadcastChannel("vtp_rtdb_sync");
      const handleMessage = (event: MessageEvent) => {
        const data = event.data;
        if (data && data.pin === cleanedPin) {
          if (data.type === "request_state") {
            try {
              const currentStr = localStorage.getItem(key);
              if (currentStr) {
                const current = JSON.parse(currentStr);
                channel.postMessage({ pin: cleanedPin, state: current });
              }
            } catch {}
          } else if (data.state !== undefined) {
            callback(data.state);
          }
        }
      };
      
      channel.addEventListener("message", handleMessage);
      
      // Request current state from other tabs just in case localStorage was modified there
      channel.postMessage({ type: "request_state", pin: cleanedPin });

      return () => {
        channel.removeEventListener("message", handleMessage);
        channel.close();
      };
    } catch (err) {
      console.error("BroadcastChannel error in subscribeToSession:", err);
      return () => {};
    }
  }

  const rtdbRef = ref(rtdb, `sessions/${cleanedPin}`);
  
  const listener = onValue(rtdbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // Return unsubscribe handler
  return () => {
    off(rtdbRef, "value", listener);
  };
}

// ── PHOTO SEGMENTS CONFIG & MANAGEMENT ─────────────────────────────────────

export const DEFAULT_PHOTOS: Record<string, string[]> = {
  sierra_leone: [
    "/photos/all/1.jpeg",
    "/photos/all/2.jpeg",
    "/photos/all/3.jpeg",
    "/photos/all/4.jpeg",
    "/photos/all/5.jpeg"
  ],
  kenya: [
    "/photos/all/6.jpeg",
    "/photos/all/7.jpeg",
    "/photos/all/8.jpeg",
    "/photos/all/9.jpeg",
    "/photos/all/10.jpeg"
  ],
  the_gambia: [
    "/photos/all/11.jpeg",
    "/photos/all/12.jpeg",
    "/photos/all/13.jpeg",
    "/photos/all/14.jpeg",
    "/photos/all/15.jpeg",
    "/photos/all/16.jpeg"
  ]
};

export async function getPhotosForSegment(segmentId: string): Promise<string[]> {
  const defaults = DEFAULT_PHOTOS[segmentId] || [];
  if (isLocalhost()) {
    try {
      const stored = localStorage.getItem(`vtp_photos_${segmentId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return defaults;
  }

  const docRef = doc(db, "photos", segmentId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().list) {
      return snap.data().list;
    }
  } catch (err) {
    console.error(`Error loading photos for segment ${segmentId}:`, err);
  }
  return defaults;
}

export async function savePhotosForSegment(segmentId: string, list: string[]): Promise<void> {
  if (isLocalhost()) {
    try {
      localStorage.setItem(`vtp_photos_${segmentId}`, JSON.stringify(list));
      const channel = new BroadcastChannel("vtp_photo_sync");
      channel.postMessage({ segmentId, list });
      channel.close();
    } catch {}
    return;
  }

  const docRef = doc(db, "photos", segmentId);
  await setDoc(docRef, { list, updatedAt: Date.now() });

  // Update in RTDB too for live syncing
  const rtdbRef = ref(rtdb, `photos/${segmentId}`);
  await set(rtdbRef, { list, updatedAt: Date.now() });
}

export function subscribePhotosForSegment(
  segmentId: string,
  onUpdate: (list: string[]) => void
): () => void {
  const defaults = DEFAULT_PHOTOS[segmentId] || [];

  if (isLocalhost()) {
    const handleStorageChange = () => {
      onUpdate(JSON.parse(localStorage.getItem(`vtp_photos_${segmentId}`) || "null") || defaults);
    };
    window.addEventListener("storage", handleStorageChange);
    
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("vtp_photo_sync");
      channel.onmessage = (e) => {
        if (e.data && e.data.segmentId === segmentId) {
          onUpdate(e.data.list);
        }
      };
    } catch {}

    // Initial load
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (channel) channel.close();
    };
  }

  const rtdbRef = ref(rtdb, `photos/${segmentId}`);
  const callback = (snapshot: any) => {
    const data = snapshot.val();
    if (snapshot.exists() && data && data.list) {
      onUpdate(data.list);
    } else {
      // Check firestore as fallback, or use defaults
      getPhotosForSegment(segmentId).then(onUpdate);
    }
  };

  onValue(rtdbRef, callback);
  return () => {
    off(rtdbRef, "value", callback);
  };
}
