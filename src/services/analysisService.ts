import type { NavDataPoint, FundData, FundAnalysis, AnalysisBucket, Timeframe, TimingSignal, ComprehensiveRecommendation } from '@/types/mutualFund';
import { filterByTimeframe, calculateVolatility, formatOrdinal } from './dateUtils';
import { WEEKDAY_LABELS, MONTH_LABELS, QUARTER_LABELS } from '@/types/mutualFund';

interface BucketAccumulator {
  deviations: number[]; // Percentage deviations from period average
  key: string | number;
  label: string;
}

/**
 * CORRECTED ANALYSIS LOGIC:
 * 
 * The problem with raw NAV comparison: NAV increases over time due to fund growth.
 * Comparing raw NAV from 2020 vs 2024 is meaningless.
 * 
 * Solution: For each data point, calculate its deviation from the 30-day moving average.
 * This normalizes the data and shows if a particular day/week tends to be higher or lower
 * than its surrounding period.
 * 
 * Negative deviation = NAV below average = GOOD for buying
 * Positive deviation = NAV above average = BAD for buying
 */

/**
 * Calculate 30-day moving average for normalization
 */
function calculateMovingAverages(data: NavDataPoint[], window: number = 30): Map<string, number> {
  const avgMap = new Map<string, number>();
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, i + Math.floor(window / 2));
    const slice = data.slice(start, end);
    const avg = slice.reduce((sum, d) => sum + d.nav, 0) / slice.length;
    avgMap.set(data[i].date.toISOString(), avg);
  }
  
  return avgMap;
}

/**
 * Group NAV data by a specific factor and calculate normalized statistics
 */
function analyzeByFactor(
  data: NavDataPoint[],
  movingAvgMap: Map<string, number>,
  getKey: (d: NavDataPoint) => number,
  getLabel: (key: number) => string,
  allKeys: number[]
): AnalysisBucket[] {
  // Initialize buckets for all possible keys
  const buckets = new Map<number, BucketAccumulator>();
  allKeys.forEach(key => {
    buckets.set(key, { deviations: [], key, label: getLabel(key) });
  });
  
  // Populate buckets with normalized deviations
  data.forEach(d => {
    const key = getKey(d);
    const bucket = buckets.get(key);
    const movingAvg = movingAvgMap.get(d.date.toISOString());
    
    if (bucket && movingAvg && movingAvg > 0) {
      // Calculate percentage deviation from moving average
      const deviation = ((d.nav - movingAvg) / movingAvg) * 100;
      bucket.deviations.push(deviation);
    }
  });
  
  // Calculate statistics for each bucket
  const results: AnalysisBucket[] = [];
  buckets.forEach((bucket, key) => {
    if (bucket.deviations.length > 0) {
      const avgDeviation = bucket.deviations.reduce((a, b) => a + b, 0) / bucket.deviations.length;
      const minDeviation = Math.min(...bucket.deviations);
      const maxDeviation = Math.max(...bucket.deviations);
      const volatility = calculateVolatility(bucket.deviations.map(d => d + 100)); // Add 100 to avoid negative values in volatility calc
      
      results.push({
        key,
        label: bucket.label,
        avgDeviation, // Average % deviation from moving average
        minDeviation,
        maxDeviation,
        samples: bucket.deviations.length,
        volatility,
        rank: 0, // Will be calculated after sorting
        vsBest: 0, // Will be calculated after ranking
        significance: 'low', // Will be calculated
      });
    }
  });
  
  // Sort by avgDeviation (lower/more negative is better for buying)
  results.sort((a, b) => a.avgDeviation - b.avgDeviation);
  
  // Assign ranks and calculate vs best
  const bestDeviation = results[0]?.avgDeviation || 0;
  const worstDeviation = results[results.length - 1]?.avgDeviation || 0;
  const range = worstDeviation - bestDeviation;
  
  results.forEach((bucket, index) => {
    bucket.rank = index + 1;
    // vsBest shows how much worse this is compared to the best option
    bucket.vsBest = bucket.avgDeviation - bestDeviation;
    
    // Calculate statistical significance based on sample size and consistency
    const minSamples = 10;
    if (bucket.samples < minSamples) {
      bucket.significance = 'low';
    } else if (bucket.volatility < 1 && bucket.samples >= 20) {
      bucket.significance = 'high';
    } else if (bucket.samples >= 15) {
      bucket.significance = 'medium';
    } else {
      bucket.significance = 'low';
    }
  });
  
  // Sort back by key for display
  results.sort((a, b) => (a.key as number) - (b.key as number));
  
  return results;
}

/**
 * Analyze fund data for a specific timeframe
 */
