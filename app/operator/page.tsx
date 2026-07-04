"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, Pause, Wifi, WifiOff, Sparkles, Image as ImageIcon, Map, HelpCircle, 
  MessageSquare, Send, CheckCircle, ArrowLeft, RefreshCw, Hand, Eye,
  ChevronDown, ChevronUp, Tv, Activity, Layers
} from "lucide-react";
import Link from "next/link";

interface Segment {
  id: string;
  name: string;
  desc: string;
  subtitles: string;
  action: string;
  isStandby?: boolean;
  visual?: "none" | "map" | "kenya" | "unicef";
}

interface Chapter {
  number: number;
  title: string;
  desc: string;
  segments: Segment[];
  gestures?: { id: string; label: string; desc: string }[];
  quickSends?: { label: string; text: string }[];
}

interface SessionState {
  currentSegmentId: string;
  mode: "video" | "avatar";
  gesture: string;
  subtitles: string;
  isPlaying: boolean;
  activeVisual?: "none" | "map" | "kenya" | "unicef";
  updatedAt: number;
}

// Full 16-Segment Technical Deconstruction grouped into 6 collapsible chapters
const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Chapter 1: Pre-Activity Intro",
    desc: "Establish classroom atmosphere, welcome guests, highlight the unconnected map dilemma, and prompt discussion.",
    segments: [
      {
        id: "walk_in",
        name: "1. Settle Down & Walk In",
        desc: "Rohey walks into the quiet classroom, sets her folder down, and asks the noisy children to quiet down.",
        subtitles: "(Class bell rings, children making noise in the background as Rohey walks in, sets down her folder, and gestures for silence) Good evening, class. Right, everyone, settle down please... Sshh, settle down.",
        action: "walk_in"
      },
      {
        id: "welcome",
        name: "2. Welcome & Greetings",
        desc: "Welcomes the room, greets Nafisa, Stephane, Franklin, Karl, Imma by name.",
        subtitles: "Good evening, my lovely class! Oh, look at this! I must say, I was not expecting our classroom to be so packed to the brim tonight! It warms my heart to see every single seat taken. Welcome, welcome, everyone. Seeing you all gathered here this evening truly, truly makes me so incredibly happy. Nafisa, my dear, it is absolutely lovely to have you with us in the front row tonight. Stephane, Turker, good evening to you both, thank you for coming! Ah, Franklin, and Karl! You made it as well! I am so glad you found your way to your desks. And Imma, welcome, welcome, it is a absolute pleasure to have you here in the room with us. To every single one of you, thank you all so much for taking the time to join us tonight. Welcome to my humble classroom. I know, I know... looking around, it is not much to look at, is it? There is no modern projector on the ceiling, no fancy tablets on the desks, and certainly no high-speed internet connection. Some mornings, we do not even have enough pieces of chalk to write on this old chalkboard. But you know what? Every single morning, without fail, they come. Thirty-two children, walking from all over, arriving right on time, with big smiles on their faces and hope in their eyes. Why? Because they believe with all their hearts that this simple classroom is a door. A magical door that could open opportunities to anywhere in this wide world.",
        action: "welcome"
      },
      {
        id: "breaks_heart",
        name: "3. Heartbreak Map Dilemma",
        desc: "Presents Giga's school mapping. Highlights unconnected schools as tragic red dots on Giga map.",
        subtitles: "But you know what truly breaks my heart, class? Right now, at this very moment, that door does not open very far for my students. Let me tell you some numbers. There are exactly 1,978 basic and secondary level schools scattered across our beautiful country of The Gambia. Every single one of these schools has now been mapped, down to the exact GPS coordinates, thanks to the incredible Giga Initiative—which is a wonderful global partnership led by UNICEF and the International Telecommunication Union. Because of them, we can see every single school on the digital map. We know exactly where they are, we know their locations. But class, look closely. Can you spot the grand, tragic problem? Let me help you find it. Look at all those red dots covering the screen. Those red dots represent schools that do not have a single byte of internet connection. Can you see them? They are everywhere. This is the reality. Seeing them is a massive step forward, yes, but seeing does not equal solving. Our school right here is one of those unconnected red dots. As a teacher, I know deep inside that I should be preparing my eager students for the digital demands of the 21st century. But tell me, how can I teach them about the internet, about coding, or about world-changing technology when we do not even have a connection? There is only so much a teacher can do with just a chalkboard and books. We need the tools!",
        action: "breaks_heart",
        visual: "map" as const
      },
      {
        id: "redesign_question",
        name: "4. Write Redesign Question",
        desc: "Writes the redesign prompt on blackboard, dismissing guests to dinner table breaks.",
        subtitles: "So tonight, my dear class, I am not going to stand up here and lecture you like a traditional teacher. No, no. Instead, I am going to do what the very best teachers do. I am going to ask you a question that challenges your imagination. I want you to think about this deeply: If every single child in The Gambia had high-speed, reliable internet access right at their school desk, how would you re-design education from the ground up? Think about this question. Let it sit in your mind. I want you to discuss it actively with your classmates at your tables. Share your wildest, most ambitious ideas. Oh! Just look at the clock! The time has flown by, and it is already time for our first break. Enjoy your discussions, talk to each other, and I will be back shortly to hear all of your brilliant ideas. Class dismissed for the break!",
        action: "redesign_question"
      }
    ]
  },
  {
    number: 2,
    title: "Chapter 2: Settle Down & Standby",
    desc: "Active live interactive session tools. Control physical pointing overrides and standby listening loops.",
    segments: [
      {
        id: "listening",
        name: "5. Active Listening Standby Loop",
        desc: "Rohey is quiet, nods her head, blinks naturally, and smiles. Use when guests are talking at their tables.",
        subtitles: "(Rohey stands silently at the front of the classroom, breathing naturally, blinking, and nodding encouragingly to the audience...)",
        action: "listening",
        isStandby: true
      }
    ],
    gestures: [
      { id: "left", label: "Point Left", desc: "Point hand to Tables 1 & 2" },
      { id: "center", label: "Look Center", desc: "Look forward in approval" },
      { id: "right", label: "Point Right", desc: "Point hand to Tables 3 & 4" },
      { id: "none", label: "Clear Pose", desc: "Reset to nodding standby loop" }
    ]
  },
  {
    number: 3,
    title: "Chapter 3: Interactive Dialogue",
    desc: "Interactive feedback segment to respond to audience suggestions dynamically.",
    segments: [
      {
        id: "interactive_feedback",
        name: "9. Interactive Student Feedback",
        desc: "Responds to classroom without walls, teachers are backbone, and no internet = no AI.",
        subtitles: "Alright, class, quiet down and settle back into your seats, please. I hope you all had a wonderful break and had enough time to really think about and discuss my question, because class is officially back in session! So, tell me, my brilliant students, what did you discuss at your tables? Come on, do not be shy with me! It is just a friendly classroom discussion; it is not like you are presenting in front of a giant room full of high-level ministers and international diplomats, right? Oh, wait... actually, you are! But do not worry, you are doing great. Yes, tell me... Ah! Remote learning! A classroom without walls! That is beautiful! Imagine a student in Basse connected in real-time to a classroom in Banjul, or even Dakar, or Lagos! And what is that? Teacher training? Thank you! Thank you so much! Finally, someone who remembers us, the hard-working teachers! If we train the teachers first, and then connect the schools, just imagine the incredible things that will become possible. And did someone say Artificial Intelligence? Yes! The safe, ethical use of AI is something I am a huge fan of, obviously. But let us be honest, class: AI is only as useful as the internet connection it actually runs on. If there is no internet, there is absolutely no AI. It is that simple, and that critical.",
        action: "interactive_feedback"
      }
    ],
    quickSends: [
      { label: "Class Settle Down", text: "Alright, class, quiet down and settle back into your seats, please. I hope you all had a wonderful break and had enough time to discuss my question." },
      { label: "Don't Be Shy", text: "So, tell me, what did you discuss at your tables? Come on, do not be shy! It is just a classroom discussion; it is not like you are presenting to ministers!" },
      { label: "Classroom Without Walls", text: "Yes! Remote learning! A classroom without walls! Imagine a student in Basse connected in real-time to a classroom in Banjul, Dakar, or Lagos!" },
      { label: "Teachers are Backbones", text: "Thank you! Teachers are backbones. If we train the teachers first, and then connect the schools, just watch what becomes possible." },
      { label: "No Internet, No AI", text: "AI is only as useful as the connection it runs on. If there is no internet, there is absolutely no AI. It is that simple, and that critical." },
      { label: "Homework Joke", text: "You have given me a lot of fantastic ideas to process here. This is a classic case of the students giving their teacher homework! What a clever class you are." }
    ]
  },
  {
    number: 4,
    title: "Chapter 4: The Giga Story",
    desc: "Present global Giga metrics and Gambia mapping status, and overlay high-fidelity network map.",
    segments: [
      {
        id: "giga_story",
        name: "10. Global Giga Impact Story",
        desc: "Highlights Sierra Leone's 90% cost drop and Darlene coding in Kenya's Kakuma camp.",
        subtitles: "Wow! You have really given me a lot of fantastic ideas to process here. This is a classic case of the students giving their teacher homework! What a clever, clever class you are. But let me tell you a secret: what you have just imagined and discussed is not just a dream. It is already being accomplished in real life all around the globe by Giga! Let us look at Sierra Leone, for example. The cost of connecting a single school dropped from a massive twelve thousand dollars down to just one thousand five hundred dollars per year—that is an incredible ninety percent drop in upfront and running costs! This changed the entire game, making internet connectivity affordable and sustainable for long-term growth. And let us travel to the Kakuma refugee camp in Kenya. There, a young girl named Darlene is learning to code, building websites, and imagining a vibrant professional future far, far beyond the physical boundaries of the camp. In fact, across Kenya, Giga has connected six hundred and fifty-nine schools, reaching over four hundred and twenty-five thousand students! You see, when school connectivity is done right, it is not just about technology. It becomes pure, living hope for a better future.",
        action: "giga_story",
        visual: "kenya" as const
      },
      {
        id: "gambia_mapping",
        name: "11. Gambia Mapping Completed",
        desc: "Pride in completed mapping. 'What we need now is the doing.'",
        subtitles: "And what about right here at home in our beloved country of The Gambia? Things are moving fast! In May, our very own Vice President officially signed our letter of interest to join Giga. That signature kicked off a massive, nationwide mapping exercise. And now, as we speak, every single one of those one thousand nine hundred and seventy-eight schools is fully mapped and visible on the platform! Even better, our technical vocational institutions and community health facilities are being added to the map right now, which helps us share and reduce the upfront infrastructure costs for everyone. We have successfully completed the mapping. We have finished the detailed planning. What we need now, my friends, is the doing. The action! Think about that. Oh, look at the time again! It is time for another break. Please, enjoy your wonderful meal. But when you come back to your desks, we are going to talk about something a little more serious, but incredibly important for the future of our youth.",
        action: "gambia_mapping"
      },
      {
        id: "giga_map_view",
        name: "12. Display Gambia Giga Map View",
        desc: "Forces a fullscreen, high-resolution upscaled node map overlay. Silent visual focus.",
        subtitles: "(High-fidelity Gambia Giga Node Map displayed on screen, showing all school connections across the regions)",
        action: "giga_map_view",
        visual: "map" as const
      }
    ]
  },
  {
    number: 5,
    title: "Chapter 5: Connected Classroom Climax",
    desc: "Crescendo transition. Transforming the physical space, digital skills, telehealth, and commitment cards.",
    segments: [
      {
        id: "classroom_transformed",
        name: "13. Connected Classroom Transformed",
        desc: "Visual transformation of bare room to tech-enabled hub. No speech, upbeat climax audio.",
        subtitles: "(Classroom transforms before our eyes. Colorful walls, interactive whiteboards, kids holding tablets, coding and smiling...)",
        action: "classroom_transformed"
      },
      {
        id: "turning_point",
        name: "14. Sincere Turning Point Address",
        desc: "Sincere address: invest in 60% youth, digital skills, and pediatric telehealth clinic nodes.",
        subtitles: "I truly hope that what you have seen and heard tonight felt real to you. Because let me tell you, it can be absolutely real! We are standing at a historic turning point. The schools of The Gambia are mapped, the partners are ready, and UNICEF is standing right here with us. The only thing that is missing now is the final, most crucial ingredient: You. Your support, your commitment. And let us be very clear, this is not about charity. Not at all. This is a high-return investment! In a country where over sixty percent of our entire population is under the age of twenty-five, the return on this investment is not just financial. The return is the next generation of proud Gambian engineers, scientists, doctors, and tech leaders, fully equipped to build leading industries right here at home rather than risking their precious lives on dangerous journeys abroad. Furthermore, connecting our mapped health facilities will turn them into modern nodes of telehealth, bringing specialist pediatric medical care directly to our most remote rural villages. This is the future we are investing in.",
        action: "turning_point"
      },
      {
        id: "final_commitment",
        name: "15. Whiteboard Commitment Cards",
        desc: "Writes final question, asks table monitors in blue shirts to distribute commitment cards.",
        subtitles: "So, class, as your teacher tonight, I have one final question for you. And this time, I am absolutely not going to let you answer it over dinner or discuss it later! The question is written right here on my whiteboard: What concrete, actionable thing can you and your organization do right now to help connect every single school, health facility, and technical training center in The Gambia? To help you answer, my lovely class monitors wearing the blue shirts will be coming to each of your tables in just a moment. They are handing out commitment cards. We want to hear your real answers tonight, before you leave this classroom. Please write down your best ideas and commitments, and I would love for some of you to stand up and share them with the class. Raise your hand high, and let us hear your voice!",
        action: "final_commitment"
      }
    ],
    quickSends: [
      { label: "Blue Shirt Monitors", text: "My lovely class monitors in blue shirts will come to each of your tables in a moment. They have cards. They want to hear your answer tonight, before you leave this classroom." },
      { label: "Share Commitments", text: "Please write down ideas, and I'd love some of you to share what you wrote. Raise your hand and share please." },
      { label: "Walk the Talk", text: "These are fantastic ideas. Please do not let this be just a talk. We all must walk the talk - our children are counting on you." }
    ]
  },
  {
    number: 6,
    title: "Chapter 6: Parting Lesson",
    desc: "The emotional closing, bow, wave, and final dinner dismissal.",
    segments: [
      {
        id: "class_dismissed",
        name: "16. Parting Lesson & Dismissal",
        desc: "Final humble teacher parting lesson, bows gracefully, waves goodbye, class dismissed.",
        subtitles: "Oh, wow! These are absolutely fantastic, inspiring ideas and commitments! My heart is so incredibly warm hearing your voices tonight. But please, please do not let this be just another evening of talk. We must all walk the talk together—because our children, our future, are counting on every single one of us in this room. You know, when I first started my journey as a teacher, a wise mentor told me something I will never forget. They said: Rohey, the very best teachers do not just give their students answers. No, they give them the right questions, and the courage to act upon them. Well, class, you have had the right question in front of you all evening. My thirty-two eager students in The Gambia are counting on your courage to act. Thank you all, and class is officially dismissed.",
        action: "class_dismissed",
        visual: "unicef" as const
      }
    ]
  }
];


