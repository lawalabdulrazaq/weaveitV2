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
exports.StorageService = void 0;
// src/services/storageService.ts
// import fs from 'fs/promises';
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const mongoose_1 = __importStar(require("mongoose"));
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
const models_1 = require("../models");
/**
 * Storage service to handle file operations and database interactions
 */
class StorageService {
    /**
     * Get the GridFS bucket instance
     * @returns GridFSBucket instance
     */
    static getGridFSBucket() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gridFSBucket) {
                yield this.initializeGridFS();
            }
            return this.gridFSBucket;
        });
    }
    /**
     * Create an upload stream to GridFS
     * @param filename Name of the file to store
     * @param options Upload stream options
     * @returns GridFSBucketWriteStream
     */
    static createUploadStream(filename, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const bucket = yield this.getGridFSBucket();
            return bucket.openUploadStream(filename, options);
        });
    }
    /**
     * Delete a file from GridFS
     * @param fileId GridFS file ID to delete
     */
    static deleteFile(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            const bucket = yield this.getGridFSBucket();
            yield bucket.delete(fileId);
        });
    }
    /**
     * Initialize GridFS bucket
     */
    static initializeGridFS() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (mongoose_1.default.connection.readyState !== 1) {
                    console.log('Waiting for MongoDB connection...');
                    yield new Promise((resolve, reject) => {
                        mongoose_1.default.connection.once('open', resolve);
                        mongoose_1.default.connection.once('error', reject);
                    });
                }
                // Ensure mongoose.connection.db is defined
                if (!mongoose_1.default.connection.db) {
                    throw new Error('MongoDB connection is not fully initialized.');
                }
                this.gridFSBucket = new mongodb_1.GridFSBucket(mongoose_1.default.connection.db, { bucketName: 'videos' });
                console.log('GridFS initialized for video storage.');
            }
            catch (error) {
                console.error('Error initializing GridFS:', error);
                throw new Error('Failed to initialize GridFS');
            }
        });
    }
    /**
     * Upload a video to GridFS
     * @param filePath Path to the video file
     * @param filename Name of the file to store in GridFS
     * @returns The GridFS file ID
     */
    static uploadVideoToGridFS(filePath, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const uploadStream = this.gridFSBucket.openUploadStream(filename);
                const fileStream = (0, fs_1.createReadStream)(filePath);
                fileStream.pipe(uploadStream)
                    .on('error', (error) => {
                    console.error('Error uploading video to GridFS:', error);
                    reject(error);
                })
                    .on('finish', () => {
                    console.log('Video uploaded to GridFS:', uploadStream.id);
                    resolve(uploadStream.id.toString());
                });
            });
        });
    }
    /**
     * Retrieve a video from GridFS
     * @param fileId The GridFS file ID
     * @returns A readable stream of the video
     */
    static getVideoFromGridFS(fileId) {
        return this.gridFSBucket.openDownloadStream(new mongoose_1.Types.ObjectId(fileId));
    }
    static ensureDirectory(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, fs_1.existsSync)(dirPath)) {
                yield fs.promises.mkdir(dirPath, { recursive: true });
            }
            return dirPath;
        });
    }
    /**
     * Update a video record
     * @param videoId Video ID to update
     * @param updateData Data to update
     * @returns Updated video record
     */
    static updateVideoRecord(videoId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const video = yield models_1.Video.findByIdAndUpdate(videoId, { $set: updateData }, { new: true });
                if (!video) {
                    throw new Error(`Video not found with id: ${videoId}`);
                }
                return video;
            }
            catch (error) {
                console.error('Error updating video record:', error);
                throw new Error(`Failed to update video record: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static getOrCreateUser(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                walletAddress = walletAddress.toLowerCase();
                let user = yield models_1.User.findOne({ walletAddress });
                if (!user) {
                    user = yield models_1.User.create({ walletAddress });
                }
                return user;
            }
            catch (error) {
                console.error('Error getting/creating user:', error);
                throw new Error(`Failed to get/create user: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static saveTempFile(content, extension) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tempDir = yield this.ensureDirectory(config_1.config.storage.tempDir);
                console.log('Temporary directory:', tempDir);
                const filename = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}${extension}`;
                const filePath = path_1.default.join(tempDir, filename);
                if (typeof content === 'string') {
                    yield fs.promises.writeFile(filePath, content, 'utf-8');
                }
                else {
                    yield fs.promises.writeFile(filePath, content);
                }
                return filePath;
            }
            catch (error) {
                console.error('Error saving temporary file:', error);
                throw new Error(`Failed to save temporary file: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static createVideoRecord(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, codeSnippet, videoPath, walletAddress, theme = config_1.config.video.defaultTheme, animationStyle = config_1.config.video.defaultAnimationStyle, voiceoverId = null }) {
            try {
                const user = yield this.getOrCreateUser(walletAddress);
                const video = yield models_1.Video.create({
                    title,
                    codeSnippet,
                    videoPath,
                    owner: user._id,
                    walletAddress: user.walletAddress,
                    // accessUrl: `/videos/${path.basename(videoPath)}?wallet=${user.walletAddress}`,
                    accessUrl: `/videos/${videoPath}?wallet=${user.walletAddress}`,
                    theme,
                    animationStyle,
                    voiceoverId,
                    status: 'processing'
                });
                return video;
            }
            catch (error) {
                console.error('Error creating video record:', error);
                throw new Error(`Failed to create video record: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static updateVideoStatus(videoId, status, errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateData = { status };
                if (errorMessage && status === 'failed') {
                    updateData.errorMessage = errorMessage;
                }
                const video = yield models_1.Video.findByIdAndUpdate(videoId, updateData, { new: true });
                return video;
            }
            catch (error) {
                console.error('Error updating video status:', error);
                throw new Error(`Failed to update video status: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static createVoiceoverRecord(_a) {
        return __awaiter(this, arguments, void 0, function* ({ content, audioPath, walletAddress, duration = 0 }) {
            try {
                const user = yield this.getOrCreateUser(walletAddress);
                const voiceover = yield models_1.Voiceover.create({
                    content,
                    audioPath,
                    owner: user._id,
                    walletAddress: user.walletAddress,
                    duration
                });
                return voiceover;
            }
            catch (error) {
                console.error('Error creating voiceover record:', error);
                throw new Error(`Failed to create voiceover record: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static getVideoByIdOrFilename(videoId, walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let video = null;
                if (mongoose_1.Types.ObjectId.isValid(videoId)) {
                    video = yield models_1.Video.findById(videoId);
                }
                else {
                    const filename = path_1.default.basename(videoId);
                    video = yield models_1.Video.findOne({ videoPath: { $regex: filename, $options: 'i' } });
                }
                if (!video || (walletAddress && video.walletAddress !== walletAddress.toLowerCase())) {
                    return null;
                }
                return video;
            }
            catch (error) {
                console.error('Error retrieving video:', error);
                throw new Error(`Failed to retrieve video: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    static listUserVideos(walletAddress_1) {
        return __awaiter(this, arguments, void 0, function* (walletAddress, limit = 50, skip = 0) {
            try {
                walletAddress = walletAddress.toLowerCase();
                const videos = yield models_1.Video.find({ walletAddress })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit);
                return videos;
            }
            catch (error) {
                console.error('Error listing user videos:', error);
                throw new Error(`Failed to list user videos: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Upload a file stream directly to GridFS
     * @param stream The readable stream to upload
     * @param filename Name of the file to store in GridFS
     * @param options Additional options for the upload
     * @returns The GridFS file ID
     */
    static uploadStreamToGridFS(stream_1, filename_1) {
        return __awaiter(this, arguments, void 0, function* (stream, filename, options = {}) {
            return new Promise((resolve, reject) => {
                if (!this.gridFSBucket) {
                    return reject(new Error('GridFS is not initialized'));
                }
                const uploadStream = this.gridFSBucket.openUploadStream(filename, {
                    contentType: options.contentType,
                    metadata: options.metadata
                });
                stream.pipe(uploadStream)
                    .on('error', (error) => {
                    console.error('Error uploading to GridFS:', error);
                    reject(error);
                })
                    .on('finish', () => {
                    console.log('File uploaded to GridFS:', uploadStream.id);
                    resolve(uploadStream.id.toString());
                });
            });
        });
    }
    /**
     * Get a temporary local file path for a GridFS file
     * @param fileId The GridFS file ID
     * @param extension Optional file extension to append
     * @returns Path to the temporary local file
     */
    static getGridFSFileAsLocalPath(fileId_1) {
        return __awaiter(this, arguments, void 0, function* (fileId, extension = '') {
            try {
                // Ensure temp directory exists
                const tempDir = yield this.ensureDirectory(config_1.config.storage.tempDir);
                // Create temporary file path
                const tempFilename = `gridfs-${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}${extension}`;
                const tempFilePath = path_1.default.join(tempDir, tempFilename);
                // Get file stream from GridFS
                const downloadStream = this.gridFSBucket.openDownloadStream(new mongoose_1.Types.ObjectId(fileId));
                // Create write stream for the temp file
                const writeStream = fs.createWriteStream(tempFilePath);
                // Return a promise that resolves when the file is fully downloaded
                return new Promise((resolve, reject) => {
                    downloadStream
                        .pipe(writeStream)
                        .on('error', (error) => {
                        console.error('Error downloading file from GridFS:', error);
                        reject(error);
                    })
                        .on('finish', () => {
                        resolve(tempFilePath);
                    });
                });
            }
            catch (error) {
                console.error('Error creating local file from GridFS:', error);
                throw new Error(`Failed to create local file from GridFS: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    /**
     * Delete a file from GridFS
     * @param fileId The GridFS file ID
     */
    static deleteFromGridFS(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.gridFSBucket) {
                    throw new Error('GridFS is not initialized');
                }
                yield this.gridFSBucket.delete(new mongoose_1.Types.ObjectId(fileId));
                console.log(`Deleted file with ID ${fileId} from GridFS`);
            }
            catch (error) {
                console.error('Error deleting file from GridFS:', error);
                throw new Error(`Failed to delete file from GridFS: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
}
exports.StorageService = StorageService;
