export type Mode = 'find' | 'compare' | 'source';

export interface ParsedAnalysisInput {
  rawQuery: string;
  cleanedQuery: string;
  asins: string[];
  isValid: boolean;
  error: string | null;
  helperText: string;
}

export interface AnalysisSession {
  id: string;
  mode: Mode;
  rawQuery: string;
  query: string;
  asins: string[];
  createdAt: string;
}
