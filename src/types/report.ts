export interface ReportHeroCard {
  label: string;
  value: string;
  desc: string;
}

export interface ReportNavItem {
  id: string;
  label: string;
}

export interface ReportMetric {
  label: string;
  value: string;
  sub: string;
}

export interface ReportProduct {
  asin: string;
  title: string;
  brand: string;
  seller: string;
  rank: string;
  description: string;
  image: string;
  metrics: ReportMetric[];
}

export interface ReportComparisonRow {
  title: string;
  val1: string;
  val2: string;
  desc: string;
  highlight?: 'left' | 'right';
}

export interface ReportTrafficColumn {
  eyebrow: string;
  title: string;
  accent?: boolean;
  points: string[];
}

export interface ReportActionCard {
  priority: string;
  title: string;
  desc: string;
  accentClass: string;
}

export interface ReportReviewBlock {
  eyebrow: string;
  title: string;
  summary: string;
  positives: string[];
  negatives: string[];
  opportunities: string[];
  evidence?: string[];
}

export interface ReportRoadmapStep {
  phase: string;
  title: string;
  desc: string;
}

export interface ReportCandidateCard {
  eyebrow: string;
  title: string;
  summary: string;
  points: string[];
  links?: Array<{
    label: string;
    url: string;
  }>;
  caution?: string;
}

export interface SourceProviderTrace {
  provider: string;
  tools: string[];
  status: 'ok' | 'partial' | 'fallback' | 'unavailable';
  verifiedFields: string[];
}

export interface SourceSearchPathItem {
  term: string;
  source: string;
  precision: 'high' | 'medium' | 'low';
  notes: string;
}

export interface SourceCandidateRow {
  offerId: string;
  seller: string;
  fitScore: number;
  matchedTerms: string[];
  specSummary: string;
  moq: string;
  priceSummary: string;
  whyMatch: string;
  riskFlags: string[];
  track: '低 MOQ 打样轨' | '高匹配工厂轨' | '观察备选';
}

export interface SourceVisualEvidence {
  image: string;
  caption: string;
  offerId: string;
}

export interface SourceVerdict {
  summary: string;
  highlights: string[];
  recommendedTracks: string[];
}

export interface SourceShortlistItem {
  seller: string;
  offerId: string;
  decisionLabel: '可继续沟通' | '可打样验证' | '接近可下单';
  reasonLines: string[];
  nextChecks: string[];
}

export interface SourceFactBoundary {
  verifiedFacts: string[];
  inferences: string[];
  notPromised: string[];
}

export interface SourceBuyerContext {
  summaryLines: string[];
  judgmentRule: string[];
}

export interface SourceDataBuckets {
  buyerPrepared: string[];
  pageObservable: string[];
  sellerVerified: string[];
}

export interface SourceInquiryQuestion {
  label: string;
  strongSignal: string;
  mediumSignal: string;
  weakSignal: string;
}

export interface SourceInquiryScoreItem {
  label: string;
  strong: number;
  medium: number;
  weak: number;
}

export interface SourceInquiryKit {
  template: string;
  questions: SourceInquiryQuestion[];
  keywordSignals: {
    strong: string[];
    risk: string[];
  };
  scoreItems: SourceInquiryScoreItem[];
}

export interface SourceReportPayload {
  providerTrace: SourceProviderTrace[];
  searchPath: SourceSearchPathItem[];
  candidateRows: SourceCandidateRow[];
  visualEvidence: SourceVisualEvidence[];
  verdict: SourceVerdict;
  shortlist: SourceShortlistItem[];
  riskChecklist: string[];
  samplePlan: string[];
  killCriteria: string[];
  factBoundary: SourceFactBoundary;
  buyerContext: SourceBuyerContext;
  dataBuckets: SourceDataBuckets;
  inquiryKit: SourceInquiryKit;
  executionSteps: string[];
}

export interface CompetitiveReport {
  meta: {
    date: string;
    marketplace: string;
    source: string;
    mode: string;
  };
  title: string;
  summary: string;
  labels: {
    left: string;
    right: string;
  };
  sectionCopy: {
    products: string;
    comparison: string;
    modeFocus?: string;
    candidates?: string;
    category: string;
    traffic: string;
    reviews: string;
    actions: string;
    roadmap: string;
  };
  heroCards: ReportHeroCard[];
  navItems: ReportNavItem[];
  modeFocusTitle?: string;
  modeFocusCards?: ReportHeroCard[];
  candidatePoolTitle?: string;
  candidatePoolCards?: ReportCandidateCard[];
  products: ReportProduct[];
  comparisonRows: ReportComparisonRow[];
  categoryCards: ReportHeroCard[];
  categoryRows: ReportComparisonRow[];
  trafficColumns: ReportTrafficColumn[];
  trafficInsight: string;
  reviewBlocks: ReportReviewBlock[];
  actionCards: ReportActionCard[];
  roadmapSteps: ReportRoadmapStep[];
  sourceReport?: SourceReportPayload;
}
