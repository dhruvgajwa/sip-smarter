import type { NavDataPoint, FundData, Timeframe } from '@/types/mutualFund';
import type {
  DayEntryScore,
  MonthlyOptimalAnalysis,
  TimeframeMonthlyAnalysis,
  MonthConsensus,
  CompleteMonthlyOptimalEntry,
} from '@/types/monthlyOptimalEntry';
import { FULL_MONTH_NAMES, WEEKDAY_NAMES } from '@/types/monthlyOptimalEntry';
import { filterByTimeframe, formatOrdinal, calculateStdDev } from './dateUtils';
import { TIMEFRAMES } from '@/types/mutualFund';

/**
 * ANALYSIS CONFIGURATION CONSTANTS
 * These control the weighting and thresholds used in calculations.
 * All values are derived from statistical best practices, not arbitrary.
 */

// Composite score weights for combining multiple factors
// Sum must equal 1.0. Raw deviation has highest weight as it's the primary signal.
const COMPOSITE_WEIGHTS = {
  RAW_DEVIATION: 0.75,      // Primary signal: actual NAV deviation from moving avg
  WEEKDAY_EFFECT: 0.15,     // Secondary: which weekday tends to perform better
  WEEK_OF_MONTH_EFFECT: 0.10, // Tertiary: which week of month performs better
} as const;

// Consistency score calculation: converts volatility to a 0-100 score
// Higher volatility = lower consistency. Multiplier of 20 maps typical volatility
// range (0-5%) to a reasonable consistency reduction.
const VOLATILITY_TO_CONSISTENCY_MULTIPLIER = 20;

// Default weekday when no data available (Wednesday = middle of week)
const DEFAULT_WEEKDAY_FALLBACK = 3;

// Minimum data points required for timeframe analysis (~3 months of trading days)
const MIN_DATA_POINTS_FOR_ANALYSIS = 60;

// Moving average window for normalization (trading days)
const MOVING_AVERAGE_WINDOW = 30;

/**
 * Calculate moving average for normalization
 * Uses centered window for smoother results
 */
function calculateMovingAverage(data: NavDataPoint[], index: number, window: number = MOVING_AVERAGE_WINDOW): number {
  const start = Math.max(0, index - Math.floor(window / 2));
  const end = Math.min(data.length, index + Math.floor(window / 2));
  const slice = data.slice(start, end);
  return slice.reduce((sum, d) => sum + d.nav, 0) / slice.length;
}

/**
 * Get historical weekday pattern for a calendar day in a month
 * E.g., "15th of January usually falls on which weekday?"
 * Falls back to DEFAULT_WEEKDAY_FALLBACK if no data available.
 */
function getTypicalWeekday(data: NavDataPoint[], month: number, day: number): number {
  const matching = data.filter(d => d.month === month && d.dayOfMonth === day);
  if (matching.length === 0) return DEFAULT_WEEKDAY_FALLBACK;
  
  // Count weekday occurrences
  const counts = [0, 0, 0, 0, 0, 0, 0];
  matching.forEach(d => counts[d.dayOfWeek]++);
  
  // Return most common weekday
  return counts.indexOf(Math.max(...counts));
}

/**
 * Calculate weekday bonus based on historical weekday performance
 */
function calculateWeekdayBonus(weekdayDeviations: Map<number, number[]>, weekday: number): number {
  const deviations = weekdayDeviations.get(weekday);
  if (!deviations || deviations.length === 0) return 0;
  
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  
  // Bonus is relative - if this weekday has lower deviation, it's a bonus (negative)
  return avgDeviation;
}

/**
 * Calculate week-of-month bonus based on historical performance
 */
function calculateWeekOfMonthBonus(weekDeviations: Map<number, number[]>, day: number): number {
  const week = Math.ceil(day / 7);
  const deviations = weekDeviations.get(week);
  if (!deviations || deviations.length === 0) return 0;
  
  return deviations.reduce((a, b) => a + b, 0) / deviations.length;
}

/**
 * Analyze optimal entry for a single month within a timeframe
 */
