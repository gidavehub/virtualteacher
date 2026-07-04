"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, Pause, Wifi, WifiOff, Sparkles, Image as ImageIcon, Map, HelpCircle, 
  MessageSquare, Send, CheckCircle, ArrowLeft, RefreshCw, Hand, Eye
} from "lucide-react";
import Link from "next/link";

interface SessionState {
  currentSegmentId: string;
  mode: "video" | "avatar";
  gesture: string;
  subtitles: string;
  isPlaying: boolean;
  activeVisual?: "none" | "map" | "kenya" | "unicef";
  updatedAt: number;
}

// Pre-defined pre-recorded chapter settings
const PRE_RECORDED_SEGMENTS = [
  {
    id: "welcome",
    name: "1. Welcome & Introduction",
    desc: "Starts the dinner, greets Nafisa, Karl, Imma, Stephane, and Turkish partners. Prompts the re-design question.",
    video: "rohey-hello.mp4",
    defaultSubtitles: "Good evening, class. Welcome to my classroom! If every child in The Gambia had internet access at school, how would you re-design education? Think about it. Discuss it with your classmates."
  },
  {
    id: "giga",
    name: "2. The Giga Story",
    desc: "Rohey talks about Sierra Leone's 90% cost drop ($12k to $1,500) and Kenya's Kakuma coding center. Maps out Gambia's 1,978 schools.",
    video: "rohey-giga.mp4",
    defaultSubtitles: "What you have imagined is already being accomplished. In Sierra Leone, connectivity dropped from $12,000 to just $1,500. In Kakuma, Darlene is learning to code. Across Kenya, Giga connected 659 schools."
  },
  {
    id: "feedback",
    name: "3. Transformed Classroom (Activity C Pt 1)",
    desc: "Connected classroom visual climax. Tablets on desks, energetic audio, children laughing and coding.",
    video: "connected-classroom.mp4",
    defaultSubtitles: "Tonight, you were asked to imagine. Maybe you imagined a girl in rural Gambia learning from scientists, or teachers getting training. I want you to see what you described. This is connectivity."
  },
  {
    id: "closing",
    name: "4. Parting Lesson & Dismissal",
    desc: "Closing remarks. The best teachers don't give answers, they give questions and the courage to act.",
    video: "rohey-closing.mp4",
    defaultSubtitles: "You know, the best teachers don't give students answers. They give them the right question and the courage to act on it. My thirty-two students are counting on your courage. Class dismissed."
  }
];

// Pre-defined Live Speech Quick-Sends (matches the script exchanges)
const LIVE_SPEECH_QUICK_SENS = [
  {
    label: "Class Settle Down",
    text: "Right class, settle down please. I hope you had enough time to think about my question, because class is back in session."
  },
  {
    label: "Ask for Ideas",
    text: "So tell me class, what did you discuss? Don't be shy. It's just a classroom discussion; it's not like you are talking in front of a room full of ministers."
  },
  {
    label: "Remote Learning Reply",
    text: "Yes! A classroom without walls. Imagine my students in Basse logging into the same lesson as a child in Banjul, Dakar, or Lagos. That's not a dream."
  },
  {
    label: "Teacher Training Reply",
    text: "Thank you, finally someone who remembers us! Teachers are backbones. Train the teachers, connect the schools, then watch what becomes possible."
  },
  {
    label: "AI & Technology Reply",
    text: "Safe use of AI for learning, I am a big fan of, obviously. But here is the thing: AI is only as useful as the connection it runs on. No internet, no AI."
  },
  {
    label: "Homework Joke Pivot",
    text: "You have given me a lot to work with – this is a case of students giving their teacher homework. What a clever class you are! Look at what we can accomplish..."
  },
  {
    label: "Telehealth Investment Case",
    text: "Furthermore, our mapped health facilities will become nodes of modern telehealth, bringing specialist pediatric care and life-saving diagnoses directly to rural villages, bypassing hours of difficult travel."
  },
  {
    label: "Commitment Card Intro",
    text: "My lovely class monitors in blue shirts will come to each of your tables in a moment. They have cards. They want to hear your answer tonight."
  },
  {
    label: "Share commitments",
    text: "Now, I'd love some of you to share what you wrote down. Raise your hand and share please. Don't be shy."
  },
  {
    label: "Walk the Talk",
    text: "These are fantastic ideas. Please do not let this be just a talk. We all must walk the talk - our children are counting on you."
  }
];

