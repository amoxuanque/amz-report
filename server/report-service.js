import { callSorftimeTool } from './sorftime-client.js';

const SCENARIO_HINTS = [
  'diffuser',
  'curly',
  'curl',
  'travel',
  'women',
  'thick',
  'comb',
  'ionic',
  'quiet',
  'lightweight',
];

const REVIEW_THEMES = [
  { label: '干发速度', patterns: [/fast dry/i, /dry.*fast/i, /dries.*fast/i, /quick dry/i] },
  { label: '轻量手感', patterns: [/lightweight/i, /light weight/i, /light\b/i] },
  { label: '卷发/扩散罩场景', patterns: [/curly/i, /curl/i, /diffuser/i] },
  { label: '抗毛躁/顺滑度', patterns: [/frizz/i, /frizzy/i, /smooth/i, /shine/i] },
  { label: '附件与扣位体验', patterns: [/attachment/i, /nozzle/i, /comb/i, /diffuser/i] },
  { label: '噪音控制', patterns: [/quiet/i, /noise/i, /loud/i] },
  { label: '安全/过热风险', patterns: [/burn/i, /smell/i, /spark/i, /fire/i, /hazard/i, /overheat/i] },
  { label: '耐久与可靠性', patterns: [/broke/i, /broken/i, /stopped/i, /stop working/i, /durable/i, /last/i] },
];

function buildNavItems(mode) {
  const modeLabel = mode === 'compare' ? '模式判断' : mode === 'find' ? '锁定逻辑' : '寻源判断';
  return [
    { id: '产品卡', label: '产品卡' },
    { id: modeLabel, label: modeLabel },
    { id: '核心对比', label: '核心对比' },
    { id: '类目环境', label: '类目环境' },
    { id: '流量与关键词', label: '流量与关键词' },
    { id: '评价洞察', label: '评价洞察' },
    { id: '执行建议', label: '执行建议' },
    { id: '执行路径', label: '执行路径' },
  ];
}

function safeJsonParse(text, fallback = null) {
  if (!text) return fallback;
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return fallback;
  }
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).replace(/[^\d.-]/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function parsePercent(value) {
  const parsed = toNumber(value);
  return parsed === null ? null : parsed;
}

function extractNumberAfterColon(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const matched = String(value).match(/[:：]\s*([\d.]+%?)/);
  if (matched?.[1]) {
    return matched[1].includes('%')
      ? parsePercent(matched[1])
      : toNumber(matched[1]);
  }

  return toNumber(value);
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '未知';
  }

  return new Intl.NumberFormat('en-US').format(Number(value));
}

function formatCurrency(value, currency = '$') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '未知';
  }

  return `${currency}${Number(value).toFixed(2)}`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '未知';
  }

  return `${Number(value).toFixed(2)}%`;
}

function formatDate(dateString) {
  if (!dateString) {
    return '未知';
  }

  return dateString;
}

function readLabel(text, label) {
  const match = text.match(new RegExp(`${label}：([^\\r\\n]+)`));
  return match?.[1]?.trim() ?? null;
}

function parseEmbeddedJson(text, label) {
  const match = text.match(new RegExp(`${label}：(\\{.+?\\})(?:；|\\r|\\n|$)`));
  return safeJsonParse(match?.[1], {});
}

function parseProductDetail(text, asinHint) {
  const monthlySales = text.match(/月销量：(?:月销量：)?([\d.]+)/)?.[1];
  const monthlyRevenue = text.match(/月销额：(?:月销额：)?([\d.]+)/)?.[1];
  const mainCategory = text.match(/所属大类：(.+?)（排名:(\d+)）/);
  const subCategory = text.match(/所属细分类目：(.+?)（排名:(\d+)）/);

  return {
    asin: readLabel(text, '产品ASIN码') || asinHint,
    title: readLabel(text, '标题'),
    image: readLabel(text, '主图'),
    price: toNumber(readLabel(text, '价格')),
    coupon: toNumber(readLabel(text, '优惠券')) || 0,
    rating: toNumber(readLabel(text, '星级')),
    reviewCount: toNumber(readLabel(text, '评论数')),
    brand: readLabel(text, '品牌'),
    nodeId: readLabel(text, '所属nodeid'),
    seller: readLabel(text, '卖家名称'),
    sellerSource: readLabel(text, '卖家来源'),
    category: readLabel(text, '分类'),
    listedAt: readLabel(text, '上架时间'),
    daysLive: toNumber(readLabel(text, '已上架天数')),
    variations: toNumber(readLabel(text, '子体数')),
    fbaFee: toNumber(readLabel(text, 'FBA费用')),
    mainCategoryName: mainCategory?.[1] ?? null,
    mainCategoryRank: toNumber(mainCategory?.[2]),
    subCategoryName: subCategory?.[1] ?? null,
    subCategoryRank: toNumber(subCategory?.[2]),
    monthlySales: toNumber(monthlySales),
    monthlyRevenue: toNumber(monthlyRevenue),
    description: readLabel(text, '产品描述'),
    grossMargin: toNumber(readLabel(text, '毛利')),
    grossMarginRate: toNumber(readLabel(text, '毛利率')),
    packageSizeCm: readLabel(text, '外包装尺寸（cm）'),
    weightG: toNumber(readLabel(text, '重量（g）')),
    attributes: parseEmbeddedJson(text, '属性'),
    features: parseEmbeddedJson(text, '特征'),
  };
}

function parseTrend(text) {
  return text
    .split(',')
    .map((item) => item.trim())
    .map((item) => {
      const [label, rawValue] = item.split('=');
      const value = toNumber(rawValue);
      if (!label || value === null) {
        return null;
      }

      return { label, value };
    })
    .filter(Boolean);
}

function parseCategoryReport(text) {
  const payload = safeJsonParse(text, {});
  const stats = payload['类目统计报告'] || {};
  const topProducts = payload['Top100产品'] || [];

  return {
    topProducts,
    stats: {
      nodeId: stats.nodeid || null,
      name: stats['类目名称'] || null,
      top100Sales: toNumber(stats['top100产品月销量']),
      top100Revenue: toNumber(stats['top100产品月销额']),
      top3ProductShare: extractNumberAfterColon(stats['top3_product_sales_volume_share']),
      top3BrandShare: extractNumberAfterColon(stats['top3_brands_sales_volume_share']),
      top3SellerShare: extractNumberAfterColon(stats['top3_seller_sales_volume_share']),
      amazonOwnedShare: extractNumberAfterColon(stats['amazonOwned_sales_volume_share']),
      averagePrice: extractNumberAfterColon(stats['average_price']),
      medianPrice: extractNumberAfterColon(stats['median_price']),
      highReviewsShare: extractNumberAfterColon(stats['high_reviews_sales_volume_share']),
      lowReviewsShare: extractNumberAfterColon(stats['low_reviews_sales_volume_share']),
      firstBrand: stats['first_brand']?.replace('销量最大品牌:', '') || null,
    },
  };
}

function parsePosition(positionText) {
  if (!positionText) {
    return null;
  }

  const match = String(positionText).match(/第(\d+)页，第(\d+)\/\d+位/);
  if (!match) {
    return null;
  }

  return {
    page: Number(match[1]),
    slot: Number(match[2]),
  };
}

function parseTrafficTerms(text) {
  const items = safeJsonParse(text, []);
  return Array.isArray(items)
    ? items.map((item) => ({
        keyword: String(item['关键词'] || ''),
        volume: toNumber(item['月搜索量']),
        cpc: toNumber(item['推荐竞价']),
        cpcRange: item['推荐竞价范围'] || null,
        exposureType: item['曝光位置'] || null,
        organicPosition: item['最近自然曝光位置'] || null,
        adPosition: item['最近广告曝光位置'] || null,
        organicRank: parsePosition(item['最近自然曝光位置']),
        adRank: parsePosition(item['最近广告曝光位置']),
      }))
    : [];
}

function parseCompetitorKeywords(text) {
  const items = safeJsonParse(text, []);
  return Array.isArray(items)
    ? items.map((item) => ({
        keyword: String(item['关键词'] || ''),
        volume: toNumber(item['关键词月搜索量']),
        position: item['曝光位置'] || null,
        rank: parsePosition(item['曝光位置']),
      }))
    : [];
}

