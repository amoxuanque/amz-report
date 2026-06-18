import { isAoxiaConfigured, resolveAoxiaConfigSource } from '../server/aoxia-client.js';
import { resolveSorftimeMcpUrl } from '../server/sorftime-client.js';

export default function handler(_req, res) {
  try {
    resolveSorftimeMcpUrl();
    res.status(200).json({
      ok: true,
      hasDataService: true,
      hasAoxiaService: isAoxiaConfigured(),
      aoxiaSource: resolveAoxiaConfigSource(),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || '数据服务未配置。',
      hasAoxiaService: isAoxiaConfigured(),
      aoxiaSource: resolveAoxiaConfigSource(),
    });
  }
}
