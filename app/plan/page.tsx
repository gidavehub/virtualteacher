"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Play, Pause, Download, Sliders, Layers, ChevronRight, HelpCircle, AlertCircle, Coins, ArrowRight } from "lucide-react";

// Helper to format track durations nicely
function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// 16 Deconstructed lesson segments matching the master timeline
const LESSON_SEGMENTS = [
  {
    id: "walk_in",
    title: "1. Settle Down & Walk In",
    description: "Setting: Dimly lit classroom, child noise. Rohey walks into frame, sets down her folder, and asks the class to quiet down.",
    videoUrl: "/media/rohey-walk-in.mp4",
    audioUrl: null, // silent/venue sound
    transcript: "(Class bell rings, children making noise in the background as Rohey walks in, sets down her folder, and gestures for silence) Good evening, class. Right, everyone, settle down please... Sshh, settle down.",
    prompt: "Bring this avatar to life. Rohey walks into a bare, dimly lit classroom, carrying a folder. She sets the folder down on her desk, looks directly at the camera, smiles, and asks everyone to quiet down."
  },
  {
    id: "welcome",
    title: "2. Welcome & Greeting",
    description: "Rohey stands warmly at her desk, welcoming the class and greeting key guests by name (Nafisa, Stephane, Franklin, Karl, Imma).",
    videoUrl: "/media/rohey-hello.mp4",
    audioUrl: "/media/rohey-hello.wav",
    transcript: "Good evening, class. I wasn’t expecting the class to be so full. Welcome, everyone. Seeing you here truly makes me happy. Nafisa, lovely to have you with us this evening. Stephane, Turker, good evening. Ah Franklin, and Karl too! Welcome, I'm so glad you came. And Imma, welcome, it's a pleasure to have you in the room. Everyone, thank you all so much for joining us. Welcome to my classroom. I know it’s not much to look at. No projector. No tablet. No internet. Some days, not even enough chalk. But every morning, they come. Thirty-two children, right on time. Because they believe that this classroom is a door. A door that could open opportunities to anywhere.",
    prompt: "Bring this avatar to life. Rohey is speaking, smiling, waving hello, and welcoming her guests warmly with a big smile."
  },
  {
    id: "breaks_heart",
    title: "3. The 1,978 Unconnected Schools",
    description: "Rohey introduces the Giga mapping progress but points out that the vast majority of schools are offline red dots.",
    videoUrl: "/media/rohey-breaks-heart.mp4",
    audioUrl: "/media/rohey-breaks-heart.wav",
    transcript: "You know what breaks my heart? Right now, that door doesn’t open very far. There are 1,978 basic and secondary level schools in The Gambia. Every single one of them has now been mapped thanks to the Giga Initiative, a global partnership led by UNICEF and the ITU. We can see every school on the map. We know where they are. Class, can you spot the problem? Let me help, look at all the red dots, they are schools that are not connected. Can you see them on the map? Seeing is a step forward, but seeing does not equal solving. Our school is one of those red dots. I know I should be preparing my students for the 21st century, but there's only so much we can do without digital tools.",
    prompt: "Bring this avatar to life. Rohey explains the Giga map with a sincere, serious, and slightly saddened look, pointing toward the background map."
  },
  {
    id: "redesign_question",
    title: "4. The Redesign Question",
    description: "Rohey poses the core question, writes it on the blackboard, and dismisses them for their table break discussion.",
    videoUrl: "/media/rohey-question.mp4",
    audioUrl: "/media/rohey-question.wav",
    transcript: "So tonight, I am not going to lecture you. I am going to do what teachers do best. If every child in The Gambia had internet access at school, how would you re-design education? Think about the question. Sit with it. Discuss it with your classmates at your table during the break. Ah, look at the time! It’s time for a break. I will be back.",
    prompt: "Bring this avatar to life. Rohey writes the question on the chalkboard, then turns back to the camera, looking at her watch with a friendly smile."
  },
  {
    id: "listening",
    title: "5. Active Standby Loop",
    description: "Silent active listening standby loop. Natural blinking, breathing, and nodding used throughout dialogue intervals.",
    videoUrl: "/media/rohey-listening.mp4",
    audioUrl: null,
    transcript: "(Rohey stands silently at the front of the classroom, breathing naturally, blinking, and nodding encouragingly to the audience...)",
    prompt: "Bring this avatar to life. Rohey is in silent listening standby mode. She is looking forward, nodding her head slightly, blinking naturally, and listening attentively with a warm, caring facial expression."
  },
  {
    id: "pointing_left",
    title: "6. Gesture Point Left",
    description: "Silent active loop used when pointing toward tables 1 & 2 on the left side of the dinner room.",
    videoUrl: "/media/rohey-pointing-left.mp4",
    audioUrl: null,
    transcript: "(Rohey smiles warmly and gestures with her hand towards the left side of the room, nodding in agreement)",
    prompt: "Bring this avatar to life. Rohey stands looking at the camera, smiles warmly, and points her hand gracefully to the left side of the room, nodding in encouragement."
  },
  {
    id: "pointing_center",
    title: "7. Gesture Look Center",
    description: "Silent active loop used when pointing or gesturing towards the center of the dinner room.",
    videoUrl: "/media/rohey-looking-center.mp4",
    audioUrl: null,
    transcript: "(Rohey looks directly forward, nodding in approval and gesturing with both hands towards the center of the class)",
    prompt: "Bring this avatar to life. Rohey stands looking forward, nods in approval, and gestures with both hands towards the center of the room, smiling."
  },
  {
    id: "pointing_right",
    title: "8. Gesture Point Right",
    description: "Silent active loop used when pointing toward tables 3 & 4 on the right side of the dinner room.",
    videoUrl: "/media/rohey-pointing-right.mp4",
    audioUrl: null,
    transcript: "(Rohey smiles warmly and gestures with her hand towards the right side of the room, nodding in agreement)",
    prompt: "Bring this avatar to life. Rohey stands looking at the camera, smiles warmly, and points her hand gracefully to the right side of the room, nodding in encouragement."
  },
  {
    id: "interactive_feedback",
    title: "9. Interactive Student Feedback",
    description: "Settle down phrase responding to student suggestions (Basse connected to Dakar, teachers backbones, simple AI).",
    videoUrl: "/media/rohey-feedback.mp4",
    audioUrl: "/media/rohey-feedback.wav",
    transcript: "Right class, settle down please. I hope you had enough time to think about my question, because class is back in session. So tell me class, what did you discuss? Don’t be shy. It’s just a classroom discussion; it’s not like you’re talking in front of a room full of ministers and diplomats! Yes, remote learning—a classroom without walls! Imagine Basse connected to Banjul, Dakar, Lagos... Teacher training? Thank you, finally someone who remembers us! Train the teachers, connect the schools, then watch what becomes possible. AI? Safe use of AI I am a big fan of, obviously. But AI is only as useful as the connection it runs on. No internet, no AI. It’s that simple.",
    prompt: "Bring this avatar to life. Rohey shows enthusiastic positive feedback, smiling broadly, nodding in approval, and speaking energetically, delighted at student answers."
  },
  {
    id: "giga_story",
    title: "10. The Global Giga Story",
    description: "Pivots to share global Giga results: Sierra Leone's 90% cost drop, Darlene learning coding in Kenya.",
    videoUrl: "/media/rohey-giga.mp4",
    audioUrl: "/media/rohey-giga.wav",
    transcript: "You have given me a lot to work with – this is a case of students giving their teacher homework. What a clever class you are! What you have imagined and discussed is already being accomplished around the globe. In Sierra Leone, connecting a school dropped from 12,000 dollars to just 1,500 dollars per year—a 90% drop! This changed everything, making connectivity affordable and sustainable. And in Kakuma refugee camp in Kenya, Darlene is learning to code, websites are being built, and students are imagining a future far beyond the camp. Across Kenya, Giga connected 659 schools, reaching 425,000 students. When connectivity is done right, it becomes hope.",
    prompt: "Bring this avatar to life. Rohey explains the Giga story with high enthusiasm, gesturing naturally, smiling, and teaching her class, with photos on the screen behind."
  },
  {
    id: "gambia_mapping",
    title: "11. Gambia Mapping Accomplished",
    description: "Details Gambia progress: VP signed letter of interest, mapping complete, needs the doing.",
    videoUrl: "/media/rohey-gambia.mp4",
    audioUrl: "/media/rohey-gambia.wav",
    transcript: "And here in The Gambia? Our Vice President signed our letter of interest in May. That kicked off a nationwide mapping exercise and now every single one of the 1,978 schools is on the map. TVET institutions and health facilities are being added to also reduce upfront costs. We have done the mapping. We have done the planning. What we need now is the doing. Think about that. Oh, it’s time for another break. Enjoy your meal. When you come back, we are going to talk about something a little more serious, but very important.",
    prompt: "Bring this avatar to life. Rohey stands explaining Gambia mapping progress with pride and confidence, talking, smiling, and gesturing naturally."
  },
  {
    id: "giga_map_view",
    title: "12. Static Map Picture Zoom",
    description: "A high-fidelity upscaled static Giga map showing Gambia nodes, overlaid on the projector screen.",
    videoUrl: "/media/giga-gambia-map.png",
    audioUrl: null, // Just a map display
    transcript: "(A high-fidelity upscaled map of Giga's Gambian nodes fades onto the projector screen, highlighting connected fiber-nodes and mapped institutions.)",
    prompt: "[STATIC IMAGE] High quality 4K upscaled Giga Gambia nodes map showing color codes."
  },
  {
    id: "classroom_transformed",
    title: "13. Classroom Transformed Video",
    description: "Visual climax: Classroom is transformed! Upbeat, full of devices, children coding.",
    videoUrl: "/media/connected-classroom.mp4",
    audioUrl: null,
    transcript: "Tonight, you were asked to imagine something. This is what connectivity looks like. This is what it feels like. Not a statistic. Not a cost model. This.",
    prompt: "Bring this avatar to life. Rohey stands in front of her newly transformed, bright, and colorful digital classroom. Tablets are on desks, and a projector is active. She is beaming with pride."
  },
  {
    id: "turning_point",
    title: "14. Sincere Turning Point",
    description: "Rohey speaks with deep sincerity: investment in the 60% youth, digital skills, and TVET/telehealth nodes.",
    videoUrl: "/media/rohey-turning-point.mp4",
    audioUrl: "/media/rohey-turning-point.wav",
    transcript: "I hope that felt real. Because it can be. We are at a turning point. The schools are mapped, partners are ready, and UNICEF is here. What is missing is the final ingredient: You. Not because this is charity, but because this is an investment. In a country where over 60 percent is under 25, the return is not just financial. The return is the next generation of Gambian engineers, scientists, doctors, and leaders, ready to build leading sectors at home rather than risking everything on a dangerous journey abroad. Plus, mapped health facilities will become nodes of modern telehealth, bringing specialist pediatric care directly to rural villages.",
    prompt: "Bring this avatar to life. Rohey speaks with deep sincerity, hope, and determination, gesturing to emphasize her points about investing in youth and telehealth."
  },
  {
    id: "final_commitment",
    title: "15. Whiteboard Commitment Question",
    description: "Writes final commitment question on whiteboard, asks blue-shirt class monitors to distribute cards.",
    videoUrl: "/media/rohey-commitment.mp4",
    audioUrl: "/media/rohey-commitment.wav",
    transcript: "So, I have one final question. And this time, I am not letting you answer over dinner. The question is: What can you and your organization do to help connect every school, health facility and TVET facility in The Gambia? My lovely class monitors in blue shirts will come to each table in a moment. They have cards. They want to hear your answer tonight, before you leave this classroom. Please write down ideas, and I'd love some of you to share what you wrote. Raise your hand and share please.",
    prompt: "Bring this avatar to life. Rohey smiles warmly, gestures to her table monitors in blue shirts, and writes the commitment question on her whiteboard."
  },
  {
    id: "class_dismissed",
    title: "16. Bow & Dismissal",
    description: "Closing remarks: Best teachers give questions and courage. Warm bow, waving goodbye.",
    videoUrl: "/media/rohey-closing.mp4",
    audioUrl: "/media/rohey-closing.wav",
    transcript: "These are fantastic ideas for contribution. My heart is warm. Please do not let this be just a talk. We all must walk the talk—our children are counting on you. You know, when I started teaching, someone told me: the best teachers don't give students answers. They give them the right question and the courage to act on it. You have had the question all evening. My thirty-two students are counting on your courage. Class dismissed.",
    prompt: "Bring this avatar to life. Rohey is giving a humble parting lesson, smiling warmly, bowing gracefully, and waving goodbye to the class as she dismisses them."
  }
];