function parseReviewList(text) {
  const items = safeJsonParse(text, []);
  return Array.isArray(items)
    ? items.map((item) => ({
        date: item['评论日期'] || null,
        rating: toNumber(item['评星']),
        title: item['标题'] || '',
        body: item['评论'] || '',
      }))
    : [];
}

function parseKeywordDetail(text) {
  const item = safeJsonParse(text, {});
  return {
    keyword: item['关键词'] || null,
    monthlyVolume: toNumber(item['月搜索量']),
    cpc: toNumber(item['推荐cpc竞价']),
    peakMonth: item['词搜索量旺季'] || null,
    resultCount: toNumber(item['搜索结果竞品数量']),
  };
}

function parseKeywordExtends(text) {
  const items = safeJsonParse(text, []);
  return Array.isArray(items)
    ? items.map((item) => ({
        keyword: item['关键词'] || null,
        monthlyVolume: toNumber(item['月搜索量']),
        cpc: toNumber(item['cpc推荐竞价']),
        seasonality: item['季节性'] || null,
      }))
    : [];
}

function parseSourcingItems(text) {
  const items = safeJsonParse(text, []);
  return Array.isArray(items)
    ? items.map((item) => ({
        title: item['标题'] || '',
        image: item['主图'] || '',
        url: item['URL'] || '',
        price: toNumber(item['价格']),
        seller: item['卖家'] || '',
      }))
    : [];
}

function sanitizeSourcingItems(items, searchName) {
  const preferredTokens = tokenize(searchName);
  const hardNoisePatterns = [
    /定子|转子|铁芯|配件|电机/i,
    /香薰|精油|熏香|diffuser香/i,
    /认证|检测|维修|服务/i,
  ];

  return items
    .map((item) => {
      const title = item.title || '';
      const overlap = tokenize(title).filter((token) => preferredTokens.includes(token)).length;
      const isNoise = hardNoisePatterns.some((pattern) => pattern.test(title));

      return {
        ...item,
        relevanceScore: overlap - (isNoise ? 5 : 0),
      };
    })
    .filter((item) => item.relevanceScore >= 0)
    .sort((left, right) => right.relevanceScore - left.relevanceScore);
}

function normalizeKeyword(keyword) {
  return String(keyword || '').trim().toLowerCase();
}

