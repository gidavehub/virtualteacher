import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "davelabs-tools";
const LOCATION = "us-east4";

const VEO = "gemini-omni-flash-preview";
const TTS = "gemini-3.1-flash-tts-preview";

const OUT_DIR = path.join(process.cwd(), "public", "media");
const PUBLIC_DIR = path.join(process.cwd(), "public");

// Voice profile instructions specifically designed for typical energetic Gambian accent
const GAMBIAN_VOICE_PROFILE = "Voice profile: A vibrant, highly energetic, and excited young Gambian lady's voice with a clear, friendly, and authentic Gambian accent. Note: Previous outputs sounded too robotic, too slow, or had foreign accents. Avoid flat, flat, or robotic delivery! Use a natural, lively, and warm human conversational tone. Pace her speech at a slightly faster and highly passionate talking speed, full of excitement.";

const VIDEOS: Record<string, { file: string; prompt: string }> = {
  walk_in: {
    file: "rohey-walk-in.mp4",
    prompt: "Bring this avatar to life. Rohey is a friendly young Gambian female teacher. She is walking into a bare, dimly lit classroom carrying a folder. There is child noise around. She sets the folder down on her desk, looks directly at the camera, smiles, and raises her hand in a warm, gentle gesture to ask everyone to quiet down. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  welcome: {
    file: "rohey-hello.mp4",
    prompt: "Bring this avatar to life. Rohey is speaking, smiling, and waving hello warmly, welcoming everyone and greeting Nafisa, Stephane, Franklin, Karl, and Imma with massive energy and a broad, friendly smile. Camera remains completely static. The background classroom, seating, blackboard, and pupils behind remain absolutely identical to the reference image."
  },
  breaks_heart: {
    file: "rohey-breaks-heart.mp4",
    prompt: "Bring this avatar to life. Rohey is explaining what breaks her heart. She looks sincere, serious, and slightly saddened, gesturing slowly with her hands, then points toward the map behind her. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  redesign_question: {
    file: "rohey-question.mp4",
    prompt: "Bring this avatar to life. Rohey stands in front of the chalkboard, holding a piece of chalk, writing on the board, and then turns back to face the camera, looking at her watch with a friendly smile, asking the students to discuss the question. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  listening: {
    file: "rohey-listening.mp4",
    prompt: "Bring this avatar to life. Rohey is in silent listening standby mode. She is looking forward, nodding her head slightly, blinking naturally, and listening attentively with a warm, caring, and encouraging facial expression. Camera remains completely static. The background classroom remains absolutely identical to the reference image. No speech, just natural silent listening and nodding."
  },
  pointing_left: {
    file: "rohey-pointing-left.mp4",
    prompt: "Bring this avatar to life. Rohey stands looking at the camera, smiles warmly, and points her hand gracefully to the left side of the room (Tables 1 & 2), nodding in encouragement. Camera remains completely static. The background classroom remains absolutely identical to the reference image. Silent loop."
  },
  pointing_center: {
    file: "rohey-looking-center.mp4",
    prompt: "Bring this avatar to life. Rohey stands looking forward, nods in approval, and gestures with both hands towards the center of the room, smiling and listening attentively. Camera remains completely static. The background classroom remains absolutely identical to the reference image. Silent loop."
  },
  pointing_right: {
    file: "rohey-pointing-right.mp4",
    prompt: "Bring this avatar to life. Rohey stands looking at the camera, smiles warmly, and points her hand gracefully to the right side of the room (Tables 3 & 4), nodding in encouragement. Camera remains completely static. The background classroom remains absolutely identical to the reference image. Silent loop."
  },
  interactive_feedback: {
    file: "rohey-feedback.mp4",
    prompt: "Bring this avatar to life. Rohey is showing enthusiastic positive feedback. She is smiling broadly, nodding her head in approval, and speaking energetically, delighted at the student's answer about remote learning. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  giga_story: {
    file: "rohey-giga.mp4",
    prompt: "Bring this avatar to life. Rohey is explaining the Giga story with high enthusiasm. She is gesturing with her hands, talking, smiling, and teaching her class about connecting schools in Sierra Leone and Kenya, with photos of connected schools on the background screen. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  gambia_mapping: {
    file: "rohey-gambia.mp4",
    prompt: "Bring this avatar to life. Rohey stands explaining the progress in The Gambia with pride and confidence. She is talking, smiling warmly, and gesturing naturally to emphasize that every school is mapped. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  classroom_transformed: {
    file: "connected-classroom.mp4",
    prompt: "Bring this avatar to life. Rohey stands in front of her newly transformed, bright, and colorful digital classroom. There are tablets on every desk and a projector. She is beaming with quiet pride, smiling warmly, and looking directly at the camera. Camera remains completely static."
  },
  turning_point: {
    file: "rohey-turning-point.mp4",
    prompt: "Bring this avatar to life. Rohey speaks with deep sincerity, hope, and determination. She is gesturing with her hands to emphasize her points about investing in the next generation of engineers and entrepreneurs. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  final_commitment: {
    file: "rohey-commitment.mp4",
    prompt: "Bring this avatar to life. Rohey smiles warmly, gestures to her table monitors in blue shirts, and writes the commitment question on her whiteboard. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  class_dismissed: {
    file: "rohey-closing.mp4",
    prompt: "Bring this avatar to life. Rohey is giving a humble parting lesson, smiling warmly, bowing gracefully, and waving goodbye to the class as she dismisses them. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  }
};

const AUDIOS: Record<string, { file: string; text: string; style: string; voice: string }> = {
  welcome: {
    file: "rohey-hello.wav",
    text: "Good evening, class! I wasn’t expecting the class to be so full. Welcome, everyone. Seeing you here truly makes me happy. Nafisa, lovely to have you with us this evening. Stephane, Turker, good evening. Ah Franklin, and Karl too! Welcome, I'm so glad you came. And Imma, welcome, it's a pleasure to have you in the room. Everyone, thank you all so much for joining us. Welcome to my classroom. I know it’s not much to look at. No projector. No tablet. No internet. Some days, not even enough chalk. But every morning, they come. Thirty-two children, right on time. Because they believe that this classroom is a door. A door that could open opportunities to anywhere.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  breaks_heart: {
    file: "rohey-breaks-heart.wav",
    text: "You know what breaks my heart? Right now, that door doesn’t open very far. There are 1,978 basic and secondary level schools in The Gambia. Every single one of them has now been mapped thanks to the Giga Initiative, a global partnership led by UNICEF and the ITU. We can see every school on the map. We know where they are. Class, can you spot the problem? Let me help, look at all the red dots, they are schools that are not connected. Can you see them on the map? Seeing is a step forward, but seeing does not equal solving. Our school is one of those red dots. I know I should be preparing my students for the 21st century, but there's only so much we can do without digital tools.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  redesign_question: {
    file: "rohey-question.wav",
    text: "So tonight, I am not going to lecture you. I am going to do what teachers do best. If every child in The Gambia had internet access at school, how would you re-design education? Think about the question. Sit with it. Discuss it with your classmates at your table during the break. Ah, look at the time! It’s time for a break. I will be back.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  interactive_feedback: {
    file: "rohey-feedback.wav",
    text: "Right class, settle down please. I hope you had enough time to think about my question, because class is back in session. So tell me class, what did you discuss? Don’t be shy. It’s just a classroom discussion; it’s not like you’re talking in front of a room full of ministers and diplomats! Yes, remote learning—a classroom without walls! Imagine Basse connected to Banjul, Dakar, Lagos... Teacher training? Thank you, finally someone who remembers us! Train the teachers, connect the schools, then watch what becomes possible. AI? Safe use of AI I am a big fan of, obviously. But AI is only as useful as the connection it runs on. No internet, no AI. It’s that simple.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  giga_story: {
    file: "rohey-giga.wav",
    text: "You have given me a lot to work with – this is a case of students giving their teacher homework. What a clever class you are! What you have imagined and discussed is already being accomplished around the globe. In Sierra Leone, connecting a school dropped from 12,000 dollars to just 1,500 dollars per year—a 90% drop! This changed everything, making connectivity affordable and sustainable. And in Kakuma refugee camp in Kenya, Darlene is learning to code, websites are being built, and students are imagining a future far beyond the camp. Across Kenya, Giga connected 659 schools, reaching 425,000 students. When connectivity is done right, it becomes hope.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  gambia_mapping: {
    file: "rohey-gambia.wav",
    text: "And here in The Gambia? Our Vice President signed our letter of interest in May. That kicked off a nationwide mapping exercise and now every single one of the 1,978 schools is on the map. TVET institutions and health facilities are being added to also reduce upfront costs. We have done the mapping. We have done the planning. What we need now is the doing. Think about that. Oh, it’s time for another break. Enjoy your meal. When you come back, we are going to talk about something a little more serious, but very important.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  turning_point: {
    file: "rohey-turning-point.wav",
    text: "I hope that felt real. Because it can be. We are at a turning point. The schools are mapped, partners are ready, and UNICEF is here. What is missing is the final ingredient: You. Not because this is charity, but because this is an investment. In a country where over 60 percent is under 25, the return is not just financial. The return is the next generation of Gambian engineers, scientists, doctors, and leaders, ready to build leading sectors at home rather than risking everything on a dangerous journey abroad. Plus, mapped health facilities will become nodes of modern telehealth, bringing specialist pediatric care directly to rural villages.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  final_commitment: {
    file: "rohey-commitment.wav",
    text: "So, I have one final question. And this time, I am not letting you answer over dinner. The question is: What can you and your organization do to help connect every school, health facility and TVET facility in The Gambia? My lovely class monitors in blue shirts will come to each table in a moment. They have cards. They want to hear your answer tonight, before you leave this classroom. Please write down ideas, and I'd love some of you to share what you wrote. Raise your hand and share please.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  },
  class_dismissed: {
    file: "rohey-closing.wav",
    text: "These are fantastic ideas for contribution. My heart is warm. Please do not let this be just a talk. We all must walk the talk—our children are counting on you. You know, when I started teaching, someone told me: the best teachers don't give students answers. They give them the right question and the courage to act on it. You have had the question all evening. My thirty-two students are counting on your courage. Class dismissed.",
    style: GAMBIAN_VOICE_PROFILE,
    voice: "Kore"
  }
};

const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });

