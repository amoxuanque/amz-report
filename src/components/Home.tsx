import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Target, BarChart2, PackageSearch, Globe2 } from 'lucide-react';
import { buildAnalysisSession, getModeExample, parseAnalysisInput, SITE_OPTIONS } from '../lib/analysis';
import type { AnalysisSession, Mode, SiteSelection } from '../types/analysis';

interface HomeProps {
  onAnalyze: (session: AnalysisSession) => void;
  serverError?: string | null;
}

const modes = [
  { id: 'find' as const, label: '找竞对', icon: Target, placeholder: '输入 1 个 ASIN 或 Amazon 链接...' },
  { id: 'compare' as const, label: '竞对分析', icon: BarChart2, placeholder: '输入 2 个或多个 ASIN 进行对比...' },
  { id: 'source' as const, label: '去寻源', icon: PackageSearch, placeholder: '输入 1 个 ASIN 或 Amazon 链接...' },
  { id: 'space' as const, label: '品类空间', icon: Globe2, placeholder: '输入 1 个 ASIN，或直接输入 hair dryer / 吹风机...' },
];

export default function Home({ onAnalyze, serverError }: HomeProps) {
  const [mode, setMode] = useState<Mode>('compare');
  const [site, setSite] = useState<SiteSelection>('AUTO');
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const currentMode = modes.find((item) => item.id === mode)!;
  const parsed = parseAnalysisInput(mode, query);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (parsed.isValid) {
      onAnalyze(buildAnalysisSession(mode, query, site));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-100 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl z-10 font-sans"
      >
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-6 border border-blue-100"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Seller Brief powered by Sorftime
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 shadow-sm">
            Stop Guessing. <br />
            <span className="text-blue-600">
              Start Briefing.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto tracking-wide">
            一次输入，直达结论。将品类空间、竞对发现、差异分析与 1688 寻源收敛于统一入口。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full mx-auto max-w-2xl">
          {/* Mode Selector */}
          <div className="flex justify-center gap-2 mb-6">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`
                    relative flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-300
                    ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-md shadow-sm border border-slate-200/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-4 flex justify-center">
            <label className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
              <span className="text-slate-400">国家站点</span>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value as SiteSelection)}
                className="bg-transparent text-slate-900 outline-none pr-6"
              >
                {SITE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Search Input Container */}
          <motion.div
            animate={{ 
              scale: isFocused ? 1.02 : 1,
              boxShadow: isFocused 
                ? '0 20px 40px -10px rgba(0,0,0,0.08), 0 0 0 4px rgba(59, 130, 246, 0.1)' 
                : '0 8px 30px -10px rgba(0,0,0,0.04), 0 0 0 0 rgba(59, 130, 246, 0)'
            }}
            transition={{ duration: 0.2 }}
            className={`
              relative flex items-center p-2 rounded-xl bg-white border transition-colors duration-300
              ${isFocused ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200 shadow-sm'}
            `}
          >
            <div className="pl-6 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={currentMode.placeholder}
              className="flex-1 w-full bg-transparent px-4 py-4 text-lg text-slate-900 placeholder-slate-400 outline-none font-medium"
              spellCheck={false}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="submit"
                  disabled={!parsed.isValid}
                  className="mr-2 p-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mt-6 text-center text-sm font-medium"
          >
            <p className={parsed.error || serverError ? 'text-amber-600' : 'text-slate-400'}>
              {parsed.error ?? serverError ?? parsed.helperText}
            </p>
            <p className="mt-2 text-slate-400">{getModeExample(mode)}</p>
            <p className="mt-2 text-slate-400">按回车键开始分析</p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
