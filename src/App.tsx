/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Home from './components/Home';
import Loading from './components/Loading';
import Report from './components/Report';
import { analyzeSession } from './lib/api';
import type { AnalysisSession } from './types/analysis';
import type { CompetitiveReport } from './types/report';

type ViewState = 'home' | 'loading' | 'report';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [report, setReport] = useState<CompetitiveReport | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleAnalyze = async (nextSession: AnalysisSession) => {
    setServerError(null);
    setSession(nextSession);
    setReport(null);
    setView('loading');

    try {
      const payload = await analyzeSession(nextSession);
      setSession(payload.session);
      setReport(payload.report);
      setView('report');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : '分析失败，请稍后重试。');
      setView('home');
    }
  };

  const handleBackToHome = () => {
    setView('home');
  };

  return (
    <>
      {view === 'home' && <Home onAnalyze={handleAnalyze} serverError={serverError} />}
      {view === 'loading' && session && <Loading session={session} />}
      {view === 'report' && session && report && (
        <Report onBack={handleBackToHome} session={session} report={report} />
      )}
    </>
  );
}
