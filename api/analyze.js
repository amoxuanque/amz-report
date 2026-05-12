import { buildLiveReport } from '../server/report-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({
      error: 'Method Not Allowed',
    });
    return;
  }

  try {
    const session = req.body?.session;
    const hasAsins = Array.isArray(session?.asins) && session.asins.length > 0;
    const hasSpaceQuery = session?.mode === 'space' && typeof session?.query === 'string' && session.query.trim();
    if (!session?.mode || (!hasAsins && !hasSpaceQuery)) {
      res.status(400).json({
        error: '请求缺少有效的分析参数。',
      });
      return;
    }

    const payload = await buildLiveReport(session);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      error: error.message || '分析服务异常。',
    });
  }
}
