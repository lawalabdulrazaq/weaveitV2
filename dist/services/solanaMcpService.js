"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSolanaMcpServer = createSolanaMcpServer;
exports.startSolanaMcpServer = startSolanaMcpServer;
// src/services/solanaMcpService.ts
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const web3_js_1 = require("@solana/web3.js");
/**
 * Creates and configures a Solana MCP server with tools for Solana blockchain interaction
 * @param config Optional configuration for the MCP server
 * @returns The configured McpServer instance
 */
function createSolanaMcpServer(config) {
    // Get API credentials from environment variables or config
    const apiKey = (config === null || config === void 0 ? void 0 : config.apiKey) || process.env.MCP_API_KEY;
    const apiSecret = (config === null || config === void 0 ? void 0 : config.apiSecret) || process.env.MCP_API_SECRET;
    // Create an MCP server with authentication if provided
    const server = new mcp_js_1.McpServer({
        name: "Solana RPC Tools",
        version: "1.0.0",
        auth: apiKey && apiSecret ? {
            apiKey,
            apiSecret
        } : undefined
    });
    // Initialize Solana connection
    const rpcEndpoint = (config === null || config === void 0 ? void 0 : config.rpcEndpoint) || process.env.SOLANA_RPC_ENDPOINT || (0, web3_js_1.clusterApiUrl)("mainnet-beta");
    const connection = new web3_js_1.Connection(rpcEndpoint, "confirmed");
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
function startSolanaMcpServer(config) {
    const server = createSolanaMcpServer(config);
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new stdio_js_1.StdioServerTransport();
    server.connect(transport);
    console.log("Solana MCP server started successfully");
}
/**
 * Registers all Solana RPC tools with the MCP server
 * @param server The MCP server instance
 * @param connection The Solana connection
 */
function registerSolanaTools(server, connection) {
    // Get Account Info
    server.tool("getAccountInfo", "Used to look up account info by public key (32 byte base58 encoded address)", { publicKey: zod_1.z.string() }, (_a) => __awaiter(this, [_a], void 0, function* ({ publicKey }) {
        try {
            const pubkey = new web3_js_1.PublicKey(publicKey);
            const accountInfo = yield connection.getAccountInfo(pubkey);
            return {
                content: [{ type: "text", text: JSON.stringify(accountInfo, null, 2) }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }));
    // Get Balance
    server.tool("getBalance", "Used to look up balance by public key (32 byte base58 encoded address)", { publicKey: zod_1.z.string() }, (_a) => __awaiter(this, [_a], void 0, function* ({ publicKey }) {
        try {
            const pubkey = new web3_js_1.PublicKey(publicKey);
            const balance = yield connection.getBalance(pubkey);
            return {
                content: [{ type: "text", text: `${balance / web3_js_1.LAMPORTS_PER_SOL} SOL (${balance} lamports)` }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }));
    // Get Minimum Balance For Rent Exemption
    server.tool("getMinimumBalanceForRentExemption", "Used to look up minimum balance required for rent exemption by data size", { dataSize: zod_1.z.number() }, (_a) => __awaiter(this, [_a], void 0, function* ({ dataSize }) {
        try {
            const minBalance = yield connection.getMinimumBalanceForRentExemption(dataSize);
            return {
                content: [{ type: "text", text: `${minBalance / web3_js_1.LAMPORTS_PER_SOL} SOL (${minBalance} lamports)` }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }));
    // Get Transaction
    server.tool("getTransaction", "Used to look up transaction by signature (64 byte base58 encoded string)", { signature: zod_1.z.string() }, (_a) => __awaiter(this, [_a], void 0, function* ({ signature }) {
        try {
            const transaction = yield connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
            return {
                content: [{ type: "text", text: JSON.stringify(transaction, null, 2) }]
            };
        }
        catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }]
            };
        }
    }));
}
/**
 * Registers Solana documentation resources with the MCP server
 * @param server The MCP server instance
 */
function registerSolanaResources(server) {
    // Setup specific resources to read from solana.com/docs pages
    server.resource("solanaDocsInstallation", new mcp_js_1.ResourceTemplate("solana://docs/intro/installation", { list: undefined }), (uri) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/intro/installation.mdx`);
            const fileContent = yield response.text();
            return {
                contents: [{
                        uri: uri.href,
                        text: fileContent
                    }]
            };
        }
        catch (error) {
            return {
                contents: [{
                        uri: uri.href,
                        text: `Error: ${error.message}`
                    }]
            };
        }
    }));
    server.resource("solanaDocsClusters", new mcp_js_1.ResourceTemplate("solana://docs/references/clusters", { list: undefined }), (uri) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/references/clusters.mdx`);
            const fileContent = yield response.text();
            return {
                contents: [{
                        uri: uri.href,
                        text: fileContent
                    }]
            };
        }
        catch (error) {
            return {
                contents: [{
                        uri: uri.href,
                        text: `Error: ${error.message}`
                    }]
            };
        }
    }));
}
/**
 * Registers Solana-related prompts with the MCP server
 * @param server The MCP server instance
 */
function registerSolanaPrompts(server) {
    server.prompt('calculate-storage-deposit', 'Calculate storage deposit for a specified number of bytes', { bytes: zod_1.z.string() }, ({ bytes }) => ({
        messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Calculate the SOL amount needed to store ${bytes} bytes of data on Solana using getMinimumBalanceForRentExemption.`
                }
            }]
    }));
    server.prompt('minimum-amount-of-sol-for-storage', 'Calculate the minimum amount of SOL needed for storing 0 bytes on-chain', () => ({
        messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Calculate the amount of SOL needed to store 0 bytes of data on Solana using getMinimumBalanceForRentExemption & present it to the user as the minimum cost for storing any data on Solana.`
                }
            }]
    }));
    server.prompt('why-did-my-transaction-fail', 'Look up the given transaction and inspect its logs to figure out why it failed', { signature: zod_1.z.string() }, ({ signature }) => ({
        messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Look up the transaction with signature ${signature} and inspect its logs to figure out why it failed.`
                }
            }]
    }));
    server.prompt('how-much-did-this-transaction-cost', 'Fetch the transaction by signature, and break down cost & priority fees', { signature: zod_1.z.string() }, ({ signature }) => ({
        messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Calculate the network fee for the transaction with signature ${signature} by fetching it and inspecting the 'fee' field in 'meta'. Base fee is 0.000005 sol per signature (also provided as array at the end). So priority fee is fee - (numSignatures * 0.000005). Please provide the base fee and the priority fee.`
                }
            }]
    }));
    server.prompt('what-happened-in-transaction', 'Look up the given transaction and inspect its logs & instructions to figure out what happened', { signature: zod_1.z.string() }, ({ signature }) => ({
        messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: `Look up the transaction with signature ${signature} and inspect its logs & instructions to figure out what happened.`
                }
            }]
    }));
}
