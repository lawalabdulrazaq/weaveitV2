// src/index.ts
export { Config, type ConfigOptions } from './config';
export { analyzeCode } from './codeAnalyzer';
export { generateSpeech } from './textToSpeech';
export { explainDocs } from './videoGenerator';
export { startServer, render3DVideo as mcpRender3DVideo } from './server';
export * from './types';

// Command line interface
export { default as cli } from './cli';