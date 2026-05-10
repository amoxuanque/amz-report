import { resolveSorftimeMcpUrl } from '../server/sorftime-client.js';

export default function handler(_req, res) {
  try {
    resolveSorftimeMcpUrl();
    res.status(200).json({
      ok: true,
      hasSorftimeUrl: true,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Sorftime MCP 未配置。',
    });
  }
}
