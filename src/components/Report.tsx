import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import type { ReactNode } from 'react';
import { getSiteLabel } from '../lib/analysis';
import type { AnalysisSession } from '../types/analysis';
import type {
  CompetitiveReport,
  ReportActionCard,
  ReportCandidateCard,
  ReportComparisonRow,
  ReportHeroCard,
  ReportProduct,
  ReportReviewBlock,
  ReportRoadmapStep,
} from '../types/report';

interface ReportProps {
  onBack: () => void;
  session: AnalysisSession;
  report: CompetitiveReport;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FIND_STEP_ITEMS = [
  { id: 'step-1', label: 'Step 1', title: '锁定第一竞对' },
  { id: 'step-2', label: 'Step 2', title: '看候选池层级' },
  { id: 'step-3', label: 'Step 3', title: '看关键词证据' },
  { id: 'step-4', label: 'Step 4', title: '看执行动作' },
];

export default function Report({ onBack, session, report }: ReportProps) {
  const sessionTitle = session.asins.length > 0 ? session.asins.join(' vs ') : report.title;
  const isFindMode = report.meta.mode === 'find';

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </button>
          <div className="text-sm font-medium text-slate-800 truncate max-w-[220px] md:max-w-none flex items-center gap-2">
            <span className="text-slate-400">Report /</span> {sessionTitle}
          </div>
          <div className="w-[100px]" />
        </div>
      </div>

      {isFindMode ? (
        <FindReportLayout session={session} report={report} />
      ) : (
        <DefaultReportLayout session={session} report={report} />
      )}
    </div>
  );
}

function DefaultReportLayout({ session, report }: { session: AnalysisSession; report: CompetitiveReport }) {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
    >
      <ReportHeroSection session={session} report={report} />

      <motion.nav variants={variants} className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
        {report.navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex-none px-4 py-2 rounded text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </motion.nav>

      <motion.section variants={variants} id="产品卡" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <SectionHeader title="产品卡" desc={report.sectionCopy.products} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {report.products.map((product) => (
            <ProductCard key={product.asin} product={product} />
          ))}
        </div>
      </motion.section>

      {report.modeFocusCards && report.modeFocusCards.length > 0 && (
        <motion.section variants={variants} id={report.modeFocusTitle || '模式判断'} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title={report.modeFocusTitle || '模式判断'} desc={report.sectionCopy.modeFocus || report.sectionCopy.comparison} />
          <CardGrid cards={report.modeFocusCards} />
        </motion.section>
      )}

      {report.candidatePoolCards && report.candidatePoolCards.length > 0 && (
        <motion.section variants={variants} id={report.candidatePoolTitle || '候选池'} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title={report.candidatePoolTitle || '候选池'} desc={report.sectionCopy.candidates || report.sectionCopy.comparison} />
          <CandidatePoolGrid cards={report.candidatePoolCards} />
        </motion.section>
      )}

      <motion.section variants={variants} id="核心对比" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader title="核心对比" desc={report.sectionCopy.comparison} />
        <ComparisonTable rows={report.comparisonRows} leftLabel={report.labels.left} rightLabel={report.labels.right} />
      </motion.section>

      <motion.section variants={variants} id="类目环境" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <SectionHeader title="类目环境" desc={report.sectionCopy.category} />
        <div className="mb-6">
          <CardGrid cards={report.categoryCards} />
        </div>
        <ComparisonTable rows={report.categoryRows} leftLabel={report.labels.left} rightLabel={report.labels.right} />
      </motion.section>

      <motion.section variants={variants} id="流量与关键词" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <SectionHeader title="流量与关键词" desc={report.sectionCopy.traffic} />
        <TrafficSection report={report} />
      </motion.section>

      <motion.section variants={variants} id="评价洞察" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <SectionHeader title="评价洞察" desc={report.sectionCopy.reviews} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {report.reviewBlocks.map((block) => (
            <ReviewBlockView key={block.title} block={block} />
          ))}
        </div>
      </motion.section>

      <motion.section variants={variants} id="执行建议" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <SectionHeader title="执行建议" desc={report.sectionCopy.actions} />
        <ActionGrid cards={report.actionCards} />
      </motion.section>

      <motion.section variants={variants} id="执行路径" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <SectionHeader title="执行路径" desc={report.sectionCopy.roadmap} />
        <RoadmapGrid steps={report.roadmapSteps} />
      </motion.section>

      <div className="h-10" />
    </motion.main>
  );
}

