import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  BarChart2,
  ChevronRight,
  Globe2,
  PackageSearch,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { buildAnalysisSession, getModeExample, parseAnalysisInput, SITE_OPTIONS } from '../lib/analysis';
import type { AnalysisSession, Mode, SiteSelection } from '../types/analysis';

interface HomeProps {
  onAnalyze: (session: AnalysisSession) => void;
  serverError?: string | null;
}

const modes = [
  {
    id: 'find' as const,
    label: '找竞对',
    icon: Target,
    placeholder: '输入 1 个 ASIN 或 Amazon 链接...',
    eyebrow: 'Track Rival',
    title: '先锁第一竞对',
    desc: '从类目池里先找最该盯的对手，不先盯整类目。',
    tone: 'from-blue-50 to-cyan-50 border-blue-200',
  },
  {
    id: 'compare' as const,
    label: '竞对分析',
    icon: BarChart2,
    placeholder: '输入 2 个或多个 ASIN 进行对比...',
    eyebrow: 'Compare',
    title: '把差距讲清楚',
    desc: '把价格、词路、评论、类目门槛和动作建议拆开看。',
    tone: 'from-slate-50 to-white border-slate-200',
  },
  {
    id: 'source' as const,
    label: '去寻源',
    icon: PackageSearch,
    placeholder: '输入 1 个 ASIN 或 Amazon 链接...',
    eyebrow: 'Source',
    title: '先看值不值得找厂',
    desc: '先看 Amazon 盘面，再筛 1688 供给和打样路径。',
    tone: 'from-emerald-50 to-teal-50 border-emerald-200',
  },
  {
    id: 'space' as const,
    label: '品类空间',
    icon: Globe2,
    placeholder: '输入 1 个 ASIN，或直接输入 hair dryer / 吹风机...',
    eyebrow: 'Expand',
    title: '判断平台与站点机会',
    desc: '看多平台、多站点空间，决定先去哪里打。',
    tone: 'from-violet-50 to-fuchsia-50 border-violet-200',
  },
];

const quickSignals = [
  { value: '4 条', label: '跨境判断路径' },
  { value: '1 次', label: '输入即进分析' },
  { value: 'ASIN / 关键词', label: '支持两类入口' },
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
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.16),transparent_62%)] blur-3xl" />
        <div className="absolute top-[24%] right-[12%] h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[12%] left-[8%] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.72)_28%,#f7f8fb_62%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14"
      >
        <div className="rounded-[36px] border border-slate-200/90 bg-white/90 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="grid gap-10 p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:p-10 xl:p-12">
            <section className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.55 }}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Cross-Border Market Intelligence
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.6 }}
                className="mt-6"
              >
                <h1 className="max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950 md:text-[58px] lg:text-[72px]">
                  从一个 ASIN 出发，
                  <br />
                  把跨境判断链
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                    一次跑完
                  </span>
                  。
                </h1>
                <p className="mt-6 max-w-2xl text-[16px] leading-8 text-slate-600 md:text-[18px]">
                  不是只看一份报告，而是把品类空间、竞对发现、双 ASIN 差距和寻源判断收敛到同一个入口。先判断值不值得做，再决定盯谁、怎么打、找不找厂。
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.6 }}
                className="mt-8 grid gap-3 sm:grid-cols-3"
              >
                {quickSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.22)]"
                  >
                    <div className="text-[24px] font-semibold tracking-[-0.05em] text-slate-950">{signal.value}</div>
                    <div className="mt-1 text-sm text-slate-500">{signal.label}</div>
                  </div>
                ))}
              </motion.div>

              <form onSubmit={handleSubmit} className="mt-8">
                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)]">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {modes.map((item) => {
                        const Icon = item.icon;
                        const isActive = mode === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setMode(item.id)}
                            className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                              isActive
                                ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_34px_-24px_rgba(15,23,42,0.55)]'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <label className="inline-flex min-w-[192px] items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-500">国家站点</span>
                        <select
                          value={site}
                          onChange={(e) => setSite(e.target.value as SiteSelection)}
                          className="bg-transparent text-sm font-semibold text-slate-950 outline-none"
                        >
                          {SITE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <motion.div
                        animate={{
                          boxShadow: isFocused
                            ? '0 20px 50px -32px rgba(37,99,235,0.45)'
                            : '0 12px 30px -28px rgba(15,23,42,0.22)',
                        }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-1 items-center rounded-[22px] border bg-white px-4 py-3 transition-colors ${
                          isFocused ? 'border-blue-400' : 'border-slate-200'
                        }`}
                      >
                        <Search className="h-5 w-5 shrink-0 text-slate-400" />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder={currentMode.placeholder}
                          className="min-w-0 flex-1 bg-transparent px-3 text-base text-slate-950 placeholder:text-slate-400 outline-none md:text-lg"
                          spellCheck={false}
                        />
                        <AnimatePresence>
                          {query && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.88 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.88 }}
                              type="submit"
                              disabled={!parsed.isValid}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition-colors hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                      <p className={parsed.error || serverError ? 'text-amber-600' : 'text-slate-500'}>
                        {parsed.error ?? serverError ?? parsed.helperText}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
                        <span>{getModeExample(mode)}</span>
                        <span>按回车键开始分析</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </section>

            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28, duration: 0.65 }}
              className="flex flex-col gap-4"
            >
              <div className="rounded-[30px] border border-slate-200 bg-[#fbfcff] p-4 shadow-[0_30px_80px_-54px_rgba(15,23,42,0.28)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Decision Surface</div>
                    <div className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">四条判断链，同一个入口</div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                    {currentMode.eyebrow}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {modes.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === mode;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMode(item.id)}
                        className={`rounded-[24px] border bg-gradient-to-br p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${item.tone} ${
                          isActive ? 'ring-2 ring-slate-950/8 shadow-[0_22px_44px_-30px_rgba(15,23,42,0.35)]' : 'shadow-[0_18px_36px_-34px_rgba(15,23,42,0.22)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-950">
                            <Icon className="h-4 w-4" />
                          </div>
                          <ArrowUpRight className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                        </div>
                        <div className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.eyebrow}</div>
                        <div className="mt-2 text-xl font-semibold leading-tight tracking-[-0.04em] text-slate-950">{item.title}</div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_28px_64px_-44px_rgba(15,23,42,0.65)]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">How It Works</div>
                  <div className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                    输入一个起点，
                    <br />
                    系统替你跑完整条判断链。
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                    <div>01 识别 ASIN / 关键词与站点</div>
                    <div>02 进入对应功能判断路径</div>
                    <div>03 输出能执行的动作建议</div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.22)]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Recommended Use</div>
                  <div className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">{currentMode.label}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{currentMode.desc}</p>
                  <div className="mt-5 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold text-slate-400">示例输入</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{getModeExample(mode).replace('示例：', '')}</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
