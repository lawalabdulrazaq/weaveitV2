// src/textToSpeech.ts
import { OpenAI } from 'openai';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { SpeechGenerationOptions } from './types';

config();

const writeFileAsync = promisify(fs.writeFile);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Generate speech from text using OpenAI's TTS API
 * @param text The text to convert to speech
 * @param outputPath Path to save the audio file
 * @param options Speech generation options
 * @returns Path to the generated audio file
 */
export async function generateSpeech(
  text: string,
  outputPath: string,
  options: SpeechGenerationOptions = {}
): Promise<string> {
  try {
    console.log('Generating speech...');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Split the text into manageable chunks if necessary
    const chunks = splitTextToChunks(text, 4000);
    
    if (chunks.length === 1) {
      // Simple case: single TTS request
      const audioResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: options.voice || 'alloy',
        input: text,
        speed: options.speed || 1.0,
      });

      const buffer = Buffer.from(await audioResponse.arrayBuffer());
      await writeFileAsync(outputPath, buffer);
      
      console.log(`Audio generated successfully: ${outputPath}`);
      return outputPath;
    } else {
      // Complex case: multiple TTS requests need to be merged
      console.log(`Text too long, splitting into ${chunks.length} chunks`);
      
      const tempDir = path.join(path.dirname(outputPath), 'temp_audio');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Generate audio for each chunk
      const chunkPaths = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkPath = path.join(tempDir, `chunk_${i}.mp3`);
        const audioResponse = await openai.audio.speech.create({
          model: 'tts-1',
          voice: options.voice || 'alloy',
          input: chunks[i],
          speed: options.speed || 1.0,
        });
        
        const buffer = Buffer.from(await audioResponse.arrayBuffer());
        await writeFileAsync(chunkPath, buffer);
        chunkPaths.push(chunkPath);
      }
      
      // Merge audio chunks
      await mergeAudioChunks(chunkPaths, outputPath);
      
      // Clean up temp files
      for (const chunkPath of chunkPaths) {
        fs.unlinkSync(chunkPath);
      }
      fs.rmdirSync(tempDir);
      
      console.log(`Combined audio generated successfully: ${outputPath}`);
      return outputPath;
    }
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Split text into chunks of max length
 */
function splitTextToChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Merge multiple audio files into a single file using ffmpeg
 */
async function mergeAudioChunks(chunkPaths: string[], outputPath: string): Promise<void> {
  try {
    const { default: ffmpeg } = await import('fluent-ffmpeg');
    
    // Create a concatenation file
    const concatFilePath = path.join(path.dirname(outputPath), 'concat.txt');
    const concatContent = chunkPaths.map(p => `file '${p}'`).join('\n');
    await writeFileAsync(concatFilePath, concatContent);
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .output(outputPath)
        .on('end', () => {
          fs.unlinkSync(concatFilePath);
          resolve();
        })
        .on('error', (err) => {
          fs.unlinkSync(concatFilePath);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    console.error('Error merging audio chunks:', error);
    throw error;
  }
}