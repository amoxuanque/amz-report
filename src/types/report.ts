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

export interface CompetitiveReport {
  meta: {
    date: string;
    marketplace: string;
    source: string;
    mode: string;
  };
  title: string;
  summary: string;
  heroCards: ReportHeroCard[];
  navItems: ReportNavItem[];
  products: ReportProduct[];
  comparisonRows: ReportComparisonRow[];
  trafficColumns: ReportTrafficColumn[];
  trafficInsight: string;
  actionCards: ReportActionCard[];
}
