// src/videoGenerator.ts
import { createCanvas, loadImage, registerFont } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { VideoGenerationOptions, RenderedSlide, TutorialResult } from './types';
// import fontData from './font.json';

// Register fonts
try {
  const fontPath = path.join(__dirname, 'fonts', 'Roboto-Regular.ttf');
  registerFont(fontPath, { family: 'Roboto' });
} catch (error) {
  console.warn('Warning: Could not register font. Using system fonts.');
}

const DEFAULT_OPTIONS: VideoGenerationOptions = {
  theme: 'dark',
  animationStyle: 'fade',
  fontFamily: 'Roboto, Arial, sans-serif',
  includeCodeHighlight: true,
  resolution: {
    width: 1280,
    height: 720,
  },
  fps: 30,
  format: 'mp4',
  quality: 'high',
};

/** Parse the tutorial text into a structured format */
function parseTutorialText(tutorialText: string): { title: string, steps: { text: string, codeSnippet?: string }[] } {
  const lines = tutorialText.split('\n');
  let title = lines[0] || 'Tutorial';
  
  // Find code blocks (assuming they're enclosed in ```code```)
  const steps: { text: string, codeSnippet?: string }[] = [];
  
  let currentStep = '';
  let inCodeBlock = false;
  let currentCodeBlock = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        inCodeBlock = false;
        if (currentStep) {
          steps.push({
            text: currentStep.trim(),
            codeSnippet: currentCodeBlock.trim()
          });
          currentStep = '';
          currentCodeBlock = '';
        }
      } else {
        // Start of code block
        inCodeBlock = true;
        if (currentStep) {
          steps.push({ text: currentStep.trim() });
          currentStep = '';
        }
      }
    } else if (inCodeBlock) {
      currentCodeBlock += line + '\n';
    } else if (line.trim() === '') {
      if (currentStep) {
        steps.push({ text: currentStep.trim() });
        currentStep = '';
      }
    } else {
      currentStep += line + '\n';
    }
  }
  
  // Add the last step if exists
  if (currentStep) {
    steps.push({ text: currentStep.trim() });
  }
  
  // If we have no steps, create at least one from the title
  if (steps.length === 0) {
    steps.push({ text: title });
    title = 'Tutorial';
  }
  
  return { title, steps };
}