function tokenize(text) {
  return normalizeKeyword(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isBrandKeyword(keyword, brands) {
  const normalized = normalizeKeyword(keyword);
  return brands.some((brand) => {
    const brandTokens = tokenize(brand);
    return brandTokens.length > 0 && brandTokens.every((token) => normalized.includes(token));
  });
}

function isScenarioKeyword(keyword) {
  const normalized = normalizeKeyword(keyword);
  return SCENARIO_HINTS.some((hint) => normalized.includes(hint));
}

function chooseKeywordSets(datasets) {
  const brands = datasets.map((dataset) => dataset.detail.brand || '');
  const genericPool = [];
  const scenarioPool = [];

  datasets.forEach((dataset) => {
    dataset.competitorKeywords.forEach((item) => {
      if (!item.keyword || !item.rank || item.rank.page > 2 || isBrandKeyword(item.keyword, brands)) {
        return;
      }

      const targetPool = isScenarioKeyword(item.keyword) ? scenarioPool : genericPool;
      targetPool.push(item);
    });

    dataset.trafficTerms.forEach((item) => {
      if (!item.keyword || !item.volume || isBrandKeyword(item.keyword, brands)) {
        return;
      }

      if (isScenarioKeyword(item.keyword)) {
        scenarioPool.push({
          keyword: item.keyword,
          volume: item.volume,
          rank: item.organicRank,
          position: item.organicPosition,
        });
      }
    });
  });

  const dedupe = (items) => {
    const seen = new Set();
    return items
      .sort((left, right) => (right.volume || 0) - (left.volume || 0))
      .filter((item) => {
        const key = normalizeKeyword(item.keyword);
        if (!key || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  };

  return {
    generic: dedupe(genericPool).slice(0, 3),
    scenario: dedupe(scenarioPool).slice(0, 3),
  };
}

function collectKeywordSeeds(keywordSets) {
  return [...keywordSets.generic, ...keywordSets.scenario]
    .map((item) => item.keyword)
    .filter(Boolean)
    .slice(0, 3);
}

async function fetchKeywordIntel(site, keywordSeeds) {
  const uniqueKeywords = [...new Set(keywordSeeds)].slice(0, 3);
  const details = await Promise.all(
    uniqueKeywords.map(async (keyword) => {
      const [detailTool, extendTool] = await Promise.all([
        callSorftimeTool('keyword_detail', {
          keyword,
          keywordSupportSite: site,
        }),
        callSorftimeTool('keyword_extends', {
          keyword,
          keywordSupportSite: site,
          page: 1,
        }),
      ]);

      return {
        keyword,
        detail: parseKeywordDetail(detailTool.text),
        extends: parseKeywordExtends(extendTool.text),
      };
    }),
  );

  return details;
}

async function fetchProductDataset(asin, site) {
  const [detailTool, positiveReviewsTool, negativeReviewsTool, trendTool, trafficTool, competitorKeywordsTool] =
    await Promise.all([
      callSorftimeTool('product_detail', { asin, amzSite: site }),
      callSorftimeTool('product_reviews', { asin, amzSite: site, reviewType: 'Positive' }),
      callSorftimeTool('product_reviews', { asin, amzSite: site, reviewType: 'Negative' }),
      callSorftimeTool('product_trend', { asin, amzSite: site, productTrendType: 'SalesVolume' }),
      callSorftimeTool('product_traffic_terms', { asin, amzSite: site, page: 1 }),
      callSorftimeTool('competitor_product_keywords', { asin, keywordSupportSite: site, page: 1 }),
    ]);

  return {
    detail: parseProductDetail(detailTool.text, asin),
    positiveReviews: parseReviewList(positiveReviewsTool.text),
    negativeReviews: parseReviewList(negativeReviewsTool.text),
    trend: parseTrend(trendTool.text),
    trafficTerms: parseTrafficTerms(trafficTool.text),
    competitorKeywords: parseCompetitorKeywords(competitorKeywordsTool.text),
  };
}

function summarizeReviewThemes(reviews) {
  const joined = reviews
    .slice(0, 40)
    .map((review) => `${review.title} ${review.body}`)
    .join('\n');

  const hits = REVIEW_THEMES.map((theme) => {
    const count = theme.patterns.reduce((sum, pattern) => sum + (joined.match(pattern)?.length || 0), 0);
    const sample = reviews.find((review) =>
      theme.patterns.some((pattern) => pattern.test(`${review.title} ${review.body}`)),
    );

    return {
      label: theme.label,
      count,
      sampleTitle: sample?.title || '',
    };
  })
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count);

  return hits.slice(0, 3);
}

function buildProductDescription(detail, positiveThemes) {
  const cleanPositiveThemes = positiveThemes.filter((theme) => theme.label !== '安全/过热风险');
  const featureHighlights = Object.entries(detail.features || {})
    .slice(0, 2)
    .map(([label, score]) => `${label} ${score}`)
    .join(' / ');

  if (cleanPositiveThemes.length > 0) {
    return `当前买点集中在 ${cleanPositiveThemes.map((theme) => theme.label).join('、')}。${featureHighlights ? `用户感知强项：${featureHighlights}。` : ''}`;
  }

  return `${detail.category || detail.subCategoryName || '该产品'}当前已拿到稳定市场反馈，可继续从价格、内容和差评点拆解。`;
}

function formatRank(detail) {
  if (detail.subCategoryRank !== null && detail.subCategoryRank !== undefined) {
    return `#${detail.subCategoryRank}`;
  }

  return '未知';
}

function buildProductCard(detail, positiveThemes) {
  return {
    asin: detail.asin,
    title: detail.title || detail.asin,
    brand: detail.brand || '未知',
    seller: detail.seller || '未知',
    rank: formatRank(detail),
    description: buildProductDescription(detail, positiveThemes),
    image: detail.image || '',
    metrics: [
      {
        label: 'Price',
        value: formatCurrency(detail.price),
        sub: detail.coupon ? `Coupon: ${formatCurrency(detail.coupon)}` : 'No Coupon',
      },
      {
        label: 'Rating',
        value: detail.rating ? detail.rating.toFixed(1) : '未知',
        sub: `${formatNumber(detail.reviewCount)} Reviews`,
      },
      {
        label: 'Monthly Rev',
        value: formatCurrency(detail.monthlyRevenue),
        sub: `${formatNumber(detail.monthlySales)} Sales`,
      },
      {
        label: 'Margin Signal',
        value: formatPercent(detail.grossMarginRate),
        sub: `FBA: ${formatCurrency(detail.fbaFee)}`,
      },
    ],
  };
}

function buildSectionCopy(mode, left, right, categoryStats, keywordSets, sourcing) {
  const leftLabel = left.detail.brand || left.detail.asin;
  const rightLabel = right.detail.brand || right.detail.asin;
  const scenarioKeyword = keywordSets.scenario[0]?.keyword;
  const categoryName = categoryStats?.name || left.detail.subCategoryName || left.detail.category || '当前类目';

  return {
    products: `${leftLabel} 和 ${rightLabel} 都在 ${categoryName} 里拿到了真实成交，但一个更像当前基准盘，另一个更像可拆解的打法样本。`,
    comparison:
      mode === 'compare'
        ? '这里不只看谁卖得多，而是拆成交、评论、排名、毛利和自然位，判断哪一侧的护城河更厚。'
        : mode === 'find'
          ? '先确认自动锁定的竞对为什么值得盯，再判断它到底是价格标杆、流量样本，还是内容样本。'
          : 'Amazon 基准盘和供给端要一起看，否则只看 1688 低价，很容易选到转化差、风险高的错误方向。',
    modeFocus:
      mode === 'compare'
        ? '这部分专门回答：当前谁定义了市场，另一侧还能从哪里切进去。'
        : mode === 'find'
          ? '这部分专门回答：为什么系统锁定了这支竞对，而不是只给你一个看起来相似的 ASIN。'
          : '这部分专门回答：当前 Amazon 需求盘和 1688 供给盘能不能对得上。',
    category: `${categoryName} 的进入难度不只由销量决定，还受价格带、头部集中度和评论门槛共同约束。`,
    traffic:
      mode === 'source' && sourcing
        ? '这里同时看 Amazon 的需求词和 1688 的供给样本，判断“有人搜”与“有人做”是不是同一件事。'
        : scenarioKeyword
          ? `重点不是泛词有多大，而是谁更能稳住免费流量，以及谁在 ${scenarioKeyword} 这类高意图词上更占优。`
          : '重点不是泛词有多大，而是谁更能稳住免费流量，以及谁的场景词结构更健康。',
    reviews: `${leftLabel} 和 ${rightLabel} 的评论主题会直接决定下一步应该修产品、修页面，还是修投放。`,
    actions:
      mode === 'source'
        ? '进入寻源阶段后，建议必须可落到打样、认证、筛厂和成本复核，不能停留在“有样本”这个层面。'
        : '建议必须能直接落到标题、主图、广告结构和产品修正，而不是停留在泛泛的“优化一下”。',
    roadmap:
      mode === 'find'
        ? '先把参考竞对盯准，再做拆解和跟踪，不要一上来就把它当成最终答案。'
        : mode === 'source'
          ? '先用 Amazon 验方向，再用 1688 验供给，最后才进入打样和成本核算。'
          : '把当前报告拆成 2 到 4 周内可执行的动作，才算真的把结论落地。',
  };
}

function compareByBetter(left, right, accessor, reverse = false) {
  const leftValue = accessor(left);
  const rightValue = accessor(right);
  if (leftValue === null || leftValue === undefined) return 'right';
  if (rightValue === null || rightValue === undefined) return 'left';
  if (leftValue === rightValue) return undefined;
  return reverse
    ? leftValue < rightValue ? 'left' : 'right'
    : leftValue > rightValue ? 'left' : 'right';
}

function buildComparisonRows(left, right, genericKeywordPair) {
  const couponAdjustedLeft = left.detail.price !== null ? left.detail.price - (left.detail.coupon || 0) : null;
  const couponAdjustedRight = right.detail.price !== null ? right.detail.price - (right.detail.coupon || 0) : null;

  return [
    {
      title: '价格与促销',
      val1: `${formatCurrency(left.detail.price)}${left.detail.coupon ? ` + ${formatCurrency(left.detail.coupon)} 券` : ''}`,
      val2: `${formatCurrency(right.detail.price)}${right.detail.coupon ? ` + ${formatCurrency(right.detail.coupon)} 券` : ''}`,
      desc: `券后价约 ${formatCurrency(couponAdjustedLeft)} vs ${formatCurrency(couponAdjustedRight)}，先看谁更能支撑客单而不是谁绝对更便宜。`,
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.price, true),
    },
    {
      title: '星级与评论',
      val1: `${left.detail.rating?.toFixed(1) || '未知'} / ${formatNumber(left.detail.reviewCount)}`,
      val2: `${right.detail.rating?.toFixed(1) || '未知'} / ${formatNumber(right.detail.reviewCount)}`,
      desc: '评分看即时满意度，评论量看护城河厚度，两者不能只看一个。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.reviewCount),
    },
    {
      title: '月销额 / 月销量',
      val1: `${formatCurrency(left.detail.monthlyRevenue)} / ${formatNumber(left.detail.monthlySales)}`,
      val2: `${formatCurrency(right.detail.monthlyRevenue)} / ${formatNumber(right.detail.monthlySales)}`,
      desc: '这是当前成交能力最直观的读数，决定谁是现阶段市场主导者。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.monthlyRevenue),
    },
    {
      title: '类目排名 / 上架天数',
      val1: `${formatRank(left.detail)} / ${formatNumber(left.detail.daysLive)} 天`,
      val2: `${formatRank(right.detail)} / ${formatNumber(right.detail.daysLive)} 天`,
      desc: '排名看当前位置，上架时长看沉淀速度和历史包袱。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.subCategoryRank, true),
    },
    {
      title: 'FBA / 毛利率',
      val1: `${formatCurrency(left.detail.fbaFee)} / ${formatPercent(left.detail.grossMarginRate)}`,
      val2: `${formatCurrency(right.detail.fbaFee)} / ${formatPercent(right.detail.grossMarginRate)}`,
      desc: '低 FBA 不一定赢，但更高毛利率意味着广告和促销空间更大。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.grossMarginRate),
    },
    {
      title: '核心泛词自然位',
      val1: genericKeywordPair?.leftLabel || '样本不足',
      val2: genericKeywordPair?.rightLabel || '样本不足',
      desc: genericKeywordPair
        ? `以 ${genericKeywordPair.keyword} 作为观察窗，谁的自然位更前，谁对免费流量更有控制力。`
        : '当前没有足够稳定的泛词样本可做自然位对比。',
      highlight: genericKeywordPair?.winner,
    },
  ];
}

function buildCategoryCards(categoryStats, left, right) {
  const medianPrice = categoryStats?.medianPrice;
  const averagePrice = categoryStats?.averagePrice;
  const topBrand = categoryStats?.firstBrand || right.detail.brand || left.detail.brand || '未知';

  return [
    {
      label: 'Top100 月销量',
      value: formatNumber(categoryStats?.top100Sales),
      desc: `${categoryStats?.name || '当前类目'} 当前容量足够大，但不是低门槛市场。`,
    },
    {
      label: '价格带',
      value: medianPrice !== null && medianPrice !== undefined ? `中位价 ${formatCurrency(medianPrice)}` : formatCurrency(averagePrice),
      desc:
        medianPrice !== null && medianPrice !== undefined && averagePrice !== null && averagePrice !== undefined
          ? `均价 ${formatCurrency(averagePrice)}，中位价更能代表主流成交带。`
          : '当前价格带样本有限，先用已有类目统计做判断。',
    },
    {
      label: '头部集中度',
      value: formatPercent(categoryStats?.top3ProductShare),
      desc: `Top3 产品销量占比 ${formatPercent(categoryStats?.top3ProductShare)}，说明头部是否已经吃掉大部分需求。`,
    },
    {
      label: '最大品牌',
      value: topBrand,
      desc: '头部品牌样本能帮助判断这个类目更偏品牌驱动还是结构驱动。',
    },
  ];
}

function buildCategoryRows(left, right, categoryStats) {
  const medianPrice = categoryStats?.medianPrice;
  const leftGap = medianPrice !== null && medianPrice !== undefined && left.detail.price !== null
    ? Math.abs(left.detail.price - medianPrice)
    : null;
  const rightGap = medianPrice !== null && medianPrice !== undefined && right.detail.price !== null
    ? Math.abs(right.detail.price - medianPrice)
    : null;

  return [
    {
      title: '价格相对主流带',
      val1: left.detail.price !== null && medianPrice ? `${formatCurrency(left.detail.price)} vs ${formatCurrency(medianPrice)}` : formatCurrency(left.detail.price),
      val2: right.detail.price !== null && medianPrice ? `${formatCurrency(right.detail.price)} vs ${formatCurrency(medianPrice)}` : formatCurrency(right.detail.price),
      desc: `相对类目中位价 ${medianPrice !== null && medianPrice !== undefined ? formatCurrency(medianPrice) : '未知'}，偏离主流带越远，就越依赖品牌、场景或内容去支撑转化。`,
      highlight:
        leftGap !== null && rightGap !== null
          ? compareByBetter({ detail: { gap: leftGap } }, { detail: { gap: rightGap } }, (dataset) => dataset.detail.gap, true)
          : undefined,
    },
    {
      title: '评论门槛',
      val1: `${formatNumber(left.detail.reviewCount)} / ${left.detail.rating?.toFixed(1) || '未知'}`,
      val2: `${formatNumber(right.detail.reviewCount)} / ${right.detail.rating?.toFixed(1) || '未知'}`,
      desc: `类目高评论销量占比 ${formatPercent(categoryStats?.highReviewsShare)}，评论量薄的一侧更容易在转化上吃亏。`,
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.reviewCount),
    },
    {
      title: '头部品牌 / 卖家集中',
      val1: left.detail.brand || '未知',
      val2: right.detail.brand || '未知',
      desc: `Top3 品牌销量占比 ${formatPercent(categoryStats?.top3BrandShare)}，Top3 卖家销量占比 ${formatPercent(categoryStats?.top3SellerShare)}。`,
    },
    {
      title: 'Amazon 自营占比',
      val1: left.detail.sellerSource || '未知',
      val2: right.detail.sellerSource || '未知',
      desc: `Amazon 自营销量占比 ${formatPercent(categoryStats?.amazonOwnedShare)}。如果自营占比高，普通卖家进入会更难。`,
    },
  ];
}

function findKeywordForDataset(dataset, keyword) {
  return (
    dataset.competitorKeywords.find((item) => normalizeKeyword(item.keyword) === normalizeKeyword(keyword)) ||
    dataset.trafficTerms.find((item) => normalizeKeyword(item.keyword) === normalizeKeyword(keyword))
  );
}

function buildGenericKeywordPair(left, right, keywordSets) {
  const keyword = keywordSets.generic[0]?.keyword;
  if (!keyword) {
    return null;
  }

  const leftTerm = findKeywordForDataset(left, keyword);
  const rightTerm = findKeywordForDataset(right, keyword);

  if (!leftTerm && !rightTerm) {
    return null;
  }

  const leftRank = leftTerm?.rank || leftTerm?.organicRank;
  const rightRank = rightTerm?.rank || rightTerm?.organicRank;
  const winner =
    leftRank && rightRank
      ? leftRank.page === rightRank.page && leftRank.slot === rightRank.slot
        ? undefined
        : leftRank.page < rightRank.page || (leftRank.page === rightRank.page && leftRank.slot < rightRank.slot)
          ? 'left'
          : 'right'
      : leftRank
        ? 'left'
        : rightRank
          ? 'right'
          : undefined;

  return {
    keyword,
    leftLabel: leftTerm?.position || leftTerm?.organicPosition || '未进样本',
    rightLabel: rightTerm?.position || rightTerm?.organicPosition || '未进样本',
    winner,
  };
}

function buildTrafficColumns(mode, left, right, keywordSets, sourcing) {
  const genericTerms = keywordSets.generic.slice(0, 3).map((item) => {
    const leftTerm = findKeywordForDataset(left, item.keyword);
    const rightTerm = findKeywordForDataset(right, item.keyword);
    return `${item.keyword}: ${left.detail.brand} [${leftTerm?.position || leftTerm?.organicPosition || '未进样本'}], ${right.detail.brand} [${rightTerm?.position || rightTerm?.organicPosition || '未进样本'}]`;
  });

  if (mode === 'source' && sourcing) {
    const prices = sourcing.items
      .map((item) => item.price)
      .filter((value) => value !== null && value !== undefined);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;

    return [
      {
        eyebrow: '泛词自然位',
        title: genericTerms.length ? `${left.detail.brand} / ${right.detail.brand} 泛词对比` : '泛词样本不足',
        points: genericTerms.length ? genericTerms : ['当前没有足够稳定的泛词样本。'],
      },
      {
        eyebrow: '1688 相似供给',
        title: prices.length ? `样本价格带约 ¥${minPrice} - ¥${maxPrice}` : '1688 样本不足',
        accent: true,
        points: [
          `搜索词：${sourcing.searchName}`,
          sourcing.items[0] ? `样本 1：${sourcing.items[0].title}` : '暂无样本 1',
          sourcing.items[1] ? `样本 2：${sourcing.items[1].title}` : '暂无样本 2',
        ],
      },
    ];
  }

  const scenarioTerms = keywordSets.scenario.slice(0, 3).map((item) => {
    const leftTerm = findKeywordForDataset(left, item.keyword);
    const rightTerm = findKeywordForDataset(right, item.keyword);
    const leftExposure = leftTerm?.organicPosition || leftTerm?.position || leftTerm?.adPosition || '未进样本';
    const rightExposure = rightTerm?.organicPosition || rightTerm?.position || rightTerm?.adPosition || '未进样本';
    return `${item.keyword}: ${left.detail.brand} [${leftExposure}], ${right.detail.brand} [${rightExposure}]`;
  });

  return [
    {
      eyebrow: '泛词自然位',
      title: genericTerms.length ? (mode === 'find' ? '为什么它值得盯' : '谁更稳住免费流量') : '泛词样本不足',
      points: genericTerms.length ? genericTerms : ['当前没有足够稳定的泛词样本。'],
    },
    {
      eyebrow: '场景词与转化意图',
      title: scenarioTerms.length ? (mode === 'find' ? '下一步该跟踪哪些词' : '谁更能吃到高意图词') : '场景词样本不足',
      accent: true,
      points: scenarioTerms.length ? scenarioTerms : ['当前没有足够稳定的场景词样本。'],
    },
  ];
}

function buildTrafficInsight(mode, categoryStats, keywordIntel, sourcing) {
  const topKeyword = keywordIntel[0]?.detail;
  const categoryLine = categoryStats
    ? `类目 Top100 月销量约 ${formatNumber(categoryStats.top100Sales)}，中位价 ${formatCurrency(categoryStats.medianPrice)}，Top3 产品销量占比 ${formatPercent(categoryStats.top3ProductShare)}。`
    : '当前类目环境样本不足。';
  const keywordLine = topKeyword
    ? `核心词 ${topKeyword.keyword} 月搜索量 ${formatNumber(topKeyword.monthlyVolume)}，推荐 CPC ${formatCurrency(topKeyword.cpc)}，旺季在 ${topKeyword.peakMonth || '未知'}。`
    : '当前关键词细节样本不足。';

  if (mode === 'source' && sourcing) {
    const prices = sourcing.items
      .map((item) => item.price)
      .filter((value) => value !== null && value !== undefined);
    const sourcingLine = prices.length
      ? `1688 本次样本价格带约 ¥${Math.min(...prices)} - ¥${Math.max(...prices)}，只能作为供给锚点，不能直接当成工厂 shortlist。`
      : '1688 这次没有形成可读价格带。';

    return `${categoryLine} ${keywordLine} ${sourcingLine}`;
  }

  return `${categoryLine} ${keywordLine}`;
}

function buildActionCards(mode, left, right, keywordSets, categoryStats, sourcing) {
  const leftRisks = summarizeReviewThemes(left.negativeReviews);
  const rightRisks = summarizeReviewThemes(right.negativeReviews);
  const topRisk = [...leftRisks, ...rightRisks].sort((a, b) => b.count - a.count)[0];
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword;
  const medianPrice = categoryStats?.medianPrice;
  const lowerPriceBrand =
    left.detail.price !== null && right.detail.price !== null
      ? left.detail.price < right.detail.price
        ? left.detail.brand
        : right.detail.brand
      : left.detail.brand;

  const cards = [
    {
      priority: 'P0',
      title: topRisk ? `优先修正 ${topRisk.label}` : '优先修正高频差评点',
      desc: topRisk
        ? `真实评论里最密集的风险落在 ${topRisk.label}。先处理“${topRisk.sampleTitle || topRisk.label}”这类问题，再谈放量和提价。`
        : '先回看近期负评，把安全、附件、耐久或毛躁等高频问题排干净，再继续放大流量。',
      accentClass: 'border-t-red-500',
    },
    {
      priority: 'P1',
      title: scenarioKeyword ? `用 ${scenarioKeyword} 切高意图词` : '先切高意图场景词',
      desc: scenarioKeyword
        ? `围绕 ${scenarioKeyword} 重写标题前半句、主图卖点和广告结构，不要只在泛词上硬拼。`
        : '优先从场景词、属性词和人群词切入，而不是直接在最大泛词上硬打。',
      accentClass: 'border-t-orange-400',
    },
    {
      priority: 'P2',
      title: mode === 'source' ? '把 1688 结果当锚点，不当结论' : '把价格带和毛利空间一起看',
      desc:
        mode === 'source'
          ? `当前 1688 结果只能帮助你判断价格带和供给方向。下一步要人工二筛相关性、认证和打样，再决定是否推进。`
          : medianPrice
            ? `当前类目中位价约 ${formatCurrency(medianPrice)}。如果你要切入，不是简单跟低价，而是要判断 ${lowerPriceBrand} 这类价格策略是否还有利润空间。`
            : '进入类目前先同时看价格、FBA、CPC 和评论门槛，避免只看售价做决策。',
      accentClass: 'border-t-blue-500',
    },
  ];

  if (mode === 'source' && sourcing?.items.length) {
    cards[2].desc = `${cards[2].desc} 当前已有 ${sourcing.items.length} 条相似供给样本，可直接进入样本筛选。`;
  }

  return cards;
}

function buildReviewBlocks(left, right) {
  const products = [
    {
      eyebrow: 'Seed ASIN',
      detail: left.detail,
      positives: summarizeReviewThemes(left.positiveReviews),
      negatives: summarizeReviewThemes(left.negativeReviews),
    },
    {
      eyebrow: 'Benchmark ASIN',
      detail: right.detail,
      positives: summarizeReviewThemes(right.positiveReviews),
      negatives: summarizeReviewThemes(right.negativeReviews),
    },
  ];

  return products.map((item) => {
    const positiveLabels = item.positives.map((theme) => theme.label);
    const negativeLabels = item.negatives.map((theme) => theme.label);
    const topNegative = item.negatives[0];

    return {
      eyebrow: item.eyebrow,
      title: item.detail.brand || item.detail.asin,
      summary:
        negativeLabels.length > 0
          ? `${item.detail.brand || item.detail.asin} 当前最大的真实风险落在 ${negativeLabels.join('、')}，这会直接影响转化和复购。`
          : `${item.detail.brand || item.detail.asin} 当前负评主题还不够集中，先继续观察评论结构。`,
      positives: positiveLabels.length > 0 ? positiveLabels : ['当前没有形成稳定的正向主题样本。'],
      negatives: negativeLabels.length > 0 ? negativeLabels : ['当前没有形成稳定的负向主题样本。'],
      opportunities:
        topNegative
          ? [
              `把 ${topNegative.label} 作为首要修正项，先解决真实体验问题。`,
              `围绕 ${topNegative.label} 在主图、A+ 或 bullet 中补足证明，而不是只堆卖点。`,
            ]
          : ['继续积累评论样本，再决定产品、页面和投放动作。'],
    };
  });
}

function buildRoadmapSteps(mode, left, right, keywordSets, sourcing) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心场景词';

  if (mode === 'find') {
    return [
      {
        phase: 'Week 1',
        title: `锁定 ${right.detail.brand || right.detail.asin} 的监控面板`,
        desc: '固定追踪价格、评论增速、核心词自然位和广告位，先确认它究竟是价格标杆还是关键词标杆。',
      },
      {
        phase: 'Week 2',
        title: `拆 ${scenarioKeyword} 对应的页面和投放结构`,
        desc: '重点看标题前半句、主图承诺、附件组合和评论里被反复验证的卖点。',
      },
      {
        phase: 'Week 3-4',
        title: '扩成备选 watchlist',
        desc: '不要只盯一支 ASIN，至少补 2 支同类目样本，判断你真正要跟的是哪种打法。',
      },
    ];
  }

  if (mode === 'source') {
    return [
      {
        phase: 'Step 1',
        title: '先筛 1688 样本，不要直接问价',
        desc: '优先按相关性、外观结构、认证可能性和起订量做第一轮淘汰，避免被低价样本误导。',
      },
      {
        phase: 'Step 2',
        title: `用 ${scenarioKeyword} 对齐产品定义`,
        desc: '供给样本要能支撑 Amazon 侧真实需求词和评论期待，否则再便宜也不值得做。',
      },
      {
        phase: 'Step 3',
        title: '进入打样与成本复核',
        desc: sourcing?.items.length
          ? `当前保留下来的 ${sourcing.items.length} 条样本只够做 shortlist，下一步必须补打样、质检和落地成本。`
          : '当前供给样本还不够，先补足有效样本再进入打样。',
      },
    ];
  }

  return [
    {
      phase: 'Week 1',
      title: '先修 P0 负评风险',
      desc: '把最密集的真实差评主题拉平，否则后续流量放大只会把问题放大。',
    },
    {
      phase: 'Week 2',
      title: `围绕 ${scenarioKeyword} 重写转化结构`,
      desc: '同步改标题前半句、主图和广告结构，让高意图词和页面承诺保持一致。',
    },
    {
      phase: 'Week 3-4',
      title: '复盘价格带与利润空间',
      desc: '在价格、FBA、CPC 和评论门槛一起成立后，再决定是否放大预算或扩变体。',
    },
  ];
}

function buildModeFocus(mode, left, right, keywordSets, categoryReport, sourcing, competitorCandidates) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';
  const secondCandidate = competitorCandidates[1];

  if (mode === 'find') {
    return {
      title: '锁定逻辑',
      cards: [
        {
          label: 'Why This ASIN',
          value: right.detail.brand || right.detail.asin,
          desc: '系统优先锁定同类目、销量靠前且标题重合度更高的样本，而不是只看表面相似。',
        },
        {
          label: 'Backup Watchlist',
          value: secondCandidate?.brand || secondCandidate?.asin || '暂无第二候选',
          desc: secondCandidate
            ? `${secondCandidate.asin} 也是可跟踪样本，但当前优先级低于第一竞对。`
            : '当前类目里没有找到足够强的第二候选。',
        },
        {
          label: 'Track First',
          value: scenarioKeyword,
          desc: `先盯 ${scenarioKeyword}、价格动作和评论增速，再判断要抄的是词路还是产品路。`,
        },
      ],
    };
  }

  if (mode === 'source') {
    const prices = sourcing?.items
      .map((item) => item.price)
      .filter((value) => value !== null && value !== undefined) || [];

    return {
      title: '寻源判断',
      cards: [
        {
          label: 'Amazon Benchmark',
          value: right.detail.brand || right.detail.asin,
          desc: '先用 Amazon 侧真实成交样本定义市场，不让 1688 低价反过来定义需求。',
        },
        {
          label: 'Supply Range',
          value: prices.length ? `¥${Math.min(...prices)} - ¥${Math.max(...prices)}` : '样本不足',
          desc: sourcing?.searchName
            ? `当前供给搜索词是 ${sourcing.searchName}，先看有没有稳定样本，再谈询盘。`
            : '当前还没形成可读的供给价格带。',
        },
        {
          label: 'Kill First',
          value: '相关性筛选',
          desc: '先淘汰低相关、低认证可能和结构不对的样本，避免把错误供给带进后续流程。',
        },
      ],
    };
  }

  return {
    title: '模式判断',
    cards: [
      {
        label: 'Current Winner',
        value: left.detail.monthlySales >= right.detail.monthlySales ? left.detail.brand || left.detail.asin : right.detail.brand || right.detail.asin,
        desc: '当前先看谁更能把销量、评论和自然位连成闭环，而不是只看单一指标。',
      },
      {
        label: 'Attack Window',
        value: scenarioKeyword,
        desc: `如果要切入，优先从 ${scenarioKeyword} 这种更高意图的词路切进去。`,
      },
      {
        label: 'Entry Constraint',
        value: categoryReport.stats?.medianPrice ? `中位价 ${formatCurrency(categoryReport.stats.medianPrice)}` : '评论门槛',
        desc: '当前进入限制主要来自价格带、评论门槛和头部集中度的组合。',
      },
    ],
  };
}

