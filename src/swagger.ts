// src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './config';

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '3D Animated Tutorial Video Generator API',
      version: '1.0.0',
      description: 'API documentation for generating 3D tutorial videos from code snippets',
      contact: {
        name: 'API Support',
        url: 'https://example.com/support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.yourvideogenerator.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        walletAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-wallet-address',
          description: 'Blockchain wallet address for authentication',
        },
      },
      schemas: {
        Video: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the video',
            },
            title: {
              type: 'string',
              description: 'Video title',
            },
            codeSnippet: {
              type: 'string',
              description: 'Excerpt of the code used to generate the video',
            },
            videoPath: {
              type: 'string',
              description: 'Path to the video file',
            },
            walletAddress: {
              type: 'string',
              description: 'Wallet address of the owner',
            },
            status: {
              type: 'string',
              enum: ['processing', 'completed', 'failed'],
              description: 'Current status of the video generation',
            },
            theme: {
              type: 'string',
              description: 'Video theme (light/dark)',
            },
            animationStyle: {
              type: 'string',
              description: 'Animation style used in the video',
            },
            accessUrl: {
              type: 'string',
              description: 'URL to access the video',
            },
            errorMessage: {
              type: 'string',
              description: 'Error message if generation failed',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the video was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the video was last updated',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/server.ts', './src/swaggerDocs.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

/**
 * Configure Swagger for the Express application
 * @param app Express application instance
 */
export function setupSwagger(app: Express) {
  // Serve Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('Swagger documentation available at /api-docs');
}