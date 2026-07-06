import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CUSTOM_TIMELINE_PATH = path.join(process.cwd(), "custom-timeline.json");

export async function GET() {
  try {
    if (fs.existsSync(CUSTOM_TIMELINE_PATH)) {
      const raw = fs.readFileSync(CUSTOM_TIMELINE_PATH, "utf-8");
      const steps = JSON.parse(raw);
      return NextResponse.json({ success: true, steps });
    }
    return NextResponse.json({ success: false, message: "No custom timeline saved yet." }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Timeline must be an array of steps." }, { status: 400 });
    }
    
    fs.writeFileSync(CUSTOM_TIMELINE_PATH, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ success: true, message: "Custom timeline saved successfully!" });
  } catch (error: any) {
    console.error("Error in POST /api/custom-timeline:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(CUSTOM_TIMELINE_PATH)) {
      fs.unlinkSync(CUSTOM_TIMELINE_PATH);
      return NextResponse.json({ success: true, message: "Custom timeline deleted, reset to default." });
    }
    return NextResponse.json({ success: true, message: "Custom timeline already clean (using default)." });
  } catch (error: any) {
    console.error("Error in DELETE /api/custom-timeline:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
