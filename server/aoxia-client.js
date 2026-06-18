import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const AOXIA_MCP_ENDPOINT = 'https://mcp.alphashop.cn/sse';
const DEFAULT_TIMEOUT_MS = 20000;

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function readCodexAoxiaConfig() {
  const configPath = path.join(os.homedir(), '.codex', 'config.toml');
  if (!fs.existsSync(configPath)) {
    return null;
  }

  const config = fs.readFileSync(configPath, 'utf8');
  const blockStart = config.indexOf('[mcp_servers.aoxia_1688_mcp]');
  if (blockStart === -1) {
    return null;
  }

  const nextBlockOffset = config.slice(blockStart + 1).search(/^\[/m);
  const blockEnd = nextBlockOffset === -1 ? config.length : blockStart + 1 + nextBlockOffset;
  const block = config.slice(blockStart, blockEnd);

  return {
    url: block.match(/^\s*url\s*=\s*"([^"]+)"/m)?.[1] || '',
    accessKey: block.match(/AOXIA_ACCESS_KEY\s*=\s*"([^"]+)"/)?.[1] || '',
    secretKey: block.match(/AOXIA_SECRET_KEY\s*=\s*"([^"]+)"/)?.[1] || '',
  };
}

function resolveAoxiaConfig() {
  if (process.env.AOXIA_MCP_URL) {
    return {
      source: 'env',
      url: process.env.AOXIA_MCP_URL,
      accessKey: '',
      secretKey: '',
    };
  }

  if (process.env.AOXIA_ACCESS_KEY && process.env.AOXIA_SECRET_KEY) {
    return {
      source: 'env',
      url: '',
      accessKey: process.env.AOXIA_ACCESS_KEY,
      secretKey: process.env.AOXIA_SECRET_KEY,
    };
  }

  const codexConfig = readCodexAoxiaConfig();
  if (codexConfig?.url) {
    return {
      source: 'codex-config',
      url: codexConfig.url,
      accessKey: '',
      secretKey: '',
    };
  }

  if (codexConfig?.accessKey && codexConfig?.secretKey) {
    return {
      source: 'codex-config',
      url: '',
      accessKey: codexConfig.accessKey,
      secretKey: codexConfig.secretKey,
    };
  }

  return {
    source: 'none',
    url: '',
    accessKey: '',
    secretKey: '',
  };
}

function buildAoxiaToken(config) {
  const accessKey = config.accessKey;
  const secretKey = config.secretKey;

  if (!accessKey || !secretKey) {
    throw new Error('AOXIA_ACCESS_KEY / AOXIA_SECRET_KEY 未配置。');
  }

  const header = base64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64urlJson({
    iss: accessKey,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5,
  });
  const signature = createHmac('sha256', secretKey)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${header}.${payload}.${signature}`;
}

function buildAoxiaUrl() {
  const config = resolveAoxiaConfig();
  if (config.url) {
    return config.url;
  }

  return `${AOXIA_MCP_ENDPOINT}?key=${buildAoxiaToken(config)}`;
}

function resolveMcpRemoteBin() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(
    dirname,
    '..',
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'mcp-remote.cmd' : 'mcp-remote',
  );
}

function withTimeout(promise, timeoutMs, label) {
  let timer = null;

  return Promise.race([
    promise.finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${label} 超时（${timeoutMs}ms）。`));
      }, timeoutMs);
    }),
  ]);
}

function normalizeTextContent(result) {
  return (result?.content || [])
    .filter((item) => item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

export function isAoxiaConfigured() {
  const config = resolveAoxiaConfig();
  return Boolean(config.url || (config.accessKey && config.secretKey));
}

export function resolveAoxiaConfigSource() {
  return resolveAoxiaConfig().source;
}

export async function createAoxiaClient({ timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const client = new Client(
    {
      name: 'amz-report-aoxia-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    },
  );

  const transport = new StdioClientTransport({
    command: resolveMcpRemoteBin(),
    args: [buildAoxiaUrl(), '--transport', 'sse-only', '--silent'],
    cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    env: process.env,
    stderr: 'pipe',
  });

  let stderrOutput = '';
  if (transport.stderr) {
    transport.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString();
    });
  }

  await withTimeout(client.connect(transport), timeoutMs, 'Aoxia MCP 连接');
  const list = await withTimeout(client.listTools(), timeoutMs, 'Aoxia tools/list');
  const tools = new Map((list?.tools || []).map((tool) => [tool.name, tool]));

  return {
    tools,
    async callTool(name, args, options = {}) {
      const callTimeout = options.timeoutMs || timeoutMs;
      const result = await withTimeout(
        client.callTool({
          name,
          arguments: args,
        }),
        callTimeout,
        `Aoxia ${name}`,
      );

      return {
        name,
        arguments: args,
        raw: result,
        text: normalizeTextContent(result),
      };
    },
    async close() {
      await transport.close().catch(() => {});
    },
    getStderr() {
      return stderrOutput.trim();
    },
  };
}