async function getAccessToken() {
  const client = await auth.getClient();
  const t = await client.getAccessToken();
  if (!t.token) throw new Error("No access token — run: gcloud auth application-default login");
  return t.token;
}

function pcmToWav(pcmBase64: string, sampleRate: number) {
  const pcm = Buffer.from(pcmBase64, "base64");
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2; // mono, 16-bit
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function vertexFetch(endpoint: string, body: any) {
  const token = await getAccessToken();
  let url;
  if (endpoint.includes("gemini-3.1-flash") || endpoint.includes("gemini-omni-flash-preview") || endpoint.includes("gemini-2.5-flash")) {
    url = `https://aiplatform.googleapis.com/v1beta1/projects/${PROJECT}/locations/global${endpoint}`;
  } else {
    url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}${endpoint}`;
  }
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vertex Fetch failed ${res.status}: ${text}`);
  }
  return res.json();
}

export async function POST(request: Request) {
  try {
    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    // Ensure output directories exist
    if (!fs.existsSync(OUT_DIR)) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    if (type === "audio") {
      const audio = AUDIOS[id];
      if (!audio) {
        return NextResponse.json({ error: `Audio ID "${id}" not found` }, { status: 404 });
      }

      console.log(`Generating TTS audio locally: ${audio.file}`);
      const promptText = audio.style ? `${audio.style}:\n\n${audio.text}` : audio.text;

      const data = await vertexFetch(`/publishers/google/models/${TTS}:generateContent`, {
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: audio.voice },
            },
          },
        },
      });

      const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
      if (!part) throw new Error("No audio returned in response candidates");

      const rateMatch = part.mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      
      const wavBuffer = pcmToWav(part.data, sampleRate);
      const filePath = path.join(OUT_DIR, audio.file);
      fs.writeFileSync(filePath, wavBuffer);

      return NextResponse.json({ success: true, file: audio.file, path: `/media/${audio.file}` });
    } else if (type === "video") {
      const vid = VIDEOS[id];
      if (!vid) {
        return NextResponse.json({ error: `Video ID "${id}" not found` }, { status: 404 });
      }

      console.log(`Generating video locally: ${vid.file}`);

      // Attempt to load baseline image from public/rohey-avatar.jpg
      let masterImgBase64 = "";
      const avatarPath = path.join(PUBLIC_DIR, "rohey-avatar.jpg");
      if (fs.existsSync(avatarPath)) {
        masterImgBase64 = fs.readFileSync(avatarPath).toString("base64");
      } else {
        return NextResponse.json({ error: `Master baseline image rohey-avatar.jpg not found in public/` }, { status: 400 });
      }

      const ai = new GoogleGenAI({
        vertexai: true,
        project: PROJECT,
        location: "global"
      });

      const interaction = await ai.interactions.create({
        model: VEO,
        input: [
          {
            type: "user_input",
            content: [
              {
                type: "image",
                data: masterImgBase64,
                mime_type: "image/jpeg"
              },
              {
                type: "text",
                text: vid.prompt
              }
            ]
          }
        ]
      });

      if (!interaction || !interaction.output_video || !interaction.output_video.data) {
        throw new Error("No video returned in interaction response");
      }

      const videoBuffer = Buffer.from(interaction.output_video.data, "base64");
      const filePath = path.join(OUT_DIR, vid.file);
      fs.writeFileSync(filePath, videoBuffer);

      return NextResponse.json({ success: true, file: vid.file, path: `/media/${vid.file}` });
    }

    return NextResponse.json({ error: "Invalid type. Must be 'audio' or 'video'" }, { status: 400 });

  } catch (error: any) {
    console.error("Local generation failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