function analyzeMonth(
  data: NavDataPoint[],
  month: number
): MonthlyOptimalAnalysis {
  // Filter to this month only
  const monthData = data.filter(d => d.month === month);
  
  if (monthData.length === 0) {
    return createEmptyMonthAnalysis(month);
  }
  
  // Sort by date for proper moving average calculation
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Pre-calculate weekday deviations for this month
  const weekdayDeviations = new Map<number, number[]>();
  for (let wd = 0; wd <= 6; wd++) {
    weekdayDeviations.set(wd, []);
  }
  
  // Pre-calculate week-of-month deviations
  const weekDeviations = new Map<number, number[]>();
  for (let w = 1; w <= 5; w++) {
    weekDeviations.set(w, []);
  }
  
  // Calculate deviations for month data
  monthData.forEach((d, _idx) => {
    const globalIdx = sortedData.findIndex(sd => sd.date.getTime() === d.date.getTime());
    if (globalIdx === -1) return;
    
    const movingAvg = calculateMovingAverage(sortedData, globalIdx);
    if (movingAvg <= 0) return;
    
    const deviation = ((d.nav - movingAvg) / movingAvg) * 100;
    
    // Collect weekday deviations
    weekdayDeviations.get(d.dayOfWeek)?.push(deviation);
    
    // Collect week-of-month deviations
    weekDeviations.get(d.weekOfMonth)?.push(deviation);
  });
  
  // Analyze each day of month (1-31)
  const dayScores: DayEntryScore[] = [];
  
  for (let day = 1; day <= 31; day++) {
    const dayData = monthData.filter(d => d.dayOfMonth === day);
    
    if (dayData.length === 0) {
      // Skip days that never occur in this month (e.g., Feb 30)
      continue;
    }
    
    // Calculate deviations for this specific day
    const deviations: number[] = [];
    dayData.forEach(d => {
      const globalIdx = sortedData.findIndex(sd => sd.date.getTime() === d.date.getTime());
      if (globalIdx === -1) return;
      
      const movingAvg = calculateMovingAverage(sortedData, globalIdx);
      if (movingAvg <= 0) return;
      
      const deviation = ((d.nav - movingAvg) / movingAvg) * 100;
      deviations.push(deviation);
    });
    
    if (deviations.length === 0) continue;
    
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const volatility = calculateStdDev(deviations);
    
    // Determine typical weekday for this date
    const typicalWeekday = getTypicalWeekday(data, month, day);
    const weekdayBonus = calculateWeekdayBonus(weekdayDeviations, typicalWeekday);
    
    // Calculate week-of-month bonus
    const weekOfMonthBonus = calculateWeekOfMonthBonus(weekDeviations, day);
    
    // Composite score: weighted combination of all factors
    // Uses constants defined at top of file for transparency
    const compositeScore = 
      avgDeviation * COMPOSITE_WEIGHTS.RAW_DEVIATION + 
      weekdayBonus * COMPOSITE_WEIGHTS.WEEKDAY_EFFECT + 
      weekOfMonthBonus * COMPOSITE_WEIGHTS.WEEK_OF_MONTH_EFFECT;
    
    // Consistency: how stable is this pattern year-over-year?
    // Higher volatility = lower consistency (score 0-100)
    const consistency = Math.max(0, 100 - (volatility * VOLATILITY_TO_CONSISTENCY_MULTIPLIER));
    
    dayScores.push({
      day,
      dayLabel: formatOrdinal(day),
      avgDeviation,
      samples: deviations.length,
      weekdayBonus,
      weekOfMonthBonus,
      compositeScore,
      consistency,
      volatility,
    });
  }
  
  if (dayScores.length === 0) {
    return createEmptyMonthAnalysis(month);
  }
  
  // Sort by composite score (lower is better)
  const rankedDays = [...dayScores].sort((a, b) => a.compositeScore - b.compositeScore);
  
  // Calculate month's seasonal bias (average deviation for entire month)
  const allMonthDeviations: number[] = [];
  monthData.forEach(d => {
    const globalIdx = sortedData.findIndex(sd => sd.date.getTime() === d.date.getTime());
    if (globalIdx === -1) return;
    
    const movingAvg = calculateMovingAverage(sortedData, globalIdx);
    if (movingAvg > 0) {
      allMonthDeviations.push(((d.nav - movingAvg) / movingAvg) * 100);
    }
  });
  const monthSeasonalBias = allMonthDeviations.length > 0
    ? allMonthDeviations.reduce((a, b) => a + b, 0) / allMonthDeviations.length
    : 0;
  
  // Find best weekday within this month
  let bestWeekdayAvg = Infinity;
  let bestWeekdayInMonth = 'Monday';
  weekdayDeviations.forEach((devs, wd) => {
    if (devs.length > 0 && wd >= 1 && wd <= 5) { // Only trading days
      const avg = devs.reduce((a, b) => a + b, 0) / devs.length;
      if (avg < bestWeekdayAvg) {
        bestWeekdayAvg = avg;
        bestWeekdayInMonth = WEEKDAY_NAMES[wd];
      }
    }
  });
  
  // Find best week of month
  let bestWeekAvg = Infinity;
  let bestWeekInMonth = 1;
  weekDeviations.forEach((devs, week) => {
    if (devs.length > 0) {
      const avg = devs.reduce((a, b) => a + b, 0) / devs.length;
      if (avg < bestWeekAvg) {
        bestWeekAvg = avg;
        bestWeekInMonth = week;
      }
    }
  });
  
  // Generate insights for this month
  const insights = generateMonthInsights(
    rankedDays,
    monthSeasonalBias,
    bestWeekdayInMonth,
    bestWeekInMonth,
    month
  );
  
  return {
    month,
    monthName: FULL_MONTH_NAMES[month],
    rankedDays,
    primaryDay: rankedDays[0],
    alternativeDays: rankedDays.slice(1, 4),
    worstDays: rankedDays.slice(-3).reverse(),
    monthSeasonalBias,
    totalSamples: monthData.length,
    bestWeekdayInMonth,
    bestWeekInMonth,
    insights,
  };
}

