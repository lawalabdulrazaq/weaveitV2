// src/services/storageService.ts
// import fs from 'fs/promises';
import * as fs from 'fs';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import mongoose, { Types } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { config } from '../config';
import { Video, User, Voiceover, IUser, IVideo, IVoiceover } from '../models';
import { GridFSBucketWriteStream } from 'mongodb';
/**
 * Storage service to handle file operations and database interactions
 */
export class StorageService {
  private static gridFSBucket: GridFSBucket;


  /**
   * Get the GridFS bucket instance
   * @returns GridFSBucket instance
   */
  static async getGridFSBucket(): Promise<GridFSBucket> {
    if (!this.gridFSBucket) {
      await this.initializeGridFS();
    }
    return this.gridFSBucket;
  }

  /**
   * Create an upload stream to GridFS
   * @param filename Name of the file to store
   * @param options Upload stream options
   * @returns GridFSBucketWriteStream
   */
  static async createUploadStream(
    filename: string,
    options?: { metadata?: any }
  ): Promise<GridFSBucketWriteStream> {
    const bucket = await this.getGridFSBucket();
    return bucket.openUploadStream(filename, options);
  }

  /**
   * Delete a file from GridFS
   * @param fileId GridFS file ID to delete
   */
  static async deleteFile(fileId: ObjectId): Promise<void> {
    const bucket = await this.getGridFSBucket();
    await bucket.delete(fileId);
  }

  /**
   * Initialize GridFS bucket
   */
  static async initializeGridFS() {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log('Waiting for MongoDB connection...');
        await new Promise<void>((resolve, reject) => {
          mongoose.connection.once('open', resolve);
          mongoose.connection.once('error', reject);
        });
      }

