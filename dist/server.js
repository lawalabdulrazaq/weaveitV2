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
exports.render3DVideo = render3DVideo;
exports.startServer = startServer;
exports.startMcpServer = startMcpServer;
exports.createMcpServer = createMcpServer;
// src/server.ts
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const videoGenerator_1 = require("./videoGenerator");
const config_1 = require("./config");
const connection_1 = require("./db/connection");
const storageService_1 = require("./services/storageService");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const cors_1 = __importDefault(require("cors"));
const swagger_1 = require("./swagger");
const mongoose_1 = __importDefault(require("mongoose"));
const gridFSStorage_1 = require("./services/gridFSStorage");
const stream_1 = require("stream");
const textToSpeech_1 = require("./textToSpeech");
const videoProcessor_1 = require("./videoProcessor");
const mongodb_1 = require("mongodb");
const solanaMcpService_1 = require("./services/solanaMcpService");
// Create Multer instance with GridFS storage
const upload = (0, multer_1.default)({ storage: gridFSStorage_1.gridFSStorage });
const transports = {};
/**
 * Render 3D slide-based video with tutorial text and audio
 * @param text Tutorial text content
 * @param audioPath Path to audio file for narration
 * @param options Video rendering options
 * @returns Path to the generated video file
 */
function render3DVideo(text_1, audioPath_1) {
    return __awaiter(this, arguments, void 0, function* (text, audioPath, options = {
        includeCodeHighlight: true,
        resolution: config_1.config.video.defaultResolution,
        quality: config_1.config.video.defaultQuality
    }) {
        try {
            console.log('Generating video with real implementation');
            // Use outputDir instead of tempDir for final video
            const outputDir = yield storageService_1.StorageService.ensureDirectory(config_1.config.storage.outputDir);
            console.log('Output directory:', outputDir);
            const videoFilename = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.mp4`;
            const outputPath = path_1.default.join(outputDir, videoFilename);
            console.log('Output video path:', outputPath);
            // Generate video
            const videoPath = yield (0, videoGenerator_1.explainDocs)(text, audioPath, Object.assign(Object.assign({}, options), { outputPath }));
            if (!(0, fs_1.existsSync)(videoPath)) {
                throw new Error(`Video file not found at ${videoPath}`);
            }
            console.log(`Video generated successfully at ${videoPath}`);
            // Upload to GridFS
            const gridFSFileId = yield storageService_1.StorageService.uploadVideoToGridFS(videoPath, videoFilename);
            console.log(`Video uploaded to GridFS with ID: ${gridFSFileId}`);
            // Return the filename instead of GridFS ID
            return videoFilename;
        }
        catch (error) {
            console.error('Error generating video:', error);
            throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
// /**
//  * Generates a voiceover for the provided text
//  * @param text Text content for voiceover
//  * @param outputPath Path to save the audio file
//  */
// async function generateVoiceover(text: string, outputPath: string): Promise<void> {
//   try {
//     if (process.env.USE_MOCK === 'true') {
//       console.log('Using mock voiceover generation');
//       await fs.writeFile(outputPath, 'mock voiceover content');
//       return;
//     }
//     console.log('Generating real voiceover...');
//     // Call your text-to-speech service here
//     // Example: await textToSpeechService.generate(text, outputPath);
//     // Generate the speech
//     await generateSpeech(text, outputPath, {
//       voice: 'alloy',  // Use default voice
//       speed: 1.0       // Use default speed
//     });
//     console.log(`Voiceover generated successfully: ${outputPath}`);
//   } catch (error) {
//     console.error('Error generating voiceover:', error);
//     throw new Error(`Failed to generate voiceover: ${error instanceof Error ? error.message : String(error)}`);
//   }
// }
/**
 * Generate voiceover audio directly to a buffer in memory
 * @param {string} text - The text to convert to speech
 * @returns {Promise<Buffer>} - A promise that resolves to a buffer containing the audio data
 */
function generateVoiceoverToBuffer(text) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Generating voiceover for text:', text.substring(0, 50) + '...');
            // Use your text-to-speech service to generate audio directly to a buffer
            const ttsService = new textToSpeech_1.TextToSpeechService();
            const audioBuffer = yield ttsService.synthesizeSpeech(text);
            console.log('Voiceover generated successfully as buffer');
            return audioBuffer;
        }
        catch (error) {
            console.error('Error generating voiceover:', error);
            throw error;
        }
    });
}
/**
 * Render a 3D video using code and voiceover from GridFS
 * @param {string} code - The code to render in the video
 * @param {string|ObjectId} voiceoverGridFSId - The GridFS ID of the voiceover file
 * @param {Object} options - Rendering options
 * @returns {Promise<string>} - A promise that resolves to the GridFS ID of the generated video
 */
function render3DVideoWithGridFS(code_1, voiceoverGridFSId_1) {
    return __awaiter(this, arguments, void 0, function* (code, voiceoverGridFSId, options = {
        quality: config_1.config.video.defaultQuality,
        includeCodeHighlight: true,
        resolution: config_1.config.video.defaultResolution
    }) {
        try {
            console.log('Starting 3D video rendering with GridFS voiceover ID:', voiceoverGridFSId);
            // Get the voiceover stream from GridFS
            let voiceoverStream = null;
            if (voiceoverGridFSId) {
                // Ensure bucket is initialized
                if (!gridFSStorage_1.gridFSStorage.bucket) {
                    yield gridFSStorage_1.gridFSStorage.initialize();
                }
                if (!gridFSStorage_1.gridFSStorage.bucket) {
                    throw new Error('Failed to initialize GridFS bucket');
                }
                voiceoverStream = gridFSStorage_1.gridFSStorage.bucket.openDownloadStream(typeof voiceoverGridFSId === 'string' ? new mongodb_1.ObjectId(voiceoverGridFSId) : voiceoverGridFSId);
            }
            // Generate the video directly to a buffer
            const videoProcessor = new videoProcessor_1.VideoProcessor();
            const videoBuffer = yield videoProcessor.render3D(code, voiceoverStream, options);
            // Upload the video buffer to GridFS
            const videoFilename = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.mp4`;
            // Ensure bucket is initialized before upload
            if (!gridFSStorage_1.gridFSStorage.bucket) {
                yield gridFSStorage_1.gridFSStorage.initialize();
            }
            if (!gridFSStorage_1.gridFSStorage.bucket) {
                throw new Error('Failed to initialize GridFS bucket');
            }
            const videoGridFSId = yield new Promise((resolve, reject) => {
                const uploadStream = gridFSStorage_1.gridFSStorage.bucket.openUploadStream(videoFilename, {
                    metadata: { type: 'video', codeSnippet: code.substring(0, 200) }
                });
                const bufferStream = new stream_1.Readable();
                bufferStream.push(videoBuffer);
                bufferStream.push(null); // Signal end of stream
                bufferStream.pipe(uploadStream);
                uploadStream.on('finish', () => {
                    console.log('Video uploaded to GridFS with ID:', uploadStream.id);
                    resolve(uploadStream.id.toString());
                });
                uploadStream.on('error', (error) => {
                    reject(error);
                });
            });
            return videoGridFSId;
        }
        catch (error) {
            console.error('Error rendering 3D video:', error);
            throw error;
        }
    });
}
// ...rest of the file...
/**
 * Start the MCP server
 * @param port Port to listen on
 * @returns Express app instance
 */