export default function OperatorConsole() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [customSubtitles, setCustomSubtitles] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Sync state from local Next.js session API via 400ms polling
  useEffect(() => {
    let active = true;

    async function pollState() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) throw new Error("Local session API failed");
        const data = await res.json();
        if (active) {
          setSession(data);
          setLoading(false);
          setOffline(false);
        }
      } catch (error) {
        console.error("Local session watch failed:", error);
        if (active) {
          setOffline(true);
          setLoading(false);
        }
      }
    }

    pollState();
    const interval = setInterval(pollState, 400);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Set general session state via local Next.js POST
  const updateSession = async (updates: Partial<SessionState>) => {
    if (!session) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Local session API POST failed");
      const data = await res.json();
      setSession(data.state);
    } catch (err) {
      console.error("Error syncing operator state:", err);
      setOffline(true);
    } finally {
      setSyncing(false);
    }
  };

  // Helper to trigger specific video segments
  const triggerSegment = (segmentId: string, text: string) => {
    updateSession({
      currentSegmentId: segmentId,
      mode: "video",
      subtitles: text,
      isPlaying: true,
      activeVisual: "none", // clear any temporary slides
    });
  };

  // Helper to activate live standby mode (nods)
  const triggerStandby = () => {
    updateSession({
      currentSegmentId: "listening",
      mode: "avatar",
      subtitles: "(Rohey is listening and nodding encouragingly to the audience...)",
      gesture: "none",
    });
  };

  // Trigger physical gesture signals on stage
  const triggerGesture = (gesture: string) => {
    let actionText = "";
    if (gesture === "left") actionText = "*Points left toward tables 1 & 2*";
    else if (gesture === "right") actionText = "*Points right toward tables 3 & 4*";
    else if (gesture === "center") actionText = "*Looks and gestures center class*";
    else actionText = "(Listening and nodding attentively...)";

    updateSession({
      gesture,
      subtitles: actionText,
    });
  };

  // Submit typed custom subtitles
  const submitCustomSubtitles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubtitles.trim()) return;
    updateSession({ subtitles: customSubtitles.trim() });
    setCustomSubtitles("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <span className="text-xs font-mono text-slate-400">ESTABLISHING STREAM FEED...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-4 px-6 md:px-12 flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200/20"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900">Operator Command Panel</h1>
            <p className="text-[10px] text-slate-400 font-mono">ROHEY REMOTE // LOCAL STATE CONTROL</p>
          </div>
        </div>

        {/* Network Status Capsule */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-100/50 border-slate-200/30">
          {offline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-mono text-rose-600 uppercase font-semibold">OFFLINE</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-600 uppercase font-semibold">SYNCD</span>
            </>
          )}
          {syncing && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping ml-1" />}
        </div>
      </header>

      {/* ── MAIN TACTILE COMMAND CONSOLE ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE MONITORS & STATE STATUS (SPAN 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Active Status Display Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-5">
              CURRENT STREAM CONSOLE
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">PLAYBACK STATE:</span>
                <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  session?.isPlaying ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                }`}>
                  {session?.isPlaying ? "STREAMING" : "PAUSED"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">AVATAR MODE:</span>
                <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  session?.mode === "video" ? "text-indigo-700 bg-indigo-50 border border-indigo-100" : "text-purple-700 bg-purple-50 border border-purple-100"
                }`}>
                  {session?.mode === "video" ? "CHAPTER VIDEO" : "LIVE STANDBY"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">ACTIVE CHAPTER:</span>
                <span className="text-xs font-mono font-bold text-slate-700 uppercase bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200/30">
                  {session?.currentSegmentId || "NONE"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">ACTIVE OVERLAY:</span>
                <span className="text-xs font-mono font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 border border-pink-100 rounded">
                  {session?.activeVisual?.toUpperCase() || "NONE"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-400 font-medium">ACTIVE GESTURE:</span>
                <span className="text-xs font-mono font-semibold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 border border-purple-100 rounded">
                  {session?.gesture || "NONE"}
                </span>
              </div>
            </div>

            {/* Micro Monitor Playback Bar */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => updateSession({ isPlaying: true })}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wider border transition-all cursor-pointer ${
                  session?.isPlaying 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10 hover:bg-emerald-600" 
                    : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Play size={14} className="fill-current" /> PLAY STREAM
              </button>
              <button
                onClick={() => updateSession({ isPlaying: false })}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wider border transition-all cursor-pointer ${
                  !session?.isPlaying 
                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10 hover:bg-amber-600" 
                    : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Pause size={14} className="fill-current" /> PAUSE STREAM
              </button>
            </div>
          </div>

          {/* Real-time Subtitles Monitor Box */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">
              PROJECTOR SUBTITLES PREVIEW
            </h2>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 min-h-[100px] flex items-center justify-center text-center">
              <p className="text-base font-serif italic text-slate-700 leading-relaxed">
                &ldquo;{session?.subtitles || "(No subtitles active)"}&rdquo;
              </p>
            </div>
          </div>

          {/* Stage Quick Launcher Links */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/30 flex items-center justify-center text-indigo-500">
                <Eye size={18} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-800">PROJECTOR WINDOW</h4>
                <p className="text-[10px] text-slate-400 leading-none mt-1">Open stage on dining projector</p>
              </div>
            </div>
            <Link 
              href="/stage" 
              target="_blank"
              className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/30 px-4 py-2.5 rounded-xl transition-all"
            >
              OPEN STAGE →
            </Link>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTROLLER ACTIONS MATRIX (SPAN 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Action 1: Pre-recorded Chapters */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                TRIGGER PRE-RECORDED CHAPTERS
              </h2>
              <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/30 font-semibold uppercase">
                VIDEO CHANNELS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRE_RECORDED_SEGMENTS.map((seg) => {
                const isActive = session?.currentSegmentId === seg.id && session?.mode === "video";
                return (
                  <button
                    key={seg.id}
                    onClick={() => triggerSegment(seg.id, seg.defaultSubtitles)}
                    className={`text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100/80 hover:border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold font-sans tracking-tight ${isActive ? "text-white" : "text-slate-800"}`}>{seg.name}</span>
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isActive ? "bg-white text-black font-bold" : "bg-slate-200/50 text-slate-400"
                      }`}>
                        {isActive ? "LIVE" : "TRIGGER"}
                      </span>
                    </div>
                    <p className={`text-[10px] leading-relaxed font-sans ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                      {seg.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action 2: Live Standby & Active Nod Loops */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                LIVE AVATAR - INTERACTION CONSOLE
              </h2>
              <button
                onClick={triggerStandby}
                className={`py-2 px-4 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase transition-all cursor-pointer ${
                  session?.mode === "avatar" && session?.currentSegmentId === "listening"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/10 border border-purple-600"
                    : "bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
                }`}
              >
                ACTIVATE LIVE LISTENING LOOP
              </button>
            </div>

            {/* Grid for gestures & pointing */}
            <div className="border-t border-slate-100 pt-5 mb-6">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3.5">
                Avatar Physical Pointing & Gestures
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => triggerGesture("left")}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    session?.gesture === "left" && session?.mode === "avatar"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Hand size={13} className="rotate-[-45deg]" /> Point Left
                </button>
                <button
                  onClick={() => triggerGesture("center")}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    session?.gesture === "center" && session?.mode === "avatar"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Hand size={13} /> Look Center
                </button>
                <button
                  onClick={() => triggerGesture("right")}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    session?.gesture === "right" && session?.mode === "avatar"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Hand size={13} className="rotate-[45deg]" /> Point Right
                </button>
                <button
                  onClick={() => triggerGesture("none")}
                  className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Clear Pose
                </button>
              </div>
            </div>

            {/* Visual Slide-In Controllers */}
            <div className="border-t border-slate-100 pt-5">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3.5">
                Projector Overlay Visual Panels
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => updateSession({ activeVisual: "map" })}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    session?.activeVisual === "map"
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Map size={13} /> Show Giga Map
                </button>
                <button
                  onClick={() => updateSession({ activeVisual: "kenya" })}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    session?.activeVisual === "kenya"
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <ImageIcon size={13} /> Show Kenya Photo
                </button>
                <button
                  onClick={() => updateSession({ activeVisual: "unicef" })}
                  className={`py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    session?.activeVisual === "unicef"
                      ? "bg-pink-600 text-white border-pink-600"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Sparkles size={13} /> Show UNICEF Logo
                </button>
                <button
                  onClick={() => updateSession({ activeVisual: "none" })}
                  className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Clear Visual
                </button>
              </div>
            </div>
          </div>

          {/* Action 3: Speech Quick-Saves */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-5">
              LIVE SPEECH SUBTITLE QUICK-SENDS
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {LIVE_SPEECH_QUICK_SENS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => updateSession({ subtitles: item.text, mode: "avatar" })}
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 text-xs font-medium text-slate-700 hover:text-indigo-900 transition-all cursor-pointer max-w-full truncate"
                  title={item.text}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action 4: Custom Subtitles Transmitter */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">
              CUSTOM SUBTITLE TRANSMITTER
            </h2>
            <form onSubmit={submitCustomSubtitles} className="flex gap-3">
              <input
                type="text"
                value={customSubtitles}
                onChange={(e) => setCustomSubtitles(e.target.value)}
                placeholder="Type what Rohey says live in the room..."
                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
              />
              <button
                type="submit"
                className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Send size={13} className="stroke-[2.5]" /> TRANSMIT
              </button>
            </form>
          </div>

        </div>

      </main>

      {/* ── FOOTER STATUS ── */}
      <footer className="w-full bg-white border-t border-slate-200/50 py-5 text-center mt-12">
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          Supported by Kids Edutainment Labs × UNICEF Gambia © 2026
        </p>
      </footer>

    </div>
  );
}