// Spoken Audio library browse data (all 9 spoken segments)
const AUDIO_LIBRARY = [
  {
    id: "rohey-hello.wav",
    title: "Welcome & Greeting Audio",
    url: "/media/rohey-hello.wav",
    accent: "Young Gambian Lady Voice, warm, friendly, energetic",
    transcript: "Good evening, class. I wasn’t expecting the class to be so full. Welcome, everyone. Seeing you here truly makes me happy... Nafisa, lovely to have you... Stephane, Turker, Franklin, Karl, Imma! Welcome."
  },
  {
    id: "rohey-breaks-heart.wav",
    title: "The 1,978 Schools Map Audio",
    url: "/media/rohey-breaks-heart.wav",
    accent: "Young Gambian Lady Voice, sincere, slightly saddened, informative",
    transcript: "You know what breaks my heart? Right now, that door doesn’t open very far. There are 1,978 basic and secondary level schools in The Gambia. Every single one has now been mapped... look at all the red unconnected dots."
  },
  {
    id: "rohey-question.wav",
    title: "The Redesign Question Audio",
    url: "/media/rohey-question.wav",
    accent: "Young Gambian Lady Voice, engaging, smiling, dismissal",
    transcript: "If every child in The Gambia had internet access at school, how would you re-design education? Think about the question. Sit with it. Discuss it with your classmates at your table during the break. I will be back."
  },
  {
    id: "rohey-feedback.wav",
    title: "Interactive Student Feedback Audio",
    url: "/media/rohey-feedback.wav",
    accent: "Young Gambian Lady Voice, conversational, highly engaging, approving",
    transcript: "Right class, settle down please... So tell me class, what did you discuss? Don’t be shy... Yes, remote learning—a classroom without walls! Imagine Basse connected to Dakar... AI? AI is only as useful as the connection."
  },
  {
    id: "rohey-giga.wav",
    title: "The Global Giga Story Audio",
    url: "/media/rohey-giga.wav",
    accent: "Young Gambian Lady Voice, passionate, professional pacing, enthusiastic",
    transcript: "You have given me a lot to work with... What you have imagined is already being accomplished. In Sierra Leone, school connection dropped 90%! In Kakuma refugee camp, Darlene is learning to code..."
  },
  {
    id: "rohey-gambia.wav",
    title: "Gambia Mapping Accomplished Audio",
    url: "/media/rohey-gambia.wav",
    accent: "Young Gambian Lady Voice, proud, confident, action-oriented",
    transcript: "And here in The Gambia? Our Vice President signed our letter of interest in May... every single one of the 1,978 schools is now mapped. We have done the mapping. We have done the planning. We need the doing."
  },
  {
    id: "rohey-turning-point.wav",
    title: "Emotional Turning Point Audio",
    url: "/media/rohey-turning-point.wav",
    accent: "Young Gambian Lady Voice, sincere, inspiring, deep emotion",
    transcript: "I hope that felt real. Because it can be. We are at a turning point. Partners ready, UNICEF here. What is missing is You. This is an investment in our 60% youth, telehealth nodes, engineers of tomorrow."
  },
  {
    id: "rohey-commitment.wav",
    title: "Whiteboard Commitment Audio",
    url: "/media/rohey-commitment.wav",
    accent: "Young Gambian Lady Voice, exciting, direct challenge, warm smile",
    transcript: "So, I have one final question. And this time, I am not letting you answer over dinner. What can you and your organization do to help connect every school? Table monitors in blue shirts have commitment cards..."
  },
  {
    id: "rohey-closing.wav",
    title: "Bow & Dismissal Audio",
    url: "/media/rohey-closing.wav",
    accent: "Young Gambian Lady Voice, warm parting lessons, elegant dismissal",
    transcript: "These are fantastic ideas. My heart is warm. Please let's walk the talk... The best teachers don't give answers. They give questions and the courage to act on them. My thirty-two students count on your courage."
  }
];

