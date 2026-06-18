import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Target, BarChart2, PackageSearch, Globe2 } from 'lucide-react';
import {
  buildAnalysisSession,
  CUSTOMIZATION_OPTIONS,
  getModeExample,
  parseAnalysisInput,
  SITE_OPTIONS,
} from '../lib/analysis';
import type { AnalysisSession, BuyerBriefInput, CustomizationNeed, Mode, SiteSelection } from '../types/analysis';

interface HomeProps {
  onAnalyze: (session: AnalysisSession) => void;
  serverError?: string | null;
  initialSession?: AnalysisSession | null;
}

const modes = [
  { id: 'find' as const, label: '找竞对', icon: Target, placeholder: '输入 1 个 ASIN 或 Amazon 链接...' },
  { id: 'compare' as const, label: '竞对分析', icon: BarChart2, placeholder: '输入 2 个或多个 ASIN 进行对比...' },
  { id: 'source' as const, label: '去寻源', icon: PackageSearch, placeholder: '输入 1 个 ASIN 或 Amazon 链接...' },
  { id: 'space' as const, label: '品类空间', icon: Globe2, placeholder: '输入 1 个 ASIN，或直接输入 hair dryer / 吹风机...' },
];

function buildInitialBuyerBrief(session?: AnalysisSession | null): BuyerBriefInput {
  if (!session?.buyerBrief) {
    return {
      asinOrUrl: '',
      targetPriceMin: '',
      targetPriceMax: '',
      maxPurchasePrice: '',
      firstOrderQty: '',
      acceptableMoq: '',
      customizationNeeds: ['none'],
    };
  }

  return {
    asinOrUrl: session.buyerBrief.asinOrUrl,
    targetPriceMin: session.buyerBrief.targetPriceMin ? String(session.buyerBrief.targetPriceMin) : '',
    targetPriceMax: session.buyerBrief.targetPriceMax ? String(session.buyerBrief.targetPriceMax) : '',
    maxPurchasePrice: session.buyerBrief.maxPurchasePrice ? String(session.buyerBrief.maxPurchasePrice) : '',
    firstOrderQty: session.buyerBrief.firstOrderQty ? String(session.buyerBrief.firstOrderQty) : '',
    acceptableMoq: session.buyerBrief.acceptableMoq ? String(session.buyerBrief.acceptableMoq) : '',
    customizationNeeds: session.buyerBrief.customizationNeeds,
  };
}