export default function OperatorConsole() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [customSubtitles, setCustomSubtitles] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Accordion state to collapse/expand Chapters (1 open by default)
  const [collapsedChapters, setCollapsedChapters] = useState<Record<number, boolean>>({
    1: false,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  });

  const toggleChapter = (num: number) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

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
  const triggerSegment = (segmentId: string, text: string, visual?: "none" | "map" | "kenya" | "unicef") => {
    updateSession({
      currentSegmentId: segmentId,
      mode: "video",
      subtitles: text,
      isPlaying: true,
      activeVisual: visual || "none", // set specific overlay or clear it
    });
  };

  // Helper to activate live standby mode (listening loop)
  const triggerStandby = () => {
    updateSession({
      currentSegmentId: "listening",
      mode: "avatar",
      subtitles: "(Rohey stands silently at the front of the classroom, breathing naturally, blinking, and nodding encouragingly to the audience...)",
      gesture: "none",
      activeVisual: "none",
      isPlaying: true
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
      mode: "avatar",
      currentSegmentId: "listening",
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

  // Get responsive mockup avatar picture for operators preview card
  const getMockupSrc = () => {
    if (session?.currentSegmentId === "giga_map_view" || session?.activeVisual === "map") {
      return "/media/giga-gambia-map.png";
    }
    if (session?.activeVisual === "kenya") {
      return "/media/darlene-coding.jpg";
    }
    return "/rohey-avatar.jpg";
  };

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
            <h1 className="text-sm font-semibold tracking-tight text-slate-900">Operator Command Deck</h1>
            <p className="text-[10px] text-slate-400 font-mono">16 DECONSTRUCTED SEGMENTS // GLASS LIGHT ARCHITECTURE</p>
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
              <Wifi className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span className="text-[10px] font-mono text-indigo-600 uppercase font-semibold">SYNCED</span>
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

            {/* Simulated Stream Visual Monitor Mockup */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200/50 bg-slate-950 mb-6 group shadow-inner">
              <img 
                src={getMockupSrc()} 
                alt="Rohey Avatar Standby" 
                className="w-full h-full object-cover opacity-75 blur-[0.5px] transition-all group-hover:scale-105 duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              
              {/* Overlay badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="bg-red-500 text-white font-mono text-[8px] font-bold tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE PREVIEW
                </span>
                <span className="bg-black/60 text-slate-200 font-mono text-[8px] tracking-widest px-2 py-0.5 rounded border border-white/5">
                  {session?.mode === "video" ? "CHAPTER VIDEO" : "LIVE STANDBY"}
                </span>
              </div>

              {/* Mini visual indicator of gestures */}
              {session?.mode === "avatar" && session?.gesture && session?.gesture !== "none" && (
                <div className="absolute top-3 right-3 bg-purple-600 text-white font-mono text-[8px] tracking-widest px-2 py-0.5 rounded border border-purple-500">
                  GESTURE: {session.gesture.toUpperCase()}
                </div>
              )}

              {/* Subtitles Overlay */}
              <div className="absolute bottom-3 left-4 right-3 text-left">
                <p className="text-[10px] text-white font-serif font-medium line-clamp-2 leading-relaxed drop-shadow-md">
                  &ldquo;{session?.subtitles || "(No subtitles)"}&rdquo;
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">PLAYBACK STATE:</span>
                <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  session?.isPlaying ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                }`}>
                  {session?.isPlaying ? "STREAMING" : "PAUSED"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">AVATAR MODE:</span>
                <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                  session?.mode === "video" ? "text-indigo-700 bg-indigo-50 border border-indigo-100" : "text-purple-700 bg-purple-50 border border-purple-100"
                }`}>
                  {session?.mode === "video" ? "CHAPTER VIDEO" : "LIVE STANDBY"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">ACTIVE SEGMENT:</span>
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200/30">
                  {session?.currentSegmentId || "NONE"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-medium">ACTIVE OVERLAY:</span>
                <span className="text-[10px] font-mono font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 border border-pink-100 rounded">
                  {session?.activeVisual?.toUpperCase() || "NONE"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-400 font-medium">ACTIVE GESTURE:</span>
                <span className="text-[10px] font-mono font-semibold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 border border-purple-100 rounded">
                  {session?.gesture || "NONE"}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => updateSession({ isPlaying: true })}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wider border transition-all cursor-pointer ${
                  session?.isPlaying 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10 hover:bg-emerald-600" 
                    : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Play size={13} className="fill-current" /> PLAY
              </button>
              <button
                onClick={() => updateSession({ isPlaying: false })}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold tracking-wider border transition-all cursor-pointer ${
                  !session?.isPlaying 
                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10 hover:bg-amber-600" 
                    : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Pause size={13} className="fill-current" /> PAUSE
              </button>
            </div>
          </div>

          {/* Real-time Subtitles Monitor Box */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">
              PROJECTOR SUBTITLES PREVIEW
            </h2>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 min-h-[90px] flex items-center justify-center text-center">
              <p className="text-sm font-serif italic text-slate-700 leading-relaxed">
                &ldquo;{session?.subtitles || "(No subtitles active)"}&rdquo;
              </p>
            </div>
          </div>

          {/* Custom Subtitles Transmitter */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">
              CUSTOM SUBTITLE TRANSMITTER
            </h2>
            <form onSubmit={submitCustomSubtitles} className="flex gap-2.5">
              <input
                type="text"
                value={customSubtitles}
                onChange={(e) => setCustomSubtitles(e.target.value)}
                placeholder="Type dynamic text for Rohey..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
              >
                <Send size={12} className="stroke-[2.5]" /> SEND
              </button>
            </form>
          </div>

          {/* Stage Quick Launcher Links */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/30 flex items-center justify-center text-indigo-500">
                <Eye size={16} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-800">PROJECTOR WINDOW</h4>
                <p className="text-[10px] text-slate-400 leading-none mt-1">Open stage on dining projector</p>
              </div>
            </div>
            <Link 
              href="/stage" 
              target="_blank"
              className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/30 px-3.5 py-2 rounded-xl transition-all"
            >
              OPEN STAGE →
            </Link>
          </div>

        </div>

        {/* RIGHT COLUMN: COLLAPSIBLE CHAPTER ACCORDIONS (SPAN 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4 w-full">
          
          <div className="flex justify-between items-center mb-1 bg-white border border-slate-100 rounded-xl px-5 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <Layers size={14} className="text-indigo-500" />
              DINNER PRODUCTION CHRONOLOGY
            </h2>
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
              6 CHAPTER FLOW
            </span>
          </div>

          {/* Chronological Chapters */}
          {CHAPTERS.map((ch) => {
            const isCollapsed = collapsedChapters[ch.number];
            return (
              <div 
                key={ch.number}
                className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-200"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleChapter(ch.number)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/30">
                        STEP {ch.number}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 tracking-tight">{ch.title}</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-sans pr-4 font-normal">
                      {ch.desc}
                    </p>
                  </div>
                  <div className="mt-1 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </div>
                </button>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="border-t border-slate-100/80 p-5 bg-slate-50/40 space-y-4 animate-scale-up">
                    
                    {/* Chapter Segments Trigger Grid */}
                    <div className="space-y-3">
                      <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                        Chapters Audio/Video Segments
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ch.segments.map((seg) => {
                          const isActive = session?.currentSegmentId === seg.id && session?.mode === (seg.isStandby ? "avatar" : "video");
                          return (
                            <button
                              key={seg.id}
                              onClick={() => {
                                if (seg.isStandby) {
                                  triggerStandby();
                                } else {
                                  triggerSegment(seg.id, seg.subtitles, seg.visual);
                                }
                              }}
                              className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-950/15"
                                  : "bg-white border-slate-100 hover:bg-indigo-50/20 hover:border-indigo-100 text-slate-800"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-[11px] font-bold font-sans tracking-tight leading-tight ${isActive ? "text-white" : "text-slate-800"}`}>
                                  {seg.name}
                                </span>
                                <span className={`text-[7px] font-mono uppercase px-1.5 py-0.5 rounded leading-none ${
                                  isActive ? "bg-white text-black font-bold" : "bg-slate-100 text-slate-400 border border-slate-200/20"
                                }`}>
                                  {isActive ? "LIVE" : "TRIGGER"}
                                </span>
                              </div>
                              <p className={`text-[10px] leading-relaxed font-sans line-clamp-2 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                                {seg.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chapter Gestures Grid (Chapter 2 specific) */}
                    {"gestures" in ch && ch.gestures && (
                      <div className="border-t border-slate-100/80 pt-4">
                        <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2.5">
                          Active Physical Pointer Overrides (Live Avatar)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {ch.gestures.map((ges) => {
                            const isGestureActive = session?.gesture === ges.id && session?.mode === "avatar";
                            return (
                              <button
                                key={ges.id}
                                onClick={() => triggerGesture(ges.id)}
                                className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                  isGestureActive
                                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/15"
                                    : "bg-white border-slate-100 hover:bg-purple-50 hover:border-purple-100 text-slate-600 hover:text-slate-800"
                                }`}
                              >
                                <Hand size={12} className={`mb-1 ${
                                  ges.id === "left" ? "rotate-[-45deg]" : ges.id === "right" ? "rotate-[45deg]" : ""
                                }`} />
                                <span>{ges.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Chapter Quick-Sends (Chapters 3 & 5 specific) */}
                    {"quickSends" in ch && ch.quickSends && (
                      <div className="border-t border-slate-100/80 pt-4">
                        <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2.5">
                          Quick Presets Live Subtitles
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ch.quickSends.map((qs) => {
                            const isPresetCurrent = session?.subtitles === qs.text && session?.mode === "avatar";
                            return (
                              <button
                                key={qs.label}
                                onClick={() => updateSession({ subtitles: qs.text, mode: "avatar", gesture: "none" })}
                                className={`px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all max-w-full truncate cursor-pointer ${
                                  isPresetCurrent
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-slate-600 hover:text-slate-800"
                                }`}
                                title={qs.text}
                              >
                                {qs.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Visual overlays in Chapter 4 / Segment 12 */}
                    {ch.number === 4 && (
                      <div className="border-t border-slate-100/80 pt-4">
                        <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2.5">
                          Chapter Visual Overlay Slides
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <button
                            onClick={() => updateSession({ activeVisual: "map" })}
                            className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              session?.activeVisual === "map"
                                ? "bg-pink-600 text-white border-pink-600 shadow-md"
                                : "bg-white border-slate-100 hover:bg-pink-50 hover:border-pink-100 text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            <Map size={11} /> Giga Map
                          </button>
                          <button
                            onClick={() => updateSession({ activeVisual: "kenya" })}
                            className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              session?.activeVisual === "kenya"
                                ? "bg-pink-600 text-white border-pink-600 shadow-md"
                                : "bg-white border-slate-100 hover:bg-pink-50 hover:border-pink-100 text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            <ImageIcon size={11} /> Kenya Photo
                          </button>
                          <button
                            onClick={() => updateSession({ activeVisual: "unicef" })}
                            className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              session?.activeVisual === "unicef"
                                ? "bg-pink-600 text-white border-pink-600 shadow-md"
                                : "bg-white border-slate-100 hover:bg-pink-50 hover:border-pink-100 text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            <Sparkles size={11} /> UNICEF Logo
                          </button>
                          <button
                            onClick={() => updateSession({ activeVisual: "none" })}
                            className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                          >
                            Clear overlay
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}

        </div>

      </main>

      {/* ── FOOTER STATUS ── */}
      <footer className="w-full bg-white border-t border-slate-200/50 py-5 text-center mt-12">
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          Supported by Kids Edutainment Labs × UNICEF Gambia © 2026
        </p>
      </footer>

      {/* Styles for scaleUp micro-animation inside operator page */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleUp {
          from {
            transform: scale(0.97);
            opacity: 0.85;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }} />

    </div>
  );
}