function ScrollingLessonSection({ 
  title, 
  description, 
  videoUrl, 
  audioUrl, 
  transcript, 
  prompt 
}: { 
  title: string; 
  description: string; 
  videoUrl: string; 
  audioUrl: string | null; 
  transcript: string; 
  prompt: string; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [inView, setInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        threshold: 0.3, 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      video.muted = isMuted;
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [inView, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    const video = videoRef.current;
    if (video) {
      video.muted = nextMute;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div ref={containerRef} className="py-16 md:py-20 w-full max-w-4xl mx-auto flex flex-col items-center text-center px-6 border-b border-neutral-100/50">
      <h3 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight mb-3">
        {title}
      </h3>
      
      <p className="text-slate-500 text-xs md:text-sm max-w-xl leading-relaxed mb-6 font-normal">
        {description}
      </p>

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner mb-5 group">
        {videoUrl.endsWith(".png") || videoUrl.endsWith(".jpg") ? (
          <img src={videoUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            loop
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        )}

        {isMuted && !videoUrl.endsWith(".png") && (
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-slate-800 text-xs font-semibold px-4 py-2 rounded-full shadow-md border border-slate-200/50 flex items-center gap-2 hover:bg-white hover:scale-105 transition-all z-10"
          >
            <svg className="w-3.5 h-3.5 fill-current animate-pulse text-red-500" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            Click to Hear Video Audio
          </button>
        )}
      </div>

      {!videoUrl.endsWith(".png") && !videoUrl.endsWith(".jpg") && (
        <div className="w-full max-w-xl bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm shrink-0 cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-700 block">
                {isPlaying ? "Playing Video" : "Paused"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration || 10)}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full sm:mx-4">
            <div 
              onClick={handleSeek}
              className="relative w-full h-1 bg-slate-200 rounded-full cursor-pointer overflow-hidden hover:h-1.5 transition-all"
            >
              <div 
                className="absolute top-0 left-0 h-full bg-slate-800 transition-all duration-75"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              !isMuted 
                ? "bg-slate-100 border-slate-300 text-slate-800" 
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {isMuted ? "Sound Off" : "Sound On"}
          </button>
        </div>
      )}

      <div className="max-w-xl">
        <p className="text-slate-800 text-sm md:text-base leading-relaxed italic mb-4 font-serif px-4">
          &ldquo;{transcript}&rdquo;
        </p>
        <div className="text-slate-400 text-[10px] font-mono tracking-wide">
          Veo prompt: {prompt}
        </div>
      </div>
    </div>
  );
}

function AudioLibraryPlayer({ 
  title, 
  url, 
  accent, 
  transcript,
  filename
}: { 
  title: string; 
  url: string; 
  accent: string; 
  transcript: string;
  filename: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach((a) => {
        if (a !== audio) a.pause();
      });
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = percentage * duration;
    setCurrentTime(audio.currentTime);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col hover:shadow-md transition-all duration-300">
      <audio ref={audioRef} src={url} />
      
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-left">
          <h4 className="text-xs font-bold text-slate-800 tracking-tight">
            {title}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            File: {filename}
          </span>
        </div>
        
        {/* EQ indicators */}
        <div className="flex items-center gap-0.5 h-4 px-2 bg-slate-50 rounded-full border border-slate-100">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`w-0.5 bg-slate-800 rounded-full ${
                isPlaying ? "animate-wave" : "h-1"
              }`}
              style={{
                animationDelay: `${bar * 0.15}s`,
                height: isPlaying ? undefined : "4px"
              }}
            />
          ))}
        </div>
      </div>

      <div className="text-left mb-4 mt-2">
        <span className="inline-block text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mb-2">
          {accent}
        </span>
        <p className="text-slate-500 text-xs leading-relaxed font-serif italic border-l border-slate-200 pl-3 py-1">
          &ldquo;{transcript}&rdquo;
        </p>
      </div>

      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-50">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-7 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm shrink-0 cursor-pointer"
        >
          {isPlaying ? (
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3 fill-current translate-x-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div 
            onClick={handleSeek}
            className="relative w-full h-1 bg-slate-100 rounded-full cursor-pointer hover:h-1.5 transition-all"
          >
            <div 
              className="absolute top-0 left-0 h-full bg-slate-800"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
        </div>

        <span className="text-[9px] text-slate-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <a
          href={url}
          download={filename}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all ml-1 shrink-0"
        >
          <Download size={12} />
        </a>
      </div>
    </div>
  );
}

// Simulated active state monitor mappings
const CONTROL_STATES = {
  walk_in: {
    name: "1. Settle Class",
    status: "Intro Settle - Speaking",
    video: "rohey-walk-in.mp4",
    rule: "onInit -> Walks in classroom, sets down file",
    waveform: "active",
    transcript: "Good evening, class. Right, everyone, settle down please... Sshh, settle down."
  },
  welcome: {
    name: "2. Welcome Intro",
    status: "Active Greeting - Speaking",
    video: "rohey-hello.mp4",
    rule: "onTrigger -> Greet specific gala VIP guests",
    waveform: "active",
    transcript: "Welcome to my classroom. nafisa, lovely to have you... Stephane, Turker, Franklin, Karl, Imma..."
  },
  listening: {
    name: "5. Active Standby",
    status: "Standby Listening Loop",
    video: "rohey-listening.mp4",
    rule: "onIdle -> Loop while class discusses",
    waveform: "idle",
    transcript: "(Teacher Rohey stands at front, blinking and nodding silent encouragement...)"
  },
  pointing_left: {
    name: "6. Point Left",
    status: "Physical Gesture - Left",
    video: "rohey-pointing-left.mp4",
    rule: "onGestureL -> Smile and gesture to Left Tables",
    waveform: "idle",
    transcript: "*Smiles and points gracefully toward Tables 1 & 2 on the left side of the room*"
  },
  pointing_right: {
    name: "8. Point Right",
    status: "Physical Gesture - Right",
    video: "rohey-pointing-right.mp4",
    rule: "onGestureR -> Smile and gesture to Right Tables",
    waveform: "idle",
    transcript: "*Smiles and points gracefully toward Tables 3 & 4 on the right side of the room*"
  },
  giga_story: {
    name: "10. Giga Story",
    status: "Giga Presentation - Speaking",
    video: "rohey-giga.mp4",
    rule: "onTrigger -> Show Sierra Leone 90% drop & Kenya",
    waveform: "active",
    transcript: "In Sierra Leone, connecting a school dropped nearly 90%! From $12,000 to just $1,500 per year..."
  },
  classroom_transformed: {
    name: "13. Transformed Class",
    status: "Video Playback Climax",
    video: "connected-classroom.mp4",
    rule: "onVideoPlay -> Bright connected room, devices active",
    waveform: "active",
    transcript: "This is what connectivity looks like. This is what it feels like. Not a statistic. Not a cost model. This."
  },
  class_dismissed: {
    name: "16. Class Dismissed",
    status: "Closing Bow - Dismissal",
    video: "rohey-closing.mp4",
    rule: "onEnd -> Bow graceful and dismiss class",
    waveform: "active",
    transcript: "My thirty-two students are counting on your courage. Class dismissed."
  }
} as const;

type ControlStateId = keyof typeof CONTROL_STATES;

export default function ProjectPlan() {
  const [activeControlState, setActiveControlState] = useState<ControlStateId>("welcome");
  const [generatingAsset, setGeneratingAsset] = useState<string | null>(null);
  const [generationResults, setGenerationResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const handleGenerate = async (id: string, type: "audio" | "video") => {
    const key = `${type}-${id}`;
    setGeneratingAsset(key);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGenerationResults(prev => ({ ...prev, [key]: { success: true, error: undefined } }));
      
      const allMedia = document.querySelectorAll("video, audio");
      allMedia.forEach((el: any) => {
        if (el.src && el.src.includes("/media/")) {
          const base = el.src.split("?")[0];
          el.src = `${base}?t=${Date.now()}`;
          el.load();
        }
      });
    } catch (err: any) {
      setGenerationResults(prev => ({ ...prev, [key]: { success: false, error: err.message } }));
    } finally {
      setGeneratingAsset(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Wave bounce helper */}
      <style jsx global>{`
        @keyframes wave-bounce {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-wave {
          animation: wave-bounce 0.8s ease-in-out infinite;
        }
        @keyframes dash-slide {
          to { stroke-dashoffset: -20; }
        }
        .active-path {
          stroke: #4f46e5;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-dasharray: 6, 6;
          animation: dash-slide 1.2s linear infinite;
        }
        @keyframes pulse-router {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.45; }
        }
        .pulse-outer {
          animation: pulse-router 2s ease-in-out infinite;
        }
        @keyframes blink-record {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .animate-blink-dot {
          animation: blink-record 1.2s ease-in-out infinite;
        }
        @keyframes bar-grow-1 {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }
        @keyframes bar-grow-2 {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        @keyframes bar-grow-3 {
          0%, 100% { height: 12px; }
          50% { height: 36px; }
        }
        .animate-bar-1 { animation: bar-grow-1 0.6s ease-in-out infinite; }
        .animate-bar-2 { animation: bar-grow-2 0.7s ease-in-out infinite; }
        .animate-bar-3 { animation: bar-grow-3 0.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-5 px-8 md:px-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold tracking-tight text-slate-800">
            AI Virtual Teacher Project Blueprint
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/30">
          UNICEF The Gambia // DECONSTRUCTED TIMELINE
        </span>
      </header>

      {/* Main Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-16">
        
        {/* Intro */}
        <section className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/50 text-[10px] font-semibold text-indigo-600 tracking-wider uppercase mb-5 font-mono">
            Full Production Script Blueprint
          </span>
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 leading-tight tracking-tight">
            16-Segment Modular Orchestration
          </h2>
          <p className="text-slate-500 text-sm md:text-base mt-5 leading-relaxed">
            Review the granular timeline deconstruction. We split the long pre-recorded animations, silent gesture loops, and interactive dialogues into modular assets to allow seamless, sub-second orchestration by the local Operator.
          </p>
        </section>

        {/* ── SCROLLING STORYFLOW ── */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.01)] px-4 py-8 md:p-12 mb-16">
          <h3 className="text-xl font-bold tracking-tight text-slate-800 mb-2 pl-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" /> Storyflow Timeline Preview
          </h3>
          <p className="text-xs text-slate-400 mb-12 pl-4 max-w-xl">
            Each card represents an active chunk. Scroll down to browse the transcripts, static Veo prompts, and dynamic media mappings.
          </p>
          <div className="divide-y divide-slate-100">
            {LESSON_SEGMENTS.map((segment) => (
              <ScrollingLessonSection
                key={segment.id}
                title={segment.title}
                description={segment.description}
                videoUrl={segment.videoUrl}
                audioUrl={segment.audioUrl}
                transcript={segment.transcript}
                prompt={segment.prompt}
              />
            ))}
          </div>
        </section>

        {/* ── CONDITIONAL PIPELINE SCHEMATIC ── */}
        <section className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 mb-16 shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block text-[9px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-mono mb-4">
              Flow telemetry Architecture
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Real-Time Dynamic Gesture Swap
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-3 leading-relaxed">
              Observe how physical gestures swap the standby loop. Choosing a gesture box below overrides the stage's silent nodding, loading pointing-left or pointing-right clips with zero black blinks.
            </p>
          </div>

          {/* Blueprint schematic grid */}
          <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
            <div className="min-w-[800px] px-4">
              
              <svg className="w-full h-24 overflow-visible mb-2" viewBox="0 0 800 90" fill="none">
                <circle cx="400" cy="15" r="15" className="pulse-outer" fill="#4f46e5" />
                
                {/* Sliders flow lines to targets */}
                <path d="M 400 15 L 400 35 L 100 35 L 100 70" stroke={activeControlState === "walk_in" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "walk_in" ? 3 : 2} className={activeControlState === "walk_in" ? "active-path" : ""} />
                <path d="M 400 15 L 400 35 L 200 35 L 200 70" stroke={activeControlState === "welcome" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "welcome" ? 3 : 2} className={activeControlState === "welcome" ? "active-path" : ""} />
                <path d="M 400 15 L 400 35 L 300 35 L 300 70" stroke={activeControlState === "listening" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "listening" ? 3 : 2} className={activeControlState === "listening" ? "active-path" : ""} />
                <path d="M 400 15 L 400 70" stroke={activeControlState === "pointing_left" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "pointing_left" ? 3 : 2} className={activeControlState === "pointing_left" ? "active-path" : ""} />
                <path d="M 400 15 L 400 35 L 500 35 L 500 70" stroke={activeControlState === "pointing_right" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "pointing_right" ? 3 : 2} className={activeControlState === "pointing_right" ? "active-path" : ""} />
                <path d="M 400 15 L 400 35 L 600 35 L 600 70" stroke={activeControlState === "giga_story" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "giga_story" ? 3 : 2} className={activeControlState === "giga_story" ? "active-path" : ""} />
                <path d="M 400 15 L 400 35 L 700 35 L 700 70" stroke={activeControlState === "class_dismissed" ? "#4f46e5" : "#e2e8f0"} strokeWidth={activeControlState === "class_dismissed" ? 3 : 2} className={activeControlState === "class_dismissed" ? "active-path" : ""} />

                <circle cx="400" cy="15" r="7" fill="white" stroke="#4f46e5" strokeWidth="2" />
                <text x="400" y="3" textAnchor="middle" className="text-[8px] font-mono font-bold fill-slate-400">TELEMETRY ROUTER</text>
              </svg>

              <div className="grid grid-cols-7 gap-3">
                {(["walk_in", "welcome", "listening", "pointing_left", "pointing_right", "giga_story", "class_dismissed"] as ControlStateId[]).map((key) => {
                  const state = CONTROL_STATES[key];
                  const isActive = activeControlState === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveControlState(key)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-28 relative ${
                        isActive 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md -translate-y-1" 
                          : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white transition-colors duration-300 ${
                        isActive ? "bg-indigo-500" : "bg-slate-200"
                      }`} />

                      <div className="pt-1.5">
                        <span className={`block text-[8px] font-mono mb-1 uppercase tracking-wider ${isActive ? "text-indigo-400" : "text-slate-400"}`}>
                          {state.rule.split(" -> ")[0]}
                        </span>
                        <h4 className="text-[11px] font-bold leading-tight">
                          {state.name}
                        </h4>
                      </div>

                      <div className="border-t border-slate-100/10 pt-1.5 mt-2">
                        <span className={`block text-[7px] font-mono leading-none truncate ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                          {state.video}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Tactile CRT monitor simulator */}
          <div className="w-full mt-8 bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col md:flex-row gap-6 items-stretch">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
            {/* Monitor */}
            <div className="flex-1 bg-black/60 rounded-xl p-4 border border-slate-900 flex flex-col justify-between relative min-h-[160px]">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-blink-dot" />
                  <span className="text-[9px] font-bold font-mono text-slate-400">TELEMETRY MONITOR</span>
                </div>
                <span className="text-[8px] font-mono text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                  {activeControlState.toUpperCase()}
                </span>
              </div>

              <div className="my-auto py-2 flex flex-col items-center">
                <div className="flex items-end justify-center gap-1.5 h-8 mb-2 px-8 w-full">
                  {CONTROL_STATES[activeControlState].waveform === "active" ? (
                    <>
                      <div className="w-0.5 bg-indigo-400/80 rounded-full animate-bar-1" style={{ animationDelay: "0.1s" }} />
                      <div className="w-0.5 bg-indigo-300 rounded-full animate-bar-2" style={{ animationDelay: "0.3s" }} />
                      <div className="w-0.5 bg-indigo-400 rounded-full animate-bar-3" style={{ animationDelay: "0s" }} />
                      <div className="w-0.5 bg-indigo-500 rounded-full animate-bar-2" style={{ animationDelay: "0.4s" }} />
                      <div className="w-0.5 bg-indigo-400/80 rounded-full animate-bar-1" style={{ animationDelay: "0.2s" }} />
                    </>
                  ) : (
                    <>
                      <div className="w-0.5 h-1 bg-slate-800 rounded-full" />
                      <div className="w-0.5 h-1.5 bg-slate-700 rounded-full" />
                      <div className="w-0.5 h-1 bg-slate-800 rounded-full" />
                    </>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-300 font-mono tracking-wider uppercase">
                  {CONTROL_STATES[activeControlState].status}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 z-10 mt-2">
                <p className="text-[11px] text-slate-300 font-serif leading-relaxed italic">
                  &ldquo;{CONTROL_STATES[activeControlState].transcript}&rdquo;
                </p>
              </div>
            </div>

            {/* Operator Overrides */}
            <div className="w-full md:w-64 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase font-mono text-slate-400">
                  Override Controls
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  Manually trigger state changes to observe the flow paths and subtitle streams.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {(["walk_in", "welcome", "listening", "pointing_left", "pointing_right"] as ControlStateId[]).map((key) => {
                  const state = CONTROL_STATES[key];
                  const isActive = activeControlState === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveControlState(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg border flex items-center justify-between transition-all group cursor-pointer ${
                        isActive
                          ? "bg-white border-white text-slate-900 font-semibold"
                          : "bg-slate-900 border-slate-800/60 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] tracking-tight">{state.name}</span>
                      <span className={`text-[8px] font-mono uppercase ${isActive ? "text-indigo-600" : "text-slate-600"}`}>
                        {isActive ? "ACTIVE" : "STANDBY"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── ON-DEVICE ASSET GENERATOR ── */}
        <section className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 mb-16 shadow-[0_4px_30px_rgba(0,0,0,0.01)] text-center">
          <span className="inline-block text-[9px] font-semibold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-mono mb-4">
            Dynamic local Synthesis
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            On-Device Next.js Asset Generation
          </h3>
          <p className="text-slate-500 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto mb-10">
            Generate and overwrite files completely locally. Under the hood, Next.js calls local Vertex AI pipelines, reads our upscaled <code className="text-xs font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded">rohey-avatar.jpg</code> master frame, synthesizes matching MP4/WAV files, and writes them straight to `/public/media/`.
          </p>

          {/* 16-Segment Generator Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              { id: "walk_in", type: "video", file: "rohey-walk-in.mp4", label: "1. Walk-In Video", desc: "Walking into bare classroom asking kids to settle." },
              { id: "welcome", type: "audio", file: "rohey-hello.wav", label: "2. Greeting Audio", desc: "Vibrant Gambian welcome greeting Nafisa, Stephane..." },
              { id: "welcome", type: "video", file: "rohey-hello.mp4", label: "2. Greeting Video", desc: "Speaking and waving hello warmly with smile." },
              { id: "breaks_heart", type: "audio", file: "rohey-breaks-heart.wav", label: "3. Red Dots Audio", desc: "Details 1,978 schools map and unconnected red dots." },
              { id: "breaks_heart", type: "video", file: "rohey-breaks-heart.mp4", label: "3. Red Dots Video", desc: "Sincere saddened expression pointing to background map." },
              { id: "redesign_question", type: "audio", file: "rohey-question.wav", label: "4. Question Audio", desc: "Ask gala tables: how would you redesign education?" },
              { id: "redesign_question", type: "video", file: "rohey-question.mp4", label: "4. Question Video", desc: "Writing question on blackboard, check watch with smile." },
              { id: "listening", type: "video", file: "rohey-listening.mp4", label: "5. Standby Video", desc: "Silent nodding, blinking standby loop for intervals." },
              { id: "pointing_left", type: "video", file: "rohey-pointing-left.mp4", label: "6. Point Left Video", desc: "Smile and gesture left (Tables 1 & 2)." },
              { id: "pointing_center", type: "video", file: "rohey-looking-center.mp4", label: "7. Look Center Video", desc: "Enthusiastic hand gestures towards center class." },
              { id: "pointing_right", type: "video", file: "rohey-pointing-right.mp4", label: "8. Point Right Video", desc: "Smile and gesture right (Tables 3 & 4)." },
              { id: "interactive_feedback", type: "audio", file: "rohey-feedback.wav", label: "9. Feedback Audio", desc: "Vibrant approval: Basse connected, simple AI." },
              { id: "interactive_feedback", type: "video", file: "rohey-feedback.mp4", label: "9. Feedback Video", desc: "Smile broadly, nod head with enthusiastic approval." },
              { id: "giga_story", type: "audio", file: "rohey-giga.wav", label: "10. Giga Story Audio", desc: "Sierra Leone 90% cost drop, Darlene learning to code." },
              { id: "giga_story", type: "video", file: "rohey-giga.mp4", label: "10. Giga Story Video", desc: "Explaining global Giga stories with enthusiasm." },
              { id: "gambia_mapping", type: "audio", file: "rohey-gambia.wav", label: "11. Gambia Map Audio", desc: "VP signed letter, schools mapped, need the doing." },
              { id: "gambia_mapping", type: "video", file: "rohey-gambia.mp4", label: "11. Gambia Map Video", desc: "Telling mapped schools progress with pride and smiles." },
              { id: "classroom_transformed", type: "video", file: "connected-classroom.mp4", label: "13. Transformed Video", desc: "Transformed digital classroom, devices, beaming pride." },
              { id: "turning_point", type: "audio", file: "rohey-turning-point.wav", label: "14. Sincere Speech Audio", desc: "Turning point, investment in 60% youth, telehealth nodes." },
              { id: "turning_point", type: "video", file: "rohey-turning-point.mp4", label: "14. Sincere Speech Video", desc: "Address camera with deep sincerity, hope, and determination." },
              { id: "final_commitment", type: "audio", file: "rohey-commitment.wav", label: "15. Commitment Audio", desc: "What can your organization do to connect schools?" },
              { id: "final_commitment", type: "video", file: "rohey-commitment.mp4", label: "15. Commitment Video", desc: "Writes question, gestures table monitors in blue shirts." },
              { id: "class_dismissed", type: "audio", file: "rohey-closing.wav", label: "16. Bow/Closing Audio", desc: "Counting on your courage. Class dismissed." },
              { id: "class_dismissed", type: "video", file: "rohey-closing.mp4", label: "16. Bow/Closing Video", desc: "Gives parting lesson, bows gracefully, waves goodbye." }
            ].map((asset) => {
              const key = `${asset.type}-${asset.id}`;
              const isGenerating = generatingAsset === key;
              const result = generationResults[key];

              return (
                <div key={key} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        asset.type === "video" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-purple-50 text-purple-600 border border-purple-100"
                      }`}>
                        {asset.type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-[100px]" title={asset.file}>
                        {asset.file}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight mb-1">
                      {asset.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal mb-4">
                      {asset.desc}
                    </p>
                  </div>

                  <div className="border-t border-slate-200/50 pt-3 mt-auto">
                    {isGenerating ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-600">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerate(asset.id, asset.type as any)}
                        className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold tracking-wide transition-all active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Generate Local
                      </button>
                    )}

                    {result && (
                      <div className={`text-[9px] font-mono font-bold mt-1.5 text-center ${result.success ? "text-emerald-600" : "text-rose-500"}`}>
                        {result.success ? "✓ Done" : `✗ Err: ${result.error}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── AUDIO LIBRARY ARCHIVE ── */}
        <section className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Tuned Gambian Voice Audio Library
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-3">
              Play and preview the 9 high-fidelity spoken dialogue tracks. Our synthesized Gambian lady voice profile resolves previous flat, sluggish, or robotic pacing issues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUDIO_LIBRARY.map((audio) => (
              <AudioLibraryPlayer
                key={audio.id}
                title={audio.title}
                url={audio.url}
                accent={audio.accent}
                transcript={audio.transcript}
                filename={audio.id}
              />
            ))}
          </div>
        </section>

        {/* ── LEDGER COSTS COMPARATIVE ── */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-mono font-bold px-4 py-1.5 uppercase tracking-widest rounded-bl-xl">
            BUDGET ACCOUNTABILITY
          </div>
          
          <div className="max-w-3xl">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block mb-2">
              Financial Architecture Ledger
            </span>
            <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight">
              Production Cost-Benefit Comparative
            </h3>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-8">
              Commercial cloud generation suites lock classrooms into high subscription brackets and custom character upcharges (typically billing $700+ for complex deconstructed timelines). By writing direct, lightweight Next.js pipelines to synthesize on Vertex AI endpoints, Kids Edutainment Labs secures absolute budget transparency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                <span className="text-[8px] font-mono text-slate-500 block mb-1">COMMERCIAL CLOUD SUITE</span>
                <span className="text-lg font-bold text-slate-300 block mb-2">$800.00 average cost</span>
                <p className="text-[10px] text-slate-500 leading-normal">Billed under continuous monthly brackets with custom gesture avatar fees.</p>
              </div>
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 relative">
                <span className="text-[8px] font-mono text-indigo-400 block mb-1">LOCAL NEXT.JS PIPELINE</span>
                <span className="text-lg font-bold text-indigo-400 block mb-2">$350.00 cap budget</span>
                <p className="text-[10px] text-slate-400 leading-normal">One-time development, free standby nodes, and programmatic gesture swaps.</p>
              </div>
              <div className="bg-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-mono text-indigo-200 block mb-1">LEDGER SAVINGS</span>
                  <span className="text-xl font-black block mb-2 font-mono">+$450.00 Saved</span>
                </div>
                <p className="text-[10px] text-indigo-100 leading-normal">Capital redirected straight to Giga offline edutainment initiatives.</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
              *With $170.00 of the credit balance safely deducted for baseline renders, our remaining credit ledger of $180.00 fully secures high-fidelity generation of all 16 modular timelines, preserving full character consistency cards.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/50 py-10 text-center mt-16">
        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
          Supported by Kids Edutainment Labs × UNICEF Gambia © 2026
        </p>
      </footer>

    </div>
  );
}
