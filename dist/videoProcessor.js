"use strict";
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
exports.VideoProcessor = void 0;
const videoGenerator_1 = require("./videoGenerator");
const fs_1 = __importDefault(require("fs"));
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
class VideoProcessor {
    render3D(code, voiceoverStream, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // If we have a voiceover stream, save it to a temporary file
                let audioPath = null;
                if (voiceoverStream) {
                    const tempDir = path_1.default.join(process.cwd(), 'temp');
                    if (!fs_1.default.existsSync(tempDir)) {
                        yield fs_1.default.promises.mkdir(tempDir, { recursive: true });
                    }
                    audioPath = path_1.default.join(tempDir, `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.mp3`);
                    const writeStream = fs_1.default.createWriteStream(audioPath);
                    yield new Promise((resolve, reject) => {
                        voiceoverStream
                            .pipe(writeStream)
                            .on('finish', resolve)
                            .on('error', reject);
                    });
                }
                // Generate video using explainDocs
                const outputPath = yield (0, videoGenerator_1.explainDocs)(code, audioPath || '', // Pass empty string if no audio
                options);
                // Read the output file into a buffer
                const videoBuffer = yield fs_1.default.promises.readFile(outputPath);
                // Clean up temporary files
                if (audioPath && fs_1.default.existsSync(audioPath)) {
                    yield fs_1.default.promises.unlink(audioPath);
                }
                if (fs_1.default.existsSync(outputPath)) {
                    yield fs_1.default.promises.unlink(outputPath);
                }
                return videoBuffer;
            }
            catch (error) {
                console.error('Error in render3D:', error);
                throw error;
            }
        });
    }
}
exports.VideoProcessor = VideoProcessor;
