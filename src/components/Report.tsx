import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Circle, ClipboardCheck, Copy, ShieldAlert, XCircle } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
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
  SourceReportPayload,
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

const SOURCE_STEP_ITEMS = [
  { id: 'source-verdict', label: '01', title: '结论总览', desc: '先看值不值得推进，以及三层判断原则。' },
  { id: 'source-buyer-context', label: '02', title: '买家目标与边界', desc: '先把买家目标和三类数据边界摆清楚。' },
  { id: 'source-screening', label: '03', title: '页面初筛与分层', desc: '页面只判断像不像，不直接判断承接能力。' },
  { id: 'source-inquiry', label: '04', title: '询盘模板与回复判断', desc: '把追问模板、强弱回复和评分入口前置。' },
  { id: 'source-sampling', label: '05', title: '样品与小单验证', desc: '先验样品和履约，再决定是否放大。' },
  { id: 'source-execution', label: '06', title: '压缩执行顺序', desc: '最后收敛成买家可直接执行的 6 步。' },
];

function useActiveSection(sectionIds: string[]) {
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0] || '');

  useEffect(() => {
    if (sectionIds.length === 0 || typeof window === 'undefined') {
      return undefined;
    }

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) {
      setActiveSectionId(sectionIds[0] || '');
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveSectionId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-18% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.55],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSectionId;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / scrollable));
      setProgress(nextProgress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return progress;
}

export default function Report({ onBack, session, report }: ReportProps) {
  const sessionTitle =
    report.meta.mode === 'source'
      ? session.asins[0] || report.title
      : session.asins.length > 0
        ? session.asins.join(' vs ')
        : report.title;
  const isFindMode = report.meta.mode === 'find';
  const isSourceMode = report.meta.mode === 'source';
  const trackedSections = isFindMode
    ? FIND_STEP_ITEMS.map((item) => item.id)
    : isSourceMode
      ? SOURCE_STEP_ITEMS.map((item) => item.id)
      : report.navItems.map((item) => item.id);
  const activeSectionId = useActiveSection(trackedSections);
  const scrollProgress = useScrollProgress();

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="h-0.5 bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(scrollProgress * 100, 4)}%` }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </button>
          <div className="text-sm font-medium text-slate-800 truncate max-w-[220px] md:max-w-none flex items-center gap-2">
            <span className="text-slate-400">AMZ Report /</span> {sessionTitle}
          </div>
          <div className="w-[100px]" />
        </div>
      </div>

      {isFindMode ? (
        <FindReportLayout session={session} report={report} activeSectionId={activeSectionId} />
      ) : isSourceMode ? (
        <SourceReportLayout session={session} report={report} activeSectionId={activeSectionId} />
      ) : (
        <DefaultReportLayout session={session} report={report} activeSectionId={activeSectionId} />
      )}
    </div>
  );
}

function DefaultReportLayout({
  session,
  report,
  activeSectionId,
}: {
  session: AnalysisSession;
  report: CompetitiveReport;
  activeSectionId: string;
}) {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
    >
      <ReportHeroSection session={session} report={report} />

      <motion.div variants={variants} className="sticky top-[4.5rem] z-30">
        <ModeSectionNav
          items={report.navItems.map((item, index) => ({
            id: item.id,
            label: `${String(index + 1).padStart(2, '0')}`,
            title: item.label,
          }))}
          activeSectionId={activeSectionId}
        />
      </motion.div>

      <motion.section variants={variants} id="产品卡" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
        <SectionHeader title="产品卡" desc={report.sectionCopy.products} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {report.products.map((product) => (
            <ProductCard key={product.asin} product={product} />
          ))}
        </div>
      </motion.section>

      {report.modeFocusCards && report.modeFocusCards.length > 0 && (
        <motion.section variants={variants} id={report.modeFocusTitle || '模式判断'} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
          <SectionHeader title={report.modeFocusTitle || '模式判断'} desc={report.sectionCopy.modeFocus || report.sectionCopy.comparison} />
          <CardGrid cards={report.modeFocusCards} />
        </motion.section>
      )}

      {report.candidatePoolCards && report.candidatePoolCards.length > 0 && (
        <motion.section variants={variants} id={report.candidatePoolTitle || '候选池'} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
          <SectionHeader title={report.candidatePoolTitle || '候选池'} desc={report.sectionCopy.candidates || report.sectionCopy.comparison} />
          <CandidatePoolGrid cards={report.candidatePoolCards} />
        </motion.section>
      )}

      <motion.section variants={variants} id="核心对比" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader title="核心对比" desc={report.sectionCopy.comparison} />
        <ComparisonTable rows={report.comparisonRows} leftLabel={report.labels.left} rightLabel={report.labels.right} />
      </motion.section>

      <motion.section variants={variants} id="类目环境" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
        <SectionHeader title="类目环境" desc={report.sectionCopy.category} />
        <div className="mb-6">
          <CardGrid cards={report.categoryCards} />
        </div>
        <ComparisonTable rows={report.categoryRows} leftLabel={report.labels.left} rightLabel={report.labels.right} />
      </motion.section>

      <motion.section variants={variants} id="流量与关键词" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
        <SectionHeader title="流量与关键词" desc={report.sectionCopy.traffic} />
        <TrafficSection report={report} />
      </motion.section>

      <motion.section variants={variants} id="评价洞察" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
        <SectionHeader title="评价洞察" desc={report.sectionCopy.reviews} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {report.reviewBlocks.map((block) => (
            <ReviewBlockView key={block.title} block={block} />
          ))}
        </div>
      </motion.section>

      <motion.section variants={variants} id="执行建议" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
        <SectionHeader title="执行建议" desc={report.sectionCopy.actions} />
        <ActionGrid cards={report.actionCards} />
      </motion.section>

      <motion.section variants={variants} id="执行路径" className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
        <SectionHeader title="执行路径" desc={report.sectionCopy.roadmap} />
        <RoadmapGrid steps={report.roadmapSteps} />
      </motion.section>

      <div className="h-10" />
    </motion.main>
  );
}

