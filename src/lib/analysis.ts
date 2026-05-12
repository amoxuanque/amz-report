import type { AnalysisSession, Mode, ParsedAnalysisInput, SiteSelection } from '../types/analysis';

const ASIN_PATTERN = /\b([A-Z0-9]{10})\b/gi;

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

export function parseAnalysisInput(mode: Mode, rawInput: string): ParsedAnalysisInput {
  const rawQuery = rawInput.trim();
  const asins = extractAsins(rawQuery);
  const inputType = asins.length > 0 ? 'asin' : 'keyword';
  const cleanedQuery = inputType === 'asin' ? asins.join(', ') : rawQuery;

  if (!rawQuery) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      inputType,
      isValid: false,
      error: mode === 'space' ? '请输入 ASIN、Amazon 商品链接，或品类关键词。' : '请输入 ASIN 或 Amazon 商品链接。',
      helperText: MODE_HELPERS[mode],
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
  };
}

export function buildAnalysisSession(mode: Mode, rawInput: string, site: SiteSelection): AnalysisSession {
  const parsed = parseAnalysisInput(mode, rawInput);

  if (!parsed.isValid) {
    throw new Error(parsed.error ?? '输入无效');
  }

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
  };
}
