"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideo = exports.generateSpeech = exports.analyzeCode = void 0;
// src/index.ts
var codeAnalyzer_1 = require("./codeAnalyzer");
Object.defineProperty(exports, "analyzeCode", { enumerable: true, get: function () { return codeAnalyzer_1.analyzeCode; } });
var textToSpeech_1 = require("./textToSpeech");
Object.defineProperty(exports, "generateSpeech", { enumerable: true, get: function () { return textToSpeech_1.generateSpeech; } });
var videoGenerator_1 = require("./videoGenerator");
Object.defineProperty(exports, "generateVideo", { enumerable: true, get: function () { return videoGenerator_1.generateVideo; } });
