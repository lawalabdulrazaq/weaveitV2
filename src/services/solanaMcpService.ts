// src/services/solanaMcpService.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import dotenv from 'dotenv';
dotenv.config();

// MCP service configuration interface
export interface McpServiceConfig {
  apiKey?: string;
  apiSecret?: string;
  rpcEndpoint?: string;
}

/**
 * Creates and configures a Solana MCP server with tools for Solana blockchain interaction
 * @param config Optional configuration for the MCP server
 * @returns The configured McpServer instance
 */
export function createSolanaMcpServer(config?: McpServiceConfig): McpServer {
  // Get API credentials from environment variables or config
  const apiKey = config?.apiKey || process.env.MCP_API_KEY;
  const apiSecret = config?.apiSecret || process.env.MCP_API_SECRET;
  
  // Create an MCP server with authentication if provided
  const server = new McpServer({
    name: "Solana RPC Tools",
    version: "1.0.0",
    auth: apiKey && apiSecret ? {
      apiKey,
      apiSecret
    } : undefined
  });

  // Initialize Solana connection
  const rpcEndpoint = config?.rpcEndpoint || process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl("mainnet-beta");
  const connection = new Connection(rpcEndpoint, "confirmed");
  
  console.log(`Connecting to Solana RPC endpoint: ${rpcEndpoint}`);
  if (apiKey) {
    console.log("Using API key authentication");
  }

  // Register all Solana tools
  registerSolanaTools(server, connection);
  
  // Register Solana resources
  registerSolanaResources(server);
  
  // Register Solana prompts
  registerSolanaPrompts(server);

  return server;
}

/**
 * Starts the Solana MCP server with stdio transport
 * @param config Optional configuration for the MCP server
 */
export function startSolanaMcpServer(config?: McpServiceConfig): void {
  const server = createSolanaMcpServer(config);
  
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  server.connect(transport);
  
  console.log("Solana MCP server started successfully");
}

/**
 * Registers all Solana RPC tools with the MCP server
 * @param server The MCP server instance
 * @param connection The Solana connection
 */
function registerSolanaTools(server: McpServer, connection: Connection): void {
    // Get Account Info
    server.tool(
        "getAccountInfo",
        "Used to look up account info by public key (32 byte base58 encoded address)",
        { publicKey: z.string() },
        async ({ publicKey }) => {
            try {
                const pubkey = new PublicKey(publicKey);
                const accountInfo = await connection.getAccountInfo(pubkey);
                return {
                    content: [{ type: "text", text: JSON.stringify(accountInfo, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
                };
            }
        }
    );

    // Get Balance
    server.tool(
        "getBalance",
        "Used to look up balance by public key (32 byte base58 encoded address)",
        { publicKey: z.string() },
        async ({ publicKey }) => {
            try {
                const pubkey = new PublicKey(publicKey);
                const balance = await connection.getBalance(pubkey);
                return {
                    content: [{ type: "text", text: `${balance / LAMPORTS_PER_SOL} SOL (${balance} lamports)` }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
                };
            }
        }
    );

    // Get Minimum Balance For Rent Exemption
    server.tool(
        "getMinimumBalanceForRentExemption",
        "Used to look up minimum balance required for rent exemption by data size",
        { dataSize: z.number() },
        async ({ dataSize }) => {
            try {
                const minBalance = await connection.getMinimumBalanceForRentExemption(dataSize);
                return {
                    content: [{ type: "text", text: `${minBalance / LAMPORTS_PER_SOL} SOL (${minBalance} lamports)` }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
                };
            }
        }
    );

    // Get Transaction
    server.tool(
        "getTransaction",
        "Used to look up transaction by signature (64 byte base58 encoded string)",
        { signature: z.string() },
        async ({ signature }) => {
            try {
                const transaction = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
                return {
                    content: [{ type: "text", text: JSON.stringify(transaction, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
                };
            }
        }
    );
}

/**
 * Registers Solana documentation resources with the MCP server
 * @param server The MCP server instance
 */
function registerSolanaResources(server: McpServer): void {
    // Setup specific resources to read from solana.com/docs pages
    server.resource(
        "solanaDocsInstallation",
        new ResourceTemplate("solana://docs/intro/installation", { list: undefined }),
        async (uri) => {
            try {
                const response = await fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/intro/installation.mdx`);
                const fileContent = await response.text();
                return {
                    contents: [{
                        uri: uri.href,
                        text: fileContent
                    }]
                };
            } catch (error) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Error: ${(error as Error).message}`
                    }]
                };
            }
        }
    );

    server.resource(
        "solanaDocsClusters",
        new ResourceTemplate("solana://docs/references/clusters", { list: undefined }),
        async (uri) => {
            try {
                const response = await fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/references/clusters.mdx`);
                const fileContent = await response.text();
                return {
                    contents: [{
                        uri: uri.href,
                        text: fileContent
                    }]
                };
            } catch (error) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Error: ${(error as Error).message}`
                    }]
                };
            }
        }
    );
}

/**
 * Registers Solana-related prompts with the MCP server
 * @param server The MCP server instance
 */
function registerSolanaPrompts(server: McpServer): void {
    server.prompt(
        'calculate-storage-deposit',
        'Calculate storage deposit for a specified number of bytes',
        { bytes: z.string() },
        ({ bytes }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Calculate the SOL amount needed to store ${bytes} bytes of data on Solana using getMinimumBalanceForRentExemption.`
                }
            }]
        })
    );

    server.prompt(
        'minimum-amount-of-sol-for-storage',
        'Calculate the minimum amount of SOL needed for storing 0 bytes on-chain',
        () => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Calculate the amount of SOL needed to store 0 bytes of data on Solana using getMinimumBalanceForRentExemption & present it to the user as the minimum cost for storing any data on Solana.`
                }
            }]
        })
    );

    server.prompt(
        'why-did-my-transaction-fail',
        'Look up the given transaction and inspect its logs to figure out why it failed',
        { signature: z.string() },
        ({ signature }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Look up the transaction with signature ${signature} and inspect its logs to figure out why it failed.`
                }
            }]
        })
    );

    server.prompt(
        'how-much-did-this-transaction-cost',
        'Fetch the transaction by signature, and break down cost & priority fees',
        { signature: z.string() },
        ({ signature }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Calculate the network fee for the transaction with signature ${signature} by fetching it and inspecting the 'fee' field in 'meta'. Base fee is 0.000005 sol per signature (also provided as array at the end). So priority fee is fee - (numSignatures * 0.000005). Please provide the base fee and the priority fee.`
                }
            }]
        })
    );

    server.prompt(
        'what-happened-in-transaction',
        'Look up the given transaction and inspect its logs & instructions to figure out what happened',
        { signature: z.string() },
        ({ signature }) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Look up the transaction with signature ${signature} and inspect its logs & instructions to figure out what happened.`
                }
            }]
        })
    );
}