// src/server.ts
import express from 'express';
import multer from 'multer';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { existsSync, createReadStream } from 'fs';
import { explainDocs } from './videoGenerator';
import { config } from './config';
import { connectDB } from './db/connection';
import { StorageService } from './services/storageService';
import { walletAuthMiddleware, optionalWalletAuthMiddleware, ownershipMiddleware } from './middlewares/authMiddleware';
import { Video } from './models';
import cors from 'cors';
import { setupSwagger } from './swagger';
import { VideoGenerationOptions } from './types';

// Storage configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      // Ensure directory exists
      await StorageService.ensureDirectory(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const transports: Record<string, StreamableHTTPServerTransport> = {};

/**
 * Render 3D slide-based video with tutorial text and audio
 * @param text Tutorial text content
 * @param audioPath Path to audio file for narration
 * @param options Video rendering options
 * @returns Path to the generated video file
 */
export async function render3DVideo(
  text: string, 
  audioPath: string, 
  options: VideoGenerationOptions = {
    includeCodeHighlight: true,
    resolution: config.video.defaultResolution,
    quality: config.video.defaultQuality
  }
): Promise<string> {
  try {
    // Check if we should use the mock implementation
    if (process.env.USE_MOCK === 'true') {
      console.log('Using mock video generation');
      const outputDir = await StorageService.ensureDirectory(config.storage.outputDir);
      const outputPath = path.join(outputDir, `tutorial_${Date.now()}.mp4`);
      await fs.writeFile(outputPath, 'mock video content');
      return outputPath;
    }
    
    // Otherwise, use the real implementation
    console.log('Generating video with real implementation');
    return await explainDocs(text, audioPath, options);
  } catch (error) {
    console.error('Error generating video:', error);
    throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates a voiceover for the provided text
 * @param text Text content for voiceover
 * @param outputPath Path to save the audio file
 */
async function generateVoiceover(text: string, outputPath: string): Promise<void> {
  try {
    if (process.env.USE_MOCK === 'true') {
      console.log('Using mock voiceover generation');
      await fs.writeFile(outputPath, 'mock voiceover content');
      return;
    }
  
    console.log('Generating real voiceover...');
    // Call your text-to-speech service here
    // Example: await textToSpeechService.generate(text, outputPath);
    throw new Error('Text-to-speech service not implemented.');
  } catch (error) {
    console.error('Error generating voiceover:', error);
    throw new Error(`Failed to generate voiceover: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Start the MCP server
 * @param port Port to listen on
 * @returns Express app instance
 */
export async function startServer(port = config.server.port) {
  // Connect to MongoDB
  await connectDB();
  
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(cors());
  
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // MCP endpoint
  app.post('/mcp', upload.single('voiceOver'), async (req, res) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;
  
      if (!sessionId) {
        // Initialize new session
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: id => transports[id] = transport
        });
  
        const server = new McpServer({
          name: 'VideoGeneratorAI',
          version: '1.0.0',
          description: '3D Animated Tutorial Video Generator'
        });
  
        // Tool: generate-video
        server.tool(
          'generate-video',
          {
            tutorialText: z.string().min(10).describe('Step-by-step tutorial text'),
            voiceFileName: z.string().describe('Name of the uploaded voice-over file'),
            walletAddress: z.string().min(5).describe('User wallet address for authentication'),
            theme: z.string().optional().describe('Video theme (dark/light)'),
            animationStyle: z.string().optional().describe('Animation style (fade/slide)')
          },
          async ({ tutorialText, voiceFileName, walletAddress, theme, animationStyle }) => {
            try {
              console.log('Processing video generation request for wallet:', walletAddress);
  
              const uploadDir = path.join(process.cwd(), 'uploads');
              const voicePath = path.join(uploadDir, voiceFileName);
  
              if (!existsSync(voicePath)) {
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
              const outputDir = await StorageService.ensureDirectory(config.storage.outputDir);
              const videoFilename = `${Date.now()}-${randomUUID().slice(0, 8)}.mp4`;
              const videoPath = path.join(outputDir, videoFilename);
              
              const videoRecord = await StorageService.createVideoRecord({
                title: videoTitle,
                codeSnippet: tutorialText.substring(0, 200) + (tutorialText.length > 200 ? '...' : ''),
                videoPath: videoFilename,
                walletAddress,
                theme,
                animationStyle
              });
  
              try {
                // Generate the video
                await render3DVideo(tutorialText, voicePath, {
                  includeCodeHighlight: true,
                  resolution: config.video.defaultResolution,
                  quality: config.video.defaultQuality
                });

                if(!videoRecord._id) {
                  throw new Error('Video record not found');
                }
                
                // Update video record status
                await StorageService.updateVideoStatus(videoRecord._id, 'completed');
                
                return {
                  content: [{
                    type: 'text',
                    text: `Video successfully generated. Access URL: /videos/${videoFilename}?wallet=${walletAddress}`
                  }]
                };
              } catch (error) {
                // Update video record with error
                await StorageService.updateVideoStatus(
                  videoRecord._id, 
                  'failed',
                  error instanceof Error ? error.message : String(error)
                );
                
                return {
                  content: [{
                    type: 'text',
                    text: `Error generating video: ${error instanceof Error ? error.message : String(error)}`
                  }],
                  error: true
                };
              }
            } catch (error) {
              console.error('Error in generate-video tool:', error);
              return {
                content: [{
                  type: 'text',
                  text: `Error generating video: ${error instanceof Error ? error.message : String(error)}`
                }],
                error: true
              };
            }
          }
        );
  
        server.tool(
          'list-videos',
          {
            walletAddress: z.string().min(5).describe('User wallet address for authentication')
          },
          async ({ walletAddress }) => {
            try {
              const videos = await StorageService.listUserVideos(walletAddress);
              
              if (videos.length === 0) {
                return {
                  content: [{
                    type: 'text',
                    text: 'You have no videos yet.'
                  }]
                };
              }
              
              const videoList = videos.map(video => 
                `${video.title} (${video.status}): ${video.accessUrl}`
              ).join('\n');
              
              return {
                content: [{
                  type: 'text',
                  text: `Available videos:\n${videoList}`
                }]
              };
            } catch (error) {
              return {
                content: [{
                  type: 'text',
                  text: `Error listing videos: ${error instanceof Error ? error.message : String(error)}`
                }],
                error: true
              };
            }
          }
        );
  
        await server.connect(transport);
      } else {
        transport = transports[sessionId];
        if (!transport) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
      }
  
      await transport.handleRequest(req, res, req.body);
      res.end();
    } catch (error) {
      console.error('Error handling MCP request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Video generation endpoint
  app.post('/generate-video', walletAuthMiddleware, upload.none(), async (req, res) => {
    try {
      console.log("Received video generation request");
      console.log('Request body:', req.body);
      const { code, theme = config.video.defaultTheme, animationStyle = config.video.defaultAnimationStyle, walletAddress } = req.body;

      if (!walletAddress || walletAddress.length < 5) {
        res.status(400).json({ error: 'Invalid wallet address. It must be at least 5 characters long.' });
        return;
      }
      console.log('Wallet address:', walletAddress);

      if (!code || code.length < 10) {
        res.status(400).json({ error: 'Code is required and must be at least 10 characters long.' });
        return;
      }

      console.log('Generating video for code with wallet:', walletAddress);

      // Generate voiceover first
      const tempDir = await StorageService.ensureDirectory(config.storage.tempDir);
      const voiceoverPath = path.join(tempDir, `${Date.now()}-${randomUUID().slice(0, 8)}.mp3`);

      try {
        await generateVoiceover(code, voiceoverPath);
      } catch (error) {
        console.error('Failed to generate voiceover:', error);
        // Continue without voiceover if it fails
      }

      // Create video record in database
      const videoTitle = `Code Tutorial ${new Date().toISOString().split('T')[0]}`;
      const outputDir = await StorageService.ensureDirectory(config.storage.outputDir);
      const videoFilename = `${Date.now()}-${randomUUID().slice(0, 8)}.mp4`;
      const videoPath = path.join(outputDir, videoFilename);

      const videoRecord = await StorageService.createVideoRecord({
        title: videoTitle,
        codeSnippet: code.substring(0, 200) + (code.length > 200 ? '...' : ''),
        videoPath: videoFilename,
        walletAddress,
        theme,
        animationStyle,
      });

      // Generate video asynchronously
      render3DVideo(code, voiceoverPath, {
        includeCodeHighlight: true,
        resolution: config.video.defaultResolution,
        quality: config.video.defaultQuality,
      })
        .then(async () => {
          await StorageService.updateVideoStatus(videoRecord._id, 'completed');
          console.log('Video generation completed for:', videoRecord._id);
        })
        .catch(async (error) => {
          console.error('Video generation failed:', error);
          await StorageService.updateVideoStatus(
            videoRecord._id,
            'failed',
            error instanceof Error ? error.message : String(error)
          );
        });

      // Respond immediately with the job ID
      res.status(202).json({
        message: 'Video generation started',
        videoId: videoRecord._id,
        status: 'processing',
        accessUrl: `/videos/${videoFilename}?wallet=${walletAddress}`,
      });
    } catch (error) {
      console.error('Error generating video:', error);
      res.status(500).json({
        error: 'Failed to generate video.',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Check video status endpoint
  app.get('/video-status/:videoId', walletAuthMiddleware, async (req: any, res: any, next) => {
    try {
      const videoId = req.params.videoId;
      const walletAddress = (req as any).walletAddress;
      
      const video = await StorageService.getVideoByIdOrFilename(videoId, walletAddress);
      
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      
      res.status(200).json({
        videoId: video._id,
        status: video.status,
        title: video.title,
        accessUrl: video.accessUrl,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        ...(video.errorMessage ? { errorMessage: video.errorMessage } : {})
      });
    } catch (error) {
      console.error('Error checking video status:', error);
      res.status(500).json({ 
        error: 'Error checking video status', 
        message: error instanceof Error ? error.message : String(error) 
      });
      next(error);
    }
  });

  // List user videos endpoint
  app.get('/videos', walletAuthMiddleware, async (req: any, res: any, next) => {
    try {
      const walletAddress = (req as any).walletAddress;
      const limit = parseInt(req.query.limit as string || '50', 10);
      const skip = parseInt(req.query.skip as string || '0', 10);
      
      const videos = await StorageService.listUserVideos(walletAddress, limit, skip);
      
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
    } catch (error) {
      console.error('Error listing videos:', error);
      res.status(500).json({ 
        error: 'Error listing videos', 
        message: error instanceof Error ? error.message : String(error) 
      });
      next(error);
    }
  });

  // Video download/stream endpoint
  app.get('/videos/:filename', optionalWalletAuthMiddleware, async (req: any, res: any, next) => {
    try {
      const filename = req.params.filename;
      const walletAddress = (req as any).walletAddress;
      
      // If wallet address provided, verify ownership
      if (walletAddress) {
        const video = await StorageService.getVideoByIdOrFilename(filename, walletAddress);
        
        if (!video) {
          return res.status(404).json({ error: 'Video not found or access denied' });
        }
        
        // Get the actual filepath
        const outputDir = config.storage.outputDir;
        const filePath = path.join(outputDir, video.videoPath);
        
        if (!existsSync(filePath)) {
          return res.status(404).json({ error: 'Video file not found' });
        }
        
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${video.videoPath}"`);
        
        const fileStream = createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
          res.end();
        });
        
        fileStream.on('error', (error) => {
          console.error('Error streaming video file:', error);
          res.status(500).json({ error: 'Error serving video file' });
        });
      } else {
        // No wallet provided, check if the video exists (could be public)
        const outputDir = config.storage.outputDir;
        const filePath = path.join(outputDir, filename);
        
        if (!existsSync(filePath)) {
          return res.status(404).json({ error: 'Video not found' });
        }
        
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
          res.end();
        });
        
        fileStream.on('error', (error) => {
          console.error('Error streaming video file:', error);
          res.status(500).json({ error: 'Error serving video file' });
        });
      }
    } catch (error) {
      console.error('Error serving video:', error);
      res.status(500).json({ error: 'Error serving video file' });
      next(error);
    }
  });
  
  // Start server
  const server = app.listen(port, () => {
    console.log(`MCP Video Server listening on port ${port}`);
    console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
  });
  
  return { app, server };
}

// run the server
startServer(config.server.port)
  .then(({ app, server }) => {
    console.log(`Server started on port ${config.server.port}`);
  })
  .catch(error => {
    console.error('Error starting server:', error);
    process.exit(1);
});