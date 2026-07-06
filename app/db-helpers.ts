import { db, rtdb } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, set, onValue, off } from "firebase/database";
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

// ── MASTER PASSCODE (Firestore) ───────────────────────────────────────────

export async function getOrGenerateMasterPasscode(): Promise<string> {
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
  const code = await getOrGenerateMasterPasscode();
  return entered.toLowerCase().trim() === code.toLowerCase().trim();
}

// ── STAGE & OPERATOR HANDSHAKE (Firestore + RTDB) ─────────────────────────

// Create a unique Stage session in Firestore and RTDB
export async function createStageSession(pin: string): Promise<void> {
  const sessionDocRef = doc(db, "sessions", pin);
  
  // Save registration in Firestore
  await setDoc(sessionDocRef, {
    pin,
    createdAt: Date.now(),
    active: true,
  });

  // Initialize state in Realtime Database for low latency
  const rtdbRef = ref(rtdb, `sessions/${pin}`);
  await set(rtdbRef, {
    started: false,
    mode: "idle",
    stepIndex: 0,
    mainClip: null,
    overlayClip: null,
    audioDelayMs: 0,
    caption: "",
    token: Date.now(),
    paused: false,
    updatedAt: Date.now(),
  });
}

// Verify Stage PIN from Operator Console
export async function verifyStageSessionPin(pin: string): Promise<boolean> {
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
  const rtdbRef = ref(rtdb, `sessions/${cleanedPin}`);
  
  // Merge state with timestamp
  const payload = {
    ...state,
    updatedAt: Date.now(),
  };

  await set(rtdbRef, payload);
}

// Listen to RTDB updates (for Stage and Operator sync)
export function subscribeToSession(pin: string, callback: (state: any) => void): () => void {
  const cleanedPin = pin.trim().toUpperCase();
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