function chooseWinner(left, right) {
  if ((left.detail.monthlySales || 0) >= (right.detail.monthlySales || 0)) {
    return { winner: left, other: right, side: 'left' };
  }

  return { winner: right, other: left, side: 'right' };
}

function buildTitle(mode, winner, other, keywordSets) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword;

  if (mode === 'source') {
    return `${winner.detail.brand || winner.detail.asin} 是当前 Amazon 基准盘，下一步看 1688 是否撑得住落地。`;
  }

  if (mode === 'find') {
    return `${winner.detail.brand || winner.detail.asin} 是当前参考锚点，${other.detail.brand || other.detail.asin} 是最值得盯住的竞对。`;
  }

  if (scenarioKeyword) {
    return `${winner.detail.brand || winner.detail.asin} 更强成交，${other.detail.brand || other.detail.asin} 在 ${scenarioKeyword} 等意图词上更值得细拆。`;
  }

  return `${winner.detail.brand || winner.detail.asin} 当前更强，${other.detail.brand || other.detail.asin} 仍有可学的自然流量结构。`;
}

function buildSummary(mode, left, right, categoryStats, extraNote) {
  const leftName = `${left.detail.asin} / ${left.detail.brand || left.detail.title}`;
  const rightName = `${right.detail.asin} / ${right.detail.brand || right.detail.title}`;
  const categoryLine = categoryStats?.name
    ? `同处 ${categoryStats.name} 类目，Top100 月销量约 ${formatNumber(categoryStats.top100Sales)}，中位价 ${formatCurrency(categoryStats.medianPrice)}。`
    : '当前类目统计样本不足。';

  const compareLine = `${leftName} 当前月销约 ${formatNumber(left.detail.monthlySales)}，月销额 ${formatCurrency(left.detail.monthlyRevenue)}；${rightName} 当前月销约 ${formatNumber(right.detail.monthlySales)}，月销额 ${formatCurrency(right.detail.monthlyRevenue)}。`;

  const modeLine =
    mode === 'source'
      ? '这份报告先用 Amazon 真实市场数据判断谁是基准盘，再补 1688 供给锚点，避免只看供货价做错方向。'
      : mode === 'find'
        ? '这份报告先用真实类目和流量数据找到最值得盯的竞对，再给出下一步应跟踪的内容。'
        : '这份报告直接对比两支 ASIN 的成交、评论、类目和流量结构，结论以实时 Sorftime 数据为准。';

  return [modeLine, compareLine, categoryLine, extraNote].filter(Boolean).join(' ');
}

