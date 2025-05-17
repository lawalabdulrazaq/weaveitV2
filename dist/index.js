"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = exports.startSolanaMcpServer = exports.createSolanaMcpServer = exports.createMcpServer = exports.startMcpServer = exports.mcpRender3DVideo = exports.startServer = exports.explainDocs = exports.generateSpeech = exports.analyzeCode = exports.Config = void 0;
// src/index.ts
var config_1 = require("./config");
Object.defineProperty(exports, "Config", { enumerable: true, get: function () { return config_1.Config; } });
var codeAnalyzer_1 = require("./codeAnalyzer");
Object.defineProperty(exports, "analyzeCode", { enumerable: true, get: function () { return codeAnalyzer_1.analyzeCode; } });
var textToSpeech_1 = require("./textToSpeech");
Object.defineProperty(exports, "generateSpeech", { enumerable: true, get: function () { return textToSpeech_1.generateSpeech; } });
var videoGenerator_1 = require("./videoGenerator");
Object.defineProperty(exports, "explainDocs", { enumerable: true, get: function () { return videoGenerator_1.explainDocs; } });
var server_1 = require("./server");
Object.defineProperty(exports, "startServer", { enumerable: true, get: function () { return server_1.startServer; } });
Object.defineProperty(exports, "mcpRender3DVideo", { enumerable: true, get: function () { return server_1.render3DVideo; } });
Object.defineProperty(exports, "startMcpServer", { enumerable: true, get: function () { return server_1.startMcpServer; } });
Object.defineProperty(exports, "createMcpServer", { enumerable: true, get: function () { return server_1.createMcpServer; } });
__exportStar(require("./types"), exports);
// Solana MCP exports
var solanaMcpService_1 = require("./services/solanaMcpService");
Object.defineProperty(exports, "createSolanaMcpServer", { enumerable: true, get: function () { return solanaMcpService_1.createSolanaMcpServer; } });
Object.defineProperty(exports, "startSolanaMcpServer", { enumerable: true, get: function () { return solanaMcpService_1.startSolanaMcpServer; } });
// Command line interface
var cli_1 = require("./cli");
Object.defineProperty(exports, "cli", { enumerable: true, get: function () { return __importDefault(cli_1).default; } });
// If this file is executed directly (not imported), start the MCP server
if (require.main === module) {
    Promise.resolve().then(() => __importStar(require('./server'))).then(({ startMcpServer }) => {
        // Read API key and secret from environment variables
        const config = {
            apiKey: process.env.MCP_API_KEY,
            apiSecret: process.env.MCP_API_SECRET,
            rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT
        };
        startMcpServer(config);
    }).catch(err => {
        console.error('Failed to start MCP server:', err);
        process.exit(1);
    });
}
