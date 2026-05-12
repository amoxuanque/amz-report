export type Mode = 'find' | 'compare' | 'source' | 'space';
export type SiteSelection =
  | 'AUTO'
  | 'US'
  | 'GB'
  | 'DE'
  | 'FR'
  | 'IN'
  | 'CA'
  | 'JP'
  | 'ES'
  | 'IT'
  | 'MX'
  | 'AE'
  | 'AU'
  | 'BR'
  | 'SA';
export type AnalysisInputType = 'asin' | 'keyword';

export interface ParsedAnalysisInput {
  rawQuery: string;
  cleanedQuery: string;
  asins: string[];
  inputType: AnalysisInputType;
  isValid: boolean;
  error: string | null;
  helperText: string;
}

export interface AnalysisSession {
  id: string;
  mode: Mode;
  site: SiteSelection;
  inputType: AnalysisInputType;
  rawQuery: string;
  query: string;
  asins: string[];
  createdAt: string;
}
