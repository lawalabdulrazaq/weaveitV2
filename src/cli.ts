// src/cli.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer, startMcpServer } from './server';
import { analyzeCode } from './codeAnalyzer';
import { generateSpeech } from './textToSpeech';
import { explainDocs } from './videoGenerator';
// Import any other necessary functions

/**
 * Command line interface for WeaveIt
 */
const cli = yargs(hideBin(process.argv))
  .command('start', 'Start the WeaveIt server', (yargs) => {
    return yargs.option('port', {
      describe: 'Port to run the server on',
      type: 'number',
      default: 3000
    });
  }, (argv) => {
    startServer(argv.port);
  })
  .command('mcp', 'Start the Solana MCP server', (yargs) => {
    return yargs
      .option('apikey', {
        describe: 'API key for the MCP service',
        type: 'string'
      })
      .option('apisecret', {
        describe: 'API secret for the MCP service',
        type: 'string'
      })
      .option('rpc', {
        describe: 'Solana RPC endpoint URL',
        type: 'string'
      });
  }, (argv) => {
    // Set environment variables from CLI arguments
    if (argv.apikey) {
      process.env.MCP_API_KEY = argv.apikey;
    }
    if (argv.apisecret) {
      process.env.MCP_API_SECRET = argv.apisecret;
    }
    if (argv.rpc) {
      process.env.SOLANA_RPC_ENDPOINT = argv.rpc;
    }
    
    startMcpServer({
      apiKey: argv.apikey,
      apiSecret: argv.apisecret,
      rpcEndpoint: argv.rpc
    });
  })
  .command('generate-config', 'Generate MCP configuration for Claude', (yargs) => {
    return yargs
      .option('path', {
        describe: 'Path to the index.ts file',
        type: 'string',
        default: __dirname + '/index.ts'
      })
      .option('js', {
        describe: 'Generate config for compiled JS instead of TS',
        type: 'boolean',
        default: false
      })
      .option('apikey', {
        describe: 'API key for the MCP service',
        type: 'string'
      })
      .option('apisecret', {
        describe: 'API secret for the MCP service',
        type: 'string'
      });
  }, (argv) => {
    const command = argv.js ? 'node' : 'ts-node';
    const path = argv.js 
      ? argv.path.replace(/\/src\//, '/dist/').replace(/\.ts$/, '.js') 
      : argv.path;
    
    // Configure environment variables for API authentication
    const env: Record<string, string> = {};
    if (argv.apikey) {
      env.MCP_API_KEY = argv.apikey;
    }
    if (argv.apisecret) {
      env.MCP_API_SECRET = argv.apisecret;
    }
    
    const config = {
      mcpServers: {
        'solana-dev-mcp': {
          command,
          args: [path],
          env
        }
      }
    };
    
    console.log(JSON.stringify(config, null, 2));
  });

// Add other commands for your existing functionality
// ...

export default cli;