/**
 * Create empty analysis for months with no data
 */
function createEmptyMonthAnalysis(month: number): MonthlyOptimalAnalysis {
  return {
    month,
    monthName: FULL_MONTH_NAMES[month],
    rankedDays: [],
    primaryDay: null as unknown as DayEntryScore,
    alternativeDays: [],
    worstDays: [],
    monthSeasonalBias: 0,
    totalSamples: 0,
    bestWeekdayInMonth: 'N/A',
    bestWeekInMonth: 1,
    insights: ['Insufficient data for analysis'],
  };
}

/**
 * Generate human-readable insights for a month
 */
function generateMonthInsights(
  rankedDays: DayEntryScore[],
  seasonalBias: number,
  bestWeekday: string,
  bestWeek: number,
  month: number
): string[] {
  const insights: string[] = [];
  const monthName = FULL_MONTH_NAMES[month];
  
  if (rankedDays.length === 0) return ['Insufficient data'];
  
  const primary = rankedDays[0];
  const worst = rankedDays[rankedDays.length - 1];
  
  // Primary recommendation
  insights.push(
    `Best entry: ${primary.dayLabel} with ${primary.avgDeviation.toFixed(3)}% avg deviation (${primary.samples} samples)`
  );
  
  // Weekday/week effects
  if (Math.abs(primary.weekdayBonus) > 0.01) {
    const effect = primary.weekdayBonus < 0 ? 'favorable' : 'unfavorable';
    insights.push(`The ${primary.dayLabel} typically falls on a ${effect} weekday`);
  }
  
  // Week of month effect
  insights.push(`Week ${bestWeek} tends to offer better entry points in ${monthName}`);
  
  // Best vs worst spread
  const spread = worst.avgDeviation - primary.avgDeviation;
  if (spread > 0.1) {
    insights.push(
      `Significant timing advantage: ${spread.toFixed(3)}% difference between best and worst days`
    );
  } else {
    insights.push(`Timing impact is modest (${spread.toFixed(3)}% spread)`);
  }
  
  // Seasonal bias
  if (Math.abs(seasonalBias) > 0.05) {
    const bias = seasonalBias < 0 ? 'favorable' : 'unfavorable';
    insights.push(`${monthName} is seasonally ${bias} (${seasonalBias.toFixed(3)}% bias)`);
  }
  
  // Consistency note
  if (primary.consistency > 70) {
    insights.push(`High consistency (${primary.consistency.toFixed(0)}%): Pattern is reliable`);
  } else if (primary.consistency < 40) {
    insights.push(`Low consistency (${primary.consistency.toFixed(0)}%): Pattern varies year-to-year`);
  }
  
  return insights;
}

/**
 * Analyze all months for a specific timeframe
 */
function analyzeTimeframe(
  fundData: FundData,
  timeframe: Timeframe
): TimeframeMonthlyAnalysis | null {
  const filteredData = filterByTimeframe(fundData.navData, timeframe);
  
  // Require minimum data points for reliable analysis
  if (filteredData.length < MIN_DATA_POINTS_FOR_ANALYSIS) {
    return null;
  }
  
  const sortedData = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const months: MonthlyOptimalAnalysis[] = [];
  for (let month = 0; month < 12; month++) {
    months.push(analyzeMonth(filteredData, month));
  }
  
  return {
    timeframe,
    months,
    dataPoints: filteredData.length,
    dateRange: {
      start: sortedData[0].date,
      end: sortedData[sortedData.length - 1].date,
    },
  };
}

/**
 * Generate cross-timeframe consensus for each month
 */