function buildHeroCards(mode, winner, other, categoryStats, keywordSets, sourcing, extraNote) {
  const genericKeyword = keywordSets.generic[0];
  const firstCard = {
    label: 'Current Winner',
    value: winner.detail.brand || winner.detail.asin,
    desc: `月销量 ${formatNumber(winner.detail.monthlySales)}，月销额 ${formatCurrency(winner.detail.monthlyRevenue)}，细分类目排名 ${formatRank(winner.detail)}。`,
  };

  const secondCard =
    mode === 'source' && sourcing
      ? {
          label: '1688 Anchor',
          value: sourcing.items.length ? `${sourcing.items.length} 条样本` : '样本不足',
          desc: sourcing.items.length
            ? `搜索词 ${sourcing.searchName} 已拉到 ${sourcing.items.length} 条相似供给，先拿来判断价格带，不直接当工厂结论。`
            : '本次 1688 样本不足，只能先以 Amazon 侧结论为主。',
        }
      : {
          label: mode === 'find' ? 'Competitor Signal' : 'Challenger Signal',
          value: other.detail.brand || other.detail.asin,
          desc: genericKeyword
            ? `${genericKeyword.keyword} 月搜索量 ${formatNumber(genericKeyword.volume)}。${other.detail.brand || other.detail.asin} 仍有自然位和内容结构上的可学样本。`
            : `${other.detail.brand || other.detail.asin} 依然值得跟，因为它代表了类目里另一种打法。`,
        };

  const thirdCard = {
    label: 'Next Move',
    value: categoryStats?.medianPrice ? `中位价 ${formatCurrency(categoryStats.medianPrice)}` : '先拆关键词和差评',
    desc: extraNote || '下一步不要继续停留在演示原型，直接围绕类目门槛、关键词和差评点落具体动作。',
  };

  return [firstCard, secondCard, thirdCard];
}

