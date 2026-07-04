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

const VIDEOS: Record<string, { file: string; prompt: string }> = {
  welcome: {
    file: "rohey-hello.mp4",
    prompt: "Bring this avatar to life. Rohey is a friendly young Gambian female teacher. She is speaking, smiling, and waving hello warmly to her students, welcoming them to her classroom in The Gambia. Camera remains completely static. The background classroom, seating, blackboard, and pupils behind remain absolutely identical to the reference image."
  },
  listening: {
    file: "rohey-listening.mp4",
    prompt: "Bring this avatar to life. Rohey is in silent listening mode. She is looking forward, nodding her head slightly, blinking naturally, and listening attentively with a warm, caring facial expression. Camera remains completely static. The background classroom remains absolutely identical to the reference image. No speech, just natural silent listening and nodding."
  },
  giga: {
    file: "rohey-giga.mp4",
    prompt: "Bring this avatar to life. Rohey is explaining the Giga story with enthusiasm. She is gesturing with her hands, talking, smiling, and teaching her class about connecting 1,978 schools in Gambia and dropping connectivity costs. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  feedback: {
    file: "rohey-feedback.mp4",
    prompt: "Bring this avatar to life. Rohey is showing positive feedback and nodding in approval. She is smiling broadly and nodding her head, expressing delight at a student's answer. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  closing: {
    file: "rohey-closing.mp4",
    prompt: "Bring this avatar to life. Rohey is giving a humble parting lesson, smiling warmly, bowing gracefully, and waving goodbye to the class as she dismisses them. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  }
};

const AUDIOS: Record<string, { file: string; text: string; style: string; voice: string }> = {
  welcome: {
    file: "rohey-hello.wav",
    text: "Good evening, class. I wasn't expecting the class to be so full... Nafisa, lovely to have you with us... Stephane, Turker, good evening. Ah, Franklin, Karl, and Imma! Welcome... Welcome to my classroom. I know it's not much... There are 1,978 schools in The Gambia. Look at all the red dots on the map—they are unconnected. If every child in The Gambia had internet access at school, how would you re-design education? Think about the question. Discuss it during the break. I will be back.",
    style: "Voice profile: A vibrant young Gambian lady's voice with a clear, friendly, and authentic Gambian accent. Note: Previous attempts sounded weird, slow, and mechanical. Avoid flat or robotic delivery! Use a natural, lively, and warm human conversational tone.",
    voice: "Kore"
  },
  giga: {
    file: "rohey-giga.wav",
    text: "What you have imagined is already being accomplished. In Sierra Leone, connecting a school dropped from $12,000 to just $1,500 per year—a 90% drop! In Kakuma refugee camp in Kenya, Darlene is learning to code. Across Kenya, Giga connected 659 schools... And here in The Gambia? Our VP signed the letter of interest in May. Every single one of the 1,978 schools is now mapped. Data from health facilities is being added. What we need now is the doing.",
    style: "Voice profile: An inspiring, passionate, and vibrant young Gambian lady's voice with an authentic Gambian accent. Note: Previous attempts sounded weird, slow, and mechanical. Speak naturally and enthusiastically with beautiful, fluent human pacing.",
    voice: "Kore"
  },
  feedback: {
    file: "rohey-feedback.wav",
    text: "Right class, settle down please... So tell me class, what did you discuss? Don't be shy, it's not like you're talking in front of a room full of diplomats! Yes, remote learning—a classroom without walls! Imagine Basse connected to Dakar, Lagos... Teacher training? Finally, someone remembers us! No internet, no AI. It's that simple.",
    style: "Voice profile: A highly engaging, conversational, and vibrant young Gambian lady's voice with a strong, welcoming Gambian accent. Note: The previous delivery sounded weird, flat, or robotic. Speak with dynamic, natural, warm human expression.",
    voice: "Kore"
  },
  closing: {
    file: "rohey-closing.wav",
    text: "You know, when I started teaching, someone told me: the best teachers don't give students answers. They give them the right question and the courage to act on it. You have had the question all evening. My thirty-two students are counting on your courage. Class dismissed.",
    style: "Voice profile: A moving, warm, and inspiring young Gambian lady's voice with an authentic Gambian accent and friendly emotional clarity. Note: Previous outputs sounded weirdly slow or artificial. Ensure natural, fluent human pacing and gentle warmth.",
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