function FindReportLayout({ session, report }: { session: AnalysisSession; report: CompetitiveReport }) {
  const seedProduct = report.products[0];
  const primaryCompetitor = report.products[1];
  const firstCandidate = report.candidatePoolCards?.[0];
  const mainCandidates = report.candidatePoolCards?.filter((card) => /第一优先|主竞对|次级|观察/.test(card.eyebrow)) || [];
  const excludedCandidates = report.candidatePoolCards?.filter((card) => /排除/.test(card.eyebrow)) || [];
  const whyChosenLines = [
    ...(report.modeFocusCards?.map((card) => `${card.label}：${card.desc}`) || []),
    ...report.comparisonRows.slice(0, 3).map((row) => `${row.title}：${row.desc}`),
  ].slice(0, 4);
  const evidenceRows = report.comparisonRows.slice(1, 6);

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
    >
      <ReportHeroSection session={session} report={report} />

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
        <motion.aside variants={variants} className="xl:sticky xl:top-24">
          <FindStepRail />
        </motion.aside>

        <div className="space-y-6">
          <motion.section variants={variants} id="step-1" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <StepSectionHeader
              step="Step 1"
              title="锁定第一竞对"
              desc="先回答谁是当前最值得盯的第一竞对，再进入后面的候选池和证据判断。"
            />

            <div className="p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] gap-6">
              {seedProduct && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
                  <div className="text-xs font-bold tracking-wider text-blue-600 uppercase mb-4">种子 ASIN</div>
                  <CompactProductCard product={seedProduct} />
                </div>
              )}

              {primaryCompetitor && (
                <div className="border border-blue-200 rounded-2xl p-5 bg-gradient-to-br from-blue-50/70 to-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs font-bold tracking-wider text-blue-600 uppercase mb-2">第一竞对</div>
                      <h3 className="text-xl font-semibold text-slate-900">{primaryCompetitor.brand} / {primaryCompetitor.asin}</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      已锁定为第一竞对
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
                    <CompactProductCard product={primaryCompetitor} emphasize />
                    <div className="bg-white rounded-2xl border border-blue-100 p-5">
                      <div className="text-sm font-semibold text-blue-700 mb-4">为什么锁它</div>
                      <ul className="space-y-3">
                        {whyChosenLines.map((line) => (
                          <li key={line} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section variants={variants} id="step-2" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <StepSectionHeader
              step="Step 2"
              title="看候选池层级"
              desc="候选池不是越多越好，而是分清谁是主竞对、谁只是第二观察位、谁应该排除。"
            />

            <div className="p-6 space-y-6">
              {firstCandidate && (
                <FindCandidateHighlight card={firstCandidate} />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="text-sm font-semibold text-slate-900 mb-4">主竞对 / 第二观察位</div>
                  <div className="space-y-4">
                    {mainCandidates.slice(1).map((card) => (
                      <CandidateTierCard key={`${card.eyebrow}-${card.title}`} card={card} />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-semibold text-slate-900 mb-4">排除项</div>
                  <div className="space-y-4">
                    {excludedCandidates.length > 0 ? (
                      excludedCandidates.map((card) => (
                        <CandidateTierCard key={`${card.eyebrow}-${card.title}`} card={card} muted />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                        当前没有明确的排除项样本。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={variants} id="step-3" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <StepSectionHeader
              step="Step 3"
              title="看关键词证据"
              desc="先看是否在抢同一批高意图词，再看价格带、类目位置和自然流量门槛。"
            />

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6">
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/60">
                  <div className="text-sm font-semibold text-slate-900 mb-4">共享高意图词与门槛</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.trafficColumns.slice(0, 2).map((column) => (
                      <FindEvidenceCard key={column.title} card={column} />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                  <div className="text-sm font-semibold text-slate-900 mb-4">类目与价格带</div>
                  <div className="space-y-3">
                    {evidenceRows.map((row) => (
                      <FindEvidenceRow key={row.title} row={row} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.trafficColumns.slice(2, 4).map((column) => (
                  <FindEvidenceCard key={column.title} card={column} accent />
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-950 leading-relaxed">
                <strong className="text-blue-700">结论：</strong> {report.trafficInsight}
              </div>
            </div>
          </motion.section>

          <motion.section variants={variants} id="step-4" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <StepSectionHeader
              step="Step 4"
              title="看执行动作"
              desc="最后不是停在分析上，而是明确接下来该盯谁、盯什么、怎么跟。"
            />

            <div className="p-6 space-y-6">
              <ActionGrid cards={report.actionCards} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="text-sm font-semibold text-slate-900 mb-4">执行路径</div>
                <RoadmapGrid steps={report.roadmapSteps} compact />
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.main>
  );
}

function ReportHeroSection({ session, report }: { session: AnalysisSession; report: CompetitiveReport }) {
  return (
    <motion.section variants={variants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <h4 className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
            {report.meta.date} <span>&middot;</span> {report.meta.marketplace} <span>&middot;</span> {report.meta.source}
          </h4>
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">{report.title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{report.summary}</p>

          <div className="flex flex-wrap gap-2">
            {session.site !== 'AUTO' && (
              <Pill>站点：<strong className="text-slate-900">{getSiteLabel(session.site)}</strong></Pill>
            )}
            {session.asins.length === 0 && (
              <Pill>Query：<strong className="text-slate-900">{session.query}</strong></Pill>
            )}
            {session.asins.map((asin) => (
              <Pill key={asin}>Input：<strong className="text-slate-900">{asin}</strong></Pill>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-72 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">本页怎么读</div>
          <div className="space-y-3">
            {report.heroCards.map((card) => (
              <div key={`${card.label}-${card.value}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</div>
                <div className="text-base font-semibold text-slate-900 mb-1">{card.value}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function FindStepRail() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-0">
        {FIND_STEP_ITEMS.map((item, index) => {
          const isActive = index === 0;
          const isLast = index === FIND_STEP_ITEMS.length - 1;
          return (
            <a key={item.id} href={`#${item.id}`} className="relative flex gap-3 pb-8 last:pb-0 group">
              <div className="relative flex flex-col items-center">
                {isActive ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                {!isLast && <div className="absolute top-6 w-px h-[calc(100%-0.25rem)] bg-slate-200" />}
              </div>
              <div>
                <div className={`text-sm font-semibold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{item.label}</div>
                <div className={`mt-1 text-base font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{item.title}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function StepSectionHeader({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
      <div className="text-sm font-semibold text-blue-600 mb-2">{step}</div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">{desc}</p>
    </div>
  );
}

function ProductCard({ product }: { product: ReportProduct }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        <div className="w-full sm:w-40 aspect-[1/1.08] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          <img src={product.image} alt={product.brand} className="object-cover mix-blend-multiply h-full p-2" />
        </div>
        <div>
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">ASIN &middot; {product.asin}</div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">{product.title}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <Pill>Brand: <strong className="text-slate-900">{product.brand}</strong></Pill>
            <Pill>Seller: <strong className="text-slate-900">{product.seller}</strong></Pill>
            <Pill>Rank: <strong className="text-slate-900">{product.rank}</strong></Pill>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">{product.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {product.metrics.map((metric) => (
          <MetricCard key={`${product.asin}-${metric.label}`} metric={metric} />
        ))}
      </div>
    </div>
  );
}

function CompactProductCard({ product, emphasize = false }: { product: ReportProduct; emphasize?: boolean }) {
  return (
    <div className={`rounded-2xl ${emphasize ? 'bg-white border border-blue-100' : 'bg-white border border-slate-200'} p-4`}>
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          <img src={product.image} alt={product.brand} className="object-cover mix-blend-multiply h-full p-2" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">{product.asin}</div>
          <h4 className="text-lg font-semibold text-slate-900 leading-tight mb-2 line-clamp-2">{product.title}</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <Pill>{product.brand}</Pill>
            <Pill>{product.rank}</Pill>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {product.metrics.map((metric) => (
          <MetricCard key={`${product.asin}-${metric.label}`} metric={metric} compact />
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  metric,
  compact = false,
}: {
  metric: ReportProduct['metrics'][number];
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-slate-100 bg-slate-50 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{metric.label}</div>
      <div className={`${compact ? 'text-base' : 'text-xl'} font-semibold text-slate-900 mb-1`}>{metric.value}</div>
      <div className="text-xs text-slate-500 font-medium">{metric.sub}</div>
    </div>
  );
}

function FindCandidateHighlight({ card }: { card: ReportCandidateCard }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-bold tracking-wider text-blue-600 uppercase mb-2">{card.eyebrow}</div>
          <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
        </div>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          查看完整候选池
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{card.summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {card.points.map((point) => (
          <div key={point} className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600 leading-relaxed">
            {point}
          </div>
        ))}
      </div>
      {card.caution && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="text-amber-700">注意：</strong> {card.caution}
        </div>
      )}
    </div>
  );
}

function CandidateTierCard({ card, muted = false }: { card: ReportCandidateCard; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${muted ? 'border-slate-200 bg-slate-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className={`text-xs font-bold tracking-wider uppercase mb-1 ${muted ? 'text-slate-400' : 'text-blue-600'}`}>{card.eyebrow}</div>
          <h4 className="text-base font-semibold text-slate-900">{card.title}</h4>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-3">{card.summary}</p>
      <ul className="space-y-2 text-sm text-slate-600">
        {card.points.slice(0, 3).map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      {card.caution && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {card.caution}
        </div>
      )}
    </div>
  );
}

function FindEvidenceCard({
  card,
  accent = false,
}: {
  card: CompetitiveReport['trafficColumns'][number];
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent || card.accent ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{card.eyebrow}</div>
      <h4 className="text-lg font-semibold text-slate-900 mb-4">{card.title}</h4>
      <ul className="space-y-3 text-sm text-slate-600">
        {card.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

function FindEvidenceRow({ row }: { row: ReportComparisonRow }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="text-sm font-semibold text-slate-900">{row.title}</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-full border ${row.highlight === 'left' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
            {row.val1}
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${row.highlight === 'right' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
            {row.val2}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{row.desc}</p>
    </div>
  );
}

function TrafficSection({ report }: { report: CompetitiveReport }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {report.trafficColumns.map((column) => (
          <div key={column.title} className={`bg-white rounded-xl p-6 border border-slate-200 shadow-sm ${column.accent ? 'border-l-4 border-l-blue-500' : ''}`}>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{column.eyebrow}</h4>
            <div className="text-2xl font-semibold text-slate-900 mb-4">{column.title}</div>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              {column.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100/50 rounded-2xl p-6 text-indigo-900 font-medium leading-relaxed">
        <strong className="text-indigo-700">战术启示：</strong> {report.trafficInsight}
      </div>
    </>
  );
}

function ActionGrid({ cards }: { cards: ReportActionCard[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.title} className={`bg-white border-t-4 rounded-xl p-6 shadow-sm border border-slate-200 ${card.accentClass}`}>
          <div className="text-lg font-semibold text-slate-900 mb-2">{card.priority}: {card.title}</div>
          <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}

function RoadmapGrid({ steps, compact = false }: { steps: ReportRoadmapStep[]; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-1 ${compact ? 'xl:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
      {steps.map((step) => (
        <RoadmapCard key={`${step.phase}-${step.title}`} step={step} />
      ))}
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">{desc}</p>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      {children}
    </span>
  );
}

function CardGrid({ cards }: { cards: ReportHeroCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={`${card.label}-${card.value}`} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative group hover:bg-slate-50 transition-all">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">{card.label}</div>
          <div className="text-2xl font-semibold text-slate-900 mb-3">{card.value}</div>
          <p className="text-[13px] text-slate-600 leading-relaxed">{card.desc}</p>
        </div>
      ))}
    </div>
  );
}

function CandidatePoolGrid({ cards }: { cards: ReportCandidateCard[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {cards.map((card) => (
        <div key={`${card.eyebrow}-${card.title}`} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">{card.eyebrow}</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">{card.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{card.summary}</p>
          <ul className="space-y-2 text-sm text-slate-600 mb-4">
            {card.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {card.links && card.links.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {card.links.map((link) => (
                <a
                  key={`${card.title}-${link.label}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {card.caution && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong className="text-amber-700">注意：</strong> {card.caution}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ComparisonTable({
  rows,
  leftLabel,
  rightLabel,
}: {
  rows: ReportComparisonRow[];
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="overflow-x-auto -mx-8 md:mx-0 px-8 md:px-0">
      <table className="w-full min-w-[800px] text-left border-collapse">
        <thead>
          <tr>
            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">维度</th>
            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">{leftLabel}</th>
            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">{rightLabel}</th>
            <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">商业解读</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.title} className="group hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 text-sm font-semibold text-slate-900 align-top">{row.title}</td>
              <td className={`py-3 px-4 text-sm w-1/4 align-top ${row.highlight === 'left' ? 'text-green-600 font-bold' : 'text-slate-700'}`}>{row.val1}</td>
              <td className={`py-3 px-4 text-sm w-1/4 align-top ${row.highlight === 'right' ? 'text-green-600 font-bold' : 'text-slate-700'}`}>{row.val2}</td>
              <td className="py-3 px-4 text-[13px] text-slate-500 align-top leading-relaxed">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewBlockView({ block }: { block: ReportReviewBlock }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{block.eyebrow}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{block.title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">{block.summary}</p>

      <div className="space-y-4">
        <ReviewList title="正向驱动" items={block.positives} accent="text-green-600" />
        <ReviewList title="负向风险" items={block.negatives} accent="text-red-600" />
        {block.evidence && block.evidence.length > 0 && (
          <ReviewList title="证据样本" items={block.evidence} accent="text-amber-600" />
        )}
        <ReviewList title="可转动作" items={block.opportunities} accent="text-blue-600" />
      </div>
    </div>
  );
}

function ReviewList({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div>
      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${accent}`}>{title}</div>
      <ul className="space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapCard({ step }: { step: ReportRoadmapStep }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{step.phase}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-3">{step.title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
    </div>
  );
}