function trimText(value, max = 88) {
  const text = String(value || '').trim();
  if (!text) {
    return '未知';
  }

  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildCompareModeFocus(left, right, categoryStats, keywordSets) {
  const winner = chooseWinner(left, right).winner;
  const other = chooseWinner(left, right).other;
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心场景词';

  return {
    title: '模式判断',
    cards: [
      {
        label: 'Current Winner',
        value: winner.detail.brand || winner.detail.asin,
        desc: `当前以销量、评论护城河和自然位综合看，${winner.detail.brand || winner.detail.asin} 更像市场基准盘。`,
      },
      {
        label: 'Challenger Signal',
        value: other.detail.brand || other.detail.asin,
        desc: `${other.detail.brand || other.detail.asin} 不是简单陪跑，它在 ${scenarioKeyword} 这类词路上仍然有值得细拆的打法。`,
      },
      {
        label: 'Entry Constraint',
        value: categoryStats?.medianPrice ? `中位价 ${formatCurrency(categoryStats.medianPrice)}` : '评论门槛',
        desc: '当前进入限制主要来自价格带、评论门槛、头部集中度和高意图词竞争强度。',
      },
    ],
  };
}

function buildCompareComparisonRows(left, right, genericKeywordPair) {
  const baseRows = buildComparisonRows(left, right, genericKeywordPair);

  return [
    {
      title: '标题与定位',
      val1: trimText(left.detail.title),
      val2: trimText(right.detail.title),
      desc: '先看标题前半句到底在抢泛词、场景词还是人群词，这决定点击质量和转化预期。',
    },
    ...baseRows,
    {
      title: '变体策略',
      val1: formatNumber(left.detail.variations),
      val2: formatNumber(right.detail.variations),
      desc: '变体多不一定赢，但更多子体通常意味着更强的颜色、附件或人群覆盖。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.variations),
    },
    {
      title: '卖家来源 / 上架时间',
      val1: `${left.detail.sellerSource || '未知'} / ${left.detail.listedAt || '未知'}`,
      val2: `${right.detail.sellerSource || '未知'} / ${right.detail.listedAt || '未知'}`,
      desc: '卖家来源看供给属性，上架时间看积累周期。年轻 listing 但能打进头部通常更值得重视。',
    },
    {
      title: '包装 / 重量',
      val1: `${left.detail.packageSizeCm || '未知'} / ${left.detail.weightG ? `${left.detail.weightG}g` : '未知'}`,
      val2: `${right.detail.packageSizeCm || '未知'} / ${right.detail.weightG ? `${right.detail.weightG}g` : '未知'}`,
      desc: '包装尺寸和重量会直接影响 FBA、运输和利润空间，不能只看售价判断商业性。',
    },
  ];
}

function buildCompareTrafficColumns(left, right, keywordSets, keywordIntel) {
  const genericTerms = keywordSets.generic.slice(0, 3).map((item) => {
    const leftTerm = findKeywordForDataset(left, item.keyword);
    const rightTerm = findKeywordForDataset(right, item.keyword);
    return `${item.keyword}: ${left.detail.brand} [${leftTerm?.position || leftTerm?.organicPosition || '未进样本'}], ${right.detail.brand} [${rightTerm?.position || rightTerm?.organicPosition || '未进样本'}]`;
  });

  const scenarioTerms = keywordSets.scenario.slice(0, 3).map((item) => {
    const leftTerm = findKeywordForDataset(left, item.keyword);
    const rightTerm = findKeywordForDataset(right, item.keyword);
    return `${item.keyword}: ${left.detail.brand} [${leftTerm?.organicPosition || leftTerm?.position || leftTerm?.adPosition || '未进样本'}], ${right.detail.brand} [${rightTerm?.organicPosition || rightTerm?.position || rightTerm?.adPosition || '未进样本'}]`;
  });

  const detailPoints = keywordIntel.slice(0, 3).map((item) => {
    const detail = item.detail;
    return `${detail.keyword || item.keyword}: 月搜 ${formatNumber(detail.monthlyVolume)} / CPC ${formatCurrency(detail.cpc)} / 旺季 ${detail.peakMonth || '未知'}`;
  });

  return [
    {
      eyebrow: '核心防守词',
      title: genericTerms.length ? '谁在守住泛词免费流量' : '泛词样本不足',
      points: genericTerms.length ? genericTerms : ['当前没有足够稳定的泛词样本。'],
    },
    {
      eyebrow: '场景攻击词',
      title: scenarioTerms.length ? '谁更能吃到高意图转化' : '场景词样本不足',
      accent: true,
      points: scenarioTerms.length ? scenarioTerms : ['当前没有足够稳定的场景词样本。'],
    },
    {
      eyebrow: 'CPC 与季节性',
      title: detailPoints.length ? '哪些词值得进广告结构' : '关键词细节样本不足',
      points: detailPoints.length ? detailPoints : ['当前还没有足够稳定的关键词细节样本。'],
    },
  ];
}

function buildCompareReviewBlocks(left, right) {
  return buildReviewBlocks(left, right).map((block) => ({
    ...block,
    opportunities: block.negatives[0] && block.positives[0]
      ? [
          `先修 ${block.negatives[0]}，否则放量只会放大差评。`,
          `把 ${block.positives[0]} 变成主图或副图里可被验证的承诺。`,
          ...block.opportunities,
        ].slice(0, 3)
      : block.opportunities,
  }));
}

function buildCompareActionCards(left, right, keywordSets, categoryStats) {
  const topRisk = [...summarizeReviewThemes(left.negativeReviews), ...summarizeReviewThemes(right.negativeReviews)]
    .sort((a, b) => b.count - a.count)[0];
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心场景词';
  const medianPrice = categoryStats?.medianPrice;

  return [
    {
      priority: 'P0',
      title: topRisk ? `先处理 ${topRisk.label}` : '先处理高频负评点',
      desc: topRisk
        ? `当前最伤转化的是 ${topRisk.label}。这类问题不解决，标题、广告和低价都只是暂时掩盖。`
        : '先把重复出现的真实负评点拉平，再谈流量扩量。',
      accentClass: 'border-t-red-500',
    },
    {
      priority: 'P1',
      title: `围绕 ${scenarioKeyword} 重写标题与主图`,
      desc: `把 ${scenarioKeyword} 放进标题前半句、主图卖点和副图证明，确保搜索词和页面承诺对齐。`,
      accentClass: 'border-t-orange-400',
    },
    {
      priority: 'P1',
      title: '拆成泛词防守 + 场景词进攻两套广告结构',
      desc: '泛词只守排名和控量，场景词才是更容易拿到高质量转化的增长抓手。',
      accentClass: 'border-t-blue-500',
    },
    {
      priority: 'P2',
      title: medianPrice ? `围绕中位价 ${formatCurrency(medianPrice)} 校正客单` : '复盘价格带与利润空间',
      desc: '不要只盯最低价。价格、FBA、CPC 和评论门槛要一起看，才能判断这条路有没有利润。',
      accentClass: 'border-t-emerald-500',
    },
  ];
}

function buildCompareRoadmapSteps(left, right, keywordSets) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心场景词';

  return [
    {
      phase: 'Week 1',
      title: `拆 ${left.detail.brand || left.detail.asin} 和 ${right.detail.brand || right.detail.asin} 的转化差`,
      desc: '先对齐价格、评论护城河、标题定位和主图承诺，确定谁赢在产品、谁赢在流量。',
    },
    {
      phase: 'Week 2',
      title: `围绕 ${scenarioKeyword} 改标题、主图和 bullet`,
      desc: '让高意图词和页面承诺一致，避免广告进来的流量在详情页丢失。',
    },
    {
      phase: 'Week 3',
      title: '重建广告分组',
      desc: '泛词单独防守，场景词单独进攻，产品词和竞品词分开管理，不混投。',
    },
    {
      phase: 'Week 4',
      title: '按评论反馈决定是否做变体或产品修正',
      desc: '先验证产品风险是否收敛，再决定要不要扩附件、颜色或场景版本。',
    },
  ];
}