function startServer() {
    return __awaiter(this, arguments, void 0, function* (port = config_1.config.server.port) {
        // Connect to MongoDB
        yield (0, connection_1.connectDB)();
        // Initialize GridFS
        yield storageService_1.StorageService.initializeGridFS();
        const app = (0, express_1.default)();
        // Middleware
        app.use(express_1.default.json());
        app.use((0, cors_1.default)());
        // Setup Swagger documentation
        (0, swagger_1.setupSwagger)(app);
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
        // MCP endpoint
        app.post('/mcp', upload.single('voiceOver'), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.headers['mcp-session-id'];
                let transport;
                if (!sessionId) {
                    // Initialize new session
                    transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                        sessionIdGenerator: () => (0, crypto_1.randomUUID)(),
                        onsessioninitialized: id => transports[id] = transport
                    });
                    const server = new mcp_js_1.McpServer({
                        name: 'VideoGeneratorAI',
                        version: '1.0.0',
                        description: '3D Animated Tutorial Video Generator'
                    });
                    // Tool: generate-video
                    server.tool('generate-video', {
                        tutorialText: zod_1.z.string().min(10).describe('Step-by-step tutorial text'),
                        voiceFileName: zod_1.z.string().describe('Name of the uploaded voice-over file'),
                        walletAddress: zod_1.z.string().min(5).describe('User wallet address for authentication'),
                        theme: zod_1.z.string().optional().describe('Video theme (dark/light)'),
                        animationStyle: zod_1.z.string().optional().describe('Animation style (fade/slide)')
                    }, (_a) => __awaiter(this, [_a], void 0, function* ({ tutorialText, voiceFileName, walletAddress, theme, animationStyle }) {
                        try {
                            console.log('Processing video generation request for wallet:', walletAddress);
                            const uploadDir = path_1.default.join(process.cwd(), 'uploads');
                            const voicePath = path_1.default.join(uploadDir, voiceFileName);
                            if (!(0, fs_1.existsSync)(voicePath)) {
                                return {
                                    content: [{
                                            type: 'text',
                                            text: `Error: Voice file not found at ${voicePath}`
                                        }],
                                    error: true
                                };
                            }
                            // Create video record in database
                            const videoTitle = `Tutorial ${new Date().toISOString().split('T')[0]}`;
                            const outputDir = yield storageService_1.StorageService.ensureDirectory(config_1.config.storage.outputDir);
                            const videoFilename = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.mp4`;
                            const videoPath = path_1.default.join(outputDir, videoFilename);
                            const videoRecord = yield storageService_1.StorageService.createVideoRecord({
                                title: videoTitle,
                                codeSnippet: tutorialText.substring(0, 200) + (tutorialText.length > 200 ? '...' : ''),
                                videoPath: videoFilename,
                                walletAddress,
                                theme,
                                animationStyle
                            });
                            try {
                                // Generate the video
                                yield render3DVideo(tutorialText, voicePath, {
                                    includeCodeHighlight: true,
                                    resolution: config_1.config.video.defaultResolution,
                                    quality: config_1.config.video.defaultQuality
                                });
                                if (!videoRecord._id) {
                                    throw new Error('Video record not found');
                                }
                                // Update video record status
                                yield storageService_1.StorageService.updateVideoStatus(videoRecord._id, 'completed');
                                return {
                                    content: [{
                                            type: 'text',
                                            text: `Video successfully generated. Access URL: /videos/${videoFilename}?wallet=${walletAddress}`
                                        }]
                                };
                            }
                            catch (error) {
                                // Update video record with error
                                yield storageService_1.StorageService.updateVideoStatus(videoRecord._id, 'failed', error instanceof Error ? error.message : String(error));
                                return {
                                    content: [{
                                            type: 'text',
                                            text: `Error generating video: ${error instanceof Error ? error.message : String(error)}`
                                        }],
                                    error: true
                                };
                            }
                        }
                        catch (error) {
                            console.error('Error in generate-video tool:', error);
                            return {
                                content: [{
                                        type: 'text',
                                        text: `Error generating video: ${error instanceof Error ? error.message : String(error)}`
                                    }],
                                error: true
                            };
                        }
                    }));
                    server.tool('list-videos', {
                        walletAddress: zod_1.z.string().min(5).describe('User wallet address for authentication')
                    }, (_a) => __awaiter(this, [_a], void 0, function* ({ walletAddress }) {
                        try {
                            const videos = yield storageService_1.StorageService.listUserVideos(walletAddress);
                            if (videos.length === 0) {
                                return {
                                    content: [{
                                            type: 'text',
                                            text: 'You have no videos yet.'
                                        }]
                                };
                            }
                            const videoList = videos.map(video => `${video.title} (${video.status}): ${video.accessUrl}`).join('\n');
                            return {
                                content: [{
                                        type: 'text',
                                        text: `Available videos:\n${videoList}`
                                    }]
                            };
                        }
                        catch (error) {
                            return {
                                content: [{
                                        type: 'text',
                                        text: `Error listing videos: ${error instanceof Error ? error.message : String(error)}`
                                    }],
                                error: true
                            };
                        }
                    }));
                    yield server.connect(transport);
                }
                else {
                    transport = transports[sessionId];
                    if (!transport) {
                        res.status(404).json({ error: 'Session not found' });
                        return;
                    }
                }
                yield transport.handleRequest(req, res, req.body);
                res.end();
            }
            catch (error) {
                console.error('Error handling MCP request:', error);
                res.status(500).json({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : String(error)
                });
            }
        }));
        // Video generation endpoint using GridFS storage
        app.post('/generate-video', upload.none(), authMiddleware_1.walletAuthMiddleware, (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Received video generation request");
                console.log('Request body:', req.body);
                const { code, theme = config_1.config.video.defaultTheme, animationStyle = config_1.config.video.defaultAnimationStyle, walletAddress } = req.body;
                // Validate wallet address
                if (!walletAddress || walletAddress.length < 5) {
                    res.status(400).json({ error: 'Invalid wallet address. It must be at least 5 characters long.' });
                    return;
                }
                console.log('Wallet address:', walletAddress);
                // Validate code input
                if (!code || code.length < 10) {
                    res.status(400).json({ error: 'Code is required and must be at least 10 characters long.' });
                    return;
                }
                console.log('Generating video for code with wallet:', walletAddress);
                // Generate voiceover directly to GridFS
                const voiceoverFilename = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.mp3`;
                let voiceoverGridFSId = null;
                try {
                    // Generate voiceover in memory
                    const voiceoverBuffer = yield generateVoiceoverToBuffer(code);
                    // Ensure bucket is initialized
                    if (!gridFSStorage_1.gridFSStorage.bucket) {
                        yield gridFSStorage_1.gridFSStorage.initialize();
                    }
                    if (!gridFSStorage_1.gridFSStorage.bucket) {
                        throw new Error('Failed to initialize GridFS bucket');
                    }
                    // Create a readable stream from the buffer and upload to GridFS
                    const voiceoverStream = new stream_1.Readable();
                    voiceoverStream.push(voiceoverBuffer);
                    voiceoverStream.push(null); // Signal end of stream
                    voiceoverGridFSId = yield new Promise((resolve, reject) => {
                        const uploadStream = gridFSStorage_1.gridFSStorage.bucket.openUploadStream(voiceoverFilename, {
                            metadata: { type: 'voiceover', walletAddress }
                        });
                        voiceoverStream.pipe(uploadStream);
                        uploadStream.on('finish', () => {
                            console.log('Voiceover uploaded to GridFS with ID:', uploadStream.id);
                            resolve(uploadStream.id);
                        });
                        uploadStream.on('error', (error) => {
                            reject(error);
                        });
                    });
                }
                catch (error) {
                    console.error('Failed to generate voiceover:', error);
                    // Continue without voiceover if it fails
                }
                // Create video record in database
                const videoTitle = `Code Tutorial ${new Date().toISOString().split('T')[0]}`;
                const videoFilename = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.mp4`;
                console.log('Creating video record with filename:', videoFilename);
                const videoRecord = yield storageService_1.StorageService.createVideoRecord({
                    title: videoTitle,
                    codeSnippet: code.substring(0, 200) + (code.length > 200 ? '...' : ''),
                    videoPath: videoFilename, // Store just the filename, not the full path
                    walletAddress,
                    theme,
                    animationStyle,
                    voiceoverId: voiceoverGridFSId // Store the GridFS ID of the voiceover file
                });
                // Generate video asynchronously
                render3DVideoWithGridFS(code, voiceoverGridFSId, {
                    includeCodeHighlight: true,
                    resolution: config_1.config.video.defaultResolution,
                    quality: config_1.config.video.defaultQuality
                })
                    .then((generatedVideoId) => __awaiter(this, void 0, void 0, function* () {
                    // Update video record with the generated video ID
                    yield storageService_1.StorageService.updateVideoRecord(videoRecord._id, {
                        videoGridFSId: generatedVideoId,
                        status: 'completed'
                    });
                    console.log('Video generation completed for:', videoRecord._id);
                }))
                    .catch((error) => __awaiter(this, void 0, void 0, function* () {
                    console.error('Video generation failed:', error);
                    yield storageService_1.StorageService.updateVideoStatus(videoRecord._id, 'failed', error instanceof Error ? error.message : String(error));
                }));
                // Respond immediately with the job ID
                res.status(202).json({
                    message: 'Video generation started',
                    videoId: videoRecord._id,
                    status: 'processing',
                    accessUrl: `/videos/${videoFilename}?wallet=${walletAddress}`,
                });
            }
            catch (error) {
                console.error('Error generating video:', error);
                res.status(500).json({
                    error: 'Failed to generate video.',
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        }));
        // Check video status endpoint
        app.get('/video-status/:videoId', authMiddleware_1.walletAuthMiddleware, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const videoId = req.params.videoId;
                const walletAddress = req.walletAddress;
                const video = yield storageService_1.StorageService.getVideoByIdOrFilename(videoId, walletAddress);
                if (!video) {
                    return res.status(404).json({ error: 'Video not found' });
                }
                res.status(200).json(Object.assign({ videoId: video._id, status: video.status, title: video.title, accessUrl: video.accessUrl, createdAt: video.createdAt, updatedAt: video.updatedAt }, (video.errorMessage ? { errorMessage: video.errorMessage } : {})));
            }
            catch (error) {
                console.error('Error checking video status:', error);
                res.status(500).json({
                    error: 'Error checking video status',
                    message: error instanceof Error ? error.message : String(error)
                });
                next(error);
            }
        }));
        // List user videos endpoint
        app.get('/videos', authMiddleware_1.walletAuthMiddleware, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const walletAddress = req.walletAddress;
                const limit = parseInt(req.query.limit || '50', 10);
                const skip = parseInt(req.query.skip || '0', 10);
                const videos = yield storageService_1.StorageService.listUserVideos(walletAddress, limit, skip);
                const videoList = videos.map(video => ({
                    videoId: video._id,
                    title: video.title,
                    status: video.status,
                    accessUrl: video.accessUrl,
                    createdAt: video.createdAt,
                    updatedAt: video.updatedAt
                }));
                res.status(200).json({
                    total: videoList.length,
                    videos: videoList
                });
            }
            catch (error) {
                console.error('Error listing videos:', error);
                res.status(500).json({
                    error: 'Error listing videos',
                    message: error instanceof Error ? error.message : String(error)
                });
                next(error);
            }
        }));
        // Video download/stream endpoint
        app.get('/videos/:filename', authMiddleware_1.optionalWalletAuthMiddleware, (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const filename = req.params.filename;
                const walletAddress = req.walletAddress;
                console.log('Requesting video:', filename);
                console.log('Wallet address:', walletAddress);
                const video = yield storageService_1.StorageService.getVideoByIdOrFilename(filename, walletAddress);
                if (!video) {
                    return res.status(404).json({ error: 'Video not found or access denied' });
                }
                console.log('Found video:', video);
                if (mongoose_1.default.Types.ObjectId.isValid(video.videoPath)) {
                    // Handle GridFS stored video
                    console.log('Serving video from GridFS:', video.videoPath);
                    res.setHeader('Content-Type', 'video/mp4');
                    res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp4"`);
                    const videoStream = storageService_1.StorageService.getVideoFromGridFS(video.videoPath);
                    videoStream.pipe(res);
                    videoStream.on('error', (error) => {
                        console.error('Error streaming video from GridFS:', error);
                        res.status(500).json({ error: 'Error serving video file' });
                    });
                    return;
                }
                else {
                    // Handle local file system stored video
                    const outputDir = config_1.config.storage.outputDir;
                    const filePath = path_1.default.join(outputDir, video.videoPath);
                    console.log('Serving video from file system:', filePath);
                    if (!(0, fs_1.existsSync)(filePath)) {
                        console.error('Video file not found at path:', filePath);
                        return res.status(404).json({ error: 'Video file not found' });
                    }
                    res.setHeader('Content-Type', 'video/mp4');
                    res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp4"`);
                    const fileStream = (0, fs_1.createReadStream)(filePath);
                    fileStream.pipe(res);
                    fileStream.on('error', (error) => {
                        console.error('Error streaming video file:', error);
                        res.status(500).json({ error: 'Error serving video file' });
                    });
                    return;
                }
            }
            catch (error) {
                console.error('Error serving video:', error);
                res.status(500).json({ error: 'Error serving video file' });
                next(error);
            }
        }));
        // Start server
        const server = app.listen(port, () => {
            console.log(`MCP Video Server listening on port ${port}`);
            console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
        });
        return { app, server };
    });
}
/**
 * Starts the Solana MCP server
 * This function should be called separately when using the MCP functionality
 * @param config Optional configuration for the MCP server
 */
function startMcpServer(config) {
    try {
        (0, solanaMcpService_1.startSolanaMcpServer)(config);
    }
    catch (error) {
        console.error('Failed to start Solana MCP server:', error);
        throw error;
    }
}
/**
 * Creates a new Solana MCP server instance
 * @param config Optional configuration for the MCP server
 * @returns The configured MCP server
 */
function createMcpServer(config) {
    return (0, solanaMcpService_1.createSolanaMcpServer)(config);
}
// run the server
startServer(config_1.config.server.port)
    .then(({ app, server }) => {
    console.log(`Server started on port ${config_1.config.server.port}`);
})
    .catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
});
