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
Object.defineProperty(exports, "__esModule", { value: true });
exports.gridFSStorage = exports.gridFSBucket = void 0;
const mongodb_1 = require("mongodb");
const storageService_1 = require("./storageService");
const crypto_1 = require("crypto");
exports.gridFSBucket = null;
exports.gridFSStorage = {
    bucket: null,
    initialize: () => __awaiter(void 0, void 0, void 0, function* () {
        exports.gridFSStorage.bucket = yield storageService_1.StorageService.getGridFSBucket();
    }),
    _handleFile: (req, file, cb) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!exports.gridFSStorage.bucket) {
                yield exports.gridFSStorage.initialize();
            }
            const uniqueName = `${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}-${file.originalname}`;
            const fileStream = file.stream;
            const uploadStream = exports.gridFSStorage.bucket.openUploadStream(uniqueName, {
                metadata: {
                    originalName: file.originalname,
                    contentType: file.mimetype,
                    walletAddress: req.walletAddress || 'anonymous',
                    uploadDate: new Date()
                }
            });
            uploadStream.on('error', (error) => {
                console.error('Error uploading to GridFS:', error);
                cb(error);
            });
            uploadStream.on('finish', () => {
                cb(null, {
                    filename: uniqueName,
                    gridFSFileId: uploadStream.id.toString(),
                    size: uploadStream.length,
                    contentType: file.mimetype
                });
            });
            fileStream.pipe(uploadStream);
        }
        catch (error) {
            console.error('Error handling file upload:', error);
            cb(error);
        }
    }),
    _removeFile: (req, file, cb) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!exports.gridFSStorage.bucket) {
                yield exports.gridFSStorage.initialize();
            }
            if (file.gridFSFileId) {
                yield exports.gridFSStorage.bucket.delete(new mongodb_1.ObjectId(file.gridFSFileId));
                console.log(`Removed file ${file.filename} with ID ${file.gridFSFileId} from GridFS`);
            }
            cb(null);
        }
        catch (error) {
            console.error('Error removing file from GridFS:', error);
            cb(error);
        }
    })
};
