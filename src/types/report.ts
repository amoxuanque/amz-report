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
  caution?: string;
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
}
