import type { Timeframe, FundAnalysis } from '@/types/mutualFund';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';
import type { OptimalEntryAnalysis, OptimalEntryPoint, DistributionStrategy, MonthlyAllocation } from '@/types/strategy';
import { MONTH_LABELS, TIMEFRAMES } from '@/types/mutualFund';
import { formatOrdinal } from './dateUtils';

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
        // Count how many timeframes rank this day in top 10
        if (score.rank <= 10) topRankCount++;
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
    
    if (primary.consensusScore >= 75) {
      reasoning.push(`High consensus (${primary.consensusScore.toFixed(0)}%): This day ranks in the top 10 across most timeframes.`);
    }
    
    const maxSavings = worstDeviation - bestDeviation;
    if (maxSavings > 0.05) {
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
/**
 * Timeframe weights - longer periods are more statistically significant
 */
const TIMEFRAME_WEIGHTS: Record<Timeframe, number> = {
  '1Y': 0.1,   // Recent but volatile, low weight
  '3Y': 0.2,   // Short-medium term
  '5Y': 0.3,   // Medium-long term
  '10Y': 0.4,  // Most reliable, highest weight
};

/**
 * Calculate optimal monthly distribution strategy
 * Uses weighted averaging where longer timeframes have higher significance
 */
export function calculateDistributionStrategy(
  multiAnalysis: MultiTimeframeAnalysis
): DistributionStrategy {
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
        const weight = TIMEFRAME_WEIGHTS[tf];
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
  
  // More conservative threshold for recommending weighted distribution
  const shouldUseWeighted = range > 0.03 && hasLongTermData;
  
  if (!shouldUseWeighted || range < 0.01) {
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
      // If NOT consistent, dampen the effect
      let adjustmentFactor = 1.0;
      if (consistency.longTermConsistent && m.avgDeviation < 0) {
        adjustmentFactor = 1.15; // Slight boost for consistent patterns
      } else if (!consistency.longTermConsistent && m.avgDeviation < 0) {
        adjustmentFactor = 0.9; // Reduce weight if pattern isn't consistent
      }
      
      // More conservative range: 0.7x to 1.3x of equal weight
      return linearAllocation * (0.7 + normalized * 0.6) * adjustmentFactor;
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
    reasoning.push(`Analysis weighted by timeframe: 10Y (40%), 5Y (30%), 3Y (20%), 1Y (10%) for statistical reliability.`);
  }
  
  // Check for consistent patterns
  const consistentCheapMonths = monthlyData.filter((m, i) => 
    consistencyCheck[i].longTermConsistent && m.avgDeviation < -0.02
  );
  const consistentExpensiveMonths = monthlyData.filter((m, i) => 
    consistencyCheck[i].longTermConsistent && m.avgDeviation > 0.02
  );
  
  if (hasLongTermData && potentialImprovement > 0.025 && consistentCheapMonths.length >= 2) {
    recommendation = 'weighted';
    reasoning.push(`Weighted distribution recommended: ${consistentCheapMonths.length} months show consistent negative deviation across long-term data.`);
    reasoning.push(`Invest more in: ${consistentCheapMonths.map(m => m.monthLabel).join(', ')}.`);
  } else if (hasLongTermData && potentialImprovement > 0.01 && consistentCheapMonths.length >= 1) {
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
  if (hasLongTermData && range > 0.03) {
    const cheapestMonth = [...monthlyData].sort((a, b) => a.avgDeviation - b.avgDeviation)[0];
    const expensiveMonth = [...monthlyData].sort((a, b) => b.avgDeviation - a.avgDeviation)[0];
    reasoning.push(`Historical pattern: ${cheapestMonth.monthLabel} tends to be cheapest (${cheapestMonth.avgDeviation.toFixed(3)}%), ${expensiveMonth.monthLabel} most expensive (${expensiveMonth.avgDeviation > 0 ? '+' : ''}${expensiveMonth.avgDeviation.toFixed(3)}%).`);
  }
  
  // Generate practical allocation
  const baseAmount = 10000;
  const practicalAllocation = monthlyData.map(m => ({
    month: m.monthLabel,
    percentage: m.recommendedWeight * 100,
    amount: recommendation === 'linear' 
      ? `₹${baseAmount.toLocaleString('en-IN')}`
      : `₹${Math.round(m.recommendedWeight * 12 * baseAmount).toLocaleString('en-IN')}`,
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
