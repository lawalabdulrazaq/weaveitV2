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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = exports.mcpRender3DVideo = exports.startServer = exports.render3DVideo = exports.generateSpeech = exports.analyzeCode = exports.Config = void 0;
// src/index.ts
var config_1 = require("./config");
Object.defineProperty(exports, "Config", { enumerable: true, get: function () { return config_1.Config; } });
var codeAnalyzer_1 = require("./codeAnalyzer");
Object.defineProperty(exports, "analyzeCode", { enumerable: true, get: function () { return codeAnalyzer_1.analyzeCode; } });
var textToSpeech_1 = require("./textToSpeech");
Object.defineProperty(exports, "generateSpeech", { enumerable: true, get: function () { return textToSpeech_1.generateSpeech; } });
var videoGenerator_1 = require("./videoGenerator");
Object.defineProperty(exports, "render3DVideo", { enumerable: true, get: function () { return videoGenerator_1.render3DVideo; } });
var server_1 = require("./server");
Object.defineProperty(exports, "startServer", { enumerable: true, get: function () { return server_1.startServer; } });
Object.defineProperty(exports, "mcpRender3DVideo", { enumerable: true, get: function () { return server_1.render3DVideo; } });
__exportStar(require("./types"), exports);
// Command line interface
var cli_1 = require("./cli");
Object.defineProperty(exports, "cli", { enumerable: true, get: function () { return __importDefault(cli_1).default; } });