export function analyzeFund(
  fundData: FundData,
  timeframe: Timeframe,
  onProgress?: (message: string) => void
): FundAnalysis {
  onProgress?.(`Analyzing ${fundData.meta.schemeName} for ${timeframe}...`);
  
  // Filter data by timeframe
  const filteredData = filterByTimeframe(fundData.navData, timeframe);
  
  if (filteredData.length === 0) {
    throw new Error(`No data available for ${timeframe} timeframe`);
  }
  
  onProgress?.(`Processing ${filteredData.length} data points with normalized deviation analysis...`);
  
  // Calculate moving averages for normalization
  const movingAvgMap = calculateMovingAverages(filteredData, 30);
  
  // Analyze by day of month (1-31)
  const dayOfMonth = analyzeByFactor(
    filteredData,
    movingAvgMap,
    d => d.dayOfMonth,
    key => formatOrdinal(key),
    Array.from({ length: 31 }, (_, i) => i + 1)
  );
  
  // Analyze by day of week (1-5, Mon-Fri only, markets closed on weekends)
  const dayOfWeek = analyzeByFactor(
    filteredData.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5),
    movingAvgMap,
    d => d.dayOfWeek,
    key => WEEKDAY_LABELS[key],
    [1, 2, 3, 4, 5]
  );
  
  // Analyze by week of month (1-5)
  const weekOfMonth = analyzeByFactor(
    filteredData,
    movingAvgMap,
    d => d.weekOfMonth,
    key => `Week ${key}`,
    [1, 2, 3, 4, 5]
  );
  
  // Analyze by month (0-11)
  const monthOfYear = analyzeByFactor(
    filteredData,
    movingAvgMap,
    d => d.month,
    key => MONTH_LABELS[key],
    Array.from({ length: 12 }, (_, i) => i)
  );
  
  // Analyze by quarter (1-4)
  const quarterOfYear = analyzeByFactor(
    filteredData,
    movingAvgMap,
    d => d.quarter,
    key => QUARTER_LABELS[key - 1],
    [1, 2, 3, 4]
  );
  
  // Find best and worst for each factor
  const findBestWorst = (buckets: AnalysisBucket[]) => {
    const sorted = [...buckets].sort((a, b) => a.avgDeviation - b.avgDeviation);
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
    };
  };
  
  const dayResults = findBestWorst(dayOfMonth);
  const weekdayResults = findBestWorst(dayOfWeek);
  const weekResults = findBestWorst(weekOfMonth);
  const monthResults = findBestWorst(monthOfYear);
  const quarterResults = findBestWorst(quarterOfYear);
  
  // Calculate return over period (first to last, accounting for chronological order)
  // NAV data is typically in reverse chronological order from API
  const sortedByDate = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstNav = sortedByDate[0]?.nav || 0;
  const lastNav = sortedByDate[sortedByDate.length - 1]?.nav || 0;
  const periodReturn = firstNav > 0 ? ((lastNav - firstNav) / firstNav) * 100 : 0;
  
  onProgress?.(`✓ Analysis complete for ${fundData.meta.schemeName}`);
  
  return {
    fundCode: fundData.meta.schemeCode,
    fundName: fundData.meta.schemeName,
    timeframe,
    totalSamples: filteredData.length,
    dateRange: {
      start: sortedByDate[0].date,
      end: sortedByDate[sortedByDate.length - 1].date,
    },
    periodReturn,
    
    dayOfMonth,
    dayOfWeek,
    weekOfMonth,
    monthOfYear,
    quarterOfYear,
    
    bestDay: dayResults.best,
    bestWeekday: weekdayResults.best,
    bestWeek: weekResults.best,
    bestMonth: monthResults.best,
    bestQuarter: quarterResults.best,
    
    worstDay: dayResults.worst,
    worstWeekday: weekdayResults.worst,
    worstWeek: weekResults.worst,
    worstMonth: monthResults.worst,
    worstQuarter: quarterResults.worst,
  };
}

/**
 * Generate comprehensive recommendation based on ALL analysis dimensions
 */
