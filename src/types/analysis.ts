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
export type CustomizationNeed = 'logo' | 'packaging' | 'color' | 'spec' | 'none';
export type BuyerBriefField =
  | 'asinOrUrl'
  | 'targetPriceMin'
  | 'targetPriceMax'
  | 'maxPurchasePrice'
  | 'firstOrderQty'
  | 'acceptableMoq'
  | 'customizationNeeds';

export interface BuyerBriefInput {
  asinOrUrl?: string;
  targetPriceMin?: string | number;
  targetPriceMax?: string | number;
  maxPurchasePrice?: string | number;
  firstOrderQty?: string | number;
  acceptableMoq?: string | number;
  customizationNeeds?: CustomizationNeed[];
}

export interface BuyerBrief {
  asinOrUrl: string;
  targetPriceMin?: number;
  targetPriceMax?: number;
  maxPurchasePrice?: number;
  firstOrderQty?: number;
  acceptableMoq?: number;
  customizationNeeds: CustomizationNeed[];
}

export interface ParsedAnalysisInput {
  rawQuery: string;
  cleanedQuery: string;
  asins: string[];
  inputType: AnalysisInputType;
  isValid: boolean;
  error: string | null;
  helperText: string;
  fieldErrors?: Partial<Record<BuyerBriefField, string>>;
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
  buyerBrief?: BuyerBrief;
}