/** Render a slide as an image */
async function renderSlide(
  slideContent: { text: string, codeSnippet?: string },
  slideIndex: number,
  options: VideoGenerationOptions,
  outputDir: string
): Promise<string> {
  const { width, height } = options.resolution || DEFAULT_OPTIONS.resolution!;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background color based on theme
  const backgroundColor = options.theme === 'dark' ? '#1e1e2f' : '#f8f9fa';
  const textColor = options.theme === 'dark' ? '#ffffff' : '#212529';
  const accentColor = options.theme === 'dark' ? '#61dafb' : '#0d6efd';
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Add some visual elements - decorative grid/pattern
  ctx.strokeStyle = options.theme === 'dark' ? '#2e2e4f' : '#e9ecef';
  ctx.lineWidth = 1;
  
  // Draw grid
  for (let x = 0; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Add slide number/indicator
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(width - 50, height - 30, 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = backgroundColor;
  ctx.font = 'bold 16px ' + (options.fontFamily || DEFAULT_OPTIONS.fontFamily);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${slideIndex + 1}`, width - 50, height - 30);
  
  // Main slide content
  ctx.fillStyle = textColor;
  ctx.font = '28px ' + (options.fontFamily || DEFAULT_OPTIONS.fontFamily);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  // Draw text
  const lines = wrapText(ctx, slideContent.text, width - 100, 28);
  lines.forEach((line, idx) => {
    ctx.fillText(line, 50, 80 + idx * 40);
  });
  
  // Draw code snippet if present
  if (slideContent.codeSnippet && options.includeCodeHighlight) {
    const codeY = 80 + lines.length * 40 + 40;
    const codeHeight = height - codeY - 80;
    
    // Code background
    ctx.fillStyle = options.theme === 'dark' ? '#2d2d3d' : '#f1f3f5';
    ctx.fillRect(50, codeY, width - 100, codeHeight);
    
    // Code text
    ctx.fillStyle = options.theme === 'dark' ? '#e6e6fa' : '#343a40';
    ctx.font = '16px monospace';
    
    const codeLines = slideContent.codeSnippet.split('\n');
    codeLines.forEach((line, idx) => {
      // Simple syntax highlighting - just colors keywords differently
      const coloredLine = options.theme === 'dark' 
        ? highlightSyntax(line, '#61dafb', '#f7c78d', '#a5d8ff')
        : highlightSyntax(line, '#0d6efd', '#fd7e14', '#6610f2');
      
      const xPos = 70;
      const yPos = codeY + 20 + idx * 24;
      
      // Draw highlighted code
      if (typeof coloredLine === 'string') {
        ctx.fillText(coloredLine, xPos, yPos);
      } else {
        // Handle complex colored segments
        let currentX = xPos;
        for (const segment of coloredLine) {
          ctx.fillStyle = segment.color;
          ctx.fillText(segment.text, currentX, yPos);
          currentX += ctx.measureText(segment.text).width;
        }
        // Reset text color
        ctx.fillStyle = options.theme === 'dark' ? '#e6e6fa' : '#343a40';
      }
    });
  }
  
  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  
  // Save image
  const imgPath = path.join(outputDir, `slide_${slideIndex}.png`);
  const buffer = canvas.toBuffer('image/png');
  await writeFile(imgPath, buffer);
  
  return imgPath;
}

/** Apply simple syntax highlighting to code */
function highlightSyntax(line: string, keywordColor: string, stringColor: string, funcColor: string) {
  // This is a simple implementation
  // For production use, consider a proper tokenizer/lexer
  
  // Keywords to highlight
  const keywords = [
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
    'import', 'export', 'class', 'interface', 'extends', 'implements', 'new',
    'async', 'await', 'try', 'catch', 'throw', 'this', 'super', 'static'
  ];
  
  // Very simple regex-based highlighting
  // This is not a full parser, just demonstration
  
  // Check if line has no special syntax
  const hasSpecialSyntax = keywords.some(kw => line.includes(kw)) || 
                          line.includes('"') || 
                          line.includes("'") ||
                          /\w+\(/.test(line);
  
  if (!hasSpecialSyntax) {
    return line;
  }
  
  // Otherwise do more complex highlighting
  const result: { text: string, color: string }[] = [];
  
  // Temporary tokenization approach
  let currentToken = '';
  let currentColor = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    // Handle strings
    if ((char === '"' || char === "'") && (i === 0 || line[i-1] !== '\\')) {
      if (inString && char === stringChar) {
        // End of string
        currentToken += char;
        result.push({ text: currentToken, color: stringColor });
        currentToken = '';
        inString = false;
      } else if (!inString) {
        // Start of string
        if (currentToken) {
          result.push({ text: currentToken, color: currentColor || 'inherit' });
        }
        currentToken = char;
        inString = true;
        stringChar = char;
        currentColor = stringColor;
      } else {
        // Different string delimiter inside a string
        currentToken += char;
      }
      continue;
    }
    
    if (inString) {
      currentToken += char;
      continue;
    }
    
    // Handle word boundaries and operators
    if (/\W/.test(char)) {
      if (currentToken) {
        // Check if it's a keyword
        if (keywords.includes(currentToken)) {
          result.push({ text: currentToken, color: keywordColor });
        } 
        // Check if it's a function call
        else if (i < line.length - 1 && line[i] === '(') {
          result.push({ text: currentToken, color: funcColor });
        } 
        else {
          result.push({ text: currentToken, color: 'inherit' });
        }
        currentToken = '';
      }
      result.push({ text: char, color: 'inherit' });
    } else {
      currentToken += char;
    }
  }
  
  // Add the last token if any
  if (currentToken) {
    if (inString) {
      result.push({ text: currentToken, color: stringColor });
    } else if (keywords.includes(currentToken)) {
      result.push({ text: currentToken, color: keywordColor });
    } else {
      result.push({ text: currentToken, color: 'inherit' });
    }
  }
  
  return result;
}

/** Wrap text for canvas rendering */
function wrapText(ctx: any, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  
  // Limit to a maximum number of lines to prevent overflow
  const maxLines = 10;
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const { width } = ctx.measureText(testLine);
    
    if (width > maxWidth && line) {
      lines.push(line);
      line = word + ' ';
      
      // Check if we've reached the maximum number of lines
      if (lines.length >= maxLines - 1) {
        // For the last line, add an ellipsis if necessary
        if (words.indexOf(word) < words.length - 1) {
          line = line.trimEnd() + '...';
          break;
        }
      }
    } else {
      line = testLine;
    }
  }
  
  if (line) {
    lines.push(line);
  }
  
  return lines;
}

/** Generate transitions between slides */
async function generateTransitions(
  slides: RenderedSlide[],
  options: VideoGenerationOptions,
  outputDir: string
): Promise<string[]> {
  const transitionPaths: string[] = [];
  
  // For each pair of slides, create a transition
  for (let i = 0; i < slides.length - 1; i++) {
    const fromSlide = slides[i];
    const toSlide = slides[i + 1];
    
    // Load both slide images
    const fromImage = await loadImage(fromSlide.imagePath);
    const toImage = await loadImage(toSlide.imagePath);
    
    const { width, height } = options.resolution || DEFAULT_OPTIONS.resolution!;
    const transitionFrames = 30; // 1 second transition at 30fps
    
    // Generate transition frames
    for (let frame = 0; frame < transitionFrames; frame++) {
      const progress = frame / transitionFrames;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Different transition effects
      switch (options.animationStyle) {
        case 'fade':
          // Cross-fade transition
          ctx.globalAlpha = 1 - progress;
          ctx.drawImage(fromImage, 0, 0, width, height);
          ctx.globalAlpha = progress;
          ctx.drawImage(toImage, 0, 0, width, height);
          break;
          
        case 'slide':
          // Slide transition
          ctx.drawImage(fromImage, -width * progress, 0, width, height);
          ctx.drawImage(toImage, width * (1 - progress), 0, width, height);
          break;
          
        case 'zoom':
          // Zoom transition
          const zoom = 1 + 0.2 * progress;
          const offsetX = (width * zoom - width) / 2;
          const offsetY = (height * zoom - height) / 2;
          
          ctx.drawImage(fromImage, -offsetX, -offsetY, width * zoom, height * zoom);
          ctx.globalAlpha = progress;
          ctx.drawImage(toImage, 0, 0, width, height);
          break;
          
        default:
          // Default simple fade
          ctx.globalAlpha = 1 - progress;
          ctx.drawImage(fromImage, 0, 0, width, height);
          ctx.globalAlpha = progress;
          ctx.drawImage(toImage, 0, 0, width, height);
      }
      
      // Save transition frame
      const framePath = path.join(outputDir, `transition_${i}_${frame}.png`);
      await writeFile(framePath, canvas.toBuffer('image/png'));
      transitionPaths.push(framePath);
    }
  }
  
  return transitionPaths;
}

/** Main function to render 3D video */
export async function explainDocs(
  tutorialText: string,
  audioPath: string,
  options: VideoGenerationOptions = DEFAULT_OPTIONS
): Promise<string> {
  console.log('Starting 3D video generation...');

  // Parse tutorial into slides
  const tutorial = parseTutorialText(tutorialText);

  // Create temp directories for slides and transitions
  const tempDir = path.join(process.cwd(), 'slides');
  const slideDir = path.join(tempDir, 'slides');
  const transitionDir = path.join(tempDir, 'transitions');

  try {
    // Ensure directories exist
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    if (!existsSync(slideDir)) {
      await mkdir(slideDir, { recursive: true });
    }
    if (!existsSync(transitionDir)) {
      await mkdir(transitionDir, { recursive: true });
    }

    console.log('Rendering slides...');

    // Render each slide
    const slidePaths: string[] = [];
    for (let i = 0; i < tutorial.steps.length; i++) {
      const slidePath = await renderSlide(tutorial.steps[i], i, options, slideDir);
      slidePaths.push(slidePath);
    }

    // Split audio into chunks for each slide
    const audioChunks = await splitAudioByText(tutorial.steps, audioPath);

    // Calculate slide durations based on audio chunks
    const slides: RenderedSlide[] = tutorial.steps.map((step, index) => ({
      imagePath: slidePaths[index],
      duration: audioChunks[index].duration,
      startTime: 0, // Ensure startTime is always a number
    }));

    // Update start times for slides
    slides.forEach((slide, index) => {
      if (index === 0) {
        slide.startTime = 0;
      } else {
        slide.startTime = slides[index - 1].startTime + slides[index - 1].duration;
      }
    });

    console.log('Generating transitions...');

    // Generate transitions between slides
    const transitionPaths = await generateTransitions(slides, options, transitionDir);

    console.log('Combining slides, transitions, and audio...');

    // Generate the output video
    const outputPath = path.join(process.cwd(), 'tutorial.mp4');

    // Create concatenation file for ffmpeg
    const concatFilePath = path.join(tempDir, 'concat.txt');
    let concatContent = '';

    // Add slides and transitions to the concatenation file
    slides.forEach((slide, index) => {
      concatContent += `file '${slide.imagePath}'\nduration ${slide.duration}\n`;
      if (index < transitionPaths.length) {
        concatContent += `file '${transitionPaths[index]}'\nduration 1\n`; // 1-second transition
      }
    });

    // Write concatenation file
    await writeFile(concatFilePath, concatContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', options.quality === 'high' ? 'slow' : options.quality === 'medium' ? 'medium' : 'fast',
          '-crf', options.quality === 'high' ? '18' : options.quality === 'medium' ? '23' : '28',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          '-r', String(options.fps || DEFAULT_OPTIONS.fps),
          '-shortest',
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
        })
        .on('end', async () => {
          console.log('Video generated successfully!');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Error generating video:', err);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    console.error('Error in video generation:', error);
    throw error;
  }
}

/** Split audio into chunks based on text */
async function splitAudioByText(steps: { text: string }[], audioPath: string): Promise<{ path: string, duration: number }[]> {
  const audioChunks: { path: string, duration: number }[] = [];
  const totalTextLength = steps.reduce((sum, step) => sum + step.text.length, 0);

  for (const step of steps) {
    const stepDuration = (step.text.length / totalTextLength) * (await getAudioDuration(audioPath));
    const chunkPath = path.join(path.dirname(audioPath), `tutorial_01.mp3`);
    // Use ffmpeg to split the audio (this assumes you have a method to split audio by duration)
    await splitAudio(audioPath, chunkPath, stepDuration);
    audioChunks.push({ path: chunkPath, duration: stepDuration });
  }

  return audioChunks;
}

/** Split audio file into chunks using ffmpeg */
async function splitAudio(inputPath: string, outputPath: string, duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(0)
      .setDuration(duration)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/** Get the duration of an audio file */
async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}