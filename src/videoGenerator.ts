// src/videoGenerator.ts
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { CanvasRenderingContext2D } from 'canvas';

export async function generateVideo(tutorialText: string, audioPath: string, outputPath: string): Promise<void> {
  const textSlide = path.join(__dirname, 'temp_slide.txt');
  fs.writeFileSync(textSlide, tutorialText);

  const slideImg = path.join(__dirname, 'slide.png');
  await generateSlideImage(tutorialText, slideImg);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(slideImg)
      .loop(10) // Loop image for 10s (should match audio duration roughly)
      .addInput(audioPath)
      .outputOptions('-shortest')
      .output(outputPath)
      .on('end', () => {
        console.log(`🎞️ Video saved to: ${outputPath}`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

async function generateSlideImage(text: string, output: string): Promise<void> {
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.font = '32px sans-serif';

  const lines = wrapText(ctx, text, 1200);
  lines.forEach((line, i) => ctx.fillText(line, 40, 60 + i * 40));

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(output, buffer);
}


function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}