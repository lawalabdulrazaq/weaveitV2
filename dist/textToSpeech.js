"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpeech = generateSpeech;
// src/textToSpeech.ts
const openai_1 = require("openai");
const dotenv_1 = require("dotenv");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
(0, dotenv_1.config)();
const writeFileAsync = (0, util_1.promisify)(fs_1.default.writeFile);
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
/**
 * Generate speech from text using OpenAI's TTS API
 * @param text The text to convert to speech
 * @param outputPath Path to save the audio file
 * @param options Speech generation options
 * @returns Path to the generated audio file
 */
function generateSpeech(text_1, outputPath_1) {
    return __awaiter(this, arguments, void 0, function* (text, outputPath, options = {}) {
        try {
            console.log('Generating speech...');
            // Ensure output directory exists
            const outputDir = path_1.default.dirname(outputPath);
            if (!fs_1.default.existsSync(outputDir)) {
                fs_1.default.mkdirSync(outputDir, { recursive: true });
            }
            // Split the text into manageable chunks if necessary
            const chunks = splitTextToChunks(text, 4000);
            if (chunks.length === 1) {
                // Simple case: single TTS request
                const audioResponse = yield openai.audio.speech.create({
                    model: 'tts-1',
                    voice: options.voice || 'alloy',
                    input: text,
                    speed: options.speed || 1.0,
                });
                const buffer = Buffer.from(yield audioResponse.arrayBuffer());
                yield writeFileAsync(outputPath, buffer);
                console.log(`Audio generated successfully: ${outputPath}`);
                return outputPath;
            }
            else {
                // Complex case: multiple TTS requests need to be merged
                console.log(`Text too long, splitting into ${chunks.length} chunks`);
                const tempDir = path_1.default.join(path_1.default.dirname(outputPath), 'temp_audio');
                if (!fs_1.default.existsSync(tempDir)) {
                    fs_1.default.mkdirSync(tempDir, { recursive: true });
                }
                // Generate audio for each chunk
                const chunkPaths = [];
                for (let i = 0; i < chunks.length; i++) {
                    const chunkPath = path_1.default.join(tempDir, `chunk_${i}.mp3`);
                    const audioResponse = yield openai.audio.speech.create({
                        model: 'tts-1',
                        voice: options.voice || 'alloy',
                        input: chunks[i],
                        speed: options.speed || 1.0,
                    });
                    const buffer = Buffer.from(yield audioResponse.arrayBuffer());
                    yield writeFileAsync(chunkPath, buffer);
                    chunkPaths.push(chunkPath);
                }
                // Merge audio chunks
                yield mergeAudioChunks(chunkPaths, outputPath);
                // Clean up temp files
                for (const chunkPath of chunkPaths) {
                    fs_1.default.unlinkSync(chunkPath);
                }
                fs_1.default.rmdirSync(tempDir);
                console.log(`Combined audio generated successfully: ${outputPath}`);
                return outputPath;
            }
        }
        catch (error) {
            console.error('Error generating speech:', error);
            throw error;
        }
    });
}
/**
 * Split text into chunks of max length
 */
function splitTextToChunks(text, maxLength) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        }
        else {
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
function mergeAudioChunks(chunkPaths, outputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { default: ffmpeg } = yield Promise.resolve().then(() => __importStar(require('fluent-ffmpeg')));
            // Create a concatenation file
            const concatFilePath = path_1.default.join(path_1.default.dirname(outputPath), 'concat.txt');
            const concatContent = chunkPaths.map(p => `file '${p}'`).join('\n');
            yield writeFileAsync(concatFilePath, concatContent);
            return new Promise((resolve, reject) => {
                ffmpeg()
                    .input(concatFilePath)
                    .inputOptions(['-f', 'concat', '-safe', '0'])
                    .output(outputPath)
                    .on('end', () => {
                    fs_1.default.unlinkSync(concatFilePath);
                    resolve();
                })
                    .on('error', (err) => {
                    fs_1.default.unlinkSync(concatFilePath);
                    reject(err);
                })
                    .run();
            });
        }
        catch (error) {
            console.error('Error merging audio chunks:', error);
            throw error;
        }
    });
}
