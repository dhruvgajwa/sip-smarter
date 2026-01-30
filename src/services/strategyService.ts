import type { Timeframe, FundAnalysis } from '@/types/mutualFund';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';
import type { OptimalEntryAnalysis, OptimalEntryPoint, DistributionStrategy, MonthlyAllocation } from '@/types/strategy';
import { MONTH_LABELS, TIMEFRAMES } from '@/types/mutualFund';
import { formatOrdinal } from './dateUtils';

/**
 * STRATEGY ANALYSIS CONSTANTS
 * These thresholds control when patterns are considered significant enough
 * to warrant deviation from a standard linear SIP strategy.
 */

// Consensus thresholds for optimal entry recommendations
const CONSENSUS_THRESHOLDS = {
  HIGH_CONSENSUS: 75,      // % of timeframes that must agree for high confidence
  TOP_RANK_CUTOFF: 10,     // Day must rank in top N to count toward consensus
  SAVINGS_THRESHOLD: 0.05, // Minimum % difference to recommend optimal vs worst day
} as const;

// Distribution strategy thresholds
const DISTRIBUTION_THRESHOLDS = {
  MIN_RANGE_FOR_WEIGHTED: 0.03,    // Minimum deviation range to consider weighted strategy
  MIN_IMPACT_THRESHOLD: 0.01,      // Below this, always recommend linear
  WEIGHT_FLOOR: 0.7,               // Minimum weight multiplier (70% of equal)
  WEIGHT_RANGE: 0.6,               // Range of weight adjustment (70% to 130%)
  CONSISTENCY_BOOST: 1.15,         // Multiplier for consistently cheap months
  CONSISTENCY_DAMPEN: 0.9,         // Multiplier for inconsistent patterns
  MIN_CHEAP_DEVIATION: -0.02,      // Threshold for "cheap" month classification
  MIN_EXPENSIVE_DEVIATION: 0.02,   // Threshold for "expensive" month classification
  WEIGHTED_IMPROVEMENT_THRESHOLD: 0.025, // Min improvement for weighted recommendation
  HYBRID_IMPROVEMENT_THRESHOLD: 0.01,    // Min improvement for hybrid recommendation
} as const;

/**
 * Calculate optimal entry points by synthesizing all timeframe data
 */
