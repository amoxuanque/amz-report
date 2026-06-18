import type {
  AnalysisSession,
  BuyerBrief,
  BuyerBriefField,
  BuyerBriefInput,
  CustomizationNeed,
  Mode,
  ParsedAnalysisInput,
  SiteSelection,
} from '../types/analysis';

const ASIN_PATTERN = /\b([A-Z0-9]{10})\b/gi;
const BUYER_BRIEF_NUMBER_FIELDS = [
  'targetPriceMin',
  'targetPriceMax',
  'maxPurchasePrice',
  'firstOrderQty',
  'acceptableMoq',
] as const;
const BUYER_BRIEF_NUMBER_FIELD_LABELS: Record<(typeof BUYER_BRIEF_NUMBER_FIELDS)[number], string> = {
  targetPriceMin: '如填写目标售价最低值，请输入有效数字。',
  targetPriceMax: '如填写目标售价最高值，请输入有效数字。',
  maxPurchasePrice: '如填写采购价上限，请输入有效数字。',
  firstOrderQty: '如填写首批数量，请输入有效数字。',
  acceptableMoq: '如填写可接受 MOQ，请输入有效数字。',
};
export const CUSTOMIZATION_OPTIONS: Array<{ value: CustomizationNeed; label: string }> = [
  { value: 'logo', label: 'Logo' },
  { value: 'packaging', label: '包装' },
  { value: 'color', label: '颜色' },
  { value: 'spec', label: '规格' },
  { value: 'none', label: '无需定制' },
];

export const SITE_OPTIONS: Array<{ value: SiteSelection; label: string }> = [
  { value: 'AUTO', label: '默认分析' },
  { value: 'US', label: '美国站' },
  { value: 'GB', label: '英国站' },
  { value: 'DE', label: '德国站' },
  { value: 'FR', label: '法国站' },
  { value: 'JP', label: '日本站' },
  { value: 'CA', label: '加拿大站' },
  { value: 'IT', label: '意大利站' },
  { value: 'ES', label: '西班牙站' },
  { value: 'MX', label: '墨西哥站' },
  { value: 'AE', label: '阿联酋站' },
  { value: 'AU', label: '澳大利亚站' },
  { value: 'BR', label: '巴西站' },
  { value: 'SA', label: '沙特站' },
  { value: 'IN', label: '印度站' },
];

const MODE_HELPERS: Record<Mode, string> = {
  find: '输入 1 个 ASIN 或 Amazon 商品链接，系统会为你找竞对。',
  compare: '输入至少 2 个 ASIN，支持空格、逗号、换行和 Amazon 链接。',
  source: '输入 1 个 ASIN 或 Amazon 商品链接，系统会为你匹配 1688 供给。',
  space: '输入 1 个 ASIN、Amazon 链接，或直接输入中英文品类词，例如 hair dryer、吹风机、water bottle。',
};

const MODE_LABELS: Record<Mode, string> = {
  find: '找竞对',
  compare: '竞对分析',
  source: '去寻源',
  space: '品类空间',
};

const MODE_EXAMPLES: Record<Mode, string> = {
  find: '示例：B09CP8SSGP',
  compare: '示例：B09CP8SSGP B07GZWQDPR',
  source: '示例：B09CP8SSGP',
  space: '示例：B09CP8SSGP / hair dryer / 吹风机',
};

export function getModeLabel(mode: Mode) {
  return MODE_LABELS[mode];
}

export function getModeExample(mode: Mode) {
  return MODE_EXAMPLES[mode];
}

export function getSiteLabel(site: SiteSelection) {
  return SITE_OPTIONS.find((item) => item.value === site)?.label || '默认分析';
}

export function extractAsins(input: string) {
  const matches = input.toUpperCase().match(ASIN_PATTERN) ?? [];
  return [...new Set(matches)];
}

