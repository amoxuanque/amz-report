import './server/sorftime-client.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { buildLiveReport } from './server/report-service.js';
import { resolveSorftimeMcpUrl } from './server/sorftime-client.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 3000);

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    try {
      resolveSorftimeMcpUrl();
      res.json({
        ok: true,
        hasSorftimeUrl: true,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error.message || 'Sorftime MCP 未配置。',
      });
    }
  });

  app.post('/api/analyze', async (req, res) => {
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
      res.json(payload);
    } catch (error) {
      res.status(500).json({
        error: error.message || '分析服务异常。',
      });
    }
  });

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('未找到 dist 目录，请先运行 npm run build。');
    }

    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`amz-report ready on http://127.0.0.1:${port}`);
  });
}

createApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
