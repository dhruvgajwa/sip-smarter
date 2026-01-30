import type { Timeframe, FundAnalysis, AnalysisBucket } from './mutualFund';

/**
 * Multi-timeframe analysis results for a single fund
 */
export interface MultiTimeframeAnalysis {
  fundCode: number;
  fundName: string;
  analyses: Record<Timeframe, FundAnalysis | null>;
}

/**
 * Comparison data point for charting
 */
export interface TimeframeComparisonPoint {
  label: string;
  key: string | number;
  '1Y': number | null;
  '3Y': number | null;
  '5Y': number | null;
  '10Y': number | null;
}

/**
 * Factor summary across timeframes
 */
export interface FactorConsistency {
  factor: string;
  bestByTimeframe: Record<Timeframe, string>;
  isConsistent: boolean; // Same best option across all timeframes
  consensusBest: string | null; // Most common best option
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Convert analysis buckets to comparison data
 */
export function createComparisonData(
  analyses: Record<Timeframe, FundAnalysis | null>,
  getBuckets: (analysis: FundAnalysis) => AnalysisBucket[]
): TimeframeComparisonPoint[] {
  // Get all unique labels from any available timeframe
  const allLabels = new Set<string>();
  const keyToLabel = new Map<string | number, string>();
  
  Object.values(analyses).forEach(analysis => {
    if (analysis) {
      getBuckets(analysis).forEach(bucket => {
        allLabels.add(bucket.label);
        keyToLabel.set(bucket.key, bucket.label);
      });
    }
  });
  
  // Create comparison points
  const points: TimeframeComparisonPoint[] = [];
  
  // Get buckets from first available analysis to maintain order
  const firstAnalysis = Object.values(analyses).find(a => a !== null);
  if (!firstAnalysis) return points;
  
  const orderedBuckets = getBuckets(firstAnalysis);
  
  orderedBuckets.forEach(bucket => {
    const point: TimeframeComparisonPoint = {
      label: bucket.label,
      key: bucket.key,
      '1Y': null,
      '3Y': null,
      '5Y': null,
      '10Y': null,
    };
    
    (['1Y', '3Y', '5Y', '10Y'] as Timeframe[]).forEach(tf => {
      const analysis = analyses[tf];
      if (analysis) {
        const matchingBucket = getBuckets(analysis).find(b => b.key === bucket.key);
        if (matchingBucket) {
          point[tf] = matchingBucket.avgDeviation;
        }
      }
    });
    
    points.push(point);
  });
  
  return points;
}

/**
 * Analyze consistency of best options across timeframes
 */
export function analyzeFactorConsistency(
  analyses: Record<Timeframe, FundAnalysis | null>
): FactorConsistency[] {
  const factors: { name: string; getBest: (a: FundAnalysis) => AnalysisBucket }[] = [
    { name: 'Day of Month', getBest: a => a.bestDay },
    { name: 'Week of Month', getBest: a => a.bestWeek },
    { name: 'Weekday', getBest: a => a.bestWeekday },
    { name: 'Month', getBest: a => a.bestMonth },
    { name: 'Quarter', getBest: a => a.bestQuarter },
  ];
  
  return factors.map(factor => {
    const bestByTimeframe: Record<Timeframe, string> = {
      '1Y': '',
      '3Y': '',
      '5Y': '',
      '10Y': '',
    };
    
    const bestCounts = new Map<string, number>();
    let validTimeframes = 0;
    
    (['1Y', '3Y', '5Y', '10Y'] as Timeframe[]).forEach(tf => {
      const analysis = analyses[tf];
      if (analysis) {
        const best = factor.getBest(analysis);
        bestByTimeframe[tf] = best.label;
        bestCounts.set(best.label, (bestCounts.get(best.label) || 0) + 1);
        validTimeframes++;
      }
    });
    
    // Find consensus (most common best option)
    let consensusBest: string | null = null;
    let maxCount = 0;
    bestCounts.forEach((count, label) => {
      if (count > maxCount) {
        maxCount = count;
        consensusBest = label;
      }
    });
    
    // Check if all agree
    const uniqueBests = new Set(Object.values(bestByTimeframe).filter(v => v !== ''));
    const isConsistent = uniqueBests.size === 1 && validTimeframes > 1;
    
    // Confidence based on consistency
    let confidence: 'high' | 'medium' | 'low';
    if (isConsistent) {
      confidence = 'high';
    } else if (maxCount >= 3 && validTimeframes >= 3) {
      confidence = 'medium';
    } else if (maxCount >= 2 && validTimeframes >= 2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    return {
      factor: factor.name,
      bestByTimeframe,
      isConsistent,
      consensusBest,
      confidence,
    };
  });
}