function parsePositiveNumber(value: string | number | undefined) {
  if (value === null || value === undefined) return null;
  const normalized = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

export function normalizeCustomizationNeeds(needs: CustomizationNeed[] | undefined) {
  const unique = [...new Set((needs || []).filter(Boolean))];
  if (unique.length === 0 || unique.includes('none')) {
    return ['none'] as CustomizationNeed[];
  }
  return unique.filter((item) => item !== 'none') as CustomizationNeed[];
}

export function normalizeBuyerBrief(input?: BuyerBriefInput | null): BuyerBrief | null {
  if (!input) return null;

  const targetPriceMin = parsePositiveNumber(input.targetPriceMin);
  const targetPriceMax = parsePositiveNumber(input.targetPriceMax);
  const maxPurchasePrice = parsePositiveNumber(input.maxPurchasePrice);
  const firstOrderQty = parsePositiveNumber(input.firstOrderQty);
  const acceptableMoq = parsePositiveNumber(input.acceptableMoq);
  const asinOrUrl = String(input.asinOrUrl || '').trim();
  const customizationNeeds = normalizeCustomizationNeeds(input.customizationNeeds);

  if (!asinOrUrl) {
    return null;
  }

  return {
    asinOrUrl,
    targetPriceMin: targetPriceMin ?? undefined,
    targetPriceMax: targetPriceMax ?? undefined,
    maxPurchasePrice: maxPurchasePrice ?? undefined,
    firstOrderQty: firstOrderQty ?? undefined,
    acceptableMoq: acceptableMoq ?? undefined,
    customizationNeeds,
  };
}

export function validateBuyerBrief(input?: BuyerBriefInput | null) {
  const errors: Partial<Record<BuyerBriefField, string>> = {};
  const normalized = normalizeBuyerBrief(input);
  const asinOrUrl = String(input?.asinOrUrl || '').trim();

  if (!asinOrUrl) {
    errors.asinOrUrl = '请输入 1 个 Amazon ASIN 或商品链接。';
  }

  BUYER_BRIEF_NUMBER_FIELDS.forEach((field) => {
    const rawValue = String(input?.[field] ?? '').trim();
    if (rawValue && parsePositiveNumber(input?.[field]) === null) {
      errors[field] = BUYER_BRIEF_NUMBER_FIELD_LABELS[field];
    }
  });

  if (normalized) {
    if (
      normalized.targetPriceMin !== undefined &&
      normalized.targetPriceMax !== undefined &&
      normalized.targetPriceMin > normalized.targetPriceMax
    ) {
      errors.targetPriceMin = '目标售价最低值不能高于最高值。';
      errors.targetPriceMax = '目标售价最高值不能低于最低值。';
    }

    if (
      normalized.maxPurchasePrice !== undefined &&
      normalized.targetPriceMax !== undefined &&
      normalized.maxPurchasePrice > normalized.targetPriceMax
    ) {
      errors.maxPurchasePrice = '采购价上限通常不应高于目标售价上限。';
    }
  }

  return {
    normalized,
    errors,
    isValid: Object.keys(errors).length === 0 && Boolean(normalized?.asinOrUrl),
  };
}

export function parseAnalysisInput(mode: Mode, rawInput: string, buyerBriefInput?: BuyerBriefInput | null): ParsedAnalysisInput {
  const rawQuery = rawInput.trim();
  const asins = extractAsins(rawQuery);
  const inputType = asins.length > 0 ? 'asin' : 'keyword';
  const cleanedQuery = inputType === 'asin' ? asins.join(', ') : rawQuery;
  const buyerBriefValidation = mode === 'source' ? validateBuyerBrief({ ...buyerBriefInput, asinOrUrl: rawQuery }) : null;

  if (!rawQuery) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType,
      isValid: false,
      error: mode === 'space' ? '请输入 ASIN、Amazon 商品链接，或品类关键词。' : '请输入 ASIN 或 Amazon 商品链接。',
      helperText: MODE_HELPERS[mode],
      fieldErrors: buyerBriefValidation?.errors,
    };
  }

  if (mode === 'space') {
    if (asins.length > 1) {
      return {
        rawQuery,
        cleanedQuery,
        asins,
        inputType: 'asin',
        isValid: false,
        error: '品类空间模式只支持 1 个 ASIN，或直接输入 1 个品类关键词。',
        helperText: MODE_HELPERS[mode],
        fieldErrors: buyerBriefValidation?.errors,
      };
    }

    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType,
      isValid: true,
      error: null,
      helperText:
        inputType === 'asin'
          ? '品类空间模式已识别 1 个 ASIN。'
          : '品类空间模式已识别为关键词分析。',
      fieldErrors: buyerBriefValidation?.errors,
    };
  }

  if (asins.length === 0) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType,
      isValid: false,
      error: '没有识别到有效 ASIN。ASIN 需要是 10 位字母或数字组合。',
      helperText: MODE_HELPERS[mode],
      fieldErrors: buyerBriefValidation?.errors,
    };
  }

  if (mode === 'compare' && asins.length < 2) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType: 'asin',
      isValid: false,
      error: '竞对分析至少需要 2 个 ASIN。',
      helperText: MODE_HELPERS[mode],
      fieldErrors: buyerBriefValidation?.errors,
    };
  }

  if (mode !== 'compare' && asins.length !== 1) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType: 'asin',
      isValid: false,
      error: `${MODE_LABELS[mode]}模式只支持 1 个 ASIN。`,
      helperText: MODE_HELPERS[mode],
      fieldErrors: buyerBriefValidation?.errors,
    };
  }

  if (mode === 'source' && buyerBriefValidation && !buyerBriefValidation.isValid) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType: 'asin',
      isValid: false,
      error: '买家寻源简报里有无效字段，请修改后再提交。',
      helperText: MODE_HELPERS[mode],
      fieldErrors: buyerBriefValidation.errors,
    };
  }

  return {
    rawQuery,
    cleanedQuery,
    asins,
    inputType: 'asin',
    isValid: true,
    error: null,
    helperText: `${MODE_LABELS[mode]}模式已识别 ${asins.length} 个 ASIN。`,
    fieldErrors: buyerBriefValidation?.errors,
  };
}

export function buildAnalysisSession(
  mode: Mode,
  rawInput: string,
  site: SiteSelection,
  buyerBriefInput?: BuyerBriefInput | null,
): AnalysisSession {
  const parsed = parseAnalysisInput(mode, rawInput, buyerBriefInput);

  if (!parsed.isValid) {
    throw new Error(parsed.error ?? '输入无效');
  }

  const buyerBrief = mode === 'source' ? normalizeBuyerBrief({ ...buyerBriefInput, asinOrUrl: rawInput }) : null;

  const rawIdSource = parsed.asins.join('-') || parsed.cleanedQuery || parsed.rawQuery || 'analysis';
  const safeIdSegment = encodeURIComponent(rawIdSource).replace(/%/g, '').slice(0, 80) || Date.now().toString(36);

  return {
    id: `${mode}-${site}-${safeIdSegment}`,
    mode,
    site,
    inputType: parsed.inputType,
    rawQuery: parsed.rawQuery,
    query: parsed.cleanedQuery,
    asins: parsed.asins,
    createdAt: new Date().toISOString(),
    buyerBrief: buyerBrief || undefined,
  };
}
