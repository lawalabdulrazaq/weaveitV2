AI Video Generator
An AI-powered tool for generating tutorial videos from code or text. The tool analyzes code, generates tutorial explanations, creates voiceover narration, and produces professional-looking tutorial videos with 3D animated slides.

Features
Code Analysis: Analyzes code to create step-by-step tutorials
Text-to-Speech: Generates high-quality narration from tutorial text
3D Video Generation: Creates animated slide-based videos with smooth transitions
MCP Server: Model Context Protocol server for integration with AI agents
CLI Tool: Command line interface for all functionality
Installation
bash
# Install from npm
npm install -g ai-video-generator

# Or clone the repo and install dependencies
git clone https://github.com/yourusername/ai-video-generator.git
cd ai-video-generator
npm install
Environment Setup
Create a .env file in the root directory with your OpenAI API key:

OPENAI_API_KEY=your-api-key-here
USE_MOCK=false  # Set to true for testing without real video generation
Usage
Command Line Interface (CLI)
The tool provides several commands:

Analyze Code
bash
# Analyze a code file and generate a tutorial
aigen analyze -f ./path/to/code.js
Generate Speech
bash
# Generate speech from tutorial text
aigen narrate -f ./path/to/tutorial.txt -o ./output/narration.mp3
Create Video
bash
# Generate video from tutorial text and audio
aigen video -t ./path/to/tutorial.txt -a ./path/to/narration.mp3
Full Pipeline
bash
# Complete process: analyze code, generate speech, and create video
aigen create -f ./path/to/code.js --theme dark --animation fade
Start Server
bash
# Start the MCP server
aigen server -p 3000
Programmatic Usage
typescript
import { analyzeCode, generateSpeech, render3DVideo } from 'ai-video-generator';

async function createTutorial() {
  // 1. Analyze code
  const code = `function hello() { console.log("Hello, world!"); }`;
  const analysis = await analyzeCode(code);
  
  // 2. Generate speech
  const audioPath = await generateSpeech(analysis.tutorialText, './output/tutorial.mp3');
  
  // 3. Create video
  const videoPath = await render3DVideo(analysis.tutorialText, audioPath, {
    theme: 'dark',
    animationStyle: 'fade',
    quality: 'high'
  });
  
  console.log(`Video created: ${videoPath}`);
}

createTutorial().catch(console.error);
MCP Server Integration
The MCP server provides a way to integrate with AI agents. Start the server and connect to it via HTTP:

bash
# Start the MCP server
aigen server -p 3000
The server exposes an endpoint at /mcp that accepts POST requests with JSON payloads following the MCP protocol.

Video Generation Options
The video generator accepts the following options:

theme: dark or light (default: dark)
animationStyle: fade, slide, or zoom (default: fade)
quality: low, medium, or high (default: high)
includeCodeHighlight: true or false (default: true)
resolution: Object with width and height (default: { width: 1280, height: 720 })
fps: Frames per second (default: 30)
format: Output format (default: mp4)
Speech Generation Options
The speech generator accepts these options:

voice: Voice ID (default: alloy)
speed: Speech speed from 0.5 to 2.0 (default: 1.0)
format: Output format (default: mp3)
Development
Building the Project
bash
# Build the TypeScript code
npm run build

# Run tests
npm test
Project Structure
├── src/
│   ├── cli.ts            # Command line interface
│   ├── codeAnalyzer.ts   # Code analysis using OpenAI
│   ├── config.ts         # Configuration management
│   ├── index.ts          # Main entry point and exports
│   ├── server.ts         # MCP server implementation
│   ├── textToSpeech.ts   # Text-to-speech generation
│   ├── types.ts          # TypeScript type definitions
│   └── videoGenerator.ts # Video generation logic
├── assets/
│   └── fonts/            # Fonts for video generation
└── tests/                # Test files
Requirements
Node.js v16+
FFmpeg (for video generation)
License
MIT

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