      // Ensure mongoose.connection.db is defined
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection is not fully initialized.');
      }

      this.gridFSBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'videos' });
      console.log('GridFS initialized for video storage.');
    } catch (error) {
      console.error('Error initializing GridFS:', error);
      throw new Error('Failed to initialize GridFS');
    }
  }

  /**
   * Upload a video to GridFS
   * @param filePath Path to the video file
   * @param filename Name of the file to store in GridFS
   * @returns The GridFS file ID
   */
  static async uploadVideoToGridFS(filePath: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.gridFSBucket.openUploadStream(filename);
      const fileStream = createReadStream(filePath);

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
  }

  /**
   * Retrieve a video from GridFS
   * @param fileId The GridFS file ID
   * @returns A readable stream of the video
   */
  static getVideoFromGridFS(fileId: string) {
    return this.gridFSBucket.openDownloadStream(new Types.ObjectId(fileId));
  }

  static async ensureDirectory(dirPath: string): Promise<string> {
    if (!existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    return dirPath;
  }

  /**
   * Update a video record
   * @param videoId Video ID to update
   * @param updateData Data to update
   * @returns Updated video record
   */
  static async updateVideoRecord(
    videoId: string | Types.ObjectId,
    updateData: {
      videoPath?: string;
      status?: 'processing' | 'completed' | 'failed';
      errorMessage?: string;
      videoGridFSId?: string | mongoose.Types.ObjectId;
    }
  ): Promise<IVideo | null> {
    try {
      const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
      );

      if (!video) {
        throw new Error(`Video not found with id: ${videoId}`);
      }

      return video;
    } catch (error) {
      console.error('Error updating video record:', error);
      throw new Error(`Failed to update video record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getOrCreateUser(walletAddress: string): Promise<IUser> {
    try {
      walletAddress = walletAddress.toLowerCase();
      let user = await User.findOne({ walletAddress });
      if (!user) {
        user = await User.create({ walletAddress });
      }
      return user;
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw new Error(`Failed to get/create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async saveTempFile(content: Buffer | string, extension: string): Promise<string> {
    try {
      const tempDir = await this.ensureDirectory(config.storage.tempDir);
      console.log('Temporary directory:', tempDir);
      const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
      const filePath = path.join(tempDir, filename);
      if (typeof content === 'string') {
        await fs.promises.writeFile(filePath, content, 'utf-8');
      } else {
        await fs.promises.writeFile(filePath, content);
      }
      return filePath;
    } catch (error) {
      console.error('Error saving temporary file:', error);
      throw new Error(`Failed to save temporary file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async createVideoRecord({
    title,
    codeSnippet,
    videoPath,
    walletAddress,
    theme = config.video.defaultTheme,
    animationStyle = config.video.defaultAnimationStyle,
    voiceoverId = null
  }: {
    title: string;
    codeSnippet: string;
    videoPath: string;
    walletAddress: string;
    theme?: string;
    animationStyle?: string;
    voiceoverId?: string | ObjectId | null;
  }): Promise<IVideo> {
    try {
      const user = await this.getOrCreateUser(walletAddress);

      const video = await Video.create({
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
    } catch (error) {
      console.error('Error creating video record:', error);
      throw new Error(`Failed to create video record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async updateVideoStatus(
    videoId: string | Types.ObjectId,
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
      const user = await this.getOrCreateUser(walletAddress);

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

  static async getVideoByIdOrFilename(videoId: string, walletAddress?: string): Promise<IVideo | null> {
    try {
      let video: IVideo | null = null;

      if (Types.ObjectId.isValid(videoId)) {
        video = await Video.findById(videoId);
      } else {
        const filename = path.basename(videoId);
        video = await Video.findOne({ videoPath: { $regex: filename, $options: 'i' } });
      }

      if (!video || (walletAddress && video.walletAddress !== walletAddress.toLowerCase())) {
        return null;
      }

      return video;
    } catch (error) {
      console.error('Error retrieving video:', error);
      throw new Error(`Failed to retrieve video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async listUserVideos(walletAddress: string, limit = 50, skip = 0): Promise<IVideo[]> {
    try {
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

  /**
   * Upload a file stream directly to GridFS
   * @param stream The readable stream to upload
   * @param filename Name of the file to store in GridFS
   * @param options Additional options for the upload
   * @returns The GridFS file ID
   */
  static async uploadStreamToGridFS(
    stream: NodeJS.ReadableStream, 
    filename: string,
    options: {
      contentType?: string,
      metadata?: Record<string, any>
    } = {}
  ): Promise<string> {
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
  }

  /**
   * Get a temporary local file path for a GridFS file
   * @param fileId The GridFS file ID
   * @param extension Optional file extension to append
   * @returns Path to the temporary local file
   */
  static async getGridFSFileAsLocalPath(fileId: string, extension: string = ''): Promise<string> {
    try {
      // Ensure temp directory exists
      const tempDir = await this.ensureDirectory(config.storage.tempDir);
      
      // Create temporary file path
      const tempFilename = `gridfs-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
      const tempFilePath = path.join(tempDir, tempFilename);
      
      // Get file stream from GridFS
      const downloadStream = this.gridFSBucket.openDownloadStream(new Types.ObjectId(fileId));
      
      // Create write stream for the temp file
      const writeStream = fs.createWriteStream(tempFilePath);
      
      // Return a promise that resolves when the file is fully downloaded
      return new Promise((resolve, reject) => {
        downloadStream
          .pipe(writeStream)
          .on('error', (error: any) => {
            console.error('Error downloading file from GridFS:', error);
            reject(error);
          })
          .on('finish', () => {
            resolve(tempFilePath);
          });
      });
    } catch (error) {
      console.error('Error creating local file from GridFS:', error);
      throw new Error(`Failed to create local file from GridFS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a file from GridFS
   * @param fileId The GridFS file ID
   */
  static async deleteFromGridFS(fileId: string): Promise<void> {
    try {
      if (!this.gridFSBucket) {
        throw new Error('GridFS is not initialized');
      }
      
      await this.gridFSBucket.delete(new Types.ObjectId(fileId));
      console.log(`Deleted file with ID ${fileId} from GridFS`);
    } catch (error) {
      console.error('Error deleting file from GridFS:', error);
      throw new Error(`Failed to delete file from GridFS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
