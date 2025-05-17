// src/models/index.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for our document types
export interface IUser extends Document {
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideo extends Document {
  _id: string | mongoose.Types.ObjectId; 
  title: string;
  codeSnippet: string;
  videoPath: string;
  owner: mongoose.Types.ObjectId | IUser;
  walletAddress: string;
  accessUrl: string;
  contentType: string;
  duration: number;
  theme: string;
  animationStyle: string;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  videoGridFSId?: string | mongoose.Types.ObjectId;
  voiceoverId?: string | mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoiceover extends Document {
  content: string;
  audioPath: string;
  owner: mongoose.Types.ObjectId | IUser;
  walletAddress: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create schemas
const UserSchema = new Schema<IUser>({
  walletAddress: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const VideoSchema = new Schema<IVideo>({
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
    type: Schema.Types.ObjectId, 
    ref: 'Voiceover',
    required: false 
  },
  owner: { 
    type: Schema.Types.ObjectId, 
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

const VoiceoverSchema = new Schema<IVoiceover>({
  content: { 
    type: String, 
    required: true 
  },
  audioPath: { 
    type: String, 
    required: true 
  },
  owner: { 
    type: Schema.Types.ObjectId, 
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
export const User = mongoose.model<IUser>('User', UserSchema);
export const Video = mongoose.model<IVideo>('Video', VideoSchema);
export const Voiceover = mongoose.model<IVoiceover>('Voiceover', VoiceoverSchema);