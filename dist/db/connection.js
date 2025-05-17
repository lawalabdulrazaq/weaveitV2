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
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
// src/db/connection.ts
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
// Define the connection options
const connectionOptions = {
// MongoDB connection options
};
/**
 * Initializes the MongoDB connection
 */
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Use environment variables or config for the MongoDB URI
            const uri = process.env.MONGODB_URI || config_1.config.mongodb.uri || 'mongodb://localhost:27017/tutorial-videos';
            console.log(`Connecting to MongoDB at ${uri.split('@').length > 1 ? uri.split('@')[1] : 'localhost'}`);
            yield mongoose_1.default.connect(uri, connectionOptions);
            // await mongoose.connect(uri, {
            //   useNewUrlParser: true,
            //   useUnifiedTopology: true,
            // });
            console.log('MongoDB connected successfully');
            // Add event listeners for connection status
            mongoose_1.default.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected');
            });
            // Handle graceful shutdown
            process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
                yield mongoose_1.default.connection.close();
                console.log('MongoDB connection closed due to app termination');
                process.exit(0);
            }));
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
            // throw new Error('Failed to connect to MongoDB');
        }
    });
}
/**
 * Closes the MongoDB connection
 */
function disconnectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connection.close();
            console.log('MongoDB connection closed');
        }
        catch (error) {
            console.error('Error while closing MongoDB connection:', error);
        }
    });
}
