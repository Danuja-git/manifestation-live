const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Create videos directory
const videoDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}
app.use('/videos', express.static(videoDir));

console.log('🚀 Backend starting...');

// ================================================
// MAIN API ENDPOINT
// ================================================
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('📍 Received prompt:', prompt);

    // Step 1: Break down with Claude
    console.log('⏳ Step 1: Analyzing with Claude...');
    const scenes = await claudeBreakdown(prompt);
    console.log(`✅ Got ${scenes.length} scenes`);

    // Step 2: Generate images
    console.log('⏳ Step 2: Generating images...');
    const imagePaths = await generateAllImages(scenes);
    console.log(`✅ Generated ${imagePaths.length} images`);

    // Step 3: Generate audio
    console.log('⏳ Step 3: Generating voiceover...');
    const audioPath = await generateAudio(scenes);
    console.log('✅ Audio ready');

    // Step 4: Stitch video
    console.log('⏳ Step 4: Stitching video...');
    const finalVideo = await stitchToVideo(imagePaths, audioPath);
    console.log('✅ Video complete:', finalVideo);

    res.json({
      success: true,
      videoUrl: `/videos/${path.basename(finalVideo)}`
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ================================================
// PERSON 2: CLAUDE API + STABILITY AI
// ================================================

// TODO (Person 2): Complete this function
// This function should:
// 1. Call Claude API to break down the prompt into scenes
// 2. Return array of scene objects with: number, visual_description, voiceover
async function claudeBreakdown(prompt) {
  try {
    // TODO: Make POST request to Claude API
    // URL: https://api.anthropic.com/v1/messages
    // Headers: 'x-api-key': process.env.CLAUDE_API_KEY
    // Body: {
    //   model: 'claude-3-5-sonnet-20241022',
    //   max_tokens: 2000,
    //   messages: [{
    //     role: 'user',
    //     content: prompt breakdown instruction
    //   }]
    // }

    // TODO: Parse the response (it returns JSON)
    // TODO: Extract the scenes array and return it

    // EXPECTED RETURN:
    // [
    //   { number: 1, visual_description: "...", voiceover: "..." },
    //   { number: 2, visual_description: "...", voiceover: "..." },
    //   ...
    // ]

    throw new Error('claudeBreakdown not implemented yet');

  } catch (error) {
    throw new Error('Claude API failed: ' + error.message);
  }
}

// TODO (Person 2): Complete this function
// This function should:
// 1. For each scene, call generateOneImage
// 2. Return array of image file paths
async function generateAllImages(scenes) {
  try {
    // TODO: Create promises for each scene image generation
    // TODO: Use Promise.all() to run all in parallel
    // TODO: Return array of image paths

    throw new Error('generateAllImages not implemented yet');

  } catch (error) {
    throw new Error('Image generation failed: ' + error.message);
  }
}

// TODO (Person 2): Complete this function
// This function should:
// 1. Call Stability AI API to generate an image from description
// 2. Save image to disk
// 3. Return the file path
async function generateOneImage(description, number) {
  try {
    // TODO: Make POST request to Stability AI
    // URL: https://api.stability.ai/v1/generate
    // Headers: 'authorization': `Bearer ${process.env.STABILITY_API_KEY}`
    // Body: {
    //   prompt: description,
    //   output_format: 'jpeg',
    //   width: 1024,
    //   height: 576
    // }

    // TODO: Get image from response.data.image (it's base64)
    // TODO: Convert to buffer and write to disk
    // TODO: Save as: videoDir/scene_${number}.jpg
    // TODO: Return the file path

    console.log(`  Generating image ${number}...`);

    throw new Error('generateOneImage not implemented yet');

  } catch (error) {
    throw new Error(`Image ${number} failed: ` + error.message);
  }
}

// ================================================
// PERSON 4: ELEVENLABS API + FFMPEG
// ================================================

// TODO (Person 4): Complete this function
// This function should:
// 1. Combine all voiceovers from scenes into one narration
// 2. Call ElevenLabs API to generate speech
// 3. Save audio file
// 4. Return the file path
async function generateAudio(scenes) {
  try {
    // TODO: Join all voiceover strings into one narration
    // const narration = scenes.map(s => s.voiceover).join(' ');

    // TODO: Make POST request to ElevenLabs
    // URL: https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM
    // Headers: 'xi-api-key': process.env.ELEVENLABS_API_KEY
    // Body: {
    //   text: narration,
    //   model_id: 'eleven_monolingual_v1',
    //   voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    // }

    // TODO: Save response.data (it's audio) to disk
    // TODO: Save as: videoDir/voiceover.mp3
    // TODO: Return the file path

    throw new Error('generateAudio not implemented yet');

  } catch (error) {
    throw new Error('Audio generation failed: ' + error.message);
  }
}

// TODO (Person 4): Complete this function
// This function should:
// 1. Use FFmpeg to combine images (each 5 seconds) with audio
// 2. Create a video file
// 3. Return the file path
async function stitchToVideo(imagePaths, audioPath) {
  return new Promise((resolve, reject) => {
    try {
      const outputPath = path.join(videoDir, `video_${Date.now()}.mp4`);

      // TODO: Use fluent-ffmpeg to:
      // 1. Add all images as inputs (each for 5 seconds)
      // 2. Add audio input
      // 3. Create concat filter to join images
      // 4. Mix audio over video
      // 5. Output as MP4 (libx264 codec)
      // 6. On success, resolve with outputPath
      // 7. On error, reject with error

      throw new Error('stitchToVideo not implemented yet');

    } catch (error) {
      reject(error);
    }
  });
}

// ================================================
// START SERVER
// ================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log('📝 API endpoint: POST /api/generate');
  console.log('');
  console.log('Check your .env file has:');
  console.log('  - CLAUDE_API_KEY');
  console.log('  - STABILITY_API_KEY');
  console.log('  - ELEVENLABS_API_KEY');
});