export function generateComprehensiveRecommendation(analysis: FundAnalysis): ComprehensiveRecommendation {
  const signals: TimingSignal[] = [];
  
  // Helper to create signal from bucket analysis
  const addSignal = (
    factor: string,
    best: AnalysisBucket,
    worst: AnalysisBucket,
    allBuckets: AnalysisBucket[],
    weight: number
  ) => {
    const range = worst.avgDeviation - best.avgDeviation;
    const strength = Math.min(Math.abs(range), 1); // Cap at 1%
    
    // Check if the pattern is consistent across multiple periods
    const topThree = [...allBuckets].sort((a, b) => a.avgDeviation - b.avgDeviation).slice(0, 3);
    const bottomThree = [...allBuckets].sort((a, b) => b.avgDeviation - a.avgDeviation).slice(0, 3);
    
    signals.push({
      factor,
      bestOption: best.label,
      worstOption: worst.label,
      advantage: range,
      confidence: best.significance,
      weight,
      reasoning: `${best.label} averages ${best.avgDeviation.toFixed(3)}% below moving average vs ${worst.label} at +${worst.avgDeviation.toFixed(3)}%`,
      topThree: topThree.map(b => b.label),
      bottomThree: bottomThree.map(b => b.label),
    });
  };
  
  // Add signals for each factor with appropriate weights
  // Day of month has highest weight (most actionable for SIP timing)
  addSignal('Day of Month', analysis.bestDay, analysis.worstDay, analysis.dayOfMonth, 0.30);
  addSignal('Week of Month', analysis.bestWeek, analysis.worstWeek, analysis.weekOfMonth, 0.25);
  addSignal('Weekday', analysis.bestWeekday, analysis.worstWeekday, analysis.dayOfWeek, 0.20);
  addSignal('Month', analysis.bestMonth, analysis.worstMonth, analysis.monthOfYear, 0.15);
  addSignal('Quarter', analysis.bestQuarter, analysis.worstQuarter, analysis.quarterOfYear, 0.10);
  
  // Calculate composite score
  const weightedAdvantage = signals.reduce((sum, s) => sum + (s.advantage * s.weight), 0);
  
  // Determine overall confidence
  const highConfidenceSignals = signals.filter(s => s.confidence === 'high').length;
  const mediumConfidenceSignals = signals.filter(s => s.confidence === 'medium').length;
  
  let overallConfidence: 'high' | 'medium' | 'low';
  if (highConfidenceSignals >= 3) {
    overallConfidence = 'high';
  } else if (highConfidenceSignals >= 1 || mediumConfidenceSignals >= 3) {
    overallConfidence = 'medium';
  } else {
    overallConfidence = 'low';
  }
  
  // Generate primary recommendation
  const primaryRecommendation = `Set SIP date to ${analysis.bestDay.label} of each month`;
  
  // Generate secondary recommendations based on other factors
  const secondaryRecommendations: string[] = [];
  
  if (analysis.bestWeek.rank <= 2) {
    secondaryRecommendations.push(`Prefer ${analysis.bestWeek.label} (days ${(analysis.bestWeek.key as number - 1) * 7 + 1}-${(analysis.bestWeek.key as number) * 7})`);
  }
  
  if (analysis.bestWeekday.rank === 1 && Math.abs(analysis.bestWeekday.avgDeviation) > 0.01) {
    secondaryRecommendations.push(`${analysis.bestWeekday.label}s tend to be slightly better for buying`);
  }
  
  if (Math.abs(analysis.bestMonth.avgDeviation - analysis.worstMonth.avgDeviation) > 0.1) {
    secondaryRecommendations.push(`${analysis.bestMonth.label} historically shows lower prices; avoid ${analysis.worstMonth.label} for lump sum`);
  }
  
  // Generate warnings/caveats
  const caveats: string[] = [];
  
  if (analysis.totalSamples < 250) {
    caveats.push(`Limited data: Only ${analysis.totalSamples} trading days analyzed`);
  }
  
  if (weightedAdvantage < 0.05) {
    caveats.push('Timing differences are minimal (<0.05%); consistent investing matters more than timing');
  }
  
  const lowConfidenceFactors = signals.filter(s => s.confidence === 'low');
  if (lowConfidenceFactors.length >= 3) {
    caveats.push('Many factors show high volatility; patterns may not persist');
  }
  
  return {
    signals,
    primaryRecommendation,
    secondaryRecommendations,
    caveats,
    estimatedAdvantage: weightedAdvantage,
    overallConfidence,
    dataQuality: {
      totalSamples: analysis.totalSamples,
      timeframe: analysis.timeframe,
      dateRange: analysis.dateRange,
    },
  };
}

/**
 * Analyze all funds
 */
export function analyzeAllFunds(
  fundsData: Map<number, FundData>,
  timeframe: Timeframe,
  onProgress?: (message: string) => void
): Map<number, FundAnalysis> {
  const results = new Map<number, FundAnalysis>();
  
  fundsData.forEach((fundData, code) => {
    try {
      const analysis = analyzeFund(fundData, timeframe, onProgress);
      results.set(code, analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(`✗ Analysis failed for ${code}: ${message}`);
    }
  });
  
  return results;
}
