export type Timeframe = '1Y' | '3Y' | '5Y' | '10Y';

export interface NavDataPoint {
  date: Date;
  nav: number;
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  weekOfMonth: number;
  month: number; // 0-11
  quarter: number; // 1-4
  year: number;
}

export interface FundMeta {
  fundHouse: string;
  schemeName: string;
  schemeCode: number;
  schemeCategory: string;
}

export interface FundData {
  meta: FundMeta;
  navData: NavDataPoint[];
}

export interface AnalysisBucket {
  key: string | number;
  label: string;
  avgNav: number;
  minNav: number;
  maxNav: number;
  samples: number;
  volatility: number;
  rank: number;
  vsBest: number; // percentage difference vs best
}

export interface FundAnalysis {
  fundCode: number;
  fundName: string;
  timeframe: Timeframe;
  totalSamples: number;
  dateRange: { start: Date; end: Date };
  threeYearReturn: number;
  
  // Analysis by different factors
  dayOfMonth: AnalysisBucket[];
  dayOfWeek: AnalysisBucket[];
  weekOfMonth: AnalysisBucket[];
  monthOfYear: AnalysisBucket[];
  quarterOfYear: AnalysisBucket[];
  
  // Best picks
  bestDay: AnalysisBucket;
  bestWeekday: AnalysisBucket;
  bestWeek: AnalysisBucket;
  bestMonth: AnalysisBucket;
  bestQuarter: AnalysisBucket;
  
  // Worst picks (for comparison)
  worstDay: AnalysisBucket;
  worstWeekday: AnalysisBucket;
  worstWeek: AnalysisBucket;
  worstMonth: AnalysisBucket;
  worstQuarter: AnalysisBucket;
}

export interface ConsoleLine {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const FUNDS = [
  { code: 101762, name: 'HDFC Flexi Cap Fund', shortName: 'HDFC Flexi Cap' },
  { code: 122640, name: 'Parag Parikh Flexi Cap Fund', shortName: 'Parag Parikh' },
  { code: 147944, name: 'Bandhan Small Cap Fund', shortName: 'Bandhan Small Cap' },
] as const;

export const TIMEFRAMES: { value: Timeframe; label: string; years: number }[] = [
  { value: '1Y', label: '1 Year', years: 1 },
  { value: '3Y', label: '3 Years', years: 3 },
  { value: '5Y', label: '5 Years', years: 5 },
  { value: '10Y', label: '10 Years', years: 10 },
];

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const QUARTER_LABELS = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
