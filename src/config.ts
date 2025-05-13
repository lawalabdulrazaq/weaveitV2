// src/config.ts
import dotenv from 'dotenv';
dotenv.config();

const password = "E1lvrD7eNg2NkLWA";
const username = "temitopelawal925";
export const config = {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || 'localhost'
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tutorial-videos',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    storage: {
      tempDir: process.env.TEMP_DIR || './temp',
      outputDir: process.env.OUTPUT_DIR || './output'
    },
    video: {
      defaultTheme: 'dark',
      defaultAnimationStyle: 'fade',
      defaultResolution: {
        width: 1280,
        height: 720
      },
      defaultQuality: 'high'
    },
    session: {
      expiryTime: 60 * 60 * 1000 // 1 hour in milliseconds
    }
  };
export interface ConfigOptions {
    openaiApiKey: string;
    useMock?: boolean;
    voice?: string;
    videoOutputDir?: string;
    audioOutputDir?: string;
    slidesOutputDir?: string;
}

export class Config {
    openaiApiKey: string;
    useMock: boolean;
    voice: string;
    videoOutputDir: string;
    audioOutputDir: string;
    slidesOutputDir: string;

    constructor(options: ConfigOptions) {
        if (!options.openaiApiKey && !options.useMock) {
            throw new Error('OpenAI API key is required unless mock mode is enabled.');
        }
    
        this.openaiApiKey = options.openaiApiKey;
        this.useMock = options.useMock ?? false;
        this.voice = options.voice ?? 'en';
        this.videoOutputDir = options.videoOutputDir ?? './output/videos';
        this.audioOutputDir = options.audioOutputDir ?? './output/audio';
        this.slidesOutputDir = options.slidesOutputDir ?? './output/slides';
        }
    }
    