function derive1688SearchName(detail, keywordSets) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword;
  const categorySeed = normalizeKeyword(detail.category || detail.subCategoryName || 'hair dryer');
  if (scenarioKeyword) {
    if (categorySeed && !normalizeKeyword(scenarioKeyword).includes(categorySeed)) {
      return `${categorySeed} ${normalizeKeyword(scenarioKeyword)}`.trim();
    }

    return scenarioKeyword;
  }

  const genericKeyword = keywordSets.generic[0]?.keyword;
  if (genericKeyword) {
    return genericKeyword;
  }

  return `${detail.category || detail.subCategoryName || detail.title}`.split(',')[0].toLowerCase();
}

function pickBestCompetitor(seedDetail, categoryReport) {
  return scoreCompetitors(seedDetail, categoryReport)[0];
}

function scoreCompetitors(seedDetail, categoryReport) {
  const seedTokens = new Set(tokenize(`${seedDetail.title || ''} ${seedDetail.category || ''}`));
  const seedBrand = normalizeKeyword(seedDetail.brand);
  const seedPrice = seedDetail.price || 0;

  return categoryReport.topProducts
    .slice(0, 20)
    .map((item) => {
      const asin = String(item['ASIN'] || '').trim();
      const title = String(item['标题'] || '');
      const brand = String(item['品牌'] || '');
      const overlap = tokenize(title).filter((token) => seedTokens.has(token)).length;
      const price = toNumber(item['价格']);
      const priceDistance = seedPrice && price ? Math.abs(seedPrice - price) / seedPrice : 1;
      const sales = toNumber(item['月销量']);
      return {
        asin,
        brand,
        title,
        score: overlap * 2 + Math.min((sales || 0) / 10000, 5) - priceDistance,
        sales,
      };
    })
    .filter((item) => item.asin && item.asin !== seedDetail.asin)
    .filter((item) => normalizeKeyword(item.brand) !== seedBrand)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.sales || 0) - (left.sales || 0);
    });
}

function buildBaseReportMeta(mode) {
  return {
    date: new Date().toISOString().slice(0, 10),
    marketplace: 'Amazon US',
    source: 'Sorftime MCP',
    mode,
  };
}

function buildCompareModeReport({ session, left, right, categoryReport, keywordIntel, extraNote }) {
  const winnerState = chooseWinner(left, right);
  const keywordSets = chooseKeywordSets([left, right]);
  const genericKeywordPair = buildGenericKeywordPair(left, right, keywordSets);
  const modeFocus = buildCompareModeFocus(left, right, categoryReport.stats, keywordSets);

  return {
    session,
    report: {
      meta: buildBaseReportMeta('compare'),
      title: buildTitle('compare', winnerState.winner, winnerState.other, keywordSets),
      summary: buildSummary('compare', left, right, categoryReport.stats, extraNote),
      labels: {
        left: left.detail.brand || left.detail.asin,
        right: right.detail.brand || right.detail.asin,
      },
      sectionCopy: buildSectionCopy('compare', left, right, categoryReport.stats, keywordSets),
      heroCards: buildHeroCards('compare', winnerState.winner, winnerState.other, categoryReport.stats, keywordSets),
      navItems: buildNavItems('compare'),
      modeFocusTitle: modeFocus.title,
      modeFocusCards: modeFocus.cards,
      products: [
        buildProductCard(left.detail, summarizeReviewThemes(left.positiveReviews)),
        buildProductCard(right.detail, summarizeReviewThemes(right.positiveReviews)),
      ],
      comparisonRows: buildCompareComparisonRows(left, right, genericKeywordPair),
      categoryCards: buildCategoryCards(categoryReport.stats, left, right),
      categoryRows: buildCategoryRows(left, right, categoryReport.stats),
      trafficColumns: buildCompareTrafficColumns(left, right, keywordSets, keywordIntel),
      trafficInsight: buildTrafficInsight('compare', categoryReport.stats, keywordIntel),
      reviewBlocks: buildCompareReviewBlocks(left, right),
      actionCards: buildCompareActionCards(left, right, keywordSets, categoryReport.stats),
      roadmapSteps: buildCompareRoadmapSteps(left, right, keywordSets),
    },
  };
}

