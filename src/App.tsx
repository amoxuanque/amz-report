/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Home, { Mode } from './components/Home';
import Loading from './components/Loading';
import Report from './components/Report';

type ViewState = 'home' | 'loading' | 'report';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [currentMode, setCurrentMode] = useState<Mode>('compare'); // Default, though unused in view atm
  
  const handleAnalyze = (mode: Mode, query: string) => {
    // In a real app we'd trigger an API fetch here with mode and query.
    // For the prototype, we move to the loading state simulating exactly what that mode does.
    setCurrentMode(mode);
    setView('loading');
  };

  const handleLoadingComplete = () => {
    setView('report');
  };

  const handleBackToHome = () => {
    setView('home');
  };

  return (
    <>
      {view === 'home' && <Home onAnalyze={handleAnalyze} />}
      {view === 'loading' && <Loading mode={currentMode} onComplete={handleLoadingComplete} />}
      {view === 'report' && <Report onBack={handleBackToHome} />}
    </>
  );
}

