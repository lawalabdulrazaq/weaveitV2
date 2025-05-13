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
// src/server.ts
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const zod_1 = require("zod");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const videoGenerator_1 = require("./videoGenerator");
// Storage configuration for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        // Ensure directory exists
        if (!(0, fs_1.existsSync)(uploadDir)) {
            promises_1.default.mkdir(uploadDir, { recursive: true })
                .then(() => cb(null, uploadDir))
                .catch(err => cb(err, ''));
        }
        else {
            cb(null, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({ storage });
const transports = {};
/**
 * Render 3D slide-based video with tutorial text and audio
 * @param text Tutorial text content
 * @param audioPath Path to audio file for narration
 * @returns Path to the generated video file
 */
function render3DVideo(text, audioPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if we should use the mock implementation
            if (process.env.USE_MOCK === 'true') {
                console.log('Using mock video generation');
                const outputPath = path_1.default.join(process.cwd(), 'tutorial_01.mp4');
                yield promises_1.default.writeFile(outputPath, 'mock video content');
                return outputPath;
            }
            // Otherwise, use the real implementation
            console.log('Generating video with real implementation');
            return yield (0, videoGenerator_1.render3DVideo)(text, audioPath, {
                theme: 'dark',
                animationStyle: 'fade',
                includeCodeHighlight: true,
                resolution: { width: 1280, height: 720 },
                quality: 'high'
            });
        }
        catch (error) {
            console.error('Error generating video:', error);
            throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
/**
 * Start the MCP server
 * @param port Port to listen on
 * @returns Express app instance
 */
function startServer(port = 3000) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
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
                    voiceFileName: zod_1.z.string().describe('Name of the uploaded voice-over file')
                }, (_a) => __awaiter(this, [_a], void 0, function* ({ tutorialText, voiceFileName }) {
                    try {
                        console.log('Processing video generation request');
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
                        const videoPath = yield render3DVideo(tutorialText, voicePath);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `Video successfully generated at: ${videoPath}`
                                }]
                        };
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
                server.tool('list-videos', {}, () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const outputDir = path_1.default.join(process.cwd());
                        const files = yield promises_1.default.readdir(outputDir);
                        const videoFiles = files.filter(file => file.endsWith('.mp4'));
                        return {
                            content: [{
                                    type: 'text',
                                    text: `Available videos:\n${videoFiles.join('\n')}`
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
    // Video download endpoint
    app.get('/videos/:filename', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const filename = req.params.filename;
            const filePath = path_1.default.join(process.cwd(), filename);
            if (!(0, fs_1.existsSync)(filePath)) {
                res.status(404).json({ error: 'Video not found' });
                return; // Ensure no further execution
            }
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            const fileStream = (0, fs_1.createReadStream)(filePath);
            fileStream.pipe(res);
            // Explicitly handle the end of the stream
            fileStream.on('end', () => {
                res.end();
            });
            fileStream.on('error', (error) => {
                console.error('Error streaming video file:', error);
                res.status(500).json({ error: 'Error serving video file' });
            });
        }
        catch (error) {
            console.error('Error serving video:', error);
            res.status(500).json({ error: 'Error serving video file' });
        }
    }));
    // Start server
    app.listen(port, () => {
        console.log(`MCP Video Server listening on port ${port}`);
    });
    return app;
}
// Start server if called directly
if (require.main === module) {
    const port = parseInt(process.env.PORT || '3000', 10);
    startServer(port);
}
