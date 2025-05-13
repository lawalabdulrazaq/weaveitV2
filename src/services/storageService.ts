// src/services/storageService.ts
import fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { Video, User, Voiceover, IUser, IVideo, IVoiceover } from '../models';
import mongoose from 'mongoose';

/**
 * Storage service to handle file operations and database interactions
 */
export class StorageService {
  /**
   * Ensures the specified directory exists
   * @param dirPath Directory path to ensure
   */
  static async ensureDirectory(dirPath: string): Promise<string> {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true });
    }
    return dirPath;
  }

  /**
   * Gets or creates a user by wallet address
   * @param walletAddress User's wallet address
   * @returns User document
   */
  static async getOrCreateUser(walletAddress: string): Promise<IUser> {
    try {
      // Normalize wallet address
      walletAddress = walletAddress.toLowerCase();
      
      // Try to find existing user
      let user = await User.findOne({ walletAddress });
      
      // If user doesn't exist, create one
      if (!user) {
        user = await User.create({ walletAddress });
      }
      
      return user;
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw new Error(`Failed to get/create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Saves a temporary file for processing
   * @param content Content to save
   * @param extension File extension
   * @returns Path to saved file
   */
  static async saveTempFile(content: Buffer | string, extension: string): Promise<string> {
    try {
      const tempDir = await this.ensureDirectory(config.storage.tempDir);
      const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
      const filePath = path.join(tempDir, filename);
      
      if (typeof content === 'string') {
        await fs.writeFile(filePath, content, 'utf-8');
      } else {
        await fs.writeFile(filePath, content);
      }
      
      return filePath;
    } catch (error) {
      console.error('Error saving temporary file:', error);
      throw new Error(`Failed to save temporary file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a video record in the database
   * @param params Video parameters
   * @returns Created video document
   */
  static async createVideoRecord({
    title,
    codeSnippet,
    videoPath,
    walletAddress,
    theme = config.video.defaultTheme,
    animationStyle = config.video.defaultAnimationStyle
  }: {
    title: string;
    codeSnippet: string;
    videoPath: string;
    walletAddress: string;
    theme?: string;
    animationStyle?: string;
  }): Promise<IVideo> {
    try {
      // Get or create user
      const user = await this.getOrCreateUser(walletAddress);
      
      // Create video record
      const video = await Video.create({
        title,
        codeSnippet,
        videoPath,
        owner: user._id,
        walletAddress: user.walletAddress,
        accessUrl: `/videos/${path.basename(videoPath)}?wallet=${user.walletAddress}`,
        theme,
        animationStyle,
        status: 'processing'
      });
      
      return video;
    } catch (error) {
      console.error('Error creating video record:', error);
      throw new Error(`Failed to create video record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Updates the video status
   * @param videoId Video ID
   * @param status New status
   * @param errorMessage Optional error message
   * @returns Updated video document
   */
  static async updateVideoStatus(
    videoId: string | mongoose.Types.ObjectId, 
    status: 'processing' | 'completed' | 'failed', 
    errorMessage?: string
  ): Promise<IVideo | null> {
    try {
      const updateData: any = { status };
      
      if (errorMessage && status === 'failed') {
        updateData.errorMessage = errorMessage;
      }
      
      const video = await Video.findByIdAndUpdate(
        videoId,
        updateData,
        { new: true }
      );
      
      return video;
    } catch (error) {
      console.error('Error updating video status:', error);
      throw new Error(`Failed to update video status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Creates a voiceover record in the database
   * @param params Voiceover parameters
   * @returns Created voiceover document
   */
  static async createVoiceoverRecord({
    content,
    audioPath,
    walletAddress,
    duration = 0
  }: {
    content: string;
    audioPath: string;
    walletAddress: string;
    duration?: number;
  }): Promise<IVoiceover> {
    try {
      // Get or create user
      const user = await this.getOrCreateUser(walletAddress);
      
      // Create voiceover record
      const voiceover = await Voiceover.create({
        content,
        audioPath,
        owner: user._id,
        walletAddress: user.walletAddress,
        duration
      });
      
      return voiceover;
    } catch (error) {
      console.error('Error creating voiceover record:', error);
      throw new Error(`Failed to create voiceover record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves a video by ID with owner verification
   * @param videoId Video ID or filename
   * @param walletAddress Owner's wallet address
   * @returns Video document or null if not found/authorized
   */
  static async getVideoByIdOrFilename(
    videoId: string, 
    walletAddress?: string
  ): Promise<IVideo | null> {
    try {
      let video: IVideo | null = null;
      
      // Check if videoId is an ObjectId or a filename
      if (mongoose.Types.ObjectId.isValid(videoId)) {
        video = await Video.findById(videoId);
      } else {
        // Assume it's a filename
        const filename = path.basename(videoId);
        video = await Video.findOne({ videoPath: { $regex: filename, $options: 'i' } });
      }
      
      // If video not found or wallet address doesn't match (when provided)
      if (!video || (walletAddress && video.walletAddress !== walletAddress.toLowerCase())) {
        return null;
      }
      
      return video;
    } catch (error) {
      console.error('Error retrieving video:', error);
      throw new Error(`Failed to retrieve video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lists videos for a specific wallet address
   * @param walletAddress User's wallet address
   * @param limit Maximum number of videos to return
   * @param skip Number of videos to skip (for pagination)
   * @returns Array of video documents
   */
  static async listUserVideos(
    walletAddress: string,
    limit = 50,
    skip = 0
  ): Promise<IVideo[]> {
    try {
      // Normalize wallet address
      walletAddress = walletAddress.toLowerCase();
      
      const videos = await Video.find({ walletAddress })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return videos;
    } catch (error) {
      console.error('Error listing user videos:', error);
      throw new Error(`Failed to list user videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}