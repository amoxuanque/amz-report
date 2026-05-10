import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface ReportProps {
  onBack: () => void;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Report({ onBack }: ReportProps) {
  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Header / Back Nav */}
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
            <span className="text-slate-400">Report /</span> Amazon US 家用吹风机双 ASIN 竞品分析
          </div>
          <div className="w-[100px]" /> {/* Spacer for centering */}
        </div>
      </div>

      <motion.main 
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
      >
        {/* Section: Hero */}
        <motion.section variants={variants} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              2026-05-08 <span>&middot;</span> Amazon US <span>&middot;</span> Sorftime MCP
            </h4>
            <h1 className="text-2xl font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-4">
              Wavytalk 更会卖，REVLON 更稳词权。
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl mb-6">
              这份报告对比 <strong>B09CP8SSGP / wavytalk</strong> 与 <strong>B07GZWQDPR / REVLON</strong> 两支 US 站主流家用吹风机。
              结论很清楚：<span className="text-blue-600 font-bold">wavytalk</span> 靠卷发场景、附件组合、年轻化表达与更积极的广告放大，跑出了更高销量和更强利润空间；
              <span className="text-blue-600 font-bold">REVLON</span> 则凭品牌信任、评论体量和泛词自然位，仍是搜索层面的基准盘。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoCard 
                label="Current Winner" 
                value="wavytalk" 
                desc={<>月销量 <strong>34,820</strong>，细分类目 <strong>#1</strong>，月销额约 <strong>$1.16M</strong>。赢在商品定义鲜明：卷发友好 + 三附件 + 高颜值。</>}
              />
              <InfoCard 
                label="Challenger Signal" 
                value="REVLON" 
                desc={<>在 <strong>hair dryer</strong> 等泛词上自然位更靠前，老牌权重、评论沉淀和用户信任在持续输送免费流量。</>}
              />
              <InfoCard 
                label="Next Move" 
                value="安全与附件" 
                desc={<>切入市场最优策略不是复制外观，而是拿走 wavytalk 的转化逻辑，避开其在 <span className="text-red-500 font-bold">安全耐久</span> 上的劣势。</>}
              />
            </div>
          </div>
        </motion.section>

        {/* In-page Nav (Optional, for visual completeness) */}
        <motion.nav variants={variants} className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
          {['产品卡', '核心对比', '流量与关键词', '评价与风险', '执行建议'].map((item, i) => (
            <a key={i} href={`#${item}`} className="flex-none px-4 py-2 rounded text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
              {item}
            </a>
          ))}
        </motion.nav>

        {/* Section: Products */}
        <motion.section variants={variants} id="产品卡" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="产品卡" desc="先看两个 ASIN 的基础盘。同属 Hair Dryers 且功率 1875W，但一个是新锐爆款，一个是老牌基础款。" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Prod 1 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="w-full sm:w-40 aspect-[1/1.08] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src="https://m.media-amazon.com/images/I/411uPMs12AL.jpg" alt="wavytalk" className="object-cover mix-blend-multiply h-full" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">ASIN &middot; B09CP8SSGP</div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Wavytalk Hair Dryer</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Pill>Brand: <strong className="text-slate-900">wavytalk</strong></Pill>
                    <Pill>Seller: <strong className="text-slate-900">wavytalk US</strong></Pill>
                    <Pill>Rank: <strong className="text-blue-600">#1</strong></Pill>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">定位高性价比家用款，明显比传统基础款更会做场景化表达。</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniCard label="Price" value="$33.21" sub="Coupon: $1.66" />
                <MiniCard label="Rating" value="4.4" sub="24,165 Reviews" />
                <MiniCard label="Monthly Rev" value="$1.15M" sub="34,820 Sales" />
                <MiniCard label="Margin Signal" value="79.81%" sub="FBA: $6.37" />
              </div>
            </div>

            {/* Prod 2 */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="w-full sm:w-40 aspect-[1/1.08] rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src="https://m.media-amazon.com/images/I/713f345lf0L.jpg" alt="revlon" className="object-cover mix-blend-multiply h-full p-2" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">ASIN &middot; B07GZWQDPR</div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">REVLON Infrared Ionic</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Pill>Brand: <strong className="text-slate-900">REVLON</strong></Pill>
                    <Pill>Seller: <strong className="text-slate-900">Amazon.com</strong></Pill>
                    <Pill>Rank: <strong className="text-slate-900">#4</strong></Pill>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">经典基础款设定，认知门槛低、品牌信任极高。</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniCard label="Price" value="$25.81" sub="No Coupon" />
                <MiniCard label="Rating" value="4.6" sub="49,498 Reviews" />
                <MiniCard label="Monthly Rev" value="$542K" sub="21,030 Sales" />
                <MiniCard label="Margin Signal" value="54.78%" sub="FBA: $7.74" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section: Comparison */}
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
                <TableRow 
                  title="价格与促销" val1="$33.21 + $1.66 券" val2="$25.81" 
                  desc="Wavytalk 靠完整卖点支撑高客单；coupon 负责降门槛。" />
                <TableRow 
                  title="星级与评论" val1="4.4 / 24,165" val2="4.6 / 49,498" 
                  desc="REVLON 护城河更厚；Wavytalk 量大但沉淀偏薄。" />
                <TableRow 
                  title="月销额" val1={<span className="text-green-600 font-bold">$1.156M</span>} val2="$0.543M" 
                  desc="Wavytalk 是目前更强的成交机器。" />
                <TableRow 
                  title="FBA / 毛利估算" val1={<span className="text-green-600 font-bold">$6.37 / 79.81%</span>} val2="$7.74 / 54.78%" 
                  desc="Wavytalk 给广告和投放留下巨大回旋空间。" />
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Section: Traffic */}
        <motion.section variants={variants} id="流量与关键词" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="流量与核心判断" desc="两者赢法完全不同。REVLON 靠泛词自然流量盘，Wavytalk 靠“泛词可见 + 场景词更会转 + 广告更积极”。" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">泛词自然位</h4>
              <div className="text-2xl font-semibold text-slate-900 mb-4">REVLON 更稳</div>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li><strong className="text-slate-900">hair dryer</strong>: REVLON [有机 #2], Wavytalk [#7]</li>
                <li><strong className="text-slate-900">ionic hair dryer</strong>: REVLON [有机 #1], Wavytalk [#9]</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">场景词与广告</h4>
              <div className="text-2xl font-semibold text-slate-900 mb-4">Wavytalk 更主动</div>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li><strong className="text-slate-900">diffuser hair dryer</strong>: Wavytalk [广告 #1]</li>
                <li><strong className="text-slate-900">blow dryer w/ diffuser</strong>: Wavytalk [广告 #1]</li>
              </ul>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100/50 rounded-2xl p-6 text-indigo-900 font-medium leading-relaxed">
            <strong className="text-indigo-700">战术启示：</strong> 最优策略不是二选一，而是把两者合并——<strong>用 REVLON 的搜索盘质量，去套用 Wavytalk 的场景化表达形式。</strong>
          </div>
        </motion.section>

        {/* Section: Action */}
        <motion.section variants={variants} id="执行建议" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="可执行建议" desc="如果要做新进入者，以下属于 P0 级别的产品优化重点。" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border-t-4 border-t-red-500 rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="text-lg font-semibold text-slate-900 mb-2">P0: 解决安全与扣位隐患</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Wavytalk 高频负评集中在：sparks, burning smell, 附件掉落。必须在插头、线缆、后盖发热丝做可靠性设计补齐，并将此项作为对外传播锚点。
              </p>
            </div>
            <div className="bg-white border-t-4 border-t-orange-400 rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="text-lg font-semibold text-slate-900 mb-2">P1: 用卷发场景切入</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                广告首攻 <strong>diffuser hair dryer</strong> 等属性词。主图/A+ 前置 Curly / Thick hair 的真实定型对比，用真实痛点对抗大类别的模糊泛词流量。
              </p>
            </div>
            <div className="bg-white border-t-4 border-t-blue-500 rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="text-lg font-semibold text-slate-900 mb-2">P2: 年轻化内容表达</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                颠覆传统黑灰色沉闷感。通过外观配色微创新、社交媒体质感的视频演示取代干瘪的参数朗读图片，提升单位曝光点击率 (CTR)。
              </p>
            </div>
          </div>
        </motion.section>

        {/* Spacer */}
        <div className="h-10" />
      </motion.main>
    </div>
  );
}

// ----- UI Components -----

function InfoCard({ label, value, desc }: { label: string, value: string, desc: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative group hover:bg-slate-50 transition-all">
      <div className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mb-3">{value}</div>
      <p className="text-[13px] text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}

function MiniCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-semibold text-slate-900 mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{sub}</div>
    </div>
  )
}

function SectionHeader({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">{desc}</p>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      {children}
    </span>
  )
}

function TableRow({ title, val1, val2, desc }: { title: string, val1: React.ReactNode, val2: string, desc: string }) {
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4 text-sm font-semibold text-slate-900 aligns-top">{title}</td>
      <td className="py-3 px-4 text-sm text-slate-700 aligns-top w-1/4">{val1}</td>
      <td className="py-3 px-4 text-sm text-slate-700 aligns-top w-1/4">{val2}</td>
      <td className="py-3 px-4 text-[13px] text-slate-500 aligns-top leading-relaxed">{desc}</td>
    </tr>
  )
}
