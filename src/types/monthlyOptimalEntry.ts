import type { Timeframe } from './mutualFund';

/**
 * Multi-factor entry point for a specific day within a month
 * Considers: calendar day, weekday effect, week-of-month effect
 */
export interface DayEntryScore {
  day: number;                    // 1-31
  dayLabel: string;               // "1st", "15th", etc.
  
  // Raw deviation from 30-day moving average (in %)
  avgDeviation: number;
  samples: number;
  
  // Multi-factor adjustment scores
  weekdayBonus: number;           // Adjustment based on typical weekday this falls on
  weekOfMonthBonus: number;       // Adjustment based on which week (1-5) this falls in
  
  // Composite score (lower is better)
  compositeScore: number;
  
  // Confidence metrics
  consistency: number;            // 0-100, how consistent across years
  volatility: number;
}

/**
 * Analysis for a single month showing optimal entry days
 */
export interface MonthlyOptimalAnalysis {
  month: number;                  // 0-11
  monthName: string;              // "January", "February", etc.
  
  // All days ranked
  rankedDays: DayEntryScore[];
  
  // Top recommendations for this month
  primaryDay: DayEntryScore;
  alternativeDays: DayEntryScore[];  // 2nd, 3rd best
  
  // Days to avoid
  worstDays: DayEntryScore[];
  
  // Month-level metrics
  monthSeasonalBias: number;      // Is this month generally good/bad? (deviation)
  totalSamples: number;
  
  // Multi-factor insights
  bestWeekdayInMonth: string;     // "Monday", "Tuesday", etc.
  bestWeekInMonth: number;        // 1-5
  
  // Reasoning for this month
  insights: string[];
}

/**
 * Timeframe-specific monthly analysis
 */
export interface TimeframeMonthlyAnalysis {
  timeframe: Timeframe;
  months: MonthlyOptimalAnalysis[];
  dataPoints: number;
  dateRange: { start: Date; end: Date };
}

/**
 * Cross-timeframe consensus for a month
 */
export interface MonthConsensus {
  month: number;
  monthName: string;
  
  // Best day consensus across timeframes
  consensusBestDay: number;
  consensusBestDayLabel: string;
  
  // How many timeframes agree on this day being top 3
  agreementScore: number;         // 0-100
  
  // Per-timeframe recommendations
  timeframeRecommendations: {
    timeframe: Timeframe;
    bestDay: number;
    bestDayLabel: string;
    deviation: number;
    available: boolean;
  }[];
  
  // Alternative days that appear consistently
  stableAlternatives: {
    day: number;
    dayLabel: string;
    avgRank: number;
    timesInTop5: number;
  }[];
  
  // Key insight for this month
  summary: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete monthly optimal entry analysis
 * This is the main output of the analysis service
 */
export interface CompleteMonthlyOptimalEntry {
  fundCode: number;
  fundName: string;
  
  // Per-timeframe detailed analysis
  timeframeAnalyses: Record<Timeframe, TimeframeMonthlyAnalysis | null>;
  
  // Cross-timeframe consensus (the actionable output)
  monthlyConsensus: MonthConsensus[];
  
  // Global patterns observed
  globalInsights: string[];
  
  // Overall data quality
  dataQuality: 'high' | 'medium' | 'low';
  analyzedTimeframes: Timeframe[];
}

// Helper constants
export const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
