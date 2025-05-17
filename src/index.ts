// src/index.ts
export { Config, type ConfigOptions } from './config';
export { analyzeCode } from './codeAnalyzer';
export { generateSpeech } from './textToSpeech';
export { explainDocs } from './videoGenerator';
export { 
  startServer, 
  render3DVideo as mcpRender3DVideo, 
  startMcpServer,
  createMcpServer
} from './server';
export * from './types';

// Solana MCP exports
export { 
  createSolanaMcpServer, 
  startSolanaMcpServer,
  type McpServiceConfig
} from './services/solanaMcpService';

// Command line interface
export { default as cli } from './cli';

// If this file is executed directly (not imported), start the MCP server
if (require.main === module) {
  import('./server').then(({ startMcpServer }) => {
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