export function calculateOptimalEntry(
  multiAnalysis: MultiTimeframeAnalysis
): OptimalEntryAnalysis {
  const { fundCode, fundName, analyses } = multiAnalysis;
  
  // Collect day-of-month data across all timeframes
  const dayScores: Map<number, OptimalEntryPoint> = new Map();
  
  // Initialize all 31 days
  for (let day = 1; day <= 31; day++) {
    dayScores.set(day, {
      day,
      dayLabel: formatOrdinal(day),
      timeframeScores: {
        '1Y': { avgDeviation: 0, rank: 0, available: false },
        '3Y': { avgDeviation: 0, rank: 0, available: false },
        '5Y': { avgDeviation: 0, rank: 0, available: false },
        '10Y': { avgDeviation: 0, rank: 0, available: false },
      },
      consensusScore: 0,
      avgDeviationAcrossTimeframes: 0,
      potentialUpside: 0,
      potentialDownside: 0,
      riskRewardRatio: 0,
      opportunityCostVsBest: 0,
      opportunityCostVsWorst: 0,
    });
  }
  
  // Populate scores from each timeframe
  const availableTimeframes: Timeframe[] = [];
  
  TIMEFRAMES.forEach(({ value: tf }) => {
    const analysis = analyses[tf];
    if (!analysis) return;
    
    availableTimeframes.push(tf);
    
    analysis.dayOfMonth.forEach(bucket => {
      const entry = dayScores.get(bucket.key as number);
      if (entry) {
        entry.timeframeScores[tf] = {
          avgDeviation: bucket.avgDeviation,
          rank: bucket.rank,
          available: true,
        };
      }
    });
  });
  
  // Calculate aggregated metrics for each day
  const rankedDays: OptimalEntryPoint[] = [];
  
  dayScores.forEach((entry, day) => {
    const deviations: number[] = [];
    let topRankCount = 0;
    
    availableTimeframes.forEach(tf => {
      const score = entry.timeframeScores[tf];
      if (score.available) {
        deviations.push(score.avgDeviation);
        // Count how many timeframes rank this day in top N (defined by constant)
        if (score.rank <= CONSENSUS_THRESHOLDS.TOP_RANK_CUTOFF) topRankCount++;
      }
    });
    
    if (deviations.length === 0) return;
    
    // Average deviation across timeframes
    entry.avgDeviationAcrossTimeframes = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    
    // Best/worst case (upside = most negative, downside = most positive)
    entry.potentialUpside = Math.min(...deviations);
    entry.potentialDownside = Math.max(...deviations);
    
    // Risk-reward ratio (higher is better)
    const absUpside = Math.abs(entry.potentialUpside);
    const absDownside = Math.abs(entry.potentialDownside);
    entry.riskRewardRatio = absDownside > 0 ? absUpside / absDownside : absUpside;
    
    // Consensus score (0-100 based on rank consistency)
    entry.consensusScore = (topRankCount / availableTimeframes.length) * 100;
    
    rankedDays.push(entry);
  });
  
  // Sort by average deviation (lower is better)
  rankedDays.sort((a, b) => a.avgDeviationAcrossTimeframes - b.avgDeviationAcrossTimeframes);
  
  // Calculate opportunity costs
  const bestDeviation = rankedDays[0]?.avgDeviationAcrossTimeframes || 0;
  const worstDeviation = rankedDays[rankedDays.length - 1]?.avgDeviationAcrossTimeframes || 0;
  
  rankedDays.forEach(entry => {
    entry.opportunityCostVsBest = entry.avgDeviationAcrossTimeframes - bestDeviation;
    entry.opportunityCostVsWorst = worstDeviation - entry.avgDeviationAcrossTimeframes;
  });
  
  // Generate reasoning
  const primary = rankedDays[0];
  const alternatives = rankedDays.slice(1, 4);
  
  const reasoning: string[] = [];
  
  if (primary) {
    reasoning.push(
      `The ${primary.dayLabel} shows the most consistent negative deviation across ${availableTimeframes.length} timeframes, averaging ${primary.avgDeviationAcrossTimeframes.toFixed(3)}% below the moving average.`
    );
    
    if (primary.consensusScore >= CONSENSUS_THRESHOLDS.HIGH_CONSENSUS) {
      reasoning.push(`High consensus (${primary.consensusScore.toFixed(0)}%): This day ranks in the top ${CONSENSUS_THRESHOLDS.TOP_RANK_CUTOFF} across most timeframes.`);
    }
    
    const maxSavings = worstDeviation - bestDeviation;
    if (maxSavings > CONSENSUS_THRESHOLDS.SAVINGS_THRESHOLD) {
      reasoning.push(`Choosing the optimal day over the worst could save approximately ${maxSavings.toFixed(3)}% per transaction.`);
    } else {
      reasoning.push(`The difference between best and worst days is minimal (${maxSavings.toFixed(3)}%), suggesting timing has limited impact for this fund.`);
    }
  }
  
  // Determine confidence level
  let dataConfidence: 'high' | 'medium' | 'low' = 'low';
  if (availableTimeframes.length >= 3 && primary?.consensusScore >= 50) {
    dataConfidence = 'high';
  } else if (availableTimeframes.length >= 2) {
    dataConfidence = 'medium';
  }
  
  return {
    fundCode,
    fundName,
    rankedDays,
    primaryRecommendation: primary,
    alternativeRecommendations: alternatives,
    maxPotentialSavings: worstDeviation - bestDeviation,
    dataConfidence,
    reasoning,
  };
}