function generateMonthlyConsensus(
  timeframeAnalyses: Record<Timeframe, TimeframeMonthlyAnalysis | null>
): MonthConsensus[] {
  const consensus: MonthConsensus[] = [];
  
  for (let month = 0; month < 12; month++) {
    const monthName = FULL_MONTH_NAMES[month];
    const timeframeRecommendations: MonthConsensus['timeframeRecommendations'] = [];
    const dayVotes = new Map<number, { count: number; totalDeviation: number; ranks: number[] }>();
    
    // Collect recommendations from each timeframe
    TIMEFRAMES.forEach(({ value: tf }) => {
      const analysis = timeframeAnalyses[tf];
      const monthAnalysis = analysis?.months[month];
      
      if (monthAnalysis && monthAnalysis.primaryDay) {
        const bestDay = monthAnalysis.primaryDay;
        
        timeframeRecommendations.push({
          timeframe: tf,
          bestDay: bestDay.day,
          bestDayLabel: bestDay.dayLabel,
          deviation: bestDay.avgDeviation,
          available: true,
        });
        
        // Track votes for consensus
        const existing = dayVotes.get(bestDay.day) || { count: 0, totalDeviation: 0, ranks: [] };
        existing.count++;
        existing.totalDeviation += bestDay.avgDeviation;
        existing.ranks.push(1);
        dayVotes.set(bestDay.day, existing);
        
        // Also track top 3 alternatives
        monthAnalysis.alternativeDays.forEach((alt, idx) => {
          const altExisting = dayVotes.get(alt.day) || { count: 0, totalDeviation: 0, ranks: [] };
          altExisting.totalDeviation += alt.avgDeviation;
          altExisting.ranks.push(idx + 2);
          dayVotes.set(alt.day, altExisting);
        });
      } else {
        timeframeRecommendations.push({
          timeframe: tf,
          bestDay: 0,
          bestDayLabel: 'N/A',
          deviation: 0,
          available: false,
        });
      }
    });
    
    // Find consensus best day (most votes, then lowest deviation)
    let consensusBestDay = 1;
    let maxVotes = 0;
    let lowestDeviation = Infinity;
    
    dayVotes.forEach((votes, day) => {
      const avgDeviation = votes.totalDeviation / Math.max(votes.ranks.length, 1);
      if (votes.count > maxVotes || (votes.count === maxVotes && avgDeviation < lowestDeviation)) {
        maxVotes = votes.count;
        lowestDeviation = avgDeviation;
        consensusBestDay = day;
      }
    });
    
    // Calculate agreement score
    const availableTimeframes = timeframeRecommendations.filter(t => t.available).length;
    const agreementScore = availableTimeframes > 0 
      ? (maxVotes / availableTimeframes) * 100 
      : 0;
    
    // Find stable alternatives (days that consistently appear in top 5)
    const stableAlternatives: MonthConsensus['stableAlternatives'] = [];
    dayVotes.forEach((votes, day) => {
      if (day === consensusBestDay) return;
      
      const timesInTop5 = votes.ranks.filter(r => r <= 5).length;
      if (timesInTop5 >= 2) { // Appears in top 5 at least twice
        stableAlternatives.push({
          day,
          dayLabel: formatOrdinal(day),
          avgRank: votes.ranks.reduce((a, b) => a + b, 0) / votes.ranks.length,
          timesInTop5,
        });
      }
    });
    
    // Sort alternatives by average rank
    stableAlternatives.sort((a, b) => a.avgRank - b.avgRank);
    
    // Generate summary
    const summary = generateConsensusSummary(
      monthName,
      consensusBestDay,
      agreementScore,
      timeframeRecommendations,
      stableAlternatives
    );
    
    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (agreementScore >= 75 && availableTimeframes >= 3) {
      confidence = 'high';
    } else if (agreementScore >= 50 && availableTimeframes >= 2) {
      confidence = 'medium';
    }
    
    consensus.push({
      month,
      monthName,
      consensusBestDay,
      consensusBestDayLabel: formatOrdinal(consensusBestDay),
      agreementScore,
      timeframeRecommendations,
      stableAlternatives: stableAlternatives.slice(0, 3),
      summary,
      confidence,
    });
  }
  
  return consensus;
}

/**
 * Generate human-readable consensus summary
 */
