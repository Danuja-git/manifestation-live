const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const outputDir = path.join(__dirname, "outputs");
const imageDir = path.join(outputDir, "images");
const videoDir = path.join(outputDir, "videos");
const sessionsFile = path.join(__dirname, "sessions.json");

[outputDir, imageDir, videoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ------------------
// Load / Save Sessions
// ------------------
let sessions = {};

if (fs.existsSync(sessionsFile)) {
  try {
    sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf-8"));
    console.log("Loaded saved sessions from sessions.json");
  } catch (error) {
    console.log("Could not load sessions.json. Starting fresh.");
    sessions = {};
  }
}

function saveSessions() {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

// ------------------
// Middleware
// ------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/outputs", express.static(outputDir));

app.get("/", (req, res) => {
  res.send("FitFrame backend is running");
});

// ------------------
// Claude Helpers
// ------------------
async function callClaude(userPrompt) {
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: process.env.CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error("Claude status:", error.response?.status);
    console.error("Claude data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Claude message:", error.message);
    throw new Error("Claude API failed");
  }
}

function extractJson(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error("No JSON found in:", text);
    throw new Error("AI did not return valid JSON");
  }

  return JSON.parse(jsonMatch[0]);
}

function buildNarrationText(scenes) {
  return scenes.map((scene) => scene.voiceover).join(" ");
}

