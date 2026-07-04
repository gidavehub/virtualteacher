const fs = require("fs");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");

const PROJECT = "davelabs-tools";
const LOCATION = "us-east4";
const TTS = "gemini-3.1-flash-tts-preview";
const OUT_DIR = path.join(__dirname, "..", "public", "media");

const GAMBIAN_VOICE_PROFILE = "Voice profile: A vibrant, highly energetic, and excited young Gambian lady's voice with a clear, friendly, and authentic Gambian accent. Note: Previous outputs sounded too robotic, too slow, or had foreign accents. Avoid flat, flat, or robotic delivery! Use a natural, lively, and warm human conversational tone. Pace her speech at a slightly faster and highly passionate talking speed, full of excitement.";

const AUDIOS = {
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
  }
};

const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });

async function getAccessToken() {
  const client = await auth.getClient();
  const t = await client.getAccessToken();
  if (!t.token) throw new Error("No access token");
  return t.token;
}

function pcmToWav(pcmBase64, sampleRate) {
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

async function vertexFetch(endpoint, body) {
  const token = await getAccessToken();
  const url = `https://aiplatform.googleapis.com/v1beta1/projects/${PROJECT}/locations/global${endpoint}`;
  
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

async function generateAllAudios() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  for (const [id, audio] of Object.entries(AUDIOS)) {
    const filePath = path.join(OUT_DIR, audio.file);
    if (fs.existsSync(filePath)) {
      console.log(`Audio asset already exists: ${audio.file}`);
      continue;
    }

    console.log(`Generating TTS audio: ${audio.file}...`);
    try {
      const promptText = `${audio.style}:\n\n${audio.text}`;
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

      const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
      if (!part) throw new Error("No audio returned in response");

      const rateMatch = part.mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      
      const wavBuffer = pcmToWav(part.data, sampleRate);
      fs.writeFileSync(filePath, wavBuffer);
      console.log(`Successfully generated and saved: ${audio.file}`);
    } catch (err) {
      console.error(`Failed to generate audio for ${id}:`, err);
    }
  }
}

generateAllAudios();
