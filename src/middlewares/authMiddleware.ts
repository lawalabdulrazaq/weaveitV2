// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService';

/**
 * Wallet authentication middleware - verifies wallet address and adds user to request
 */
export async function walletAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const walletAddress =
      req.headers['x-wallet-address'] as string ||
      req.query.wallet as string ||
      req.body?.walletAddress;

      console.log('walletAuthMiddleware - Received walletAddress:', walletAddress); // Debugging

    if (!walletAddress) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Wallet address is required for this operation',
      });
      return; // Ensure no further execution
    }

    try {
      const user = await StorageService.getOrCreateUser(walletAddress);
      (req as any).user = user;
      (req as any).walletAddress = walletAddress.toLowerCase();
      next(); // Call next middleware
    } catch (error) {
      console.error('Error in wallet authentication:', error);
      res.status(500).json({
        error: 'Authentication error',
        message: 'Error processing wallet authentication',
      });
    }
  } catch (error) {
    console.error('Unexpected error in wallet auth middleware:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred during authentication',
    });
  }
}

/**
 * Optional wallet authentication middleware - doesn't require wallet but uses it if available
 */
export async function optionalWalletAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get wallet address from various possible sources
    const walletAddress = 
      req.headers['x-wallet-address'] as string || 
      req.query.wallet as string || 
      req.body?.walletAddress;
    
    // If wallet address provided, get or create user
    if (walletAddress) {
      try {
        const user = await StorageService.getOrCreateUser(walletAddress);
        (req as any).user = user;
        (req as any).walletAddress = walletAddress.toLowerCase();
      } catch (error) {
        console.warn('Warning: Could not process wallet address:', error);
        // Continue anyway since it's optional
      }
    }
    
    next();
  } catch (error) {
    console.error('Unexpected error in optional wallet auth middleware:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'An unexpected error occurred during optional authentication' 
    });
  }
}

/**
 * Resource ownership middleware - ensures the user owns the requested resource
 */
export function ownershipMiddleware(resourceType: 'video' | 'voiceover') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const walletAddress = (req as any).walletAddress;
      const resourceId = req.params.id;
      
      if (!walletAddress || !resourceId) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: 'You do not have permission to access this resource' 
        });
      }
      
      let resource = null;
      
      if (resourceType === 'video') {
        resource = await StorageService.getVideoByIdOrFilename(resourceId, walletAddress);
      } 
      // Add other resource types as needed
      
      if (!resource) {
        res.status(404).json({ 
          error: 'Resource not found', 
          message: `The requested ${resourceType} was not found or you don't have access to it` 
        });
      }
      
      // Attach resource to request
      (req as any).resource = resource;
      next();
    } catch (error) {
      console.error(`Error in ownership middleware for ${resourceType}:`, error);
      res.status(500).json({ 
        error: 'Server error', 
        message: 'An unexpected error occurred while verifying resource ownership' 
      });
    }
  };
}