import type { AnalysisSession, Mode, ParsedAnalysisInput } from '../types/analysis';

const ASIN_PATTERN = /\b([A-Z0-9]{10})\b/gi;

const MODE_HELPERS: Record<Mode, string> = {
  find: '输入 1 个 ASIN 或 Amazon 商品链接，系统会为你找竞品。',
  compare: '输入至少 2 个 ASIN，支持空格、逗号、换行和 Amazon 链接。',
  source: '输入 1 个 ASIN 或 Amazon 商品链接，系统会为你匹配 1688 供给。',
};

const MODE_LABELS: Record<Mode, string> = {
  find: '找竞对',
  compare: '竞对分析',
  source: '去寻源',
};

export function getModeLabel(mode: Mode) {
  return MODE_LABELS[mode];
}

export function extractAsins(input: string) {
  const matches = input.toUpperCase().match(ASIN_PATTERN) ?? [];
  return [...new Set(matches)];
}

export function parseAnalysisInput(mode: Mode, rawInput: string): ParsedAnalysisInput {
  const rawQuery = rawInput.trim();
  const asins = extractAsins(rawQuery);
  const cleanedQuery = asins.join(', ');

  if (!rawQuery) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
      isValid: false,
      error: '请输入 ASIN 或 Amazon 商品链接。',
      helperText: MODE_HELPERS[mode],
    };
  }

  if (asins.length === 0) {
    return {
      rawQuery,
      cleanedQuery,
      asins,
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
      isValid: false,
      error: `${MODE_LABELS[mode]}模式只支持 1 个 ASIN。`,
      helperText: MODE_HELPERS[mode],
    };
  }

  return {
    rawQuery,
    cleanedQuery,
    asins,
    isValid: true,
    error: null,
    helperText: `${MODE_LABELS[mode]}模式已识别 ${asins.length} 个 ASIN。`,
  };
}

export function buildAnalysisSession(mode: Mode, rawInput: string): AnalysisSession {
  const parsed = parseAnalysisInput(mode, rawInput);

  if (!parsed.isValid) {
    throw new Error(parsed.error ?? '输入无效');
  }

  return {
    id: `${mode}-${parsed.asins.join('-')}`,
    mode,
    rawQuery: parsed.rawQuery,
    query: parsed.cleanedQuery,
    asins: parsed.asins,
    createdAt: new Date().toISOString(),
  };
}
