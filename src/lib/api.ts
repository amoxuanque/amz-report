import type { AnalysisSession } from '../types/analysis';
import type { CompetitiveReport } from '../types/report';

interface AnalyzeResponse {
  session: AnalysisSession;
  report: CompetitiveReport;
}

export async function analyzeSession(session: AnalysisSession): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ session }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || '分析服务暂时不可用。');
  }

  return payload as AnalyzeResponse;
}