// ------------------
// Story Start
// ------------------
app.post("/api/story/start", async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: "Answer is required" });
    }

    const sessionId = uuidv4();

    sessions[sessionId] = {
      answers: [
        {
          question:
            "Tell me about the healthiest version of yourself you want to become.",
          answer,
        },
      ],
      topics: [],
      questionCount: 1,
    };

    saveSessions();

    const aiPrompt = `
You are helping a user tell their health and fitness future-self story.

The user answered the first question:
"${answer}"

Your job:
1. Extract specific health/fitness/wellness topics from their answer.
2. Decide the next best follow-up question.
3. The goal is to eventually collect enough information for 5 video scenes.

Important:
- Return ONLY valid JSON.
- Do not include markdown.
- Ask only ONE short follow-up question.
- Keep it positive, realistic, and not body-shaming.
- Focus on energy, strength, confidence, routine, wellness, sleep, nutrition, hydration, and consistency.
- topicsFound must be specific user topics, not generic labels.

Return format:
{
  "topicsFound": ["morning walks", "better sleep", "healthy meals"],
  "missingCategories": ["challenge", "emotion"],
  "nextQuestion": "short follow-up question"
}
`;

    const claudeText = await callClaude(aiPrompt);
    const data = extractJson(claudeText);

    sessions[sessionId].topics = data.topicsFound || [];
    saveSessions();

    res.json({
      success: true,
      sessionId,
      topicsSoFar: sessions[sessionId].topics,
      nextQuestion: data.nextQuestion,
      done: false,
    });
  } catch (error) {
    console.error("Story start error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------
// Story Follow-up Answer
// ------------------
app.post("/api/story/answer", async (req, res) => {
  try {
    const { sessionId, question, answer } = req.body;

    if (!sessionId || !sessions[sessionId]) {
      return res.status(404).json({ error: "Invalid sessionId" });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: "Answer is required" });
    }

    const session = sessions[sessionId];

    session.answers.push({
      question: question || "Follow-up question",
      answer,
    });

    session.questionCount += 1;
    saveSessions();

    const conversationText = session.answers
      .map((item, index) => {
        return `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`;
      })
      .join("\n\n");

    const aiPrompt = `
You are guiding a user through an interactive health and fitness story interview.

Here is the conversation so far:
${conversationText}

Your goal:
Collect enough detail to create exactly 5 future-self video scenes.

Important story categories:
- goal
- challenge
- preferred healthy activity
- sleep / food / hydration / wellness detail
- emotional outcome

Rules:
- If there is enough information OR the user has answered 4 total questions, set done to true.
- Otherwise, ask ONE short follow-up question.
- Return ONLY valid JSON.
- Keep tone supportive and realistic.
- Avoid body-shaming or unrealistic transformation language.
- topicsFound must be specific user topics like "morning walks", "sleeping on time", "drinking more water", "busy schedule", "feeling energetic".

Return format:
{
  "done": false,
  "topicsFound": ["specific topic 1", "specific topic 2", "specific topic 3"],
  "nextQuestion": "one short follow-up question"
}

If done:
{
  "done": true,
  "topicsFound": ["specific topic 1", "specific topic 2", "specific topic 3", "specific topic 4", "specific topic 5"],
  "finalTopics": ["specific topic 1", "specific topic 2", "specific topic 3", "specific topic 4", "specific topic 5"]
}
`;

    const claudeText = await callClaude(aiPrompt);
    const data = extractJson(claudeText);

    const newTopics = data.topicsFound || [];

    session.topics = Array.from(
      new Set([...(session.topics || []), ...newTopics])
    );

    const enoughQuestions = session.questionCount >= 4;
    const enoughTopics = session.topics.length >= 5;

    if (data.done || enoughQuestions || enoughTopics) {
      session.finalTopics = data.finalTopics || session.topics.slice(0, 5);
      data.done = true;
    }

    saveSessions();

    res.json({
      success: true,
      sessionId,
      done: Boolean(data.done),
      topicsSoFar: session.topics,
      finalTopics: session.finalTopics || null,
      nextQuestion: data.done ? null : data.nextQuestion || null,
    });
  } catch (error) {
    console.error("Story answer error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------
// Story Finalize
// ------------------
app.post("/api/story/finalize", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId || !sessions[sessionId]) {
      return res.status(404).json({ error: "Invalid sessionId" });
    }

    const session = sessions[sessionId];

    const conversationText = session.answers
      .map((item, index) => {
        return `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`;
      })
      .join("\n\n");

    const aiPrompt = `
Create a 5-scene cinematic health and fitness future-self story.

Use this user's interview answers:
${conversationText}

Topics found:
${JSON.stringify(session.finalTopics || session.topics)}

Goal:
Show the future healthier version of the user doing positive habits.

Story style:
- positive
- motivating
- practical
- visually clear
- hopeful

For each scene, include:
- number
- title
- visual_description
- voiceover
- caption

IMPORTANT RULES:
- Return ONLY valid JSON.
- No markdown.
- Exactly 5 scenes.
- Every voiceover must be positive, first-person, and present tense.
- Never focus on what is wrong in a negative way.
- Convert struggles into positive actions and benefits.
- If the user says they feel lazy, show an active positive habit like walking, stretching, or exercising.
- If the user says their sleep schedule is off, show the future-self going to sleep on time or sleeping peacefully.
- If the user says they eat poorly, show balanced meals or healthy food prep.
- Make each visual description concrete and easy to generate as an image.
- Every scene must show ONE clear action.
- Use an adult male in casual athletic wear in every scene.
- DO NOT make portrait descriptions.
- DO NOT describe a man standing and looking at the camera.
- The man must be doing the action clearly.

Examples of good voiceovers:
- "I take morning walks now, and they make me feel more energetic and lively."
- "I go to sleep on time so I can wake up feeling refreshed."
- "I eat balanced meals that help me feel strong and focused."
- "I drink more water throughout the day, and it keeps me feeling fresh and clear."

Return format:
{
  "title": "A Day With My Healthiest Self",
  "avatarProfile": "adult male in casual athletic wear",
  "scenes": [
    {
      "number": 1,
      "title": "Morning Walk",
      "visual_description": "An adult male in casual athletic wear walking in a park in the morning, visible movement, full body, outdoor path, natural sunlight, realistic lifestyle scene",
      "voiceover": "I take morning walks now, and they make me feel more energetic and lively.",
      "caption": "Move to feel alive"
    }
  ],
  "actionPlan": {
    "today": ["small action 1", "small action 2", "small action 3"],
    "thisWeek": ["weekly action 1", "weekly action 2", "weekly action 3"]
  }
}
`;

    const claudeText = await callClaude(aiPrompt);
    const data = extractJson(claudeText);

    if (!data.scenes || !Array.isArray(data.scenes)) {
      throw new Error("Scene generation failed");
    }

    session.title = data.title || "A Day With My Healthiest Self";
    session.avatarProfile = data.avatarProfile || "adult male in casual athletic wear";
    session.scenes = data.scenes.slice(0, 5);
    session.actionPlan = data.actionPlan || {};
    session.narrationText = buildNarrationText(session.scenes);

    saveSessions();

    res.json({
      success: true,
      sessionId,
      title: session.title,
      scenes: session.scenes,
      narrationText: session.narrationText,
      actionPlan: session.actionPlan,
    });
  } catch (error) {
    console.error("Finalize error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------
// Image Generation
// ------------------
async function generateAllImages(scenes, sessionId) {
  const imagePromises = scenes.map((scene, index) => {
    return generateOneImage(scene.visual_description, index + 1, sessionId);
  });

  return Promise.all(imagePromises);
}

async function generateOneImage(description, sceneNumber, sessionId) {
  try {
    console.log(`Generating image ${sceneNumber}...`);

    const avatar =
      sessions[sessionId]?.avatarProfile || "adult male in casual athletic wear";

    const formData = new FormData();

    formData.append(
      "prompt",
      `Create a realistic health and fitness lifestyle image.
Subject: ${avatar}.
Scene: ${description}.
Important:
- Show the male actively doing the action clearly.
- Full scene, not a close-up portrait.
- Do not make him stand still and face the camera.
- Do not create a studio portrait.
- Show movement or obvious activity.
- Make the habit easy to understand visually.
- Realistic lifestyle photography.
- Informative, clear, and natural.
- 16:9 composition.`
    );

    formData.append("output_format", "jpeg");
    formData.append("aspect_ratio", "16:9");

    const response = await axios.post(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "image/*",
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    const imagePath = path.join(
      imageDir,
      `${sessionId}_scene_${sceneNumber}.jpg`
    );

    fs.writeFileSync(imagePath, response.data);

    return imagePath;
  } catch (error) {
  let details = error.message;

  if (error.response?.data) {
    if (Buffer.isBuffer(error.response.data)) {
      details = error.response.data.toString("utf-8");
    } else {
      details = JSON.stringify(error.response.data, null, 2);
    }
  }

  console.error(`Image ${sceneNumber} status:`, error.response?.status);
  console.error(`Image ${sceneNumber} error:`, details);

  throw new Error(`Image ${sceneNumber} generation failed: ${details}`);
}
}

async function generatePlaceholderImages(scenes, sessionId) {
  const imagePaths = [];

  for (let i = 0; i < scenes.length; i++) {
    const sceneNumber = i + 1;
    const imagePath = path.join(
      imageDir,
      `${sessionId}_placeholder_${sceneNumber}.jpg`
    );

    const response = await axios.get(
      `https://placehold.co/1280x720/jpg?text=${encodeURIComponent(
        scenes[i].title || `Scene ${sceneNumber}`
      )}`,
      {
        responseType: "arraybuffer",
      }
    );

    fs.writeFileSync(imagePath, response.data);
    imagePaths.push(imagePath);
  }

  return imagePaths;
}


// ------------------
// Video Generation
// ------------------


function buildVoiceoverSegments(scenes) {
  const sceneDuration = 5;

  return scenes.map((scene, index) => ({
    sceneNumber: scene.number || index + 1,
    title: scene.title,
    caption: scene.caption,
    voiceover: scene.voiceover,
    startTime: index * sceneDuration,
    endTime: (index + 1) * sceneDuration,
  }));
}

function sanitizeTextForFFmpeg(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .slice(0, 80);
}
async function createAnimatedVideo(imagePaths, scenes, sessionId) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(videoDir, `${sessionId}_fitframe.mp4`);

    const sceneDuration = 5;
    const width = 1280;
    const height = 720;
    const fps = 30;
    const frameCount = sceneDuration * fps;

    let command = ffmpeg();

    imagePaths.forEach((imagePath) => {
      command = command.input(imagePath).inputOptions(["-loop 1"]);
    });

    const filters = [];

    imagePaths.forEach((_, index) => {
      const scene = scenes[index];

      const caption = sanitizeTextForFFmpeg(
        scene.caption || scene.title || `Scene ${index + 1}`
      );

      filters.push(
        `[${index}:v]scale=${width}:${height},` +
          `zoompan=z='min(zoom+0.0015,1.12)':d=${frameCount}:s=${width}x${height}:fps=${fps},` +
          `trim=duration=${sceneDuration},setpts=PTS-STARTPTS,` +
          `drawbox=x=0:y=${height - 150}:w=${width}:h=150:color=black@0.45:t=fill,` +
          `drawtext=text='${caption}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=h-100,` +
          `format=yuv420p[v${index}]`
      );
    });

    const concatInputs = imagePaths.map((_, index) => `[v${index}]`).join("");

    filters.push(
      `${concatInputs}concat=n=${imagePaths.length}:v=1:a=0,format=yuv420p[vout]`
    );

    command
      .complexFilter(filters)
      .outputOptions([
        "-map [vout]",
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-preset fast",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => {
        console.log("Video with captions created:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        reject(new Error("Video stitching failed"));
      })
      .run();
  });
}

app.post("/api/generate-video", async (req, res) => {
  try {
    const { sessionId, usePlaceholders } = req.body;

    if (!sessionId || !sessions[sessionId]) {
      return res.status(404).json({ error: "Invalid sessionId" });
    }

    const session = sessions[sessionId];

    if (!session.scenes || session.scenes.length === 0) {
      return res.status(400).json({
        error: "No scenes found. Call /api/story/finalize first.",
      });
    }

    console.log("Starting video generation...");

    let imagePaths;

    if (usePlaceholders) {
      imagePaths = await generatePlaceholderImages(session.scenes, sessionId);
    } else {
      imagePaths = await generateAllImages(session.scenes, sessionId);
    }

    console.log("Images ready");

    const videoPath = await createAnimatedVideo(
      imagePaths,
      session.scenes,
      sessionId
    );

    const videoUrl = `${process.env.BASE_URL}/outputs/videos/${path.basename(
      videoPath
    )}`;

    session.videoUrl = videoUrl;
    session.narrationText = buildNarrationText(session.scenes);
    session.voiceoverSegments = buildVoiceoverSegments(session.scenes);
    saveSessions();

    res.json({
      success: true,
      sessionId,
      videoUrl,
      title: session.title,
      scenes: session.scenes,
      narrationText: session.narrationText,
      voiceoverSegments: session.voiceoverSegments,
      actionPlan: session.actionPlan,
      note: "Use narrationText with browser speechSynthesis on the frontend.",

    });
  } catch (error) {
    console.error("Generate video error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ------------------
// Get Session
// ------------------
app.get("/api/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ error: "Invalid sessionId" });
  }

  res.json({
    success: true,
    sessionId,
    session: sessions[sessionId],
  });
});

// ------------------
// Start Server
// ------------------
app.listen(PORT, () => {
  console.log(`FitFrame backend running on http://localhost:${PORT}`);
});