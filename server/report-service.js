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
  const items = [
    { id: '产品卡', label: '产品卡' },
    { id: modeLabel, label: modeLabel },
    { id: '核心对比', label: '核心对比' },
    { id: '类目环境', label: '类目环境' },
    { id: '流量与关键词', label: '流量与关键词' },
    { id: '评价洞察', label: '评价洞察' },
    { id: '执行建议', label: '执行建议' },
    { id: '执行路径', label: '执行路径' },
  ];

  if (mode === 'find') {
    items.splice(2, 0, { id: '候选池', label: '候选池' });
  }

  if (mode === 'source') {
    items.splice(2, 0, { id: '推荐厂家', label: '推荐厂家' });
  }

  return items;
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

function averageOf(items, accessor) {
  const values = items
    .map(accessor)
    .filter((value) => value !== null && value !== undefined && !Number.isNaN(value));

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function daysSinceDate(dateString) {
  if (!dateString) {
    return null;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

function deriveCategoryBenchmarks(topProducts) {
  const normalized = Array.isArray(topProducts)
    ? topProducts.map((item) => ({
        sales: toNumber(item['月销量']),
        revenue: toNumber(item['月销额']),
        price: toNumber(item['价格']),
        rating: toNumber(item['星级']),
        reviews: toNumber(item['评论数']),
        listedAt: item['上架日期'] || null,
      }))
    : [];

  const top10 = normalized.slice(0, 10);
  const newProducts = normalized.filter((item) => {
    const daysLive = daysSinceDate(item.listedAt);
    return daysLive !== null && daysLive <= 365;
  });

  return {
    top10AverageSales: averageOf(top10, (item) => item.sales),
    top10AverageRevenue: averageOf(top10, (item) => item.revenue),
    top10AverageRating: averageOf(top10, (item) => item.rating),
    top10AverageReviews: averageOf(top10, (item) => item.reviews),
    newProductShare: normalized.length > 0 ? (newProducts.length / normalized.length) * 100 : null,
    newProductAverageSales: averageOf(newProducts, (item) => item.sales),
    newProductAveragePrice: averageOf(newProducts, (item) => item.price),
  };
}

function parseCategoryReport(text) {
  const payload = safeJsonParse(text, {});
  const stats = payload['类目统计报告'] || {};
  const topProducts = payload['Top100产品'] || [];
  const benchmarks = deriveCategoryBenchmarks(topProducts);

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
      ...benchmarks,
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

function parseKeywordSearchResultStats(text) {
  if (!text) {
    return null;
  }

  const nonBestSeller = text.match(/自然位非Best Seller Top100产品数量占比([\d.]+)%/);
  const naturalLowReview = text.match(/自然位评价数低于100\/300\/500的产品数量占比分别为([\d.]+)%\/([\d.]+)%\/([\d.]+)%/);
  const adLowReview = text.match(/广告位评价数低于100\/300\/500的产品数量占比分别为([\d.]+)%\/([\d.]+)%\/([\d.]+)%/);
  const coupon = text.match(/做coupon促销产品数量\/占比分别为(\d+)个\s*\/([\d.]+)%/);

  return {
    nonBestSellerShare: parsePercent(nonBestSeller?.[1]),
    naturalLowReview100: parsePercent(naturalLowReview?.[1]),
    naturalLowReview300: parsePercent(naturalLowReview?.[2]),
    naturalLowReview500: parsePercent(naturalLowReview?.[3]),
    adLowReview100: parsePercent(adLowReview?.[1]),
    adLowReview300: parsePercent(adLowReview?.[2]),
    adLowReview500: parsePercent(adLowReview?.[3]),
    couponCount: toNumber(coupon?.[1]),
    couponShare: parsePercent(coupon?.[2]),
  };
}

function parseKeywordDetail(text) {
  const item = safeJsonParse(text, {});
  return {
    keyword: item['关键词'] || null,
    monthlyVolume: toNumber(item['月搜索量']),
    cpc: toNumber(item['推荐cpc竞价']),
    peakMonth: item['词搜索量旺季'] || null,
    resultCount: toNumber(item['搜索结果竞品数量']),
    pageOneStats: parseKeywordSearchResultStats(item['搜索结果首页统计']),
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
  const normalizedSearchName = normalizeKeyword(searchName);
  const hardNoisePatterns = [
    /定子|转子|铁芯|配件|电机|风罩|烘罩|卷发罩|扩散罩/i,
    /香薰|精油|熏香|扩香|扩香机|香氛|喷香|diffuser香/i,
    /认证|检测|维修|服务/i,
  ];
  const coreProductPattern = /吹风机|电吹风|风筒/i;

  return items
    .map((item) => {
      const title = item.title || '';
      const overlap = tokenize(title).filter((token) => preferredTokens.includes(token)).length;
      const searchPhraseHit =
        normalizedSearchName && normalizedSearchName.length > 1 && normalizeKeyword(title).includes(normalizedSearchName) ? 1 : 0;
      const isNoise = hardNoisePatterns.some((pattern) => pattern.test(title));
      const hasCoreProduct = coreProductPattern.test(title);
      const hasRelevantFeature = /负离子|高速|护发|静音|大功率|速干/i.test(title);

      return {
        ...item,
        relevanceScore:
          overlap +
          searchPhraseHit +
          (hasCoreProduct ? 2 : 0) +
          (hasRelevantFeature ? 1 : 0) +
          ((item.price || 0) >= 5 ? 0 : -2) -
          (isNoise ? 6 : 0),
      };
    })
    .filter((item) => item.relevanceScore >= 1)
    .sort((left, right) => right.relevanceScore - left.relevanceScore);
}

function dedupeSourcingItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.url || `${item.title}-${item.seller}`;
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function classifySourcingItem(title) {
  const text = String(title || '');

  if (/宠物|狗狗|猫咪|犬猫|吹水机/i.test(text)) {
    return {
      type: 'pet',
      label: '宠物吹水机',
      caution: '产品形态已经偏到宠物护理，不适合当成人吹风机供给样本。',
    };
  }

  if (/吹风梳|热风梳|直卷|卷发梳|五合一|六合一|多功能/i.test(text)) {
    return {
      type: 'brush',
      label: '吹风梳/造型器',
      caution: '形态已经偏到吹风梳/造型器，不能直接拿来当直机吹风机样本。',
    };
  }

  if (/usb|无线|折叠|便携|宿舍|旅行/i.test(text)) {
    return {
      type: 'compact',
      label: '便携/折叠样本',
      caution: '更偏便携或旅行场景，和当前主打法不完全一致。',
    };
  }

  return {
    type: 'direct',
    label: '直机吹风机',
    caution: null,
  };
}

function buildPriceBand(items) {
  const prices = items
    .map((item) => item.price)
    .filter((value) => value !== null && value !== undefined && !Number.isNaN(value))
    .sort((left, right) => left - right);

  if (!prices.length) {
    return null;
  }

  const middle = prices[Math.floor(prices.length / 2)];
  return {
    min: prices[0],
    median: middle,
    max: prices[prices.length - 1],
  };
}

function buildSellerLookupUrl(seller) {
  const value = String(seller || '').trim();
  if (!value) {
    return null;
  }

  return `https://s.1688.com/company/company_search.htm?keywords=${encodeURIComponent(value)}`;
}

function buildSourceTargets(seedDetail, benchmarkDetail, keywordSets) {
  const titleBlob = `${seedDetail?.title || ''} ${benchmarkDetail?.title || ''}`;
  const scenarioKeyword = keywordSets?.scenario?.[0]?.keyword || keywordSets?.generic?.[0]?.keyword || null;
  const targets = [];

  if (/diffuser/i.test(titleBlob)) {
    targets.push({
      label: '扩散罩/卷发场景',
      patterns: [/diffuser/i, /扩散罩|卷发|风罩/i],
    });
  }

  if (/ionic|negative ion/i.test(titleBlob)) {
    targets.push({
      label: '负离子护发',
      patterns: [/ionic/i, /负离子|水离子/i],
    });
  }

  if (/ceramic|tourmaline/i.test(titleBlob)) {
    targets.push({
      label: '陶瓷/顺滑路线',
      patterns: [/ceramic/i, /tourmaline/i, /陶瓷|顺滑/i],
    });
  }

  if (/quiet|noise/i.test(titleBlob)) {
    targets.push({
      label: '静音体验',
      patterns: [/quiet/i, /noise/i, /静音/i],
    });
  }

  if (/fast drying|high speed|1875w|watt/i.test(titleBlob)) {
    targets.push({
      label: '高速速干',
      patterns: [/fast dry/i, /high speed/i, /高速|速干|大功率/i],
    });
  }

  return {
    scenarioKeyword,
    labels: targets.map((item) => item.label),
    featureChecks: targets,
  };
}

function extractSourceFeatureHits(title, sourceTargets) {
  return sourceTargets.featureChecks
    .filter((check) => check.patterns.some((pattern) => pattern.test(title)))
    .map((check) => check.label);
}

function scoreSourcePriceFit(price, priceBand) {
  if (!priceBand || !price) {
    return 0;
  }

  const diffRatio = Math.abs(price - priceBand.median) / Math.max(priceBand.median, 1);
  if (diffRatio <= 0.2) {
    return 2;
  }
  if (diffRatio <= 0.45) {
    return 1;
  }
  if (diffRatio >= 0.8) {
    return -2;
  }
  if (diffRatio >= 0.9) {
    return -1;
  }

  return 0;
}

function buildSupplierRecommendations(items, sourceTargets, directPriceBand) {
  const sellerMap = new Map();

  items.forEach((item) => {
    const sellerKey = String(item.seller || item.url || item.title).trim();
    if (!sellerKey) {
      return;
    }

    const current = sellerMap.get(sellerKey) || {
      seller: item.seller || '未知供应商',
      items: [],
      searchNames: new Set(),
    };
    current.items.push(item);
    if (item.matchedSearchName) {
      current.searchNames.add(item.matchedSearchName);
    }
    sellerMap.set(sellerKey, current);
  });

  return [...sellerMap.values()]
    .map((supplier) => {
      const rankedItems = supplier.items
        .map((item) => {
          const featureHits = extractSourceFeatureHits(item.title || '', sourceTargets);
          const manufacturerCue = /厂家|工厂|源头|跨境|批发/i.test(item.title || '');
          const ipRisk = /某森|dyson|徕芬|airwrap/i.test(item.title || '');
          const suspiciousLowPrice =
            item.price ? item.price < 20 : false;
          const score =
            6 +
            featureHits.length * 2 +
            supplier.searchNames.size * 1.5 +
            scoreSourcePriceFit(item.price, directPriceBand) +
            (manufacturerCue ? 1 : 0) -
            (ipRisk ? 4 : 0) -
            (suspiciousLowPrice ? 3 : 0);

          return {
            ...item,
            featureHits,
            manufacturerCue,
            ipRisk,
            suspiciousLowPrice,
            supplierScore: Number(score.toFixed(2)),
          };
        })
        .sort((left, right) => right.supplierScore - left.supplierScore);
      const reviewedItems = rankedItems.filter((item) => !item.ipRisk && !item.suspiciousLowPrice);
      const bestItem = reviewedItems[0];
      const supplierPriceBand = buildPriceBand(reviewedItems);
      const featureHits = [...new Set(reviewedItems.flatMap((item) => item.featureHits))];
      const reasonLines = [];

      if (featureHits.length > 0) {
        reasonLines.push(`产品路线更接近当前需求：${featureHits.slice(0, 3).join(' / ')}`);
      }

      if (supplier.searchNames.size > 0) {
        reasonLines.push(`至少命中 ${supplier.searchNames.size} 个供给搜索词：${[...supplier.searchNames].slice(0, 3).join(' / ')}`);
      }

      if (reviewedItems.some((item) => item.manufacturerCue)) {
        reasonLines.push('标题里有厂家/跨境/批发信号，适合作为第一轮问样对象。');
      }

      return {
        seller: supplier.seller,
        score: Number((bestItem?.supplierScore || 0).toFixed(2)),
        offerCount: reviewedItems.length,
        searchNames: [...supplier.searchNames],
        bestItem,
        supplierPriceBand,
        featureHits,
        reasonLines: reasonLines.slice(0, 4),
        offerUrl: bestItem?.url || null,
        storeUrl: buildSellerLookupUrl(supplier.seller),
      };
    })
    .filter((supplier) => supplier.bestItem)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.offerCount || 0) - (left.offerCount || 0);
    })
    .slice(0, 4);
}

function analyzeSourcing(searchNames, items, seedDetail, benchmarkDetail, keywordSets) {
  const normalizedItems = dedupeSourcingItems(items).map((item) => {
    const classification = classifySourcingItem(item.title);
    return {
      ...item,
      supplyType: classification.type,
      supplyLabel: classification.label,
      supplyCaution: classification.caution,
    };
  });

  const directItems = normalizedItems.filter((item) => item.supplyType === 'direct');
  const brushItems = normalizedItems.filter((item) => item.supplyType === 'brush');
  const petItems = normalizedItems.filter((item) => item.supplyType === 'pet');
  const compactItems = normalizedItems.filter((item) => item.supplyType === 'compact');
  const priceBand = buildPriceBand(directItems.length ? directItems : normalizedItems);
  const uniqueSellers = new Set(normalizedItems.map((item) => item.seller).filter(Boolean));
  const sourceTargets = buildSourceTargets(seedDetail, benchmarkDetail, keywordSets);
  const recommendedSuppliers = buildSupplierRecommendations(directItems, sourceTargets, buildPriceBand(directItems));

  return {
    searchNames,
    items: normalizedItems,
    directItems,
    brushItems,
    petItems,
    compactItems,
    priceBand,
    totalCount: normalizedItems.length,
    directCount: directItems.length,
    brushCount: brushItems.length,
    petCount: petItems.length,
    compactCount: compactItems.length,
    uniqueSellerCount: uniqueSellers.size,
    sourceTargets,
    recommendedSuppliers,
  };
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

function countTokenOverlap(leftText, rightText) {
  const rightTokens = new Set(tokenize(rightText));
  return [...new Set(tokenize(leftText))].filter((token) => rightTokens.has(token)).length;
}

function buildKeywordTermSet(dataset) {
  return new Set([
    ...dataset.trafficTerms.map((item) => normalizeKeyword(item.keyword)),
    ...dataset.competitorKeywords.map((item) => normalizeKeyword(item.keyword)),
  ].filter(Boolean));
}

function getScenarioTermsFromSet(keywordSet) {
  return [...keywordSet].filter((keyword) => isScenarioKeyword(keyword));
}

function detectFindMismatch(seedTitle, candidateTitle) {
  const seedTokens = new Set(tokenize(seedTitle));
  const candidateTokens = new Set(tokenize(candidateTitle));

  const brushMismatch =
    (candidateTokens.has('brush') || candidateTokens.has('styler') || candidateTokens.has('volumizer')) &&
    !(seedTokens.has('brush') || seedTokens.has('styler') || seedTokens.has('volumizer'));
  const travelMismatch =
    (candidateTokens.has('compact') || candidateTokens.has('folding')) &&
    !(seedTokens.has('compact') || seedTokens.has('folding'));

  if (brushMismatch) {
    return '形态不一致，更像刷梳/造型器路线，不适合作为第一竞对。';
  }

  if (travelMismatch) {
    return '更偏 travel/compact 路线，流量有重叠，但不是当前主打法的直接竞对。';
  }

  return null;
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

async function fetchCandidateSignal(asin, site) {
  const [detailTool, trafficTool, competitorKeywordsTool] = await Promise.all([
    callSorftimeTool('product_detail', { asin, amzSite: site }),
    callSorftimeTool('product_traffic_terms', { asin, amzSite: site, page: 1 }),
    callSorftimeTool('competitor_product_keywords', { asin, keywordSupportSite: site, page: 1 }),
  ]);

  return {
    detail: parseProductDetail(detailTool.text, asin),
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
      sampleDate: sample?.date || '',
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

function formatSignedPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '未知';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${Number(value).toFixed(1)}%`;
}

function summarizeTrendSignal(trend) {
  if (!Array.isArray(trend) || trend.length < 2) {
    return null;
  }

  const values = trend.map((item) => item.value).filter((value) => value !== null && value !== undefined);
  if (values.length < 2) {
    return null;
  }

  const first = values[0];
  const last = values[values.length - 1];
  const peak = Math.max(...values);
  const trough = Math.min(...values);
  const delta = first ? ((last - first) / first) * 100 : null;

  return {
    first,
    last,
    peak,
    trough,
    delta,
  };
}

function describeKeywordAccessibility(detail) {
  const stats = detail?.pageOneStats;
  if (!stats) {
    return '首页门槛样本不足';
  }

  const lowReviewShare = stats.naturalLowReview100;
  const nonBestSellerShare = stats.nonBestSellerShare;
  if (
    lowReviewShare !== null &&
    lowReviewShare !== undefined &&
    nonBestSellerShare !== null &&
    nonBestSellerShare !== undefined
  ) {
    if (lowReviewShare <= 20 && nonBestSellerShare <= 20) {
      return '首页自然位门槛高，新品不容易裸冲';
    }

    if (lowReviewShare >= 30 || nonBestSellerShare >= 25) {
      return '首页仍有非头部进入窗口';
    }
  }

  return '首页进入难度中等，更适合场景词切入';
}

function summarizeTrafficStructure(dataset) {
  const organicPageOneKeywords = new Set();
  const adOnlyKeywords = new Set();
  const dualExposureKeywords = new Set();

  dataset.trafficTerms.forEach((item) => {
    if (item.organicRank?.page === 1) {
      organicPageOneKeywords.add(normalizeKeyword(item.keyword));
    }
    if (item.adRank && !item.organicRank) {
      adOnlyKeywords.add(normalizeKeyword(item.keyword));
    }
    if (item.adRank && item.organicRank) {
      dualExposureKeywords.add(normalizeKeyword(item.keyword));
    }
  });

  dataset.competitorKeywords.forEach((item) => {
    if (item.rank?.page === 1) {
      organicPageOneKeywords.add(normalizeKeyword(item.keyword));
    }
  });

  return {
    organicPageOneCount: [...organicPageOneKeywords].filter(Boolean).length,
    adOnlyCount: [...adOnlyKeywords].filter(Boolean).length,
    dualExposureCount: [...dualExposureKeywords].filter(Boolean).length,
  };
}

function extractClaimHighlights(detail) {
  const attributeHighlights = Object.entries(detail.attributes || {})
    .slice(0, 2)
    .map(([label, value]) => `${label}:${value}`);
  const featureHighlights = Object.entries(detail.features || {})
    .sort((left, right) => toNumber(right[1]) - toNumber(left[1]))
    .slice(0, 2)
    .map(([label, value]) => `${label} ${value}`);

  return [...attributeHighlights, ...featureHighlights].filter(Boolean).slice(0, 3);
}

function collectKeywordExpansionPoints(keywordIntel, brands) {
  const seen = new Set();
  const brandTokens = brands.flatMap((brand) => tokenize(brand));
  const seedKeywords = new Set(keywordIntel.map((item) => normalizeKeyword(item.keyword)));

  return keywordIntel
    .flatMap((item) => item.extends || [])
    .filter((entry) => entry.keyword && entry.monthlyVolume)
    .filter((entry) => !seedKeywords.has(normalizeKeyword(entry.keyword)))
    .filter((entry) => !brandTokens.some((token) => token && normalizeKeyword(entry.keyword).includes(token)))
    .sort((left, right) => (right.monthlyVolume || 0) - (left.monthlyVolume || 0))
    .filter((entry) => {
      const key = normalizeKeyword(entry.keyword);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 4)
    .map((entry) => `${entry.keyword}: 月搜 ${formatNumber(entry.monthlyVolume)} / CPC ${formatCurrency(entry.cpc)} / ${entry.seasonality || '季节性未知'}`);
}

function buildReviewEvidence(themes) {
  return themes
    .filter((theme) => theme.sampleTitle)
    .slice(0, 2)
    .map((theme) => `${theme.label}: ${theme.sampleTitle}${theme.sampleDate ? ` (${theme.sampleDate})` : ''}`);
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

  return [
    {
      label: 'Top100 月销量',
      value: formatNumber(categoryStats?.top100Sales),
      desc: `${categoryStats?.name || '当前类目'} 当前容量足够大，但不是低门槛市场。`,
    },
    {
      label: 'Top10 头部线',
      value: categoryStats?.top10AverageSales ? `${formatNumber(Math.round(categoryStats.top10AverageSales))} /月` : '未知',
      desc: categoryStats?.top10AverageRevenue
        ? `Top10 平均月销额约 ${formatCurrency(Math.round(categoryStats.top10AverageRevenue))}，这更接近真正头部款的成交线。`
        : '当前还缺少完整头部样本。',
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
      label: '评论门槛',
      value: formatPercent(categoryStats?.highReviewsShare),
      desc: `评价数 1000+ 的产品拿走了 ${formatPercent(categoryStats?.highReviewsShare)} 的销量，新品评论薄会很吃亏。`,
    },
    {
      label: '新品窗口',
      value: categoryStats?.newProductShare !== null && categoryStats?.newProductShare !== undefined ? formatPercent(categoryStats.newProductShare) : '未知',
      desc:
        categoryStats?.newProductAverageSales
          ? `近 1 年新品平均月销约 ${formatNumber(Math.round(categoryStats.newProductAverageSales))}，不是纯蓝海，但仍有结构化切入空间。`
          : '当前新品样本不足，先保守看待切入难度。',
    },
    {
      label: '头部集中度',
      value: formatPercent(categoryStats?.top3ProductShare),
      desc: `Top3 产品销量占比 ${formatPercent(categoryStats?.top3ProductShare)}，Top3 品牌占比 ${formatPercent(categoryStats?.top3BrandShare)}。`,
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
      title: '头部销量线',
      val1: categoryStats?.top10AverageSales ? `${formatNumber(left.detail.monthlySales)} vs ${formatNumber(categoryStats.top10AverageSales)}` : formatNumber(left.detail.monthlySales),
      val2: categoryStats?.top10AverageSales ? `${formatNumber(right.detail.monthlySales)} vs ${formatNumber(categoryStats.top10AverageSales)}` : formatNumber(right.detail.monthlySales),
      desc: categoryStats?.top10AverageSales
        ? `Top10 平均月销约 ${formatNumber(categoryStats.top10AverageSales)}。离这条线更近的一侧，更接近成熟头部款。`
        : '当前缺少足够头部样本，先用月销绝对值判断。',
      highlight:
        left.detail.monthlySales !== null && right.detail.monthlySales !== null
          ? compareByBetter(left, right, (dataset) => dataset.detail.monthlySales)
          : undefined,
    },
    {
      title: '新品进入窗口',
      val1: left.detail.listedAt || '未知',
      val2: right.detail.listedAt || '未知',
      desc: categoryStats?.newProductShare !== null && categoryStats?.newProductShare !== undefined
        ? `近 1 年新品占比约 ${formatPercent(categoryStats.newProductShare)}，新品平均月销约 ${formatNumber(categoryStats.newProductAverageSales)}。`
        : '当前新品样本不足，难以判断“新上架就能起量”的概率。',
      highlight:
        left.detail.daysLive !== null && right.detail.daysLive !== null
          ? compareByBetter(left, right, (dataset) => dataset.detail.daysLive, true)
          : undefined,
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
          value: secondCandidate?.detail?.brand || secondCandidate?.detail?.asin || '暂无第二候选',
          desc: secondCandidate
            ? `${secondCandidate.detail.asin} 也是可跟踪样本，但当前优先级低于第一竞对。`
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
        label: '当前标杆',
        value: winner.detail.brand || winner.detail.asin,
        desc: `${winner.detail.brand || winner.detail.asin} 现在更像这条类目的参考答案，销量、评论和自然位都更稳。`,
      },
      {
        label: '可拆对手',
        value: other.detail.brand || other.detail.asin,
        desc: `${other.detail.brand || other.detail.asin} 不是陪跑，它在 ${scenarioKeyword} 这类词上还有值得学、也值得避开的地方。`,
      },
      {
        label: '真正门槛',
        value: categoryStats?.medianPrice ? `中位价 ${formatCurrency(categoryStats.medianPrice)}` : '评论门槛',
        desc: '这条类目难做，不是因为没人买，而是因为价格带、评论门槛和头部款都已经比较强。',
      },
    ],
  };
}

function toFixedNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}

function buildCompareCommercialSnapshot(left, right, categoryStats, keywordSets) {
  const salesRatio =
    left.detail.monthlySales && right.detail.monthlySales
      ? toFixedNumber(Math.max(left.detail.monthlySales, right.detail.monthlySales) / Math.max(1, Math.min(left.detail.monthlySales, right.detail.monthlySales)), 1)
      : null;
  const revenueRatio =
    left.detail.monthlyRevenue && right.detail.monthlyRevenue
      ? toFixedNumber(Math.max(left.detail.monthlyRevenue, right.detail.monthlyRevenue) / Math.max(1, Math.min(left.detail.monthlyRevenue, right.detail.monthlyRevenue)), 1)
      : null;
  const reviewRatio =
    left.detail.reviewCount && right.detail.reviewCount
      ? toFixedNumber(Math.max(left.detail.reviewCount, right.detail.reviewCount) / Math.max(1, Math.min(left.detail.reviewCount, right.detail.reviewCount)), 1)
      : null;
  const medianPrice = categoryStats?.medianPrice;
  const priceGap =
    left.detail.price !== null && right.detail.price !== null
      ? toFixedNumber(Math.abs(left.detail.price - right.detail.price), 2)
      : null;
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || null;
  const leftTrend = summarizeTrendSignal(left.trend);
  const rightTrend = summarizeTrendSignal(right.trend);
  const leftTraffic = summarizeTrafficStructure(left);
  const rightTraffic = summarizeTrafficStructure(right);

  return {
    salesRatio,
    revenueRatio,
    reviewRatio,
    medianPrice,
    priceGap,
    scenarioKeyword,
    leftTrend,
    rightTrend,
    leftTraffic,
    rightTraffic,
  };
}

function buildCompareTitle(left, right, keywordSets) {
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const scenarioKeyword = keywordSets.scenario[0]?.keyword;

  if (scenarioKeyword) {
    return `${winner.detail.brand || winner.detail.asin} 是当前成交基准，${other.detail.brand || other.detail.asin} 更值得从 ${scenarioKeyword} 词路切开。`;
  }

  return `${winner.detail.brand || winner.detail.asin} 是当前成交基准，${other.detail.brand || other.detail.asin} 是更适合拆打法的挑战者。`;
}

function buildCompareSummary(left, right, categoryStats, keywordSets, keywordIntel) {
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const snapshot = buildCompareCommercialSnapshot(left, right, categoryStats, keywordSets);
  const genericKeyword = keywordSets.generic[0]?.keyword || '核心泛词';
  const scenarioKeyword = snapshot.scenarioKeyword;
  const topKeyword = keywordIntel[0]?.detail;
  const factLine = `先看结果：${left.detail.brand || left.detail.asin} 当前月销约 ${formatNumber(left.detail.monthlySales)}、月销额 ${formatCurrency(left.detail.monthlyRevenue)}；${right.detail.brand || right.detail.asin} 当前月销约 ${formatNumber(right.detail.monthlySales)}、月销额 ${formatCurrency(right.detail.monthlyRevenue)}。`;
  const categoryLine = categoryStats?.name
    ? `再看类目：两者都在 ${categoryStats.name}，中位价约 ${formatCurrency(categoryStats.medianPrice)}，Top10 平均月销约 ${formatNumber(Math.round(categoryStats.top10AverageSales || 0))}，高评论产品吃走了 ${formatPercent(categoryStats.highReviewsShare)} 的销量。`
    : '再看类目：当前类目样本还不够完整。';
  const trendLine =
    snapshot.leftTrend?.delta !== null && snapshot.rightTrend?.delta !== null
      ? `最近走势上，${left.detail.brand || left.detail.asin} 近 12 期约 ${formatSignedPercent(snapshot.leftTrend.delta)}，${right.detail.brand || right.detail.asin} 近 12 期约 ${formatSignedPercent(snapshot.rightTrend.delta)}。`
      : '最近走势上，当前趋势样本还不够完整。';
  const barrierLine = topKeyword?.pageOneStats
    ? `词路门槛也不低：在 ${topKeyword.keyword} 这个大词里，首页自然位里评论低于 100 的产品只占 ${formatPercent(topKeyword.pageOneStats.naturalLowReview100)}，说明不是随便一个新品就能冲上去。`
    : '词路门槛上，当前关键词首页样本还不够完整。';
  const verdictLine = `结论很简单：${winner.detail.brand || winner.detail.asin} 更像当前标杆，因为它在销量、评论和自然位上都更稳；${other.detail.brand || other.detail.asin} 真正值得学的，不是低价，而是 ${scenarioKeyword ? `${scenarioKeyword}` : genericKeyword} 这条更容易打透的词路。`;
  const actionLine = `下一步也很明确：先别继续硬打 ${genericKeyword} 这种最大词，先把 ${other.detail.brand || other.detail.asin} 的页面说清楚、差评问题压下去，再决定要不要放大预算。`;

  return [factLine, categoryLine, barrierLine, trendLine, verdictLine, actionLine].join(' ');
}

function buildCompareHeroCards(left, right, categoryStats, keywordSets) {
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const snapshot = buildCompareCommercialSnapshot(left, right, categoryStats, keywordSets);
  const scenarioKeyword = snapshot.scenarioKeyword;
  const otherTrend = other === left ? snapshot.leftTrend : snapshot.rightTrend;
  const otherTraffic = other === left ? snapshot.leftTraffic : snapshot.rightTraffic;

  return [
    {
      label: '当前标杆',
      value: winner.detail.brand || winner.detail.asin,
      desc: `${winner.detail.brand || winner.detail.asin} 现在更像头部基准，销量、评论和自然位都更完整。`,
    },
    {
      label: '可拆信号',
      value: other.detail.brand || other.detail.asin,
      desc:
        scenarioKeyword
          ? `${other.detail.brand || other.detail.asin} 体量没赢，但${otherTrend?.delta !== null ? `最近还在涨，` : ''}${scenarioKeyword} 这类词上还有切入机会。`
          : `${other.detail.brand || other.detail.asin} 更适合拿来拆词路、页面和进攻方式。`,
    },
    {
      label: '下一步',
      value: scenarioKeyword || (categoryStats?.medianPrice ? `中位价 ${formatCurrency(categoryStats.medianPrice)}` : '先拆高意图词'),
      desc:
        scenarioKeyword
          ? otherTraffic.adOnlyCount > 0
            ? `先把 ${scenarioKeyword} 相关页面和广告理顺。现在还有不少词靠广告撑着，不适合马上放量。`
            : `先把 ${scenarioKeyword} 相关页面说清楚，先补转化，再谈加预算。`
          : `先把价格、评论和高频差评看明白，再决定怎么切进去。`,
    },
  ];
}

function buildCompareSectionCopy(left, right, categoryStats, keywordSets) {
  const snapshot = buildCompareCommercialSnapshot(left, right, categoryStats, keywordSets);
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const leftLabel = left.detail.brand || left.detail.asin;
  const rightLabel = right.detail.brand || right.detail.asin;

  return {
    products: `两款 ASIN 在同一个类目里都卖得动，但走的不是一条路：一个更像成熟款，一个更像还在找突破口的款。`,
    comparison: `这部分不只是比参数，而是回答一个更实际的问题：${other.detail.brand || other.detail.asin} 如果还想往上做，到底该学 ${winner.detail.brand || winner.detail.asin} 什么，不该学什么。当前销量差大约 ${snapshot.salesRatio ? `${snapshot.salesRatio} 倍` : '未知'}，评论差大约 ${snapshot.reviewRatio ? `${snapshot.reviewRatio} 倍` : '未知'}。`,
    modeFocus: '先把角色看清楚：谁是现在的参考答案，谁只是给我们提供打法样本。',
    category: `这个类目有量，但并不好打。真正的门槛不是“有没有需求”，而是价格带、评论门槛和头部款已经卷到什么程度。`,
    traffic: snapshot.scenarioKeyword
      ? `流量结构已经比较清楚：${winner.detail.brand || winner.detail.asin} 更像守住大词的一方，${other.detail.brand || other.detail.asin} 更适合从 ${snapshot.scenarioKeyword} 这种更具体的词切进去。`
      : '流量结构已经比较清楚：真正值得抢的，不一定是最大词，而是更容易转化的具体词。',
    reviews: `评论这里重点看两件事：什么在帮它成交，什么会让它一放量就开始掉分、退货。`,
    actions: `下面的建议默认都是给 ${other.detail.brand || other.detail.asin} 用的，目标不是把它做成另一个 ${winner.detail.brand || winner.detail.asin}，而是让它先站稳。`,
    roadmap: `${other.detail.brand || other.detail.asin} 后面最合理的顺序是：先把转化基础修好，再把细分词跑稳，最后再考虑扩量。`,
  };
}

function buildCompareTrafficInsight(left, right, categoryStats, keywordIntel, keywordSets) {
  const topKeyword = keywordIntel[0]?.detail;
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '高意图词';
  const trafficLeft = summarizeTrafficStructure(left);
  const trafficRight = summarizeTrafficStructure(right);
  const expansion = collectKeywordExpansionPoints(keywordIntel, [left.detail.brand || '', right.detail.brand || ''])[0];
  const barrierText = topKeyword?.pageOneStats
    ? `以 ${topKeyword.keyword} 这个大词看，首页里低评论产品并不多，说明这个词不是新链接轻松能抢下来的。`
    : '当前还没有足够稳定的首页门槛样本。';

  return [
    `先看大盘：${categoryStats?.name || '当前类目'} Top100 月销量约 ${formatNumber(categoryStats?.top100Sales)}，中位价 ${formatCurrency(categoryStats?.medianPrice)}。`,
    topKeyword
      ? `再看核心词：${topKeyword.keyword} 月搜索量约 ${formatNumber(topKeyword.monthlyVolume)}，推荐 CPC ${formatCurrency(topKeyword.cpc)}，搜索结果约 ${formatNumber(topKeyword.resultCount)}。`
      : '再看核心词：当前关键词细节样本不足。',
    barrierText,
    expansion
      ? `接下来更值得测的长尾词里，${expansion}。`
      : '接下来更值得测的长尾词样本还不够。',
    `结论：${winner.detail.brand || winner.detail.asin} 更像守住大词的一方，${other.detail.brand || other.detail.asin} 更适合先从 ${scenarioKeyword} 这种更具体的词切，不要一开始就去硬拼最大词。`,
  ].join(' ');
}

function buildCompareComparisonRows(left, right, genericKeywordPair, keywordIntel) {
  const baseRows = buildComparisonRows(left, right, genericKeywordPair);
  const leftTrend = summarizeTrendSignal(left.trend);
  const rightTrend = summarizeTrendSignal(right.trend);
  const leftTraffic = summarizeTrafficStructure(left);
  const rightTraffic = summarizeTrafficStructure(right);
  const leftClaims = extractClaimHighlights(left.detail);
  const rightClaims = extractClaimHighlights(right.detail);
  const topKeyword = keywordIntel[0]?.detail;

  return [
    {
      title: '标题与定位',
      val1: trimText(left.detail.title),
      val2: trimText(right.detail.title),
      desc: '先看它到底在卖“什么东西、给谁用、什么场景用”，这会直接影响点进来的人准不准。',
    },
    ...baseRows,
    {
      title: '变体策略',
      val1: formatNumber(left.detail.variations),
      val2: formatNumber(right.detail.variations),
      desc: '变体多不代表一定卖得更好，但通常说明它接得住更多颜色、附件或人群需求。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.variations),
    },
    {
      title: '卖家来源 / 上架时间',
      val1: `${left.detail.sellerSource || '未知'} / ${left.detail.listedAt || '未知'}`,
      val2: `${right.detail.sellerSource || '未知'} / ${right.detail.listedAt || '未知'}`,
      desc: '这里主要看两件事：它是老链接慢慢做起来的，还是新链接快速冲起来的。',
    },
    {
      title: '包装 / 重量',
      val1: `${left.detail.packageSizeCm || '未知'} / ${left.detail.weightG ? `${left.detail.weightG}g` : '未知'}`,
      val2: `${right.detail.packageSizeCm || '未知'} / ${right.detail.weightG ? `${right.detail.weightG}g` : '未知'}`,
      desc: '包装和重量会直接影响 FBA 和运输成本，所以不能只看售价判断它赚不赚钱。',
    },
    {
      title: '近12期销量趋势',
      val1: leftTrend ? `${formatNumber(leftTrend.first)} -> ${formatNumber(leftTrend.last)} (${formatSignedPercent(leftTrend.delta)})` : '样本不足',
      val2: rightTrend ? `${formatNumber(rightTrend.first)} -> ${formatNumber(rightTrend.last)} (${formatSignedPercent(rightTrend.delta)})` : '样本不足',
      desc: '只看单月容易误判，这里主要看它是在稳着卖、往下掉，还是还在往上冲。',
      highlight:
        leftTrend?.delta !== null && rightTrend?.delta !== null
          ? compareByBetter({ detail: { delta: leftTrend.delta } }, { detail: { delta: rightTrend.delta } }, (dataset) => dataset.detail.delta)
          : undefined,
    },
    {
      title: '自然覆盖 / 广告依赖',
      val1: `P1 自然词 ${leftTraffic.organicPageOneCount} / 广告独占 ${leftTraffic.adOnlyCount}`,
      val2: `P1 自然词 ${rightTraffic.organicPageOneCount} / 广告独占 ${rightTraffic.adOnlyCount}`,
      desc: '自然词多的一边更稳，很多词只能靠广告顶着的一边，放量风险也更大。',
      highlight:
        leftTraffic.organicPageOneCount !== rightTraffic.organicPageOneCount
          ? leftTraffic.organicPageOneCount > rightTraffic.organicPageOneCount ? 'left' : 'right'
          : undefined,
    },
    {
      title: '核心词首页门槛',
      val1: `${formatNumber(left.detail.reviewCount)} 评 / ${describeKeywordAccessibility(topKeyword)}`,
      val2: `${formatNumber(right.detail.reviewCount)} 评 / ${describeKeywordAccessibility(topKeyword)}`,
      desc: topKeyword?.pageOneStats
        ? `以 ${topKeyword.keyword} 为例，首页里低评论产品不多，所以这个词不是靠一条新链接就能轻松打上去的。`
        : '当前还没有足够稳定的首页门槛样本。',
      highlight: compareByBetter(left, right, (dataset) => dataset.detail.reviewCount),
    },
    {
      title: '卖点与属性承诺',
      val1: leftClaims.join(' / ') || '样本不足',
      val2: rightClaims.join(' / ') || '样本不足',
      desc: '这里看的是它页面到底在承诺什么，这些承诺能不能在图片和评论里对得上。',
    },
  ];
}

function buildCompareTrafficColumns(left, right, keywordSets, keywordIntel) {
  const trafficLeft = summarizeTrafficStructure(left);
  const trafficRight = summarizeTrafficStructure(right);
  const expansionPoints = collectKeywordExpansionPoints(keywordIntel, [left.detail.brand || '', right.detail.brand || '']);
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
    return `${detail.keyword || item.keyword}: 月搜 ${formatNumber(detail.monthlyVolume)} / CPC ${formatCurrency(detail.cpc)} / 结果数 ${formatNumber(detail.resultCount)} / ${describeKeywordAccessibility(detail)}`;
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
    {
      eyebrow: '扩展词与依赖度',
      title: expansionPoints.length ? '下一批该进测试池的长尾词' : '先看自然盘和广告盘结构',
      points: expansionPoints.length
        ? [
            ...expansionPoints.slice(0, 2),
            `${left.detail.brand}: P1 自然词 ${trafficLeft.organicPageOneCount} / 广告独占 ${trafficLeft.adOnlyCount}`,
            `${right.detail.brand}: P1 自然词 ${trafficRight.organicPageOneCount} / 广告独占 ${trafficRight.adOnlyCount}`,
          ]
        : [
            `${left.detail.brand}: P1 自然词 ${trafficLeft.organicPageOneCount} / 广告独占 ${trafficLeft.adOnlyCount}`,
            `${right.detail.brand}: P1 自然词 ${trafficRight.organicPageOneCount} / 广告独占 ${trafficRight.adOnlyCount}`,
          ],
    },
  ];
}

function buildCompareReviewBlocks(left, right) {
  const leftPositive = summarizeReviewThemes(left.positiveReviews);
  const leftNegative = summarizeReviewThemes(left.negativeReviews);
  const rightPositive = summarizeReviewThemes(right.positiveReviews);
  const rightNegative = summarizeReviewThemes(right.negativeReviews);

  return buildReviewBlocks(left, right).map((block, index) => {
    const positives = index === 0 ? leftPositive : rightPositive;
    const negatives = index === 0 ? leftNegative : rightNegative;

    return {
      ...block,
      evidence: [...buildReviewEvidence(positives), ...buildReviewEvidence(negatives)].slice(0, 4),
      opportunities: block.negatives[0] && block.positives[0]
        ? [
            `先修 ${block.negatives[0]}，否则放量只会放大差评。`,
            `把 ${block.positives[0]} 变成主图或副图里可被验证的承诺。`,
            ...block.opportunities,
          ].slice(0, 3)
        : block.opportunities,
    };
  });
}

function buildCompareActionCards(left, right, keywordSets, categoryStats) {
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const challengerRisks = summarizeReviewThemes(other.negativeReviews);
  const topRisk = challengerRisks[0];
  const genericKeyword = keywordSets.generic[0]?.keyword || '核心泛词';
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || genericKeyword || '核心场景词';
  const medianPrice = categoryStats?.medianPrice;

  return [
    {
      priority: 'P0',
      title: topRisk ? `先修 ${other.detail.brand || other.detail.asin} 的 ${topRisk.label}` : `先修 ${other.detail.brand || other.detail.asin} 的高频负评点`,
      desc: topRisk
        ? `现在最先要处理的是 ${topRisk.label}。这个问题不解决，流量再多也只会把差评放大。`
        : `先把 ${other.detail.brand || other.detail.asin} 最常见的负评问题压下去，再谈放量。`,
      accentClass: 'border-t-red-500',
    },
    {
      priority: 'P1',
      title: `围绕 ${scenarioKeyword} 重写 ${other.detail.brand || other.detail.asin} 的标题与主图`,
      desc: `把 ${scenarioKeyword} 放进标题、主图和副图里，让用户一眼看懂它卖的到底是什么，不要再写得模糊。`,
      accentClass: 'border-t-orange-400',
    },
    {
      priority: 'P1',
      title: `别再硬拼 ${genericKeyword}，拆成防守盘和进攻盘`,
      desc: `${genericKeyword} 这种大词先少打，先把 ${scenarioKeyword} 这种更具体、更容易成交的词跑顺。`,
      accentClass: 'border-t-blue-500',
    },
    {
      priority: 'P2',
      title: medianPrice ? `围绕中位价 ${formatCurrency(medianPrice)} 校正 ${other.detail.brand || other.detail.asin} 客单` : '复盘价格带与利润空间',
      desc: `不要一味压低价格。要把售价、FBA、广告成本一起看，先确认这条路做下来到底赚不赚钱。`,
      accentClass: 'border-t-emerald-500',
    },
  ];
}

function buildCompareRoadmapSteps(left, right, keywordSets) {
  const winnerState = chooseWinner(left, right);
  const winner = winnerState.winner;
  const other = winnerState.other;
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心场景词';
  const topRisk = summarizeReviewThemes(other.negativeReviews)[0];

  return [
    {
      phase: 'Week 1',
      title: `先拆 ${other.detail.brand || other.detail.asin} 为什么输给 ${winner.detail.brand || winner.detail.asin}`,
      desc: '先把价格、评论、标题和主图放在一起看清楚，确认它到底输在产品、流量还是页面表达。',
    },
    {
      phase: 'Week 2',
      title: `围绕 ${scenarioKeyword} 改标题、主图和 bullet`,
      desc: '让用户搜这个词进来以后，第一眼就知道这是不是他要的东西，别让流量白白流失。',
    },
    {
      phase: 'Week 3',
      title: '重建广告分组',
      desc: `大词单独守，${scenarioKeyword} 这类词单独打，产品词和竞品词分开，不要再混在一起烧钱。`,
    },
    {
      phase: 'Week 4',
      title: topRisk ? `按 ${topRisk.label} 的反馈决定是否做产品修正` : '按评论反馈决定是否做变体或产品修正',
      desc: `先看最关键的负评有没有压下来，再决定要不要改产品、扩颜色或者扩场景版本。`,
    },
  ];
}

function buildFindTitle(seed, primary) {
  return `${seed.detail.brand || seed.detail.asin} 的第一竞对是 ${primary.detail.brand || primary.detail.asin}，先盯它，不要先盯整类目。`;
}

function buildFindSummary(seed, primary, categoryStats, candidates, keywordIntel, extraNote) {
  const topKeyword = keywordIntel[0]?.detail;
  const second = candidates[1];

  return [
    `这次不是直接做双 ASIN 对比，而是先回答一个更重要的问题：${seed.detail.brand || seed.detail.asin} 现在最该盯谁。`,
    `${seed.detail.brand || seed.detail.asin} 当前月销约 ${formatNumber(seed.detail.monthlySales)}，价格 ${formatCurrency(seed.detail.price)}；锁定的第一竞对 ${primary.detail.brand || primary.detail.asin} 当前月销约 ${formatNumber(primary.detail.monthlySales)}，价格 ${formatCurrency(primary.detail.price)}。`,
    categoryStats?.name
      ? `两者都在 ${categoryStats.name}，类目中位价约 ${formatCurrency(categoryStats.medianPrice)}，高评论产品拿走了 ${formatPercent(categoryStats.highReviewsShare)} 的销量。`
      : '当前类目统计样本还不够完整。',
    topKeyword
      ? `从词路看，${topKeyword.keyword} 月搜索量约 ${formatNumber(topKeyword.monthlyVolume)}，这说明这个类目该先盯“谁在吃这些词”，而不是先盯“谁看起来像”。`
      : '从词路看，当前关键词细节样本还不够完整。',
    `${primary.detail.brand || primary.detail.asin} 被锁成第一竞对，核心原因是它和种子 ASIN 在价格带、标题结构、共享高意图词和类目位置上都最接近。`,
    second
      ? `${second.detail.brand || second.detail.asin} 也值得进 watchlist，但更适合作为第二观察位，不是第一优先。`
      : '当前没有足够强的第二观察位样本。',
    extraNote,
  ].filter(Boolean).join(' ');
}

function buildFindModeFocus(seed, primary, candidates, keywordSets) {
  const second = candidates[1];
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';

  return {
    title: '锁定逻辑',
    cards: [
      {
        label: '第一竞对',
        value: primary.detail.brand || primary.detail.asin,
        desc: '不是因为它卖得最多，而是因为它和种子 ASIN 最像同一场仗里的对手。',
      },
      {
        label: '第二观察位',
        value: second?.detail.brand || second?.detail.asin || '暂无更强候选',
        desc: second
          ? `${second.detail.brand || second.detail.asin} 可以进 watchlist，但优先级低于第一竞对。`
          : '当前候选池里还没有足够强的第二观察位。',
      },
      {
        label: '先盯什么',
        value: scenarioKeyword,
        desc: `先盯 ${scenarioKeyword}、价格动作和评论变化，再决定要学它的产品路，还是学它的词路。`,
      },
    ],
  };
}

function buildFindHeroCards(seed, primary, candidates, keywordSets) {
  const second = candidates[1];
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';

  return [
    {
      label: '第一竞对',
      value: primary.detail.brand || primary.detail.asin,
      desc: `当前月销约 ${formatNumber(primary.detail.monthlySales)}，价格 ${formatCurrency(primary.detail.price)}，是最该先盯的样本。`,
    },
    {
      label: 'Watchlist',
      value: second?.detail?.brand || second?.detail?.asin || '暂无第二观察位',
      desc: second
        ? '除了第一竞对，还要保留第二观察位，避免把个别样本误当成全类目答案。'
        : '当前还缺第二观察位，后面需要继续补候选池。',
    },
    {
      label: '先盯什么',
      value: scenarioKeyword,
      desc: `先盯 ${scenarioKeyword}、价格动作和评论变化，再判断该学它的产品路还是词路。`,
    },
  ];
}

function buildFindCandidatePoolCards(candidates) {
  const directCandidates = candidates.filter((candidate) => candidate.role !== '排除项').slice(0, 3);
  const excludedCandidate = candidates.find((candidate) => candidate.role === '排除项');
  const cards = [...directCandidates];

  if (excludedCandidate) {
    cards.push(excludedCandidate);
  }

  return cards.slice(0, 4).map((candidate, index) => ({
    eyebrow: index === 0 ? '第一优先' : candidate.role,
    title: `${candidate.detail.brand || candidate.detail.asin} / ${candidate.detail.asin}`,
    summary:
      candidate.role === '排除项'
        ? '这支样本流量可能有重叠，但产品路线不够像，不适合作为第一竞对。'
        : `${candidate.detail.brand || candidate.detail.asin} 值得盯，因为它和种子 ASIN 在词路、价格带或产品定义上足够接近。`,
    points: [
      `月销 ${formatNumber(candidate.detail.monthlySales)} / 价格 ${formatCurrency(candidate.detail.price)} / 类目排名 ${formatRank(candidate.detail)}`,
      `共享词约 ${formatNumber(candidate.sharedKeywordCount)} 个，核心场景词重合约 ${formatNumber(candidate.sharedScenarioCount)} 个`,
      ...candidate.reasonLines,
    ].slice(0, 5),
    caution: candidate.mismatchReason || undefined,
  }));
}

function buildFindSectionCopy(seed, primary) {
  return {
    products: `先看种子 ASIN 和锁定出来的第一竞对，确认它们到底是不是同一类打法。`,
    modeFocus: '这里先回答“为什么锁它”，而不是直接进入双 ASIN 对比。',
    candidates: '候选池不是越多越好，而是要分清谁是第一竞对、谁只是观察样本、谁应该排除。',
    comparison: `这一段主要解释：为什么 ${primary.detail.brand || primary.detail.asin} 是当前最值得盯的第一竞对。`,
    category: '类目环境不是用来看热闹的，而是用来判断这支竞对值不值得当长期参考样本。',
    traffic: '真正要看的不是“它有没有流量”，而是它和种子 ASIN 到底抢的是不是同一批词。',
    reviews: `评论区主要用来判断：这支竞对的优势是真优势，还是只是靠价格或广告短期撑起来。`,
    actions: `下面的建议默认都是围绕 ${seed.detail.brand || seed.detail.asin} 展开，目标是先盯对人，再抄对打法。`,
    roadmap: '找竞对的最终目的不是找一支 ASIN 收藏起来，而是建立一套可持续跟踪的 watchlist。',
  };
}

function buildFindComparisonRows(seed, primary, candidates, genericKeywordPair) {
  const second = candidates[1];
  const sharedTerms = candidates[0]?.sharedScenarioTerms || [];

  return [
    {
      title: '为什么先锁它',
      val1: seed.detail.brand || seed.detail.asin,
      val2: primary.detail.brand || primary.detail.asin,
      desc: `${primary.detail.brand || primary.detail.asin} 和种子 ASIN 同类目、价格带接近、标题结构接近，且共享的高意图词更多。`,
    },
    {
      title: '价格带',
      val1: formatCurrency(seed.detail.price),
      val2: formatCurrency(primary.detail.price),
      desc: '价格带接近，说明两者更可能在同一批用户心智里竞争。',
      highlight: compareByBetter(seed, primary, (dataset) => dataset.detail.price, true),
    },
    {
      title: '月销量 / 类目排名',
      val1: `${formatNumber(seed.detail.monthlySales)} / ${formatRank(seed.detail)}`,
      val2: `${formatNumber(primary.detail.monthlySales)} / ${formatRank(primary.detail)}`,
      desc: '这里不是只看谁卖得多，而是看它是不是已经在类目里站稳。',
      highlight: compareByBetter(seed, primary, (dataset) => dataset.detail.monthlySales),
    },
    {
      title: '评论基础',
      val1: `${formatNumber(seed.detail.reviewCount)} / ${seed.detail.rating?.toFixed(1) || '未知'}`,
      val2: `${formatNumber(primary.detail.reviewCount)} / ${primary.detail.rating?.toFixed(1) || '未知'}`,
      desc: '评论差距决定它是“真标杆”，还是“短期爬坡样本”。',
      highlight: compareByBetter(seed, primary, (dataset) => dataset.detail.reviewCount),
    },
    {
      title: '共享高意图词',
      val1: sharedTerms.length ? sharedTerms.join(' / ') : '样本不足',
      val2: `${formatNumber(candidates[0]?.sharedScenarioCount)} 个重合`,
      desc: '高意图词重合越多，越说明它们在抢的是同一类转化需求。',
    },
    {
      title: '核心泛词自然位',
      val1: genericKeywordPair?.leftLabel || '未进样本',
      val2: genericKeywordPair?.rightLabel || '未进样本',
      desc: genericKeywordPair
        ? `以 ${genericKeywordPair.keyword} 为例，先看谁已经在免费流量里站住。`
        : '当前没有足够稳定的泛词样本可做自然位判断。',
      highlight: genericKeywordPair?.winner,
    },
    {
      title: '第二观察位',
      val1: second?.detail.brand || '暂无',
      val2: second?.sharedScenarioTerms?.slice(0, 2).join(' / ') || '暂无',
      desc: second
        ? `${second.detail.brand || second.detail.asin} 可以进 watchlist，但当前更适合拿来补样本，不适合当第一竞对。`
        : '当前候选池里没有更强的第二观察位。',
    },
  ];
}

function buildFindTrafficColumns(seed, primary, candidates, keywordSets, keywordIntel) {
  const sharedScenarioTerms = candidates[0]?.sharedScenarioTerms || [];
  const detailPoints = keywordIntel.slice(0, 3).map((item) => {
    const detail = item.detail;
    return `${detail.keyword || item.keyword}: 月搜 ${formatNumber(detail.monthlyVolume)} / CPC ${formatCurrency(detail.cpc)} / 结果数 ${formatNumber(detail.resultCount)}`;
  });
  const second = candidates[1];

  return [
    {
      eyebrow: '为什么锁它',
      title: sharedScenarioTerms.length ? '共享高意图词足够多' : '共享词样本不足',
      points: sharedScenarioTerms.length
        ? sharedScenarioTerms.slice(0, 4).map((term) => `${term}: 种子 ASIN 和第一竞对都在吃这类词`)
        : ['当前还没有足够强的共享场景词样本。'],
    },
    {
      eyebrow: '该先盯哪些词',
      title: keywordSets.scenario.length ? '先盯高意图词，不先盯最大泛词' : '先盯核心泛词',
      accent: true,
      points: keywordSets.scenario.length
        ? keywordSets.scenario.slice(0, 4).map((item) => item.keyword)
        : keywordSets.generic.slice(0, 4).map((item) => item.keyword),
    },
    {
      eyebrow: '关键词门槛',
      title: detailPoints.length ? '这几个词最值得做监控' : '关键词细节样本不足',
      points: detailPoints.length ? detailPoints : ['当前还没有足够稳定的关键词细节样本。'],
    },
    {
      eyebrow: 'Watchlist',
      title: second ? `${second.detail.brand || second.detail.asin} 作为第二观察位` : '当前暂无第二观察位',
      points: second
        ? [
            `共享词约 ${formatNumber(second.sharedKeywordCount)} 个`,
            `共享场景词：${second.sharedScenarioTerms.slice(0, 3).join(' / ') || '暂无'}`,
            second.mismatchReason || '可以补充观察，但先不作为第一竞对。',
          ]
        : ['当前类目里没有足够可信的第二观察位。'],
    },
  ];
}

function buildFindTrafficInsight(seed, primary, candidates, categoryStats, keywordIntel) {
  const topKeyword = keywordIntel[0]?.detail;
  const second = candidates[1];

  return [
    `先看大盘：${categoryStats?.name || '当前类目'} Top100 月销量约 ${formatNumber(categoryStats?.top100Sales)}，中位价 ${formatCurrency(categoryStats?.medianPrice)}。`,
    topKeyword
      ? `再看核心词：${topKeyword.keyword} 月搜索量约 ${formatNumber(topKeyword.monthlyVolume)}，推荐 CPC ${formatCurrency(topKeyword.cpc)}。`
      : '再看核心词：当前关键词细节样本不足。',
    `之所以先锁 ${primary.detail.brand || primary.detail.asin}，不是因为它恰好卖得好，而是因为它和种子 ASIN 吃的是同一批更具体的词。`,
    second
      ? `${second.detail.brand || second.detail.asin} 也要进 watchlist，但目前更适合做补充观察，不适合作第一优先。`
      : '当前没有足够强的第二观察位。',
  ].join(' ');
}

function buildFindReviewBlocks(seed, primary) {
  return [
    {
      eyebrow: '种子 ASIN',
      title: seed.detail.brand || seed.detail.asin,
      summary: '先看种子 ASIN 当前已经被用户认可什么、又卡在哪些问题上，这决定后面该盯什么竞对。',
      positives: summarizeReviewThemes(seed.positiveReviews).map((theme) => theme.label),
      negatives: summarizeReviewThemes(seed.negativeReviews).map((theme) => theme.label),
      opportunities: [
        '先确认它的优势到底来自产品本身，还是只是吃到了某一批词。',
        '先确认高频差评会不会影响后面跟竞对学习时的判断。',
      ],
      evidence: buildReviewEvidence([
        ...summarizeReviewThemes(seed.positiveReviews),
        ...summarizeReviewThemes(seed.negativeReviews),
      ]),
    },
    {
      eyebrow: '第一竞对',
      title: primary.detail.brand || primary.detail.asin,
      summary: '这里不是为了找它的毛病，而是为了判断：它的优势能不能学，它的坑要不要避开。',
      positives: summarizeReviewThemes(primary.positiveReviews).map((theme) => theme.label),
      negatives: summarizeReviewThemes(primary.negativeReviews).map((theme) => theme.label),
      opportunities: [
        '优先看它哪些卖点在评论里被反复验证，这才是值得学的部分。',
        '如果它的负评集中在某一类体验问题，那就别把这条路当成完整答案。',
      ],
      evidence: buildReviewEvidence([
        ...summarizeReviewThemes(primary.positiveReviews),
        ...summarizeReviewThemes(primary.negativeReviews),
      ]),
    },
  ];
}

function buildFindActionCards(seed, primary, keywordSets, candidates, categoryStats) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';
  const second = candidates[1];

  return [
    {
      priority: 'P0',
      title: `先盯 ${primary.detail.brand || primary.detail.asin} 的价格、评论和核心词`,
      desc: '不要一上来就跟整类目。先把第一竞对盯透，才能知道它到底是价格标杆、词路标杆，还是产品标杆。',
      accentClass: 'border-t-red-500',
    },
    {
      priority: 'P1',
      title: `围绕 ${scenarioKeyword} 建立监控词表`,
      desc: `先围绕 ${scenarioKeyword} 这类词看自然位、广告位和页面表达，别先被最大泛词带偏。`,
      accentClass: 'border-t-orange-400',
    },
    {
      priority: 'P1',
      title: second ? `把 ${second.detail.brand || second.detail.asin} 放进第二观察位` : '补一个第二观察位',
      desc: second
        ? '不要只盯一支 ASIN。至少保留第二观察位，避免把个别样本误当成整类目的标准答案。'
        : '当前还缺第二观察位，后面需要继续补候选池。',
      accentClass: 'border-t-blue-500',
    },
    {
      priority: 'P2',
      title: categoryStats?.medianPrice ? `结合中位价 ${formatCurrency(categoryStats.medianPrice)} 看值不值得跟` : '结合价格带判断值不值得跟',
      desc: '不是所有高销量样本都值得跟。价格带、评论门槛和词路结构一起成立，才值得长期跟。 ',
      accentClass: 'border-t-emerald-500',
    },
  ];
}

function buildFindRoadmapSteps(seed, primary, candidates, keywordSets) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';
  const second = candidates[1];

  return [
    {
      phase: 'Week 1',
      title: `先把 ${primary.detail.brand || primary.detail.asin} 盯透`,
      desc: '固定看价格、评论增速、核心词自然位和主图变化，先判断它到底是哪种标杆。',
    },
    {
      phase: 'Week 2',
      title: `围绕 ${scenarioKeyword} 拆页面和投放`,
      desc: '重点看它标题前半句、主图卖点、附件组合和广告在打哪些词。',
    },
    {
      phase: 'Week 3',
      title: second ? `把 ${second.detail.brand || second.detail.asin} 拉进 watchlist` : '补第二观察位',
      desc: second
        ? '用第二观察位校正判断，避免把第一竞对的个别打法误当成唯一答案。'
        : '继续补候选池，至少要再拉一支能长期跟踪的备选样本。',
    },
    {
      phase: 'Week 4',
      title: '形成长期监控清单',
      desc: '最后沉淀成固定 watchlist、固定关键词和固定监控指标，而不是下次再从头找一遍。',
    },
  ];
}

function evaluateSourceVerdict(categoryStats, sourcing) {
  const competitionHigh = (categoryStats?.highReviewsShare || 0) >= 75 || (categoryStats?.top3ProductShare || 0) >= 25;
  const roomExists = (categoryStats?.top100Sales || 0) >= 150000 && (categoryStats?.medianPrice || 0) >= 20;
  const supplyReady = sourcing.recommendedSuppliers.length >= 2;

  if (roomExists && supplyReady && !competitionHigh) {
    return {
      label: '可以进入第一轮寻源',
      desc: '类目空间成立，1688 侧也已经有可联系的供应商，可以先打样，不用继续空转。',
    };
  }

  if (roomExists && supplyReady) {
    return {
      label: '可以找厂，但别走低价货盘',
      desc: '类目需求成立，但评论门槛和头部竞争不低，后面必须按目标款找厂，不适合拿便宜货硬上。',
    };
  }

  return {
    label: '先缩小机会，再继续找厂',
    desc: '现在不是没有货，而是还没有足够可信的 shortlist，应该先把产品定义和筛厂口径再收紧。',
  };
}

function buildSourceTitle(seed, benchmark, categoryStats, sourcing) {
  const verdict = evaluateSourceVerdict(categoryStats, sourcing);
  const brand = seed.detail.brand || seed.detail.asin;

  if (sourcing.recommendedSuppliers.length >= 2) {
    return `${brand} 这条路${verdict.label}，先联系 ${sourcing.recommendedSuppliers.slice(0, 2).map((item) => item.seller).join('、')}。`;
  }

  return `${brand} 这条路需求成立，但推荐厂家还不够，先别急着批量问价。`;
}

function buildSourceSummary(seed, benchmark, categoryStats, keywordIntel, sourcing, extraNote) {
  const topKeyword = keywordIntel[0]?.detail;
  const priceBand = sourcing.priceBand;
  const verdict = evaluateSourceVerdict(categoryStats, sourcing);
  const supplierLine = sourcing.recommendedSuppliers.length
    ? `当前第一轮推荐先联系 ${sourcing.recommendedSuppliers.slice(0, 3).map((item) => item.seller).join('、')}。`
    : '当前还没有拉出足够可信的厂家 shortlist。';

  return [
    `这次去寻源先回答三件事：这个 Amazon 机会值不值得做、竞争门槛高不高、1688 有没有值得先聊的厂。`,
    `Amazon 侧先拿 ${benchmark.detail.brand || benchmark.detail.asin} 做基准。${seed.detail.brand || seed.detail.asin} 当前月销约 ${formatNumber(seed.detail.monthlySales)}，${benchmark.detail.brand || benchmark.detail.asin} 当前月销约 ${formatNumber(benchmark.detail.monthlySales)}。`,
    categoryStats?.name
      ? `${categoryStats.name} 当前 Top100 月销量约 ${formatNumber(categoryStats.top100Sales)}，中位价约 ${formatCurrency(categoryStats.medianPrice)}，高评论产品拿走了 ${formatPercent(categoryStats.highReviewsShare)} 的销量。`
      : '当前类目样本还不够完整。',
    topKeyword
      ? `需求词里，${topKeyword.keyword} 月搜索量约 ${formatNumber(topKeyword.monthlyVolume)}，说明这不是没需求的路子。`
      : '关键词需求样本还不够完整。',
    priceBand
      ? `1688 侧这次一共拉到 ${formatNumber(sourcing.totalCount)} 条样本，其中直机样本约 ${formatNumber(sourcing.directCount)} 条，供给参考带主要落在 ¥${priceBand.min} - ¥${priceBand.max}。`
      : `1688 侧这次一共拉到 ${formatNumber(sourcing.totalCount)} 条样本，但还没有形成稳定价格带。`,
    `${verdict.label}。${verdict.desc}`,
    supplierLine,
    extraNote,
  ].filter(Boolean).join(' ');
}

function buildSourceHeroCards(seed, benchmark, categoryStats, sourcing) {
  const verdict = evaluateSourceVerdict(categoryStats, sourcing);

  return [
    {
      label: '机会判断',
      value: verdict.label,
      desc: verdict.desc,
    },
    {
      label: '竞争门槛',
      value: categoryStats?.highReviewsShare ? `${formatPercent(categoryStats.highReviewsShare)} 高评论销量占比` : '评论门槛待确认',
      desc: '这决定了后面是直接找便宜货，还是必须按主流款标准去找能配合打样的厂。',
    },
    {
      label: '推荐厂家',
      value: sourcing.recommendedSuppliers.length ? `${formatNumber(sourcing.recommendedSuppliers.length)} 家 shortlist` : 'shortlist 不足',
      desc: sourcing.recommendedSuppliers.length
        ? `这轮不是泛泛看货盘，而是已经先筛出 ${sourcing.recommendedSuppliers.length} 家更值得联系的供应商。`
        : '当前供应商还不够稳定，继续盲目询盘没有意义。',
    },
  ];
}

function buildSourceModeFocus(seed, benchmark, categoryStats, sourcing) {
  const verdict = evaluateSourceVerdict(categoryStats, sourcing);

  return {
    title: '寻源判断',
    cards: [
      {
        label: '类目空间',
        value: categoryStats?.top100Sales ? `${formatNumber(categoryStats.top100Sales)} /月` : '样本不足',
        desc: '先确认这个类目盘子够不够大，值不值得继续往供应侧走。',
      },
      {
        label: '竞争门槛',
        value: categoryStats?.highReviewsShare ? `${formatPercent(categoryStats.highReviewsShare)}` : '待确认',
        desc: '高评论销量占比越高，越不能靠低价货盘切入。',
      },
      {
        label: '结论',
        value: verdict.label,
        desc: verdict.desc,
      },
    ],
  };
}

function buildSourceCandidatePoolCards(sourcing) {
  const cards = sourcing.recommendedSuppliers.slice(0, 3).map((supplier, index) => {
    const supplierPriceBand = supplier.supplierPriceBand;
    const priceLine = supplierPriceBand
      ? supplierPriceBand.min === supplierPriceBand.max
        ? `代表货盘价格约 ¥${supplierPriceBand.min}`
        : `代表货盘价格约 ¥${supplierPriceBand.min} - ¥${supplierPriceBand.max}`
      : '当前价格带还不稳定';

    return {
      eyebrow: `推荐厂家 ${index + 1}`,
      title: supplier.seller,
      summary: supplier.reasonLines[0] || '这家不是最便宜，但更接近当前 Amazon 目标款，适合先进第一轮问样。',
      points: [
        `代表货盘：${supplier.bestItem?.title || '暂无代表货盘'}`,
        priceLine,
        supplier.searchNames.length ? `命中供给词：${supplier.searchNames.slice(0, 3).join(' / ')}` : '命中供给词不足',
        ...supplier.reasonLines.slice(1, 4),
      ].filter(Boolean),
      links: [
        supplier.offerUrl ? { label: '货源链接', url: supplier.offerUrl } : null,
        supplier.storeUrl ? { label: '店铺入口', url: supplier.storeUrl } : null,
      ].filter(Boolean),
    };
  });

  cards.push({
    eyebrow: '筛厂标准',
    title: '为什么不是谁便宜就推谁',
    summary: '这轮推荐看的不是最低价，而是它能不能接住当前 Amazon 机会。',
    points: [
      '先看产品路线是否对得上，再看价格。',
      '至少要能命中不止一个供给搜索词，避免只是碰巧搜出来。',
      '能不能做扩散罩/负离子/高速这类主流配置，比单个报价更重要。',
      '低价但路线不对的样本，只会把后面的打样和上架都带偏。',
    ],
    caution: '当前 MCP 只直出货源详情 URL，店铺入口这里用的是 1688 店铺检索入口，不是直接旺铺页。',
  });

  return cards.slice(0, 4);
}

function buildSourceSectionCopy(seed, benchmark, sourcing) {
  return {
    products: '先把 Amazon 种子盘和基准盘摆在一起，明确我们要找的是哪种产品路线，而不是先在 1688 看谁便宜。',
    modeFocus: '这里先回答“这个机会值不值得找厂”，再回答“该先找哪几家厂”。',
    candidates: '这里不是供给噪音池，而是第一轮更值得联系的供应商 shortlist。',
    comparison: `这部分主要解释：为什么先拿 ${benchmark.detail.brand || benchmark.detail.asin} 定义目标款，再去筛供应商。`,
    category: '类目环境决定这是不是值得做的市场，也决定后面该找什么水平的厂。',
    traffic: '这里同时看 Amazon 需求词和 1688 供给词，避免出现“有货但没人买”或“有人买但货盘不对”的错位。',
    reviews: '评论区的作用不是改文案，而是把真实负评翻译成找厂和打样条件。',
    actions: `下面的动作默认都是为 ${seed.detail.brand || seed.detail.asin} 的寻源落地服务，目标是先找对厂，再谈成本。`,
    roadmap: '寻源的正确顺序是：定目标款、联系 shortlist、打样验收、再做成本和认证复核。',
  };
}

function buildSourceComparisonRows(seed, benchmark, genericKeywordPair, sourcing, categoryStats) {
  const priceBand = sourcing.priceBand;

  return [
    {
      title: 'Amazon 目标价带',
      val1: formatCurrency(seed.detail.price),
      val2: formatCurrency(benchmark.detail.price),
      desc: '先用 Amazon 真实成交价定义目标款客单，供应侧只负责验证这条路能不能做。',
      highlight: compareByBetter(seed, benchmark, (dataset) => dataset.detail.price, true),
    },
    {
      title: 'Amazon 需求强度',
      val1: `${formatNumber(seed.detail.monthlySales)} / ${formatCurrency(seed.detail.monthlyRevenue)}`,
      val2: `${formatNumber(benchmark.detail.monthlySales)} / ${formatCurrency(benchmark.detail.monthlyRevenue)}`,
      desc: '两支样本都卖得动，说明先找供给是有意义的，不是在空找货。',
      highlight: compareByBetter(seed, benchmark, (dataset) => dataset.detail.monthlySales),
    },
    {
      title: '评论门槛',
      val1: `${formatNumber(seed.detail.reviewCount)} / ${seed.detail.rating?.toFixed(1) || '未知'}`,
      val2: `${formatNumber(benchmark.detail.reviewCount)} / ${benchmark.detail.rating?.toFixed(1) || '未知'}`,
      desc: `类目高评论销量占比约 ${formatPercent(categoryStats?.highReviewsShare)}，所以找厂不能只看能不能出货，还要看能不能把质量做稳。`,
      highlight: compareByBetter(seed, benchmark, (dataset) => dataset.detail.reviewCount),
    },
    {
      title: '推荐厂家数',
      val1: `${formatNumber(sourcing.recommendedSuppliers.length)} 家 shortlist`,
      val2: `${formatNumber(sourcing.uniqueSellerCount)} 家供给卖家`,
      desc: '真正值得联系的厂家不会等于全部卖家数，shortlist 越清晰，后面打样越高效。',
    },
    {
      title: '1688 供给参考带',
      val1: priceBand ? `¥${priceBand.min} - ¥${priceBand.max}` : '样本不足',
      val2: priceBand ? `中位约 ¥${priceBand.median}` : '样本不足',
      desc: '这里只拿来做第一轮供给锚点，不直接等于最终 BOM 或落地利润。',
    },
    {
      title: '错样本压力',
      val1: `吹风梳 ${formatNumber(sourcing.brushCount)} / 宠物 ${formatNumber(sourcing.petCount)}`,
      val2: `便携折叠 ${formatNumber(sourcing.compactCount)} / 直机 ${formatNumber(sourcing.directCount)}`,
      desc: '如果错样本多，说明这条路必须先把产品定义和筛厂口径讲清楚，再去谈价格。',
    },
  ];
}

function buildSourceTrafficColumns(seed, benchmark, keywordSets, keywordIntel, sourcing) {
  const detailPoints = keywordIntel.slice(0, 3).map((item) => {
    const detail = item.detail;
    return `${detail.keyword || item.keyword}: 月搜 ${formatNumber(detail.monthlyVolume)} / CPC ${formatCurrency(detail.cpc)} / 结果数 ${formatNumber(detail.resultCount)}`;
  });

  return [
    {
      eyebrow: 'Amazon 需求词',
      title: keywordSets.scenario.length ? '先盯高意图词，不先盯最大泛词' : '先盯核心泛词',
      points: keywordSets.scenario.length
        ? keywordSets.scenario.slice(0, 4).map((item) => item.keyword)
        : keywordSets.generic.slice(0, 4).map((item) => item.keyword),
    },
    {
      eyebrow: '1688 搜索词',
      title: sourcing.searchNames.length ? '当前实际跑过的供给词' : '供给词不足',
      accent: true,
      points: sourcing.searchNames.length ? sourcing.searchNames : ['当前没有稳定的供给搜索词。'],
    },
    {
      eyebrow: '要找什么货',
      title: sourcing.sourceTargets.labels.length ? '主流配置要对得上' : '先对齐主流配置',
      points: sourcing.sourceTargets.labels.length
        ? sourcing.sourceTargets.labels.map((item) => `${item}: 这是当前 shortlist 重点要对齐的配置`)
        : ['先围绕扩散罩、负离子、高速这类主流配置去找厂。'],
    },
    {
      eyebrow: '供应商覆盖',
      title: sourcing.recommendedSuppliers.length ? '先联系 shortlist，不先泛问' : 'shortlist 还不够',
      points: sourcing.recommendedSuppliers.length
        ? sourcing.recommendedSuppliers.map((supplier) => `${supplier.seller}: ${supplier.searchNames.slice(0, 2).join(' / ') || '已进 shortlist'}`)
        : ['当前还没有足够可信的厂家 shortlist。'],
    },
  ];
}

function buildSourceTrafficInsight(seed, benchmark, categoryStats, keywordIntel, sourcing) {
  const topKeyword = keywordIntel[0]?.detail;
  const priceBand = sourcing.priceBand;
  const firstSupplier = sourcing.recommendedSuppliers[0];

  return [
    `先看机会：${categoryStats?.name || '当前类目'} Top100 月销量约 ${formatNumber(categoryStats?.top100Sales)}，中位价 ${formatCurrency(categoryStats?.medianPrice)}。`,
    topKeyword
      ? `再看需求词：${topKeyword.keyword} 月搜索量约 ${formatNumber(topKeyword.monthlyVolume)}，说明这条路本身有人找。`
      : '再看需求词：当前核心词样本不足。',
    priceBand
      ? `再看供给：1688 当前直机供给参考带约 ¥${priceBand.min} - ¥${priceBand.max}，已经能拉出第一轮 shortlist。`
      : '再看供给：当前还没形成稳定的供给参考带。',
    firstSupplier
      ? `所以这次不是继续泛搜，而是先联系 ${firstSupplier.seller}${sourcing.recommendedSuppliers[1] ? `、${sourcing.recommendedSuppliers[1].seller}` : ''}，验证它们能不能接住目标款。`
      : '所以这次还不该急着大面积询盘，先把 shortlist 再收紧。',
  ].join(' ');
}

function buildSourceReviewBlocks(seed, benchmark) {
  const seedNegatives = summarizeReviewThemes(seed.negativeReviews);
  const benchmarkNegatives = summarizeReviewThemes(benchmark.negativeReviews);

  return [
    {
      eyebrow: '种子 ASIN',
      title: seed.detail.brand || seed.detail.asin,
      summary: '这部分不是为了改 listing，而是为了把 Amazon 负评翻译成筛样和打样条件。',
      positives: summarizeReviewThemes(seed.positiveReviews).map((theme) => theme.label),
      negatives: seedNegatives.map((theme) => theme.label),
      opportunities: [
        '把高频负评直接写进样品验收标准，不要等上架后再踩坑。',
        '附件、过热、噪音和耐久这些问题，打样阶段就要先测。',
      ],
      evidence: buildReviewEvidence([...summarizeReviewThemes(seed.positiveReviews), ...seedNegatives]),
    },
    {
      eyebrow: 'Amazon 基准盘',
      title: benchmark.detail.brand || benchmark.detail.asin,
      summary: '基准盘的评论更适合告诉我们：主流用户到底在意什么，哪些问题是能忍的，哪些是不能忍的。',
      positives: summarizeReviewThemes(benchmark.positiveReviews).map((theme) => theme.label),
      negatives: benchmarkNegatives.map((theme) => theme.label),
      opportunities: [
        '优先保留用户愿意买单的核心卖点，再看能不能把高频负评压下去。',
        '如果主流款都绕不开某类问题，打样阶段更要先验证能不能真正改善。',
      ],
      evidence: buildReviewEvidence([...summarizeReviewThemes(benchmark.positiveReviews), ...benchmarkNegatives]),
    },
  ];
}

function buildSourceActionCards(seed, benchmark, keywordSets, sourcing, categoryStats) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';
  const topSupplier = sourcing.recommendedSuppliers[0];

  return [
    {
      priority: 'P0',
      title: '先定目标款，再联系 shortlist',
      desc: topSupplier
        ? `第一轮先联系 ${topSupplier.seller}${sourcing.recommendedSuppliers[1] ? `、${sourcing.recommendedSuppliers[1].seller}` : ''}，不要把所有卖家都问一遍。`
        : '当前先不要大面积询盘，先把推荐厂家 shortlist 做出来。',
      accentClass: 'border-t-red-500',
    },
    {
      priority: 'P1',
      title: `围绕 ${scenarioKeyword} 对齐产品定义`,
      desc: `找厂时先把 ${scenarioKeyword} 对应的页面承诺和主流配置说清楚，否则工厂给出来的会是另一条产品路线。`,
      accentClass: 'border-t-orange-400',
    },
    {
      priority: 'P1',
      title: '按 Amazon 负评写打样验收标准',
      desc: '把过热、附件体验、噪音、耐久这些高频负评直接变成样品验收清单，而不是只看图片和报价。',
      accentClass: 'border-t-blue-500',
    },
    {
      priority: 'P2',
      title: categoryStats?.medianPrice ? `结合中位价 ${formatCurrency(categoryStats.medianPrice)} 做成本倒推` : '做成本倒推',
      desc: '别拿 1688 单价直接当利润模型。最后一定要把 Amazon 客单、FBA、广告、退货和认证一起算进去。',
      accentClass: 'border-t-emerald-500',
    },
  ];
}

function buildSourceRoadmapSteps(seed, benchmark, keywordSets, sourcing) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword || keywordSets.generic[0]?.keyword || '核心词';
  const topSuppliers = sourcing.recommendedSuppliers.slice(0, 2).map((item) => item.seller).filter(Boolean);

  return [
    {
      phase: 'Step 1',
      title: '先定义目标款',
      desc: `先围绕 ${scenarioKeyword} 和 Amazon 基准盘，把要找的结构、附件和体验写清楚，再去找厂。`,
    },
    {
      phase: 'Step 2',
      title: '联系第一轮推荐厂家',
      desc: topSuppliers.length
        ? `第一轮先联系 ${topSuppliers.join('、')}，先看它们能不能按目标款给样。`
        : '当前先不要大面积联系工厂，先把 shortlist 再收紧。',
    },
    {
      phase: 'Step 3',
      title: '做样品验收和对比',
      desc: '样品回来后重点看附件、过热、噪音、耐久和页面承诺能不能对上，而不是只比外观。',
    },
    {
      phase: 'Step 4',
      title: '最后再做认证和成本复核',
      desc: '等 shortlist 和样品都站住之后，再进入认证风险、成本模型和 kill criteria，不要顺序反了。',
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

function collectSourceSearchNames(detail, keywordSets) {
  const scenarioKeyword = keywordSets.scenario[0]?.keyword;
  const genericKeyword = keywordSets.generic[0]?.keyword;
  const safeScenarioKeyword = scenarioKeyword && tokenize(scenarioKeyword).length >= 2 ? scenarioKeyword : null;
  const safeGenericKeyword = genericKeyword && tokenize(genericKeyword).length >= 2 ? genericKeyword : null;
  const titleBlob = `${detail.title || ''} ${detail.description || ''}`;
  const chineseHints = [];

  if (/diffuser/i.test(titleBlob)) {
    chineseHints.push('吹风机 扩散罩');
  }
  if (/ionic/i.test(titleBlob)) {
    chineseHints.push('负离子 吹风机');
  }
  if (/quiet|noise/i.test(titleBlob)) {
    chineseHints.push('静音 吹风机');
  }
  if (/fast dry|high speed|1875w|watt/i.test(titleBlob)) {
    chineseHints.push('高速 吹风机');
  }

  const names = [
    derive1688SearchName(detail, keywordSets),
    safeScenarioKeyword,
    safeGenericKeyword,
    normalizeKeyword(`${detail.attributes?.Wattage || ''} ${detail.category || detail.subCategoryName || ''}`.trim()),
    ...chineseHints,
  ].filter(Boolean);

  return [...new Set(names)].slice(0, 4);
}

async function fetchSourcingIntel(searchNames, seedDetail, benchmarkDetail, keywordSets) {
  const batches = await Promise.all(
    searchNames.map(async (searchName) => {
      const pages = await Promise.all(
        [1, 2].map(async (page) => {
          const sourcingTool = await callSorftimeTool('ali1688_similar_product', {
            searchName,
            page,
          });
          const rawItems = parseSourcingItems(sourcingTool.text);
          return sanitizeSourcingItems(rawItems, searchName).map((item) => ({
            ...item,
            matchedSearchName: searchName,
          }));
        }),
      );

      return pages.flat();
    }),
  );

  return analyzeSourcing(searchNames, batches.flat(), seedDetail, benchmarkDetail, keywordSets);
}

function summarizeCandidateRole(candidate, index) {
  if (index === 0 && !candidate.mismatchReason) {
    return '主竞对';
  }

  if (candidate.mismatchReason) {
    return '排除项';
  }

  if (candidate.sharedScenarioCount >= 4 && candidate.titleOverlap >= 8) {
    return '次级直接竞对';
  }

  if (candidate.sharedKeywordCount >= 20) {
    return '观察样本';
  }

  return '低优先级候选';
}

function buildCandidateReasonLines(candidate) {
  const reasons = [];

  if (candidate.sharedScenarioTerms.length > 0) {
    reasons.push(`共享高意图词：${candidate.sharedScenarioTerms.slice(0, 3).join(' / ')}`);
  }

  if (candidate.titleOverlap >= 8) {
    reasons.push('标题和卖点结构接近，像同一路产品定义');
  } else if (candidate.titleOverlap >= 5) {
    reasons.push('标题有一定重合，但产品打法不完全一样');
  }

  if (candidate.priceGapRatio !== null && candidate.priceGapRatio <= 0.2) {
    reasons.push('价格带很接近，更适合直接对打');
  } else if (candidate.priceGapRatio !== null && candidate.priceGapRatio <= 0.4) {
    reasons.push('价格带可比，但不算完全贴身');
  }

  if (candidate.detail.subCategoryRank !== null && candidate.detail.subCategoryRank <= 10) {
    reasons.push('类目位置靠前，值得当头部打法样本');
  }

  return reasons.slice(0, 4);
}

function scoreCompetitorCandidates(seedDataset, candidateSignals) {
  const seedKeywordSet = buildKeywordTermSet(seedDataset);
  const seedScenarioTerms = getScenarioTermsFromSet(seedKeywordSet).slice(0, 12);
  const seedPrice = seedDataset.detail.price || 0;

  return candidateSignals
    .map((signal) => {
      const candidateKeywordSet = buildKeywordTermSet(signal);
      const sharedKeywordTerms = [...seedKeywordSet].filter((keyword) => candidateKeywordSet.has(keyword));
      const sharedScenarioTerms = seedScenarioTerms.filter((keyword) => candidateKeywordSet.has(keyword));
      const titleOverlap = countTokenOverlap(seedDataset.detail.title, signal.detail.title);
      const priceGapRatio =
        seedPrice && signal.detail.price ? Math.abs(signal.detail.price - seedPrice) / seedPrice : null;
      const mismatchReason = detectFindMismatch(seedDataset.detail.title, signal.detail.title);
      const score =
        titleOverlap * 2 +
        sharedScenarioTerms.length * 3 +
        Math.min(sharedKeywordTerms.length / 10, 4) +
        (signal.detail.subCategoryRank !== null ? Math.max(0, 4 - signal.detail.subCategoryRank / 5) : 0) -
        Math.min(priceGapRatio ?? 1.5, 1.5) -
        (mismatchReason ? 5 : 0);

      return {
        ...signal,
        score: Number(score.toFixed(2)),
        titleOverlap,
        priceGapRatio,
        sharedKeywordCount: sharedKeywordTerms.length,
        sharedScenarioCount: sharedScenarioTerms.length,
        sharedScenarioTerms: sharedScenarioTerms.slice(0, 6),
        mismatchReason,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.detail.monthlySales || 0) - (left.detail.monthlySales || 0);
    })
    .map((candidate, index) => ({
      ...candidate,
      role: summarizeCandidateRole(candidate, index),
      reasonLines: buildCandidateReasonLines(candidate),
    }));
}

async function findCompetitorCandidates(seedDataset, categoryReport, site) {
  const pool = categoryReport.topProducts
    .slice(0, 10)
    .filter((item) => String(item['ASIN'] || '').trim())
    .filter((item) => String(item['ASIN']).trim() !== seedDataset.detail.asin)
    .filter((item) => normalizeKeyword(item['品牌'] || '') !== normalizeKeyword(seedDataset.detail.brand || ''));

  const candidateSignals = await Promise.all(
    pool.map((item) => fetchCandidateSignal(String(item['ASIN']).trim(), site)),
  );

  return scoreCompetitorCandidates(seedDataset, candidateSignals);
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
      title: buildCompareTitle(left, right, keywordSets),
      summary: [buildCompareSummary(left, right, categoryReport.stats, keywordSets, keywordIntel), extraNote].filter(Boolean).join(' '),
      labels: {
        left: left.detail.brand || left.detail.asin,
        right: right.detail.brand || right.detail.asin,
      },
      sectionCopy: buildCompareSectionCopy(left, right, categoryReport.stats, keywordSets),
      heroCards: buildCompareHeroCards(left, right, categoryReport.stats, keywordSets),
      navItems: buildNavItems('compare'),
      modeFocusTitle: modeFocus.title,
      modeFocusCards: modeFocus.cards,
      products: [
        buildProductCard(left.detail, summarizeReviewThemes(left.positiveReviews)),
        buildProductCard(right.detail, summarizeReviewThemes(right.positiveReviews)),
      ],
      comparisonRows: buildCompareComparisonRows(left, right, genericKeywordPair, keywordIntel),
      categoryCards: buildCategoryCards(categoryReport.stats, left, right),
      categoryRows: buildCategoryRows(left, right, categoryReport.stats),
      trafficColumns: buildCompareTrafficColumns(left, right, keywordSets, keywordIntel),
      trafficInsight: buildCompareTrafficInsight(left, right, categoryReport.stats, keywordIntel, keywordSets),
      reviewBlocks: buildCompareReviewBlocks(left, right),
      actionCards: buildCompareActionCards(left, right, keywordSets, categoryReport.stats),
      roadmapSteps: buildCompareRoadmapSteps(left, right, keywordSets),
    },
  };
}

function buildFindModeReport({ session, left, right, categoryReport, keywordIntel, extraNote, competitorCandidates }) {
  const keywordSets = chooseKeywordSets([left, right]);
  const genericKeywordPair = buildGenericKeywordPair(left, right, keywordSets);
  const modeFocus = buildFindModeFocus(left, right, competitorCandidates, keywordSets);

  return {
    session,
    report: {
      meta: buildBaseReportMeta('find'),
      title: buildFindTitle(left, right),
      summary: buildFindSummary(left, right, categoryReport.stats, competitorCandidates, keywordIntel, extraNote),
      labels: {
        left: left.detail.brand || left.detail.asin,
        right: right.detail.brand || right.detail.asin,
      },
      sectionCopy: buildFindSectionCopy(left, right),
      heroCards: buildFindHeroCards(left, right, competitorCandidates, keywordSets),
      navItems: buildNavItems('find'),
      modeFocusTitle: modeFocus.title,
      modeFocusCards: modeFocus.cards,
      candidatePoolTitle: '候选池',
      candidatePoolCards: buildFindCandidatePoolCards(competitorCandidates),
      products: [
        buildProductCard(left.detail, summarizeReviewThemes(left.positiveReviews)),
        buildProductCard(right.detail, summarizeReviewThemes(right.positiveReviews)),
      ],
      comparisonRows: buildFindComparisonRows(left, right, competitorCandidates, genericKeywordPair),
      categoryCards: buildCategoryCards(categoryReport.stats, left, right),
      categoryRows: buildCategoryRows(left, right, categoryReport.stats),
      trafficColumns: buildFindTrafficColumns(left, right, competitorCandidates, keywordSets, keywordIntel),
      trafficInsight: buildFindTrafficInsight(left, right, competitorCandidates, categoryReport.stats, keywordIntel),
      reviewBlocks: buildFindReviewBlocks(left, right),
      actionCards: buildFindActionCards(left, right, keywordSets, competitorCandidates, categoryReport.stats),
      roadmapSteps: buildFindRoadmapSteps(left, right, competitorCandidates, keywordSets),
    },
  };
}

function buildSourceModeReport({ session, left, right, categoryReport, keywordIntel, sourcing, extraNote, competitorCandidates }) {
  const keywordSets = chooseKeywordSets([left, right]);
  const genericKeywordPair = buildGenericKeywordPair(left, right, keywordSets);
  const modeFocus = buildSourceModeFocus(left, right, categoryReport.stats, sourcing);

  return {
    session,
    report: {
      meta: buildBaseReportMeta('source'),
      title: buildSourceTitle(left, right, categoryReport.stats, sourcing),
      summary: buildSourceSummary(left, right, categoryReport.stats, keywordIntel, sourcing, extraNote),
      labels: {
        left: left.detail.brand || left.detail.asin,
        right: right.detail.brand || right.detail.asin,
      },
      sectionCopy: buildSourceSectionCopy(left, right, sourcing),
      heroCards: buildSourceHeroCards(left, right, categoryReport.stats, sourcing),
      navItems: buildNavItems('source'),
      modeFocusTitle: modeFocus.title,
      modeFocusCards: modeFocus.cards,
      candidatePoolTitle: '推荐厂家',
      candidatePoolCards: buildSourceCandidatePoolCards(sourcing),
      products: [
        buildProductCard(left.detail, summarizeReviewThemes(left.positiveReviews)),
        buildProductCard(right.detail, summarizeReviewThemes(right.positiveReviews)),
      ],
      comparisonRows: buildSourceComparisonRows(left, right, genericKeywordPair, sourcing, categoryReport.stats),
      categoryCards: buildCategoryCards(categoryReport.stats, left, right),
      categoryRows: buildCategoryRows(left, right, categoryReport.stats),
      trafficColumns: buildSourceTrafficColumns(left, right, keywordSets, keywordIntel, sourcing),
      trafficInsight: buildSourceTrafficInsight(left, right, categoryReport.stats, keywordIntel, sourcing),
      reviewBlocks: buildSourceReviewBlocks(left, right),
      actionCards: buildSourceActionCards(left, right, keywordSets, sourcing, categoryReport.stats),
      roadmapSteps: buildSourceRoadmapSteps(left, right, keywordSets, sourcing),
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
  const competitorCandidates = await findCompetitorCandidates(seed, categoryReport, site);
  const competitor = competitorCandidates[0];

  if (!competitor?.detail?.asin) {
    throw new Error('没有从当前类目里找到足够可信的竞对样本，请更换 ASIN 再试。');
  }

  const benchmark = await fetchProductDataset(competitor.detail.asin, site);
  const keywordSets = chooseKeywordSets([seed, benchmark]);
  const keywordIntel = await fetchKeywordIntel(site, collectKeywordSeeds(keywordSets));

  if (sessionInput.mode === 'find') {
    return buildFindModeReport({
      session: { ...sessionInput, asins: [seedAsin, competitor.detail.asin], query: `${seedAsin}, ${competitor.detail.asin}` },
      left: seed,
      right: benchmark,
      categoryReport,
      keywordIntel,
      extraNote: `本次自动锁定的第一竞对是 ${competitor.detail.asin}，因为它和种子 ASIN 在价格带、标题结构和共享高意图词上都更接近。`,
      competitorCandidates,
    });
  }

  const sourceSearchNames = collectSourceSearchNames(seed.detail, keywordSets);
  const sourcing = await fetchSourcingIntel(sourceSearchNames, seed.detail, benchmark.detail, keywordSets);

  return buildSourceModeReport({
    session: { ...sessionInput, asins: [seedAsin, competitor.detail.asin], query: `${seedAsin}, ${competitor.detail.asin}` },
    left: seed,
    right: benchmark,
    categoryReport,
    keywordIntel,
    sourcing,
    extraNote: `Amazon 侧先拿 ${competitor.detail.asin} 定义目标款，1688 侧再用 “${sourceSearchNames.join(' / ')}” 拉供给，并只保留第一轮更值得联系的厂家 shortlist。`,
    competitorCandidates,
  });
}
