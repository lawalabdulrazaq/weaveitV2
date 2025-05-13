# 3D Animated Tutorial Video Generator

A service that generates 3D animated video tutorials from code snippets with narration. The system uses blockchain wallet addresses for authentication and content ownership.

## Features

- Generate 3D animated tutorial videos from code snippets
- Automatic voiceover generation
- Blockchain wallet authentication
- RESTful API for video management
- Model Context Protocol (MCP) integration
- Interactive API documentation with Swagger

## Project Structure

```
├── README.md
├── index.d.ts
├── package.json
├── pnpm-lock.yaml
├── src
│   ├── assets
│   │   └── fonts.json
│   ├── cli.ts
│   ├── codeAnalyzer.ts
│   ├── config.ts
│   ├── db
│   │   └── connection.ts
│   ├── index.ts
│   ├── middlewares
│   │   └── authMiddleware.ts
│   ├── models
│   │   └── index.ts
│   ├── server.ts
│   ├── services
│   │   └── storageService.ts
│   ├── slides
│   │   ├── clips
│   │   └── narration.mp3
│   ├── swagger.ts
│   ├── swaggerDocs.ts
│   ├── temp_slide.txt
│   ├── textToSpeech.ts
│   ├── types.ts
│   └── videoGenerator.ts
├── tester.ts
└── tsconfig.json
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Configure environment variables:

```
# Create a .env file in the project root
PORT=3000
MONGODB_URI=mongodb://localhost:27017/video-generator
# For testing without actual video generation
USE_MOCK=true
```

4. Build the project:

```bash
npm run build
# or
pnpm build
```

## Running the Application

```bash
# Development mode
npm run dev
# or
pnpm dev

# Production mode
npm start
# or
pnpm start
```

The server will start at http://localhost:3000 (or the port specified in your environment variables).

## API Documentation

The API is documented with Swagger. After starting the server, you can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | /health | Server health check | No |
| POST | /generate-video | Generate video from code | Yes (wallet) |
| GET | /video-status/:videoId | Check video generation status | Yes (wallet) |
| GET | /videos | List all videos for user | Yes (wallet) |
| GET | /videos/:filename | Stream/download video | Optional |
| POST | /mcp | Model Context Protocol endpoint | No |

## Authentication

Authentication is performed using blockchain wallet addresses. To authenticate API requests, include the wallet address in the `x-wallet-address` header.

## Example Usage

### Generating a Video

```bash
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-wallet-address: 0x123456789abcdef" \
  --data-urlencode "code=function helloWorld() { console.log('Hello, world!'); }" \
  --data-urlencode "theme=dark" \
  --data-urlencode "animationStyle=fade"
```

### Checking Video Status

```bash
curl -X GET http://localhost:3000/video-status/60d21b4667d0d8992e610c85 \
  -H "x-wallet-address: 0x123456789abcdef"
```

### Listing User Videos

```bash
curl -X GET http://localhost:3000/videos \
  -H "x-wallet-address: 0x123456789abcdef"
```

### Downloading a Video

```bash
curl -X GET http://localhost:3000/videos/1620000000000-a1b2c3d4.mp4 \
  -H "x-wallet-address: 0x123456789abcdef" \
  --output my_video.mp4
```

## MCP Integration

This service integrates with the Model Context Protocol (MCP) to enable AI models to generate videos. The MCP endpoint is available at:

```
POST http://localhost:3000/mcp
```

## Development

### Adding a New Endpoint

1. Define the endpoint in `server.ts`
2. Add Swagger documentation in `swaggerDocs.ts`
3. Implement any necessary services in the `services/` directory
4. Update tests if needed

### Running Tests

```bash
npm test
# or
pnpm test
```

## License

MIT