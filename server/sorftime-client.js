import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

let rpcId = 1;

export function resolveSorftimeMcpUrl() {
  if (process.env.SORFTIME_MCP_URL) {
    return process.env.SORFTIME_MCP_URL;
  }

  const configPath = path.join(os.homedir(), '.codex', 'config.toml');
  if (!fs.existsSync(configPath)) {
    throw new Error('未找到 SORFTIME_MCP_URL，也无法从 ~/.codex/config.toml 读取 sorftime_mcp.url。');
  }

  const config = fs.readFileSync(configPath, 'utf8');
  const match = config.match(
    /\[mcp_servers\.sorftime_mcp\][\s\S]*?^\s*url\s*=\s*"([^"]+)"/m,
  );

  if (!match?.[1]) {
    throw new Error('无法从 ~/.codex/config.toml 解析 sorftime_mcp.url。');
  }

  return match[1];
}

function parseRpcResponse(body) {
  const trimmed = body.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  const dataLines = [...body.matchAll(/^data:\s*(.+)$/gm)].map((match) => match[1]);
  for (let index = dataLines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(dataLines[index]);
    } catch (error) {
      continue;
    }
  }

  throw new Error('Sorftime MCP 返回格式无法解析。');
}

function callSorftimeRpc(method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: rpcId += 1,
      method,
      params,
    });

    const target = new URL(resolveSorftimeMcpUrl());
    const request = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            const message = parseRpcResponse(body);
            if (message.error) {
              reject(new Error(message.error.message || 'Sorftime MCP 调用失败。'));
              return;
            }

            resolve(message.result);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

export async function callSorftimeTool(name, args) {
  const result = await callSorftimeRpc('tools/call', {
    name,
    arguments: args,
  });

  const textPart = result?.content?.find((item) => item.type === 'text');

  return {
    name,
    arguments: args,
    raw: result,
    text: textPart?.text ?? '',
  };
}
