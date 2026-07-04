const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const PROJECT = "davelabs-tools";
const VEO = "gemini-omni-flash-preview";

const OUT_DIR = path.join(__dirname, "..", "public", "media");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const VIDEOS = {
  walk_in: {
    file: "rohey-walk-in.mp4",
    prompt: "Bring this avatar to life. Rohey is a friendly young Gambian female teacher. She is walking into a bare, dimly lit classroom carrying a folder. There is child noise around. She sets the folder down on her desk, looks directly at the camera, smiles, and raises her hand in a warm, gentle gesture to ask everyone to quiet down. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  breaks_heart: {
    file: "rohey-breaks-heart.mp4",
    prompt: "Bring this avatar to life. Rohey is explaining what breaks her heart. She looks sincere, serious, and slightly saddened, gesturing slowly with her hands, then points toward the map behind her. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  redesign_question: {
    file: "rohey-question.mp4",
    prompt: "Bring this avatar to life. Rohey stands in front of the chalkboard, holding a piece of chalk, writing on the board, and then turns back to face the camera, looking at her watch with a friendly smile, asking the students to discuss the question. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
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
  gambia_mapping: {
    file: "rohey-gambia.mp4",
    prompt: "Bring this avatar to life. Rohey stands explaining the progress in The Gambia with pride and confidence. She is talking, smiling warmly, and gesturing naturally to emphasize that every school is mapped. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  turning_point: {
    file: "rohey-turning-point.mp4",
    prompt: "Bring this avatar to life. Rohey speaks with deep sincerity, hope, and determination. She is gesturing with her hands to emphasize her points about investing in the next generation of engineers and entrepreneurs. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  },
  final_commitment: {
    file: "rohey-commitment.mp4",
    prompt: "Bring this avatar to life. Rohey smiles warmly, gestures to her table monitors in blue shirts, and writes the commitment question on her whiteboard. Camera remains completely static. The background classroom remains absolutely identical to the reference image."
  }
};

async function generateAllVideos() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Load baseline avatar image
  const avatarPath = path.join(PUBLIC_DIR, "rohey-avatar.jpg");
  if (!fs.existsSync(avatarPath)) {
    console.error("Master baseline avatar image not found at public/rohey-avatar.jpg!");
    return;
  }
  const masterImgBase64 = fs.readFileSync(avatarPath).toString("base64");

  const ai = new GoogleGenAI({
    vertexai: true,
    project: PROJECT,
    location: "global"
  });

  for (const [id, vid] of Object.entries(VIDEOS)) {
    const filePath = path.join(OUT_DIR, vid.file);
    if (fs.existsSync(filePath)) {
      console.log(`Video asset already exists: ${vid.file}`);
      continue;
    }

    console.log(`Generating video for: ${vid.file}...`);
    try {
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
      fs.writeFileSync(filePath, videoBuffer);
      console.log(`Successfully generated and saved video: ${vid.file}`);
    } catch (err) {
      console.error(`Failed to generate video for ${id}:`, err);
    }
  }
}

generateAllVideos();