/**
 * Calculate optimal monthly distribution strategy
 */
export type TimeframeWeights = Record<Timeframe, number>;

/**
 * Default timeframe weights - heavily favor long-term data for buy-and-hold investors
 */
export const DEFAULT_TIMEFRAME_WEIGHTS: TimeframeWeights = {
  '1Y': 0.05,   // Minimal - too volatile for long-term decisions
  '3Y': 0.15,   // Some relevance
  '5Y': 0.30,   // Significant
  '10Y': 0.50,  // Most reliable for long-term holders
};

/**
 * Preset weight configurations
 */
export const WEIGHT_PRESETS: Record<string, { label: string; description: string; weights: TimeframeWeights }> = {
  longTerm: {
    label: 'Long-term Holder',
    description: 'Best for 5+ year investment horizon',
    weights: { '1Y': 0.05, '3Y': 0.15, '5Y': 0.30, '10Y': 0.50 },
  },
  balanced: {
    label: 'Balanced',
    description: 'Equal consideration across timeframes',
    weights: { '1Y': 0.25, '3Y': 0.25, '5Y': 0.25, '10Y': 0.25 },
  },
  recentTrends: {
    label: 'Recent Trends',
    description: 'For shorter holding periods (1-3 years)',
    weights: { '1Y': 0.40, '3Y': 0.30, '5Y': 0.20, '10Y': 0.10 },
  },
  decadeOnly: {
    label: 'Decade Focus',
    description: 'Only trust 10-year patterns',
    weights: { '1Y': 0.00, '3Y': 0.10, '5Y': 0.30, '10Y': 0.60 },
  },
};

/**
 * Calculate optimal monthly distribution strategy
 * Uses weighted averaging where longer timeframes have higher significance
 */
