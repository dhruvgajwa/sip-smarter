import type { NavDataPoint, FundData, FundAnalysis, AnalysisBucket, Timeframe } from '@/types/mutualFund';
import { filterByTimeframe, calculateVolatility, formatOrdinal } from './dateUtils';
import { WEEKDAY_LABELS, MONTH_LABELS, QUARTER_LABELS } from '@/types/mutualFund';

interface BucketAccumulator {
  values: number[];
  key: string | number;
  label: string;
}

/**
 * Group NAV data by a specific factor and calculate statistics
 */
function analyzeByFactor(
  data: NavDataPoint[],
  getKey: (d: NavDataPoint) => number,
  getLabel: (key: number) => string,
  allKeys: number[]
): AnalysisBucket[] {
  // Initialize buckets for all possible keys
  const buckets = new Map<number, BucketAccumulator>();
  allKeys.forEach(key => {
    buckets.set(key, { values: [], key, label: getLabel(key) });
  });
  
  // Populate buckets with NAV values
  data.forEach(d => {
    const key = getKey(d);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.values.push(d.nav);
    }
  });
  
  // Calculate statistics for each bucket
  const results: AnalysisBucket[] = [];
  buckets.forEach((bucket, key) => {
    if (bucket.values.length > 0) {
      const avgNav = bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length;
      const minNav = Math.min(...bucket.values);
      const maxNav = Math.max(...bucket.values);
      const volatility = calculateVolatility(bucket.values);
      
      results.push({
        key,
        label: bucket.label,
        avgNav,
        minNav,
        maxNav,
        samples: bucket.values.length,
        volatility,
        rank: 0, // Will be calculated after sorting
        vsBest: 0, // Will be calculated after ranking
      });
    }
  });
  
  // Sort by avgNav (lower is better for buying)
  results.sort((a, b) => a.avgNav - b.avgNav);
  
  // Assign ranks and calculate vs best
  const bestAvg = results[0]?.avgNav || 0;
  results.forEach((bucket, index) => {
    bucket.rank = index + 1;
    bucket.vsBest = bestAvg > 0 ? ((bucket.avgNav - bestAvg) / bestAvg) * 100 : 0;
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
  
  onProgress?.(`Processing ${filteredData.length} data points...`);
  
  // Analyze by day of month (1-31)
  const dayOfMonth = analyzeByFactor(
    filteredData,
    d => d.dayOfMonth,
    key => formatOrdinal(key),
    Array.from({ length: 31 }, (_, i) => i + 1)
  );
  
  // Analyze by day of week (1-5, Mon-Fri only, markets closed on weekends)
  const dayOfWeek = analyzeByFactor(
    filteredData.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5),
    d => d.dayOfWeek,
    key => WEEKDAY_LABELS[key],
    [1, 2, 3, 4, 5]
  );
  
  // Analyze by week of month (1-5)
  const weekOfMonth = analyzeByFactor(
    filteredData,
    d => d.weekOfMonth,
    key => `Week ${key}`,
    [1, 2, 3, 4, 5]
  );
  
  // Analyze by month (0-11)
  const monthOfYear = analyzeByFactor(
    filteredData,
    d => d.month,
    key => MONTH_LABELS[key],
    Array.from({ length: 12 }, (_, i) => i)
  );
  
  // Analyze by quarter (1-4)
  const quarterOfYear = analyzeByFactor(
    filteredData,
    d => d.quarter,
    key => QUARTER_LABELS[key - 1],
    [1, 2, 3, 4]
  );
  
  // Find best and worst for each factor
  const findBestWorst = (buckets: AnalysisBucket[]) => {
    const sorted = [...buckets].sort((a, b) => a.avgNav - b.avgNav);
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
  
  // Calculate return over period
  const firstNav = filteredData[0]?.nav || 0;
  const lastNav = filteredData[filteredData.length - 1]?.nav || 0;
  const threeYearReturn = firstNav > 0 ? ((lastNav - firstNav) / firstNav) * 100 : 0;
  
  onProgress?.(`✓ Analysis complete for ${fundData.meta.schemeName}`);
  
  return {
    fundCode: fundData.meta.schemeCode,
    fundName: fundData.meta.schemeName,
    timeframe,
    totalSamples: filteredData.length,
    dateRange: {
      start: filteredData[0].date,
      end: filteredData[filteredData.length - 1].date,
    },
    threeYearReturn,
    
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
