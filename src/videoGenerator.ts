import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { CanvasRenderingContext2D } from 'canvas';

const gTTS = require('node-gtts');
const gtts = gTTS('en');

function generateAudioFromText(text: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    gtts.save(outputPath, text, () => {
      console.log(`✅ Audio saved to ${outputPath}`);
      resolve();
    });
  });
}


/**
 * Get the duration of the audio.
 */
function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Split tutorial text into chunks for separate slides.
 */
function splitTextIntoSlides(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const slides: string[] = [];
  let slide = '';

  for (const word of words) {
    if ((slide + word).length > maxChars) {
      slides.push(slide.trim());
      slide = '';
    }
    slide += `${word} `;
  }
  if (slide) slides.push(slide.trim());
  return slides;
}

/**
 * Create images (slides) from text.
 */
async function generateSlides(script: string, outputDir: string): Promise<string[]> {
  const { createCanvas } = await import('canvas');
  const slidesText = splitTextIntoSlides(script, 500);
  const slidePaths: string[] = [];

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (let i = 0; i < slidesText.length; i++) {
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Tutorial Slide', 40, 50);

    ctx.font = '24px sans-serif';
    const lines = wrapText(ctx, slidesText[i], 1200);
    lines.forEach((line, j) => ctx.fillText(line, 40, 100 + j * 40));

    const slidePath = path.join(outputDir, `slide_${i}.png`);
    fs.writeFileSync(slidePath, canvas.toBuffer('image/png'));
    slidePaths.push(slidePath);
  }

  return slidePaths;
}

/**
 * Turn each slide into a short video clip.
 */
function createSlideVideo(slidePath: string, outputPath: string, duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(slidePath)
      .loop(duration)
      .inputOptions(['-framerate 1'])
      .outputOptions([
        '-c:v libx264',
        `-t ${duration}`,
        '-pix_fmt yuv420p',
        '-r 30',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Concatenate slide video clips using FFmpeg concat.
 */
function concatSlideVideos(videoPaths: string[], outputPath: string): Promise<void> {
  const concatListPath = path.join(__dirname, 'slides', 'file_list.txt');
  const fileList = videoPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(concatListPath, fileList);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Merge final video with audio.
 */
// function mergeWithAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .addInput(videoPath)
//       .addInput(audioPath)
//       .outputOptions(['-shortest', '-c:v copy', '-c:a aac'])
//       .output(outputPath)
//       .on('end', () => resolve())
//       .on('error', (err) => reject(err))
//       .run();
//   });
// }

function mergeWithAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(videoPath)
      .addInput(audioPath)
      .outputOptions([
        '-shortest',
        '-c:v copy',
        '-c:a aac',
        '-b:a 192k',     // ✅ added bitrate for audio
        '-movflags +faststart' // ✅ helps audio start faster in some players
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Utility to wrap text for slides.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }

  lines.push(line.trim());
  return lines;
}

/**
 * Main function to generate the full tutorial video.
 */
// export async function generateVideo(tutorialText: string, audioPath: string, finalOutputPath: string): Promise<void> {
//   const outputDir = path.join(__dirname, 'slides');
//   const tempClipsDir = path.join(outputDir, 'clips');

//   if (!fs.existsSync(tempClipsDir)) {
//     fs.mkdirSync(tempClipsDir, { recursive: true });
//   }

//   try {
//     const slides = await generateSlides(tutorialText, outputDir);
//     const audioDuration = await getAudioDuration(audioPath);
//     const durationPerSlide = audioDuration / slides.length;

//     const videoClips: string[] = [];

//     for (let i = 0; i < slides.length; i++) {
//       const videoClipPath = path.join(tempClipsDir, `clip_${i}.mp4`);
//       await createSlideVideo(slides[i], videoClipPath, durationPerSlide);
//       videoClips.push(videoClipPath);
//     }

//     const concatVideoPath = path.join(outputDir, 'combined.mp4');
//     await concatSlideVideos(videoClips, concatVideoPath);

//     await mergeWithAudio(concatVideoPath, audioPath, finalOutputPath);
//     console.log(`✅ Final tutorial video saved to: ${finalOutputPath}`);

//     // Cleanup temporary files
//     [...slides, ...videoClips, concatVideoPath].forEach(file => fs.unlinkSync(file));
//     fs.unlinkSync(path.join(outputDir, 'file_list.txt'));
//     fs.rmdirSync(tempClipsDir);
//     console.log('🧹 Cleaned up temporary files.');
//   } catch (err) {
//     console.error('❌ Error generating video:', err);
//     throw err;
//   }
// }

export async function generateVideo(tutorialText: string, audioPath: string, finalOutputPath: string): Promise<void> {
  const outputDir = path.join(__dirname, 'slides');
  const tempClipsDir = path.join(outputDir, 'clips');
  const ttsPath = path.join(outputDir, 'narration.mp3');

  if (!fs.existsSync(tempClipsDir)) {
    fs.mkdirSync(tempClipsDir, { recursive: true });
  }

  try {
    fs.copyFileSync(audioPath, ttsPath);

    const slides = await generateSlides(tutorialText, outputDir);
    const audioDuration = await getAudioDuration(ttsPath);
    const durationPerSlide = audioDuration / slides.length;

    const videoClips: string[] = [];

    for (let i = 0; i < slides.length; i++) {
      const videoClipPath = path.join(tempClipsDir, `clip_${i}.mp4`);
      await createSlideVideo(slides[i], videoClipPath, durationPerSlide);
      videoClips.push(videoClipPath);
    }

    const concatVideoPath = path.join(outputDir, 'combined.mp4');
    await concatSlideVideos(videoClips, concatVideoPath);

    await mergeWithAudio(concatVideoPath, ttsPath, finalOutputPath);
    console.log(`✅ Final tutorial video saved to: ${finalOutputPath}`);

    // Cleanup
    [...slides, ...videoClips, concatVideoPath, ttsPath].forEach(file => fs.unlinkSync(file));
    fs.unlinkSync(path.join(outputDir, 'file_list.txt'));
    fs.rmdirSync(tempClipsDir);
    console.log('🧹 Cleaned up temporary files.');
  } catch (err) {
    console.error('❌ Error generating video:', err);
    throw err;
  }
}
