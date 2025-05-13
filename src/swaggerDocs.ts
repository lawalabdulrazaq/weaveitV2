// src/swaggerDocs.ts
/**
 * @swagger
 * tags:
 *   - name: Videos
 *     description: Video generation and management endpoints
 *   - name: Health
 *     description: Server health and status
 *   - name: MCP
 *     description: Model Context Protocol integration
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */

/**
 * @swagger
 * /generate-video:
 *   post:
 *     summary: Generate a 3D video from code
 *     description: Accepts code and generates a 3D animated tutorial video
 *     tags: [Videos]
 *     security:
 *       - walletAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code snippet to explain in the video
 *                 example: "function helloWorld() { console.log('Hello, world!'); }"
 *               theme:
 *                 type: string
 *                 description: Video theme (dark/light)
 *                 default: "dark"
 *               animationStyle:
 *                 type: string
 *                 description: Animation style for transitions
 *                 default: "fade"
 *               walletAddress:
 *                 type: string
 *                 description: Blockchain wallet address of the user
 *                 example: "0x123abc456def789ghi"
 *     responses:
 *       202:
 *         description: Video generation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video generation started
 *                 videoId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *                 status:
 *                   type: string
 *                   example: processing
 *                 accessUrl:
 *                   type: string
 *                   example: /videos/1620000000000-a1b2c3d4.mp4?wallet=0x123abc456def789ghi
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - wallet address not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /video-status/{videoId}:
 *   get:
 *     summary: Check status of a video
 *     description: Get current status of a video generation job
 *     tags: [Videos]
 *     security:
 *       - walletAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID or filename
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Video status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *                 status:
 *                   type: string
 *                   enum: [processing, completed, failed]
 *                   example: completed
 *                 title:
 *                   type: string
 *                   example: Code Tutorial 2025-05-13
 *                 accessUrl:
 *                   type: string
 *                   example: /videos/1620000000000-a1b2c3d4.mp4?wallet=0x123...abc
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-05-13T12:00:00.000Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-05-13T12:05:00.000Z
 *                 errorMessage:
 *                   type: string
 *                   example: Failed to process video frame at 00:01:23
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - wallet address not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: List user's videos
 *     description: Get a list of all videos created by the authenticated user
 *     tags: [Videos]
 *     security:
 *       - walletAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of videos to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of videos to skip (for pagination)
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       videoId:
 *                         type: string
 *                         example: 60d21b4667d0d8992e610c85
 *                       title:
 *                         type: string
 *                         example: Code Tutorial 2025-05-13
 *                       status:
 *                         type: string
 *                         enum: [processing, completed, failed]
 *                         example: completed
 *                       accessUrl:
 *                         type: string
 *                         example: /videos/1620000000000-a1b2c3d4.mp4?wallet=0x123...abc
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-05-13T12:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-05-13T12:05:00.000Z
 *       401:
 *         description: Unauthorized - wallet address not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /videos/{filename}:
 *   get:
 *     summary: Download or stream a video
 *     description: Access a generated video by filename
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Video filename
 *         example: 1620000000000-a1b2c3d4.mp4
 *       - in: header
 *         name: x-wallet-address
 *         schema:
 *           type: string
 *         required: false
 *         description: Wallet address for authentication (optional)
 *     responses:
 *       200:
 *         description: Video file
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Video not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /mcp:
 *   post:
 *     summary: Model Context Protocol endpoint
 *     description: MCP integration for AI model interactions
 *     tags: [MCP]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               voiceOver:
 *                 type: string
 *                 format: binary
 *                 description: Voice-over audio file
 *     responses:
 *       200:
 *         description: MCP response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */