import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { STEPS } from "../../show-timeline";

const CUSTOM_TIMELINE_PATH = path.join(process.cwd(), "custom-timeline.json");

export async function GET() {
  try {
    if (fs.existsSync(CUSTOM_TIMELINE_PATH)) {
      const raw = fs.readFileSync(CUSTOM_TIMELINE_PATH, "utf-8");
      const steps = JSON.parse(raw);
      return NextResponse.json(steps);
    }
  } catch (error) {
    console.error("Failed to read custom-timeline.json, using default:", error);
  }
  
  // Fallback to default timeline steps
  return NextResponse.json(STEPS);
}
