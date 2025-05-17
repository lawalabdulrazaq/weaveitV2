"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.config = void 0;
// src/config.ts
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const password = "E1lvrD7eNg2NkLWA";
const username = "temitopelawal925";
exports.config = {
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
    // storage: {
    //   tempDir: process.env.TEMP_DIR || './temp',
    //   outputDir: process.env.OUTPUT_DIR || './output'
    // },
    storage: {
        tempDir: path_1.default.join(process.cwd(), 'temp'),
        outputDir: path_1.default.join(process.cwd(), 'uploads'),
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
class Config {
    constructor(options) {
        var _a, _b, _c, _d, _e;
        if (!options.openaiApiKey && !options.useMock) {
            throw new Error('OpenAI API key is required unless mock mode is enabled.');
        }
        this.openaiApiKey = options.openaiApiKey;
        this.useMock = (_a = options.useMock) !== null && _a !== void 0 ? _a : false;
        this.voice = (_b = options.voice) !== null && _b !== void 0 ? _b : 'en';
        this.videoOutputDir = (_c = options.videoOutputDir) !== null && _c !== void 0 ? _c : './output/videos';
        this.audioOutputDir = (_d = options.audioOutputDir) !== null && _d !== void 0 ? _d : './output/audio';
        this.slidesOutputDir = (_e = options.slidesOutputDir) !== null && _e !== void 0 ? _e : './output/slides';
    }
}
exports.Config = Config;