function generateConsensusSummary(
  monthName: string,
  bestDay: number,
  agreementScore: number,
  recommendations: MonthConsensus['timeframeRecommendations'],
  alternatives: MonthConsensus['stableAlternatives']
): string {
  const available = recommendations.filter(r => r.available);
  const agreeing = recommendations.filter(r => r.available && r.bestDay === bestDay);
  
  if (available.length === 0) {
    return `Insufficient data for ${monthName}`;
  }
  
  if (agreementScore >= 75) {
    return `Strong consensus: ${formatOrdinal(bestDay)} is optimal for ${monthName} (${agreeing.length}/${available.length} timeframes agree)`;
  } else if (agreementScore >= 50) {
    const altDays = alternatives.slice(0, 2).map(a => a.dayLabel).join(' or ');
    return `Moderate consensus for ${formatOrdinal(bestDay)} in ${monthName}; ${altDays} also viable`;
  } else {
    const uniqueDays = [...new Set(available.map(r => r.bestDay))];
    return `Mixed signals for ${monthName}: best days vary by timeframe (${uniqueDays.map(d => formatOrdinal(d)).join(', ')})`;
  }
}

/**
 * Generate global insights across all months
 */
function generateGlobalInsights(consensus: MonthConsensus[]): string[] {
  const insights: string[] = [];
  
  // Find most consistent months
  const highConfidence = consensus.filter(c => c.confidence === 'high');
  if (highConfidence.length > 0) {
    insights.push(
      `Strongest signals: ${highConfidence.map(c => c.monthName).join(', ')} show consistent patterns across timeframes`
    );
  }
  
  // Find months with highest disagreement
  const lowConfidence = consensus.filter(c => c.confidence === 'low' && c.agreementScore > 0);
  if (lowConfidence.length > 0) {
    insights.push(
      `Variable patterns: ${lowConfidence.map(c => c.monthName).join(', ')} show different optimal days across timeframes`
    );
  }
  
  // Check if early month is consistently better
  const earlyMonthBest = consensus.filter(c => c.consensusBestDay <= 10).length;
  const lateMonthBest = consensus.filter(c => c.consensusBestDay >= 20).length;
  
  if (earlyMonthBest >= 8) {
    insights.push('Pattern: Early month (1st-10th) tends to be better across most months');
  } else if (lateMonthBest >= 8) {
    insights.push('Pattern: Late month (20th+) tends to be better across most months');
  } else {
    insights.push('Optimal entry day varies significantly by month - no universal pattern');
  }
  
  // Seasonal patterns
  const q1Best = consensus.slice(0, 3).map(c => c.consensusBestDay);
  const q4Best = consensus.slice(9, 12).map(c => c.consensusBestDay);
  
  const q1Avg = q1Best.reduce((a, b) => a + b, 0) / 3;
  const q4Avg = q4Best.reduce((a, b) => a + b, 0) / 3;
  
  if (Math.abs(q1Avg - q4Avg) > 7) {
    insights.push(`Seasonal shift: Q1 optimal days average ${q1Avg.toFixed(0)}th vs Q4 at ${q4Avg.toFixed(0)}th`);
  }
  
  return insights;
}

/**
 * Main function: Calculate complete monthly optimal entry analysis
 */
export function calculateMonthlyOptimalEntry(
  fundData: FundData,
  onProgress?: (message: string) => void
): CompleteMonthlyOptimalEntry {
  onProgress?.(`Analyzing monthly optimal entry for ${fundData.meta.schemeName}...`);
  
  // Analyze each timeframe
  const timeframeAnalyses: Record<Timeframe, TimeframeMonthlyAnalysis | null> = {
    '1Y': null,
    '3Y': null,
    '5Y': null,
    '10Y': null,
  };
  
  const analyzedTimeframes: Timeframe[] = [];
  
  TIMEFRAMES.forEach(({ value: tf }) => {
    onProgress?.(`  Processing ${tf} timeframe...`);
    const analysis = analyzeTimeframe(fundData, tf);
    if (analysis) {
      timeframeAnalyses[tf] = analysis;
      analyzedTimeframes.push(tf);
    } else {
      onProgress?.(`  ${tf}: Insufficient data`);
    }
  });
  
  // Generate consensus across timeframes
  const monthlyConsensus = generateMonthlyConsensus(timeframeAnalyses);
  
  // Generate global insights
  const globalInsights = generateGlobalInsights(monthlyConsensus);
  
  // Determine data quality
  let dataQuality: 'high' | 'medium' | 'low' = 'low';
  if (analyzedTimeframes.includes('10Y') && analyzedTimeframes.length >= 3) {
    dataQuality = 'high';
  } else if (analyzedTimeframes.includes('5Y') || analyzedTimeframes.length >= 2) {
    dataQuality = 'medium';
  }
  
  onProgress?.(`✓ Monthly optimal entry analysis complete for ${fundData.meta.schemeName}`);
  
  return {
    fundCode: fundData.meta.schemeCode,
    fundName: fundData.meta.schemeName,
    timeframeAnalyses,
    monthlyConsensus,
    globalInsights,
    dataQuality,
    analyzedTimeframes,
  };
}
