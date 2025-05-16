// src/types.ts
export interface TutorialResult {
  tutorialText: string;
  language: string;
  steps?: TutorialStep[];
}

export interface TutorialStep {
  text: string;
  codeSnippet?: string;
  duration?: number; // Duration in seconds
}

export interface SlideGenerationOptions {
  theme?: 'dark' | 'light';
  animationStyle?: 'fade' | 'slide' | 'zoom';
  fontFamily?: string;
  includeCodeHighlight?: boolean;
}

export interface VideoGenerationOptions extends SlideGenerationOptions {
  resolution?: {
    width: number;
    height: number;
  };
  fps?: number;
  format?: 'mp4' | 'webm';
  quality: string; // e.g., 'high', 'medium', 'low'
  outputPath?: string; // Path where the generated video will be saved
}

export interface SpeechGenerationOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav';
}

export interface SlideData {
  title?: string;
  content: string;
  codeSnippet?: string;
  duration: number;
  backgroundStyle?: string;
  animations?: string[];
}

export interface VideoMetadata {
  totalDuration: number;
  slidesCount: number;
  audioLength: number;
  resolution: {
    width: number;
    height: number;
  };
  format: string;
  outputPath: string;
}

export interface RenderedSlide {
  imagePath: string;
  duration: number;
  startTime: number;
}