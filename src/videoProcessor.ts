import { VideoGenerationOptions } from './types';
import { explainDocs } from './videoGenerator';
import fs from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { config } from './config';

export class VideoProcessor {
  async render3D(
    code: string,
    voiceoverStream: NodeJS.ReadableStream | null,
    options: VideoGenerationOptions
  ): Promise<Buffer> {
    try {
      // If we have a voiceover stream, save it to a temporary file
      let audioPath: string | null = null;
      if (voiceoverStream) {
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          await fs.promises.mkdir(tempDir, { recursive: true });
        }
        
        audioPath = path.join(tempDir, `${Date.now()}-${randomUUID().slice(0, 8)}.mp3`);
        const writeStream = fs.createWriteStream(audioPath);
        
        await new Promise<void>((resolve, reject) => {
          voiceoverStream
            .pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
        });
      }

      // Generate video using explainDocs
      const outputPath = await explainDocs(
        code,
        audioPath || '', // Pass empty string if no audio
        options
      );

      // Read the output file into a buffer
      const videoBuffer = await fs.promises.readFile(outputPath);

      // Clean up temporary files
      if (audioPath && fs.existsSync(audioPath)) {
        await fs.promises.unlink(audioPath);
      }
      if (fs.existsSync(outputPath)) {
        await fs.promises.unlink(outputPath);
      }

      return videoBuffer;
    } catch (error) {
      console.error('Error in render3D:', error);
      throw error;
    }
  }
}