function FindReportLayout({
  session,
  report,
  activeSectionId,
}: {
  session: AnalysisSession;
  report: CompetitiveReport;
  activeSectionId: string;
}) {
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
          <FindStepRail activeSectionId={activeSectionId} />
        </motion.aside>

        <div className="space-y-6">
          <motion.section variants={variants} id="step-1" className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
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

                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
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

          <motion.section variants={variants} id="step-2" className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
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

          <motion.section variants={variants} id="step-3" className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
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

          <motion.section variants={variants} id="step-4" className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
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

function SourceReportLayout({
  session,
  report,
  activeSectionId,
}: {
  session: AnalysisSession;
  report: CompetitiveReport;
  activeSectionId: string;
}) {
  const sourceReport = report.sourceReport;
  const sourceSeed = report.products[0];
  const benchmarkProduct = report.products[1];

  if (!sourceReport) {
    return (
      <motion.main
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.08 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
      >
        <motion.section variants={variants} className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">{report.title}</h1>
          <p className="text-slate-600 leading-relaxed">{report.summary}</p>
        </motion.section>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
    >
      <motion.section
        variants={variants}
        id="source-verdict"
        className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-6 lg:px-8 lg:py-7 grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] gap-8">
          <div>
            <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">
              {report.meta.date} &middot; {report.meta.marketplace} &middot; {report.meta.source}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">{report.title}</h1>
            <p className="text-base text-slate-600 leading-relaxed mb-5 max-w-2xl">{report.summary}</p>

            <div className="flex flex-wrap gap-2">
              {session.site !== 'AUTO' && (
                <Pill>站点：<strong className="text-slate-900">{getSiteLabel(session.site)}</strong></Pill>
              )}
              {session.asins.map((asin) => (
                <Pill key={asin}>Input：<strong className="text-slate-900">{asin}</strong></Pill>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sourceReport.buyerContext.summaryLines.map((line) => (
                <div key={line} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {report.heroCards.map((card) => (
                <SourceMetricCard key={`${card.label}-${card.value}`} card={card} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 lg:px-8">
          <SourceBoundaryStrip
            verified={sourceReport.factBoundary.verifiedFacts[0] || '当前结论基于真实 MCP 字段。'}
            inference={sourceReport.factBoundary.inferences[0] || 'Shortlist 排序属于规则推断。'}
          />
        </div>

        <div className="px-6 pb-6 lg:px-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SourceSideProductCard title="Amazon 种子款" product={sourceSeed} />
            <SourceSideProductCard title="Amazon 基准盘" product={benchmarkProduct} />
          </div>
          <SourceJudgmentRulePanel items={sourceReport.buyerContext.judgmentRule} />
        </div>
      </motion.section>

      <motion.div variants={variants} className="sticky top-[4.5rem] z-30">
        <ModeSectionNav items={SOURCE_STEP_ITEMS} activeSectionId={activeSectionId} compact />
      </motion.div>

      <motion.section
        variants={variants}
        id="source-buyer-context"
        className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <StepSectionHeader
          step="Step 02"
          title="买家目标与判断边界"
          desc="先把买家自己准备的数据、页面可观察数据、以及必须靠商家回复验证的数据拆开。"
        />
        <div className="p-6 space-y-6">
          <SourceBoundaryStrip
            verified="买家目标定义了推进边界，但不自动等于平台已验证事实。"
            inference="页面初筛和商家承接验证属于不同层级，不能混在一起下结论。"
          />
          <SourceBuyerContextGrid items={sourceReport.buyerContext.summaryLines} />
          <SourceDataBucketTable buckets={sourceReport.dataBuckets} />
        </div>
      </motion.section>

      <motion.section
        variants={variants}
        id="source-screening"
        className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <StepSectionHeader
          step="Step 03"
          title="页面初筛与商家分层"
          desc="这一步只回答像不像。先收紧候选池、证据和 shortlist，不直接输出承接能力结论。"
        />
        <div className="p-6 space-y-6">
          <SourceBoundaryStrip
            verified="候选表里的标题、价格、卖家和部分 MOQ / SKU / 属性字段来自真实 MCP 返回。"
            inference="主推 / 副推 / 观察备选是页面规则分层，不等于商家已被验证能承接。"
          />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_360px] gap-6 items-start">
            <div className="space-y-6">
              <SourceCandidateTable items={sourceReport.candidateRows} />
              <SourceVisualEvidenceGrid items={sourceReport.visualEvidence} />
            </div>
            <div className="space-y-6 xl:sticky xl:top-32">
              <SourceTrackPanel tracks={sourceReport.verdict.recommendedTracks} highlights={sourceReport.verdict.highlights} />
              <SourceFactBoundaryPanel boundary={sourceReport} />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6">
            <SourceShortlistGrid items={sourceReport.shortlist} />
            <SourceSpecEvidencePanel items={sourceReport.candidateRows.slice(0, 4)} />
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={variants}
        id="source-inquiry"
        className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <StepSectionHeader
          step="Step 04"
          title="询盘模板与回复判断"
          desc="把标准询盘模板、强弱回复标准、关键词和评分入口前置，避免泛泛问价。"
        />
        <div className="p-6 space-y-6">
          <SourceBoundaryStrip
            verified="询盘模板直接基于买家目标、Amazon 锚点和 shortlist 组装。"
            inference="强 / 中 / 弱回复和评分表是执行规则，不是平台原生能力。"
          />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-6">
            <SourceInquiryTemplatePanel template={sourceReport.inquiryKit.template} />
            <SourceKeywordSignalPanel signals={sourceReport.inquiryKit.keywordSignals} />
          </div>
          <SourceInquiryQuestionTable items={sourceReport.inquiryKit.questions} />
          <SourceInquiryScorePanel items={sourceReport.inquiryKit.scoreItems} />
        </div>
      </motion.section>

      <motion.section
        variants={variants}
        id="source-sampling"
        className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <StepSectionHeader
          step="Step 05"
          title="样品验证与小单验证"
          desc="样品阶段验证真实版本，小单阶段验证履约能力，最后再决定是否放大。"
        />
        <div className="p-6 space-y-6">
          <SourceBoundaryStrip
            verified="风险项一部分来自 Amazon 评论，一部分来自 1688 详情与标题信号。"
            inference="kill criteria 是执行守门规则，不是平台原生判定。"
          />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <SourceChecklistPanel title="风险清单" items={sourceReport.riskChecklist} tone="danger" />
            <SourceChecklistPanel title="样品计划" items={sourceReport.samplePlan} tone="neutral" />
            <SourceKillCriteriaPanel items={sourceReport.killCriteria} />
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={variants}
        id="source-execution"
        className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden"
      >
        <StepSectionHeader
          step="Step 06"
          title="压缩后的买家版执行顺序"
          desc="最后把整套寻源动作收成买家能直接执行的 6 步，不在页面里继续散开。"
        />
        <div className="p-6 space-y-6">
          <SourceBoundaryStrip
            verified="执行顺序已经吸收买家目标、页面初筛、询盘、样品和小单验证。"
            inference="真正要不要锁主供，仍取决于样品和小单结果，不在本轮自动判断。"
          />
          <SourceExecutionStepGrid items={sourceReport.executionSteps} />
        </div>
      </motion.section>
    </motion.main>
  );
}

function SourceBuyerContextGrid({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {items.map((item, index) => (
        <div key={`${index}-${item}`} className="rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400 mb-3">Buyer Brief {String(index + 1).padStart(2, '0')}</div>
          <div className="text-sm text-slate-700 leading-relaxed">{item}</div>
        </div>
      ))}
    </div>
  );
}

function SourceJudgmentRulePanel({ items }: { items: string[] }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400 mb-4">判断层级</div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {index + 1}
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceDataBucketTable({ buckets }: { buckets: SourceReportPayload['dataBuckets'] }) {
  const rows = [
    {
      phase: 'Step 01 定目标',
      buyer: buckets.buyerPrepared.slice(0, 3),
      page: buckets.pageObservable.slice(0, 2),
      seller: buckets.sellerVerified.slice(0, 2),
    },
    {
      phase: 'Step 02-03 初筛分层',
      buyer: buckets.buyerPrepared.slice(2, 5),
      page: buckets.pageObservable,
      seller: buckets.sellerVerified.slice(0, 3),
    },
    {
      phase: 'Step 04-06 承接验证',
      buyer: buckets.buyerPrepared.slice(1, 5),
      page: buckets.pageObservable.slice(2),
      seller: buckets.sellerVerified,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500">
            <th className="px-4 py-4 font-semibold">阶段</th>
            <th className="px-4 py-4 font-semibold">买家自己准备的数据</th>
            <th className="px-4 py-4 font-semibold">1688 页面可观察数据</th>
            <th className="px-4 py-4 font-semibold">必须靠商家回复验证</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.phase} className="align-top border-t border-slate-200">
              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{row.phase}</td>
              <td className="px-4 py-4"><SourceMiniList items={row.buyer} /></td>
              <td className="px-4 py-4"><SourceMiniList items={row.page} /></td>
              <td className="px-4 py-4"><SourceMiniList items={row.seller} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceMiniList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 leading-relaxed">
          {item}
        </div>
      ))}
    </div>
  );
}

function SourceInquiryTemplatePanel({ template }: { template: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">标准询盘模板</div>
          <div className="mt-1 text-sm text-slate-500">本轮先做轻量可复制版本，直接发给商家即可。</div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          {copied ? <ClipboardCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? '已复制' : '复制模板'}
        </button>
      </div>
      <div className="p-5">
        <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 leading-7 font-sans">
          {template}
        </pre>
      </div>
    </div>
  );
}

function SourceKeywordSignalPanel({ signals }: { signals: SourceReportPayload['inquiryKit']['keywordSignals'] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-lg font-semibold text-slate-900">强回复关键词</div>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {signals.strong.map((item) => (
            <span key={item} className="px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-700">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-lg font-semibold text-slate-900">风险关键词</div>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {signals.risk.map((item) => (
            <span key={item} className="px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-sm font-medium text-rose-700">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceInquiryQuestionTable({ items }: { items: SourceReportPayload['inquiryKit']['questions'] }) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500">
            <th className="px-4 py-4 font-semibold">问题</th>
            <th className="px-4 py-4 font-semibold">强回复</th>
            <th className="px-4 py-4 font-semibold">中回复</th>
            <th className="px-4 py-4 font-semibold">弱回复 / 放弃信号</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.label} className="align-top border-t border-slate-200">
              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{item.label}</td>
              <td className="px-4 py-4 text-sm text-emerald-900 leading-relaxed bg-emerald-50/40">{item.strongSignal}</td>
              <td className="px-4 py-4 text-sm text-blue-900 leading-relaxed bg-blue-50/30">{item.mediumSignal}</td>
              <td className="px-4 py-4 text-sm text-rose-900 leading-relaxed bg-rose-50/30">{item.weakSignal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceInquiryScorePanel({ items }: { items: SourceReportPayload['inquiryKit']['scoreItems'] }) {
  const [answers, setAnswers] = useState<Record<string, 'strong' | 'medium' | 'weak' | ''>>({});
  const total = items.reduce((sum, item) => {
    const answer = answers[item.label];
    if (answer === 'strong') return sum + item.strong;
    if (answer === 'medium') return sum + item.medium;
    if (answer === 'weak') return sum + item.weak;
    return sum;
  }, 0);
  const answered = items.filter((item) => answers[item.label]).length;
  const maxScore = items.reduce((sum, item) => sum + item.strong, 0);
  const status =
    answered < items.length
      ? '待补回复'
      : total >= 80
        ? '可优先推进'
        : total >= 60
          ? '继续追问后再决定'
          : '谨慎，必要时放弃';

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">商家回复评分表</div>
          <div className="mt-1 text-sm text-slate-500">本地打分即可，不做持久化。全部填完后再看状态。</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            {total} / {maxScore}
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {status}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <div className="mt-1 text-xs text-slate-500">
                  强回复 {item.strong} 分 / 中回复 {item.medium} 分 / 弱回复 {item.weak} 分
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['strong', 'medium', 'weak'] as const).map((level) => {
                  const active = answers[item.label] === level;
                  const text = level === 'strong' ? '强回复' : level === 'medium' ? '中回复' : '弱回复';
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [item.label]: current[item.label] === level ? '' : level,
                        }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? level === 'strong'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : level === 'medium'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceExecutionStepGrid({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {items.map((item, index) => (
        <div key={`${index}-${item}`} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Step {String(index + 1).padStart(2, '0')}
          </div>
          <div className="text-sm text-slate-700 leading-relaxed">{item}</div>
        </div>
      ))}
    </div>
  );
}

function ReportHeroSection({ session, report }: { session: AnalysisSession; report: CompetitiveReport }) {
  return (
    <motion.section variants={variants} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-blue-50/90 via-cyan-50/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50/80 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <h4 className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
            {report.meta.date} <span>&middot;</span> {report.meta.marketplace} <span>&middot;</span> {report.meta.source}
          </h4>
          <h1 className="text-3xl font-semibold text-slate-900 mb-4">{report.title}</h1>
          <p className="text-[15px] text-slate-600 leading-8 mb-5 max-w-4xl">{report.summary}</p>

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

        <div className="w-full lg:w-80 shrink-0 rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">本页怎么读</div>
          <div className="space-y-3">
            {report.heroCards.map((card) => (
              <div key={`${card.label}-${card.value}`} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5">
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

function ModeSectionNav({
  items,
  activeSectionId,
  compact = false,
}: {
  items: Array<{ id: string; label: string; title: string; desc?: string }>;
  activeSectionId: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/95 backdrop-blur px-3 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.4)]">
      <div className={`grid gap-2 ${compact ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'}`}>
        {items.map((item) => {
          const isActive = activeSectionId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`rounded-2xl border px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'border-blue-200 bg-blue-50 text-blue-950 shadow-[0_16px_30px_-24px_rgba(37,99,235,0.5)]'
                  : 'border-transparent bg-slate-50/80 text-slate-600 hover:border-slate-200 hover:bg-white'
              }`}
            >
              <div className={`text-[11px] font-bold tracking-[0.18em] uppercase mb-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.label}
              </div>
              <div className="text-sm font-semibold">{item.title}</div>
              {item.desc && <div className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</div>}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function FindStepRail({ activeSectionId }: { activeSectionId: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.4)]">
      <div className="space-y-0">
        {FIND_STEP_ITEMS.map((item, index) => {
          const isActive = activeSectionId === item.id;
          const isLast = index === FIND_STEP_ITEMS.length - 1;
          return (
            <a key={item.id} href={`#${item.id}`} className="relative flex gap-3 pb-8 last:pb-0 group">
              <div className="relative flex flex-col items-center">
                {isActive ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Circle className="w-5 h-5 text-slate-300" />}
                {!isLast && <div className={`absolute top-6 w-px h-[calc(100%-0.25rem)] ${isActive ? 'bg-blue-200' : 'bg-slate-200'}`} />}
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
    <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50/40">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 mb-3">
        <CheckCircle2 className="w-4 h-4" />
        {step}
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">{desc}</p>
    </div>
  );
}

function SourceConclusionCard({ card }: { card?: ReportHeroCard }) {
  if (!card) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-5 flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">{card.label}</div>
        <div className="text-3xl font-semibold text-emerald-700 mb-2">{card.value}</div>
        <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
      </div>
    </div>
  );
}

function SourceMetricCard({ card }: { card?: ReportHeroCard }) {
  if (!card) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{card.label}</div>
      <div className="text-3xl font-semibold text-slate-900 mb-2">{card.value}</div>
      <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
    </div>
  );
}

function SourceSideProductCard({ title, product }: { title: string; product?: ReportProduct }) {
  if (!product) {
    return null;
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-xl font-semibold text-slate-900">{title}</div>
      </div>
      <div className="p-5">
        <CompactProductCard product={product} />
      </div>
    </div>
  );
}

function SourceSupplySnapshot({ rows }: { rows: ReportComparisonRow[] }) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-xl font-semibold text-slate-900">1688 供给盘</div>
      </div>
      <div className="p-5 space-y-4">
        {rows.slice(0, 3).map((row) => (
          <div key={row.title} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="text-sm font-semibold text-slate-900 mb-2">{row.title}</div>
            <div className="flex flex-wrap gap-2 mb-2 text-xs">
              <span className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700">{row.val1}</span>
              <span className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-700">{row.val2}</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{row.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceBoundaryStrip({ verified, inference }: { verified: string; inference: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
        <div className="text-xs font-bold tracking-wider uppercase text-emerald-700 mb-2">已验证事实</div>
        <div className="text-sm text-emerald-950 leading-relaxed">{verified}</div>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3">
        <div className="text-xs font-bold tracking-wider uppercase text-blue-700 mb-2">推断判断</div>
        <div className="text-sm text-blue-950 leading-relaxed">{inference}</div>
      </div>
    </div>
  );
}

function SourceProviderTraceGrid({ items }: { items: SourceReportPayload['providerTrace'] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {items.map((item) => {
        const statusClass =
          item.status === 'ok'
            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
            : item.status === 'partial'
              ? 'border-amber-200 bg-amber-50/70 text-amber-700'
              : 'border-rose-200 bg-rose-50/70 text-rose-700';
        return (
          <div key={item.provider} className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-lg font-semibold text-slate-900">{item.provider}</div>
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusClass}`}>{item.status}</div>
            </div>
            <div className="mb-4">
              <div className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">使用工具</div>
              <div className="flex flex-wrap gap-2">
                {item.tools.length > 0 ? item.tools.map((tool) => <Pill key={tool}>{tool}</Pill>) : <Pill>本轮未调用</Pill>}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">本轮核实字段</div>
              <div className="flex flex-wrap gap-2">
                {item.verifiedFields.length > 0 ? item.verifiedFields.map((field) => <Pill key={field}>{field}</Pill>) : <Pill>字段不足</Pill>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SourceSearchPathGrid({ items }: { items: SourceReportPayload['searchPath'] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
      {items.map((item, index) => {
        const precisionClass =
          item.precision === 'high'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : item.precision === 'medium'
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-amber-200 bg-amber-50 text-amber-700';
        return (
          <div key={`${item.source}-${item.term}-${index}`} className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400">Term {String(index + 1).padStart(2, '0')}</div>
              <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${precisionClass}`}>{item.precision}</div>
            </div>
            <div className="text-lg font-semibold text-slate-900 mb-2 break-all">{item.term}</div>
            <div className="text-sm text-slate-500 mb-3">{item.source}</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 leading-relaxed">{item.notes}</div>
          </div>
        );
      })}
    </div>
  );
}

function SourceCandidateTable({ items }: { items: SourceReportPayload['candidateRows'] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500 leading-relaxed">
        当前还没有拉出稳定候选池。先继续收紧搜索词和目标款定义，不要直接放大询盘面。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500">
            <th className="px-4 py-4 font-semibold">匹配度</th>
            <th className="px-4 py-4 font-semibold">候选 / 卖家</th>
            <th className="px-4 py-4 font-semibold">规格 / MOQ / 价格</th>
            <th className="px-4 py-4 font-semibold">为什么推荐</th>
            <th className="px-4 py-4 font-semibold">风险 / 轨道</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.offerId}-${item.seller}`} className="align-top border-t border-slate-200">
              <td className="px-4 py-4">
                <div className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold min-w-12 h-12 px-3">
                  {item.fitScore}
                </div>
              </td>
              <td className="px-4 py-4 min-w-[260px]">
                <div className="text-base font-semibold text-slate-900 mb-2">{item.seller}</div>
                <div className="text-sm text-slate-600 leading-relaxed mb-2">{item.offerId}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{item.matchedTerms.join(' / ') || '命中词不足'}</div>
              </td>
              <td className="px-4 py-4 min-w-[260px]">
                <div className="text-sm font-medium text-slate-900 mb-2">{item.specSummary}</div>
                <div className="text-sm text-slate-600 mb-1">MOQ：{item.moq}</div>
                <div className="text-sm text-slate-600">{item.priceSummary}</div>
              </td>
              <td className="px-4 py-4 min-w-[280px]">
                <div className="text-sm text-slate-700 leading-relaxed">{item.whyMatch}</div>
              </td>
              <td className="px-4 py-4 min-w-[240px]">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">{item.track}</span>
                </div>
                <div className="space-y-2">
                  {item.riskFlags.length > 0 ? (
                    item.riskFlags.map((risk) => (
                      <div key={risk} className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 leading-relaxed">
                        {risk}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 leading-relaxed">
                      当前没有看到明显致命风险
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceVisualEvidenceGrid({ items }: { items: SourceReportPayload['visualEvidence'] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
        当前没有拿到可展示的图像证据。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {items.map((item) => (
        <div key={`${item.offerId}-${item.image}`} className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
          <div className="aspect-[1.08/1] bg-slate-50 flex items-center justify-center overflow-hidden">
            <img src={item.image} alt={item.offerId} className="h-full w-full object-cover" />
          </div>
          <div className="p-4">
            <div className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">{item.offerId}</div>
            <div className="text-sm text-slate-700 leading-relaxed">{item.caption}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceSpecEvidencePanel({ items }: { items: SourceReportPayload['candidateRows'] }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-lg font-semibold text-slate-900">规格证据</div>
      </div>
      <div className="p-5 space-y-4">
        {items.map((item) => (
          <div key={`${item.offerId}-spec`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-sm font-semibold text-slate-900">{item.seller}</div>
              <div className="text-xs font-semibold text-slate-400">{item.offerId}</div>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed mb-2">{item.specSummary}</div>
            <div className="text-xs text-slate-500">{item.priceSummary} · MOQ {item.moq}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceFactBoundaryPanel({ boundary }: { boundary: SourceReportPayload }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-lg font-semibold text-slate-900">证据边界</div>
      </div>
      <div className="p-5 space-y-5">
        <SourceBulletPanel title="已验证事实" items={boundary.factBoundary.verifiedFacts} tone="safe" />
        <SourceBulletPanel title="推断判断" items={boundary.factBoundary.inferences} tone="info" />
        <SourceBulletPanel title="本轮不承诺" items={boundary.factBoundary.notPromised} tone="warn" />
      </div>
    </div>
  );
}

function SourceShortlistGrid({ items }: { items: SourceReportPayload['shortlist'] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500 leading-relaxed">
        当前 shortlist 还不够稳定。这一轮先别急着批量问价，先补详情字段和更干净的搜索路径。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {items.map((item, index) => (
        <div key={`${item.offerId}-${item.seller}`} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">{index + 1}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortlist</div>
            </div>
            <div className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700">{item.decisionLabel}</div>
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-1">{item.seller}</div>
          <div className="text-sm text-slate-500 mb-4">{item.offerId}</div>
          <div className="space-y-3 mb-4">
            {item.reasonLines.map((line) => (
              <div key={line} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
          <div className="text-sm font-semibold text-slate-900 mb-3">下一步核实</div>
          <div className="space-y-2">
            {item.nextChecks.map((check) => (
              <div key={check} className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{check}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceTrackPanel({
  tracks,
  highlights,
}: {
  tracks: SourceReportPayload['verdict']['recommendedTracks'];
  highlights: SourceReportPayload['verdict']['highlights'];
}) {
  return (
    <div className="space-y-6 xl:sticky xl:top-32">
      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-lg font-semibold text-slate-900">双轨建议</div>
        </div>
        <div className="p-5 space-y-3">
          {tracks.map((track) => (
            <div key={track} className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-950 leading-relaxed">
              {track}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-lg font-semibold text-slate-900">关键提醒</div>
        </div>
        <div className="p-5 space-y-3">
          {highlights.map((line) => (
            <div key={line} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceBulletPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'safe' | 'info' | 'warn';
}) {
  const palette =
    tone === 'safe'
      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
      : tone === 'info'
        ? 'border-blue-200 bg-blue-50/70 text-blue-950'
        : 'border-amber-200 bg-amber-50/70 text-amber-950';

  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 mb-3">{title}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${palette}`}>
            {item}
          </div>
        ))}
      </div>
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

function SourceSupplierCard({ card, rank }: { card: ReportCandidateCard; rank: number }) {
  const isPrimary = rank === 1;
  const statusLabel = isPrimary ? '优先联系' : rank === 2 ? '备选观察' : '不建议泛联';
  const statusClass = isPrimary
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : rank === 2
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.45)] transition-transform duration-200 hover:-translate-y-1 flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">{rank}</div>
          <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusClass}`}>{statusLabel}</div>
        </div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.eyebrow}</div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 mb-3 leading-snug">{card.title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{card.summary}</p>

      <div className="space-y-3 mb-4">
        {card.points.map((point) => (
          <div key={point} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 leading-relaxed">
            {point}
          </div>
        ))}
      </div>

      {card.links && card.links.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          {card.links.map((link) => (
            <a
              key={`${card.title}-${link.label}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {card.caution && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="text-amber-700">注意：</strong> {card.caution}
        </div>
      )}
    </div>
  );
}

function SourceInsightPanel({
  title,
  lines,
  links,
  caution,
}: {
  title: string;
  lines: string[];
  links?: Array<{ label: string; url: string }>;
  caution?: string;
}) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-xl font-semibold text-slate-900">{title}</div>
      </div>
      <div className="p-5">
        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={line} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {links && links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={`${title}-${link.label}`}
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

        {caution && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong className="text-amber-700">提示：</strong> {caution}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceEvidenceStack({ title, rows }: { title: string; rows: ReportComparisonRow[] }) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="text-xl font-semibold text-slate-900">{title}</div>
      </div>
      <div className="p-5 space-y-4">
        {rows.map((row) => (
          <FindEvidenceRow key={row.title} row={row} />
        ))}
      </div>
    </div>
  );
}

function SourceReviewTranslateBlock({
  title,
  lines,
  tone,
}: {
  title: string;
  lines: string[];
  tone: 'danger' | 'safe';
}) {
  const isDanger = tone === 'danger';
  return (
    <div className={`rounded-2xl border p-5 ${isDanger ? 'border-rose-200 bg-rose-50/70' : 'border-emerald-200 bg-emerald-50/70'}`}>
      <div className={`text-sm font-semibold mb-4 ${isDanger ? 'text-rose-700' : 'text-emerald-700'}`}>{title}</div>
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line} className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-600 leading-relaxed">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceChecklistPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'danger' | 'neutral';
}) {
  const isDanger = tone === 'danger';
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className={`text-sm font-semibold mb-4 ${isDanger ? 'text-rose-700' : 'text-slate-700'}`}>{title}</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 leading-relaxed">
            {isDanger ? <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceKillCriteriaPanel({ items }: { items: string[] }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
      <div className="text-lg font-semibold text-rose-700 mb-4">Kill Criteria</div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-slate-700 leading-relaxed">
            <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindCandidateHighlight({ card }: { card: ReportCandidateCard }) {
  return (
    <div className="rounded-[24px] border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/50 p-5 shadow-[0_18px_38px_-30px_rgba(37,99,235,0.45)]">
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
    <div className={`rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${muted ? 'border-slate-200 bg-slate-50/70' : 'border-slate-200 bg-white'}`}>
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
    <div className={`rounded-[22px] border p-5 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.35)] ${accent || card.accent ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'}`}>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4">
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
          <div
            key={column.title}
            className={`bg-white rounded-[22px] p-6 border border-slate-200 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-0.5 ${
              column.accent ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
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

      <div className="bg-indigo-50 border border-indigo-100/50 rounded-[24px] p-6 text-indigo-900 font-medium leading-relaxed shadow-[0_16px_36px_-34px_rgba(79,70,229,0.55)]">
        <strong className="text-indigo-700">战术启示：</strong> {report.trafficInsight}
      </div>
    </>
  );
}

function ActionGrid({ cards }: { cards: ReportActionCard[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-white border-t-4 rounded-[22px] p-6 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.45)] border border-slate-200 transition-transform duration-200 hover:-translate-y-1 ${card.accentClass}`}
        >
          <div className="text-xs font-bold tracking-[0.18em] text-slate-400 uppercase mb-2">{card.priority}</div>
          <div className="text-lg font-semibold text-slate-900 mb-2">{card.title}</div>
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
        <div
          key={`${card.label}-${card.value}`}
          className="bg-white border border-slate-200 rounded-[22px] p-5 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.35)] relative group hover:bg-slate-50 transition-all duration-200 hover:-translate-y-0.5"
        >
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
        <div
          key={`${card.eyebrow}-${card.title}`}
          className="bg-white border border-slate-200 rounded-[22px] p-6 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-0.5"
        >
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

function buildSourceChecklistItems(blocks: Array<ReportReviewBlock | undefined>, field: 'negatives' | 'positives') {
  return [...new Set(blocks.flatMap((block) => block?.[field] || []))]
    .slice(0, 5)
    .map((item) => {
      if (field === 'negatives') {
        return `${item}：打样阶段必须先验证，不能等上架后再发现。`;
      }

      return `${item}：这是主流用户已经买单的部分，打样时不要丢。`;
    });
}

function buildSourceKillCriteriaItems(blocks: Array<ReportReviewBlock | undefined>) {
  const labels = [...new Set(blocks.flatMap((block) => block?.negatives || []))].slice(0, 5);

  if (!labels.length) {
    return ['如果样品无法稳定对齐核心配置、质量和安全要求，就不要继续推进。'];
  }

  return labels.map((label) => `${label}：如果样品阶段不能明显改善，这条供给就不建议继续。`);
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
