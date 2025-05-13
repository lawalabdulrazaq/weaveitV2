// src/db/connection.ts
import mongoose from 'mongoose';
import { config } from '../config';

// Define the connection options
const connectionOptions: mongoose.ConnectOptions = {
  // MongoDB connection options
};

/**
 * Initializes the MongoDB connection
 */
export async function connectDB(): Promise<void> {
  try {
    // Use environment variables or config for the MongoDB URI
    const uri = process.env.MONGODB_URI || config.mongodb.uri || 'mongodb://localhost:27017/tutorial-videos';
    
    console.log(`Connecting to MongoDB at ${uri.split('@').length > 1 ? uri.split('@')[1] : 'localhost'}`);
    
    await mongoose.connect(uri, connectionOptions);
    
    console.log('MongoDB connected successfully');
    
    // Add event listeners for connection status
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Closes the MongoDB connection
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error while closing MongoDB connection:', error);
  }
}