export function calculateDistributionStrategy(
  multiAnalysis: MultiTimeframeAnalysis,
  customWeights?: TimeframeWeights
): DistributionStrategy {
  const weights = customWeights || DEFAULT_TIMEFRAME_WEIGHTS;
  const { fundCode, fundName, analyses } = multiAnalysis;
  
  const linearAllocation = 1 / 12; // 8.33%
  
  // Track which timeframes are available
  const availableTimeframes: Timeframe[] = [];
  TIMEFRAMES.forEach(({ value: tf }) => {
    if (analyses[tf]) availableTimeframes.push(tf);
  });
  
  // Collect monthly data across timeframes with proper weighting
  const monthlyData: MonthlyAllocation[] = [];
  
  for (let month = 0; month < 12; month++) {
    const deviations: Record<Timeframe, number | null> = {
      '1Y': null,
      '3Y': null,
      '5Y': null,
      '10Y': null,
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    const deviationValues: number[] = [];
    
    TIMEFRAMES.forEach(({ value: tf }) => {
      const analysis = analyses[tf];
      if (!analysis) return;
      
      const monthBucket = analysis.monthOfYear.find(b => b.key === month);
      if (monthBucket) {
        deviations[tf] = monthBucket.avgDeviation;
        deviationValues.push(monthBucket.avgDeviation);
        
        // Weighted contribution
        const weight = weights[tf];
        weightedSum += monthBucket.avgDeviation * weight;
        totalWeight += weight;
      }
    });
    
    // Use weighted average instead of simple average
    const avgDeviation = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    monthlyData.push({
      month,
      monthLabel: MONTH_LABELS[month],
      avgDeviation,
      deviationsByTimeframe: deviations,
      recommendedWeight: 0,
      vsEqualWeight: 0,
    });
  }
  
  // Check consistency across timeframes
  // A month is "consistently cheap" if it's below average in most long-term timeframes
  const consistencyCheck = monthlyData.map(m => {
    let agreementCount = 0;
    let longTermAgreement = 0;
    
    (['3Y', '5Y', '10Y'] as Timeframe[]).forEach(tf => {
      const dev = m.deviationsByTimeframe[tf];
      if (dev !== null) {
        if (dev < 0) longTermAgreement++;
      }
    });
    
    // Count how many timeframes agree on direction
    availableTimeframes.forEach(tf => {
      const dev = m.deviationsByTimeframe[tf];
      if (dev !== null && dev < 0) agreementCount++;
    });
    
    return {
      month: m.month,
      agreementRatio: availableTimeframes.length > 0 ? agreementCount / availableTimeframes.length : 0,
      longTermConsistent: longTermAgreement >= 2, // At least 2 of 3Y/5Y/10Y agree
    };
  });
  
  // Calculate weighted distribution only if we have enough long-term data
  const hasLongTermData = availableTimeframes.includes('5Y') || availableTimeframes.includes('10Y');
  const has10YData = availableTimeframes.includes('10Y');
  
  const allDeviations = monthlyData.map(m => m.avgDeviation);
  const minDev = Math.min(...allDeviations);
  const maxDev = Math.max(...allDeviations);
  const range = maxDev - minDev;
  
  // Use constants for thresholds - range must exceed MIN_RANGE_FOR_WEIGHTED
  const shouldUseWeighted = range > DISTRIBUTION_THRESHOLDS.MIN_RANGE_FOR_WEIGHTED && hasLongTermData;
  
  if (!shouldUseWeighted || range < DISTRIBUTION_THRESHOLDS.MIN_IMPACT_THRESHOLD) {
    monthlyData.forEach(m => {
      m.recommendedWeight = linearAllocation;
      m.vsEqualWeight = 0;
    });
  } else {
    // Only apply weighting to months that are CONSISTENTLY cheap across long-term data
    const rawWeights = monthlyData.map((m, i) => {
      const consistency = consistencyCheck[i];
      
      // Normalize to 0-1 where 0 = worst, 1 = best
      const normalized = 1 - (m.avgDeviation - minDev) / range;
      
      // If month is consistently cheap in long-term data, amplify slightly
      // If NOT consistent, dampen the effect - uses constants for transparency
      let adjustmentFactor = 1.0;
      if (consistency.longTermConsistent && m.avgDeviation < 0) {
        adjustmentFactor = DISTRIBUTION_THRESHOLDS.CONSISTENCY_BOOST;
      } else if (!consistency.longTermConsistent && m.avgDeviation < 0) {
        adjustmentFactor = DISTRIBUTION_THRESHOLDS.CONSISTENCY_DAMPEN;
      }
      
      // Weight range defined by constants (WEIGHT_FLOOR to WEIGHT_FLOOR + WEIGHT_RANGE)
      return linearAllocation * (DISTRIBUTION_THRESHOLDS.WEIGHT_FLOOR + normalized * DISTRIBUTION_THRESHOLDS.WEIGHT_RANGE) * adjustmentFactor;
    });
    
    // Normalize to sum to 1
    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    monthlyData.forEach((m, i) => {
      m.recommendedWeight = rawWeights[i] / totalWeight;
      m.vsEqualWeight = m.recommendedWeight - linearAllocation;
    });
  }
  
  // Calculate expected outcomes
  const linearExpectedDeviation = monthlyData.reduce((sum, m) => sum + m.avgDeviation * linearAllocation, 0);
  const weightedExpectedDeviation = monthlyData.reduce((sum, m) => sum + m.avgDeviation * m.recommendedWeight, 0);
  const potentialImprovement = linearExpectedDeviation - weightedExpectedDeviation;
  
  // Stricter recommendation criteria
  let recommendation: 'linear' | 'weighted' | 'hybrid' = 'linear';
  const reasoning: string[] = [];
  
  // Add data quality context
  if (!hasLongTermData) {
    reasoning.push(`⚠️ Only short-term data available. Long-term patterns (5Y/10Y) are required for reliable recommendations.`);
    recommendation = 'linear';
  } else if (!has10YData) {
    reasoning.push(`Note: 10Y data not available. Recommendations based on 3Y-5Y patterns.`);
  } else {
    // Show actual weights being used
    const weightDesc = Object.entries(weights)
      .filter(([_, w]) => w > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([tf, w]) => `${tf} (${(w * 100).toFixed(0)}%)`)
      .join(', ');
    reasoning.push(`Analysis weighted by timeframe: ${weightDesc} for statistical reliability.`);
  }
  
  // Check for consistent patterns using thresholds defined at top of file
  const consistentCheapMonths = monthlyData.filter((m, i) => 
    consistencyCheck[i].longTermConsistent && m.avgDeviation < DISTRIBUTION_THRESHOLDS.MIN_CHEAP_DEVIATION
  );
  const consistentExpensiveMonths = monthlyData.filter((m, i) => 
    consistencyCheck[i].longTermConsistent && m.avgDeviation > DISTRIBUTION_THRESHOLDS.MIN_EXPENSIVE_DEVIATION
  );
  
  if (hasLongTermData && potentialImprovement > DISTRIBUTION_THRESHOLDS.WEIGHTED_IMPROVEMENT_THRESHOLD && consistentCheapMonths.length >= 2) {
    recommendation = 'weighted';
    reasoning.push(`Weighted distribution recommended: ${consistentCheapMonths.length} months show consistent negative deviation across long-term data.`);
    reasoning.push(`Invest more in: ${consistentCheapMonths.map(m => m.monthLabel).join(', ')}.`);
  } else if (hasLongTermData && potentialImprovement > DISTRIBUTION_THRESHOLDS.HYBRID_IMPROVEMENT_THRESHOLD && consistentCheapMonths.length >= 1) {
    recommendation = 'hybrid';
    reasoning.push(`Consider occasional top-ups in ${consistentCheapMonths.map(m => m.monthLabel).join(', ')} - these show consistent patterns.`);
    reasoning.push(`Overall improvement potential is modest (${(potentialImprovement * 100).toFixed(2)}%), so stick with regular SIP as base.`);
  } else {
    recommendation = 'linear';
    if (hasLongTermData) {
      reasoning.push(`Monthly patterns are not consistent enough across timeframes to warrant deviation from regular SIP.`);
      reasoning.push(`Discipline and consistency in a regular SIP outweigh marginal timing benefits.`);
    }
  }
  
  // Add insight about best/worst months if patterns exist
  if (hasLongTermData && range > DISTRIBUTION_THRESHOLDS.MIN_RANGE_FOR_WEIGHTED) {
    const cheapestMonth = [...monthlyData].sort((a, b) => a.avgDeviation - b.avgDeviation)[0];
    const expensiveMonth = [...monthlyData].sort((a, b) => b.avgDeviation - a.avgDeviation)[0];
    reasoning.push(`Historical pattern: ${cheapestMonth.monthLabel} tends to be cheapest (${cheapestMonth.avgDeviation.toFixed(3)}%), ${expensiveMonth.monthLabel} most expensive (${expensiveMonth.avgDeviation > 0 ? '+' : ''}${expensiveMonth.avgDeviation.toFixed(3)}%).`);
  }
  
  // Generate practical allocation - amounts are calculated in UI component
  // based on user's baseAmount input, not hardcoded here
  const practicalAllocation = monthlyData.map(m => ({
    month: m.monthLabel,
    percentage: m.recommendedWeight * 100,
    // Amount is a percentage string - actual rupee amounts calculated in UI
    amount: `${(m.recommendedWeight * 100).toFixed(1)}%`,
  }));
  
  return {
    fundCode,
    fundName,
    linearAllocation,
    monthlyAllocations: monthlyData,
    linearVsWeighted: {
      linearExpectedDeviation,
      weightedExpectedDeviation,
      potentialImprovement,
    },
    recommendation,
    reasoning,
    practicalAllocation,
  };
}
