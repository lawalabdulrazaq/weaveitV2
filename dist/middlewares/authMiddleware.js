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
exports.walletAuthMiddleware = walletAuthMiddleware;
exports.optionalWalletAuthMiddleware = optionalWalletAuthMiddleware;
exports.ownershipMiddleware = ownershipMiddleware;
const storageService_1 = require("../services/storageService");
/**
 * Wallet authentication middleware - verifies wallet address and adds user to request
 */
function walletAuthMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const walletAddress = req.headers['x-wallet-address'] ||
                req.query.wallet ||
                ((_a = req.body) === null || _a === void 0 ? void 0 : _a.walletAddress);
            console.log('walletAuthMiddleware - Received walletAddress:', walletAddress); // Debugging
            if (!walletAddress) {
                res.status(401).json({
                    error: 'Authentication required',
                    message: 'Wallet address is required for this operation',
                });
                return; // Ensure no further execution
            }
            try {
                const user = yield storageService_1.StorageService.getOrCreateUser(walletAddress);
                req.user = user;
                req.walletAddress = walletAddress.toLowerCase();
                next(); // Call next middleware
            }
            catch (error) {
                console.error('Error in wallet authentication:', error);
                res.status(500).json({
                    error: 'Authentication error',
                    message: 'Error processing wallet authentication',
                });
            }
        }
        catch (error) {
            console.error('Unexpected error in wallet auth middleware:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'An unexpected error occurred during authentication',
            });
        }
    });
}
/**
 * Optional wallet authentication middleware - doesn't require wallet but uses it if available
 */
function optionalWalletAuthMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Get wallet address from various possible sources
            const walletAddress = req.headers['x-wallet-address'] ||
                req.query.wallet ||
                ((_a = req.body) === null || _a === void 0 ? void 0 : _a.walletAddress);
            // If wallet address provided, get or create user
            if (walletAddress) {
                try {
                    const user = yield storageService_1.StorageService.getOrCreateUser(walletAddress);
                    req.user = user;
                    req.walletAddress = walletAddress.toLowerCase();
                }
                catch (error) {
                    console.warn('Warning: Could not process wallet address:', error);
                    // Continue anyway since it's optional
                }
            }
            next();
        }
        catch (error) {
            console.error('Unexpected error in optional wallet auth middleware:', error);
            res.status(500).json({
                error: 'Server error',
                message: 'An unexpected error occurred during optional authentication'
            });
        }
    });
}
/**
 * Resource ownership middleware - ensures the user owns the requested resource
 */
function ownershipMiddleware(resourceType) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            const walletAddress = req.walletAddress;
            const resourceId = req.params.id;
            if (!walletAddress || !resourceId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to access this resource'
                });
            }
            let resource = null;
            if (resourceType === 'video') {
                resource = yield storageService_1.StorageService.getVideoByIdOrFilename(resourceId, walletAddress);
            }
            // Add other resource types as needed
            if (!resource) {
                res.status(404).json({
                    error: 'Resource not found',
                    message: `The requested ${resourceType} was not found or you don't have access to it`
                });
            }
            // Attach resource to request
            req.resource = resource;
            next();
        }
        catch (error) {
            console.error(`Error in ownership middleware for ${resourceType}:`, error);
            res.status(500).json({
                error: 'Server error',
                message: 'An unexpected error occurred while verifying resource ownership'
            });
        }
    });
}