function buildFindModeReport({ session, left, right, categoryReport, keywordIntel, extraNote, competitorCandidates }) {
  const winnerState = chooseWinner(left, right);
  const keywordSets = chooseKeywordSets([left, right]);
  const genericKeywordPair = buildGenericKeywordPair(left, right, keywordSets);
  const modeFocus = buildModeFocus('find', left, right, keywordSets, categoryReport, null, competitorCandidates);

  return {
    session,
    report: {
      meta: buildBaseReportMeta('find'),
      title: buildTitle('find', winnerState.winner, winnerState.other, keywordSets),
      summary: buildSummary('find', left, right, categoryReport.stats, extraNote),
      labels: {
        left: left.detail.brand || left.detail.asin,
        right: right.detail.brand || right.detail.asin,
      },
      sectionCopy: buildSectionCopy('find', left, right, categoryReport.stats, keywordSets),
      heroCards: buildHeroCards('find', winnerState.winner, winnerState.other, categoryReport.stats, keywordSets, null, extraNote),
      navItems: buildNavItems('find'),
      modeFocusTitle: modeFocus.title,
      modeFocusCards: modeFocus.cards,
      products: [
        buildProductCard(left.detail, summarizeReviewThemes(left.positiveReviews)),
        buildProductCard(right.detail, summarizeReviewThemes(right.positiveReviews)),
      ],
      comparisonRows: buildComparisonRows(left, right, genericKeywordPair),
      categoryCards: buildCategoryCards(categoryReport.stats, left, right),
      categoryRows: buildCategoryRows(left, right, categoryReport.stats),
      trafficColumns: buildTrafficColumns('find', left, right, keywordSets),
      trafficInsight: buildTrafficInsight('find', categoryReport.stats, keywordIntel),
      reviewBlocks: buildReviewBlocks(left, right),
      actionCards: buildActionCards('find', left, right, keywordSets, categoryReport.stats),
      roadmapSteps: buildRoadmapSteps('find', left, right, keywordSets),
    },
  };
}

function buildSourceModeReport({ session, left, right, categoryReport, keywordIntel, sourcing, extraNote, competitorCandidates }) {
  const winnerState = chooseWinner(left, right);
  const keywordSets = chooseKeywordSets([left, right]);
  const genericKeywordPair = buildGenericKeywordPair(left, right, keywordSets);
  const modeFocus = buildModeFocus('source', left, right, keywordSets, categoryReport, sourcing, competitorCandidates);

  return {
    session,
    report: {
      meta: buildBaseReportMeta('source'),
      title: buildTitle('source', winnerState.winner, winnerState.other, keywordSets),
      summary: buildSummary('source', left, right, categoryReport.stats, extraNote),
      labels: {
        left: left.detail.brand || left.detail.asin,
        right: right.detail.brand || right.detail.asin,
      },
      sectionCopy: buildSectionCopy('source', left, right, categoryReport.stats, keywordSets, sourcing),
      heroCards: buildHeroCards('source', winnerState.winner, winnerState.other, categoryReport.stats, keywordSets, sourcing, extraNote),
      navItems: buildNavItems('source'),
      modeFocusTitle: modeFocus.title,
      modeFocusCards: modeFocus.cards,
      products: [
        buildProductCard(left.detail, summarizeReviewThemes(left.positiveReviews)),
        buildProductCard(right.detail, summarizeReviewThemes(right.positiveReviews)),
      ],
      comparisonRows: buildComparisonRows(left, right, genericKeywordPair),
      categoryCards: buildCategoryCards(categoryReport.stats, left, right),
      categoryRows: buildCategoryRows(left, right, categoryReport.stats),
      trafficColumns: buildTrafficColumns('source', left, right, keywordSets, sourcing),
      trafficInsight: buildTrafficInsight('source', categoryReport.stats, keywordIntel, sourcing),
      reviewBlocks: buildReviewBlocks(left, right),
      actionCards: buildActionCards('source', left, right, keywordSets, categoryReport.stats, sourcing),
      roadmapSteps: buildRoadmapSteps('source', left, right, keywordSets, sourcing),
    },
  };
}

export async function buildLiveReport(sessionInput) {
  const site = 'US';

  if (sessionInput.mode === 'compare') {
    const usedAsins = sessionInput.asins.slice(0, 2);
    if (usedAsins.length < 2) {
      throw new Error('竞对分析至少需要 2 个 ASIN。');
    }

    const [left, right] = await Promise.all(usedAsins.map((asin) => fetchProductDataset(asin, site)));
    const primaryNodeId = left.detail.nodeId || right.detail.nodeId;
    const categoryReportText = primaryNodeId
      ? await callSorftimeTool('category_report', { nodeId: primaryNodeId, amzSite: site })
      : null;
    const categoryReport = categoryReportText ? parseCategoryReport(categoryReportText.text) : { topProducts: [], stats: {} };
    const keywordIntel = await fetchKeywordIntel(site, collectKeywordSeeds(chooseKeywordSets([left, right])));
    const extraNote =
      sessionInput.asins.length > 2
        ? `当前详细报告只对前两个 ASIN ${usedAsins.join(' / ')} 做深度比对，其余输入建议下一轮单独展开。`
        : '';

    return buildCompareModeReport({
      session: { ...sessionInput, asins: usedAsins, query: usedAsins.join(', ') },
      left,
      right,
      categoryReport,
      keywordIntel,
      extraNote,
    });
  }

  const seedAsin = sessionInput.asins[0];
  const seed = await fetchProductDataset(seedAsin, site);
  const categoryReportText = seed.detail.nodeId
    ? await callSorftimeTool('category_report', { nodeId: seed.detail.nodeId, amzSite: site })
    : null;
  const categoryReport = categoryReportText ? parseCategoryReport(categoryReportText.text) : { topProducts: [], stats: {} };
  const competitorCandidates = scoreCompetitors(seed.detail, categoryReport);
  const competitor = competitorCandidates[0];

  if (!competitor?.asin) {
    throw new Error('没有从当前类目里找到足够可信的竞对样本，请更换 ASIN 再试。');
  }

  const benchmark = await fetchProductDataset(competitor.asin, site);
  const keywordSets = chooseKeywordSets([seed, benchmark]);
  const keywordIntel = await fetchKeywordIntel(site, collectKeywordSeeds(keywordSets));

  if (sessionInput.mode === 'find') {
    return buildFindModeReport({
      session: { ...sessionInput, asins: [seedAsin, competitor.asin], query: `${seedAsin}, ${competitor.asin}` },
      left: seed,
      right: benchmark,
      categoryReport,
      keywordIntel,
      extraNote: `本次自动锁定的第一竞对是 ${competitor.asin}，因为它和种子 ASIN 同类目、销量靠前且标题相似度更高。`,
      competitorCandidates,
    });
  }

  const searchName = derive1688SearchName(seed.detail, keywordSets);
  const sourcingTool = await callSorftimeTool('ali1688_similar_product', {
    searchName,
    page: 1,
  });
  const rawSourcingItems = parseSourcingItems(sourcingTool.text);
  const sourcing = {
    searchName,
    items: sanitizeSourcingItems(rawSourcingItems, searchName),
  };

  return buildSourceModeReport({
    session: { ...sessionInput, asins: [seedAsin, competitor.asin], query: `${seedAsin}, ${competitor.asin}` },
    left: seed,
    right: benchmark,
    categoryReport,
    keywordIntel,
    sourcing,
    extraNote: `Amazon 侧先拿 ${competitor.asin} 做对照，1688 侧再用 “${searchName}” 拉相似供给作为落地锚点。`,
    competitorCandidates,
  });
}
