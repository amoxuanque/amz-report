import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AnalysisSession } from '../types/analysis';
import type { CompetitiveReport } from '../types/report';

interface ReportProps {
  onBack: () => void;
  session: AnalysisSession;
  report: CompetitiveReport;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Report({ onBack, session, report }: ReportProps) {
  const sessionTitle = session.asins.length > 0 ? session.asins.join(' vs ') : report.title;
  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回工作台
          </button>
          <div className="text-sm font-medium text-slate-800 truncate max-w-[200px] md:max-w-none flex items-center gap-2">
            <span className="text-slate-400">Report /</span> {sessionTitle}
          </div>
          <div className="w-[100px]" />
        </div>
      </div>

      <motion.main
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
      >
        <motion.section variants={variants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              {report.meta.date} <span>&middot;</span> {report.meta.marketplace} <span>&middot;</span> {report.meta.source}
            </h4>
            <h1 className="text-2xl font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-4">
              {report.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl mb-6">
              {report.summary}
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {session.asins.map((asin) => (
                <span key={asin} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Input: <strong className="text-slate-900">{asin}</strong>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {report.heroCards.map((card) => (
                <div key={card.label} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative group hover:bg-slate-50 transition-all">
                  <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">{card.label}</div>
                  <div className="text-2xl font-semibold text-slate-900 mb-3">{card.value}</div>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.nav variants={variants} className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          {report.navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="flex-none px-4 py-2 rounded text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
              {item.label}
            </a>
          ))}
        </motion.nav>

        <motion.section variants={variants} id="产品卡" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="产品卡" desc="先看两个 ASIN 的基础盘。同属 Hair Dryers 且功率 1875W，但一个是新锐爆款，一个是老牌基础款。" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {report.products.map((product) => (
              <div key={product.asin} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
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
                    <div key={`${product.asin}-${metric.label}`} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{metric.label}</div>
                      <div className="text-xl font-semibold text-slate-900 mb-1">{metric.value}</div>
                      <div className="text-xs text-slate-500 font-medium">{metric.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={variants} id="核心对比" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <SectionHeader title="核心数据对比" desc="重点不是谁参数更多，而是谁更能把“搜索、点击、转化、利润”串成闭环。" />

          <div className="overflow-x-auto -mx-8 md:mx-0 px-8 md:px-0">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">维度</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Wavytalk</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">REVLON</th>
                  <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">商业解读</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.comparisonRows.map((row) => (
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
        </motion.section>

        <motion.section variants={variants} id="流量与关键词" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="流量与核心判断" desc="两者赢法完全不同。REVLON 靠泛词自然流量盘，Wavytalk 靠“泛词可见 + 场景词更会转 + 广告更积极”。" />

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
        </motion.section>

        <motion.section variants={variants} id="执行建议" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="可执行建议" desc="如果要做新进入者，以下属于 P0 级别的产品优化重点。" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {report.actionCards.map((card) => (
              <div key={card.title} className={`bg-white border-t-4 rounded-xl p-6 shadow-sm border border-slate-200 ${card.accentClass}`}>
                <div className="text-lg font-semibold text-slate-900 mb-2">{card.priority}: {card.title}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="h-10" />
      </motion.main>
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
