import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATE_FILE_PATH = path.join(process.cwd(), "session-state.json");

const DEFAULT_STATE = {
  currentSegmentId: "welcome",
  mode: "video",
  gesture: "none",
  subtitles: "Good evening, class. Welcome to my classroom...",
  isPlaying: false,
  activeVisual: "none",
  updatedAt: Date.now(),
};

// In-memory fallback if file system write/read fails
let inMemoryState = { ...DEFAULT_STATE };

function readLocalState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      inMemoryState = { ...DEFAULT_STATE, ...parsed };
      return inMemoryState;
    }
  } catch (error) {
    console.error("Local state read failed, using memory:", error);
  }
  return inMemoryState;
}

function writeLocalState(state: any) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
    inMemoryState = state;
  } catch (error) {
    console.error("Local state write failed, using memory:", error);
    inMemoryState = state;
  }
}

export async function GET() {
  try {
    const currentState = readLocalState();
    return NextResponse.json(currentState);
  } catch (error: any) {
    console.error("Error in GET /api/session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentState = readLocalState();

    const updatedState = {
      ...currentState,
      ...body,
      updatedAt: Date.now(),
    };

    writeLocalState(updatedState);

    return NextResponse.json({ success: true, state: updatedState });
  } catch (error: any) {
    console.error("Error in POST /api/session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