export default function Home({ onAnalyze, serverError, initialSession }: HomeProps) {
  const [mode, setMode] = useState<Mode>(initialSession?.mode || 'compare');
  const [site, setSite] = useState<SiteSelection>(initialSession?.site || 'AUTO');
  const [query, setQuery] = useState(initialSession?.rawQuery || initialSession?.query || '');
  const [buyerBrief, setBuyerBrief] = useState<BuyerBriefInput>(buildInitialBuyerBrief(initialSession));
  const [sourceFieldTouched, setSourceFieldTouched] = useState<
    Partial<Record<'targetPriceMin' | 'targetPriceMax' | 'maxPurchasePrice' | 'firstOrderQty' | 'acceptableMoq', boolean>>
  >({});
  const [sourceSubmitAttempted, setSourceSubmitAttempted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const currentMode = modes.find((item) => item.id === mode)!;
  const parsed = parseAnalysisInput(mode, query, buyerBrief);
  const sourceFieldErrors = parsed.fieldErrors || {};
  const modeSummary = {
    find: '输入 1 个 ASIN，快速锁定第一竞对和可跟踪候选池。',
    compare: '输入 2 个或多个 ASIN，把差异、关键词和动作建议收成一页。',
    source: '输入 1 个 ASIN 和买家简报，按初筛、询盘、样品、小单推进寻源。',
    space: '输入 1 个 ASIN 或品类词，看当前盘子值不值得进、能不能进。',
  } satisfies Record<Mode, string>;
  const setBuyerBriefField = (field: keyof BuyerBriefInput, value: BuyerBriefInput[keyof BuyerBriefInput]) => {
    setBuyerBrief((current) => ({ ...current, [field]: value }));
  };

  const toggleCustomizationNeed = (nextNeed: CustomizationNeed) => {
    setBuyerBrief((current) => {
      const currentNeeds = current.customizationNeeds || ['none'];
      if (nextNeed === 'none') {
        return { ...current, customizationNeeds: ['none'] };
      }

      const withoutNone = currentNeeds.filter((item) => item !== 'none');
      const nextNeeds = withoutNone.includes(nextNeed)
        ? withoutNone.filter((item) => item !== nextNeed)
        : [...withoutNone, nextNeed];

      return {
        ...current,
        customizationNeeds: nextNeeds.length > 0 ? nextNeeds : ['none'],
      };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'source') {
      setSourceSubmitAttempted(true);
    }
    if (parsed.isValid) {
      onAnalyze(buildAnalysisSession(mode, query, site, buyerBrief));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50 font-sans text-slate-900">
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
            AMZ Report
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-5">
            AMZ Report
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-8">
            帮你更快看清竞对、品类空间和寻源方向，直接拿到可执行的分析结果。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full mx-auto max-w-2xl">
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
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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

          <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modes.map((item) => {
              const active = item.id === mode;
              return (
                <div
                  key={`${item.id}-summary`}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    active ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-white/85'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{modeSummary[item.id]}</p>
                </div>
              );
            })}
          </div>

          <motion.div
            animate={{
              scale: isFocused ? 1.02 : 1,
              boxShadow: isFocused
                ? '0 20px 40px -10px rgba(0,0,0,0.08), 0 0 0 4px rgba(59, 130, 246, 0.1)'
                : '0 8px 30px -10px rgba(0,0,0,0.04), 0 0 0 0 rgba(59, 130, 246, 0)',
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
              onInput={(e) => setBuyerBriefField('asinOrUrl', (e.target as HTMLInputElement).value)}
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

          {mode === 'source' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-sm"
            >
              <div className="mb-4">
                <div className="text-sm font-semibold text-slate-900">买家寻源简报（选填）</div>
                <p className="mt-1 text-sm text-slate-500">
                  只填 ASIN 也可以先出结果。补得越全，后面的筛厂、询盘和样品建议会更精准。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SourceField
                  label="目标售价最低值"
                  suffix="$"
                  value={String(buyerBrief.targetPriceMin || '')}
                  onChange={(value) => setBuyerBriefField('targetPriceMin', value)}
                  onBlur={() => setSourceFieldTouched((current) => ({ ...current, targetPriceMin: true }))}
                  error={sourceSubmitAttempted || sourceFieldTouched.targetPriceMin ? sourceFieldErrors.targetPriceMin : undefined}
                />
                <SourceField
                  label="目标售价最高值"
                  suffix="$"
                  value={String(buyerBrief.targetPriceMax || '')}
                  onChange={(value) => setBuyerBriefField('targetPriceMax', value)}
                  onBlur={() => setSourceFieldTouched((current) => ({ ...current, targetPriceMax: true }))}
                  error={sourceSubmitAttempted || sourceFieldTouched.targetPriceMax ? sourceFieldErrors.targetPriceMax : undefined}
                />
                <SourceField
                  label="采购价上限"
                  suffix="¥"
                  value={String(buyerBrief.maxPurchasePrice || '')}
                  onChange={(value) => setBuyerBriefField('maxPurchasePrice', value)}
                  onBlur={() => setSourceFieldTouched((current) => ({ ...current, maxPurchasePrice: true }))}
                  error={sourceSubmitAttempted || sourceFieldTouched.maxPurchasePrice ? sourceFieldErrors.maxPurchasePrice : undefined}
                />
                <SourceField
                  label="首批数量"
                  suffix="件"
                  value={String(buyerBrief.firstOrderQty || '')}
                  onChange={(value) => setBuyerBriefField('firstOrderQty', value)}
                  onBlur={() => setSourceFieldTouched((current) => ({ ...current, firstOrderQty: true }))}
                  error={sourceSubmitAttempted || sourceFieldTouched.firstOrderQty ? sourceFieldErrors.firstOrderQty : undefined}
                />
                <SourceField
                  label="可接受 MOQ"
                  suffix="件"
                  value={String(buyerBrief.acceptableMoq || '')}
                  onChange={(value) => setBuyerBriefField('acceptableMoq', value)}
                  onBlur={() => setSourceFieldTouched((current) => ({ ...current, acceptableMoq: true }))}
                  error={sourceSubmitAttempted || sourceFieldTouched.acceptableMoq ? sourceFieldErrors.acceptableMoq : undefined}
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-700">当前规则</div>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    页面数据初筛，商家回复验证承接，样品和小单验证可靠性。
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">定制需求</div>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMIZATION_OPTIONS.map((option) => {
                    const active = (buyerBrief.customizationNeeds || ['none']).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleCustomizationNeed(option.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {sourceFieldErrors.customizationNeeds && (
                  <p className="mt-2 text-xs font-medium text-amber-600">{sourceFieldErrors.customizationNeeds}</p>
                )}
              </div>
            </motion.div>
          )}

          {serverError && (
            <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-left shadow-sm">
              <div className="text-sm font-semibold text-amber-900">这次没有成功进入结果页</div>
              <p className="mt-1 text-sm leading-6 text-amber-800">{serverError}</p>
              <p className="mt-2 text-xs leading-5 text-amber-700">已保留你刚才填写的内容，直接改输入或参数后重试即可。</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mt-6 text-center text-sm font-medium"
          >
            <p className={parsed.error ? 'text-amber-600' : 'text-slate-400'}>
              {parsed.error ?? parsed.helperText}
            </p>
            <p className="mt-2 text-slate-400">{getModeExample(mode)}</p>
            <p className="mt-2 text-slate-400">{mode === 'source' ? '只填 ASIN 也可提交，补简报会更精准' : '按回车键开始分析'}</p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

function SourceField({
  label,
  value,
  onChange,
  onBlur,
  error,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-700 mb-2">{label}</div>
      <div className={`flex items-center rounded-2xl border bg-white px-4 py-3 ${error ? 'border-amber-300' : 'border-slate-200'}`}>
        {suffix && <span className="mr-2 text-sm font-semibold text-slate-400">{suffix}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-300"
          placeholder="选填"
          spellCheck={false}
        />
      </div>
      {error && <p className="mt-2 text-xs font-medium text-amber-600">{error}</p>}
    </label>
  );
}
