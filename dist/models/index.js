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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Voiceover = exports.Video = exports.User = void 0;
// src/models/index.ts
const mongoose_1 = __importStar(require("mongoose"));
// Create schemas
const UserSchema = new mongoose_1.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const VideoSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    codeSnippet: {
        type: String,
        required: true
    },
    videoPath: {
        type: String,
        required: true
    },
    voiceoverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Voiceover',
        required: false
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletAddress: {
        type: String,
        required: true,
        index: true
    },
    accessUrl: {
        type: String
    },
    contentType: {
        type: String,
        default: 'video/mp4'
    },
    duration: {
        type: Number,
        default: 0
    },
    theme: {
        type: String,
        default: 'dark'
    },
    animationStyle: {
        type: String,
        default: 'fade'
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    errorMessage: {
        type: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const VoiceoverSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true
    },
    audioPath: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletAddress: {
        type: String,
        required: true,
        index: true
    },
    duration: {
        type: Number,
        default: 0
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
// Create and export models
exports.User = mongoose_1.default.model('User', UserSchema);
exports.Video = mongoose_1.default.model('Video', VideoSchema);
exports.Voiceover = mongoose_1.default.model('Voiceover', VoiceoverSchema);
