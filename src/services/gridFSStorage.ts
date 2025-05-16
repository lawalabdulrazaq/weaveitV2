import { GridFSBucket, ObjectId } from 'mongodb';
import { StorageService } from './storageService';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

export let gridFSBucket: GridFSBucket | null = null;

export const gridFSStorage = {
  bucket: null as GridFSBucket | null,

  initialize: async () => {
    gridFSStorage.bucket = await StorageService.getGridFSBucket();
  },

  _handleFile: async (req: any, file: Express.Multer.File, cb: (error?: any, info?: any) => void) => {
    try {
      if (!gridFSStorage.bucket) {
        await gridFSStorage.initialize();
      }

      const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}-${file.originalname}`;
      const fileStream = file.stream;
      
      const uploadStream = gridFSStorage.bucket!.openUploadStream(uniqueName, {
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
    } catch (error) {
      console.error('Error handling file upload:', error);
      cb(error);
    }
  },
  
  _removeFile: async (req: any, file: any, cb: (error?: any) => void) => {
    try {
      if (!gridFSStorage.bucket) {
        await gridFSStorage.initialize();
      }

      if (file.gridFSFileId) {
        await gridFSStorage.bucket!.delete(new ObjectId(file.gridFSFileId));
        console.log(`Removed file ${file.filename} with ID ${file.gridFSFileId} from GridFS`);
      }
      cb(null);
    } catch (error) {
      console.error('Error removing file from GridFS:', error);
      cb(error);
    }
  }
};