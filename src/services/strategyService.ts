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
export function calculateDistributionStrategy(
  multiAnalysis: MultiTimeframeAnalysis
): DistributionStrategy {
  const { fundCode, fundName, analyses } = multiAnalysis;
  
  const linearAllocation = 1 / 12; // 8.33%
  
  // Collect monthly data across timeframes
  const monthlyData: MonthlyAllocation[] = [];
  
  for (let month = 0; month < 12; month++) {
    const deviations: Record<Timeframe, number | null> = {
      '1Y': null,
      '3Y': null,
      '5Y': null,
      '10Y': null,
    };
    
    const availableDeviations: number[] = [];
    
    TIMEFRAMES.forEach(({ value: tf }) => {
      const analysis = analyses[tf];
      if (!analysis) return;
      
      const monthBucket = analysis.monthOfYear.find(b => b.key === month);
      if (monthBucket) {
        deviations[tf] = monthBucket.avgDeviation;
        availableDeviations.push(monthBucket.avgDeviation);
      }
    });
    
    const avgDeviation = availableDeviations.length > 0
      ? availableDeviations.reduce((a, b) => a + b, 0) / availableDeviations.length
      : 0;
    
    monthlyData.push({
      month,
      monthLabel: MONTH_LABELS[month],
      avgDeviation,
      deviationsByTimeframe: deviations,
      recommendedWeight: 0, // Will be calculated
      vsEqualWeight: 0,
    });
  }
  
  // Calculate weighted distribution
  // Idea: Invest MORE in months with negative deviation (cheaper), LESS in positive deviation (expensive)
  // Use inverse sigmoid-like scaling to avoid extreme weights
  
  const allDeviations = monthlyData.map(m => m.avgDeviation);
  const minDev = Math.min(...allDeviations);
  const maxDev = Math.max(...allDeviations);
  const range = maxDev - minDev;
  
  if (range < 0.01) {
    // If range is tiny, just use equal distribution
    monthlyData.forEach(m => {
      m.recommendedWeight = linearAllocation;
      m.vsEqualWeight = 0;
    });
  } else {
    // Calculate raw weights (inverted: lower deviation = higher weight)
    const rawWeights = monthlyData.map(m => {
      // Normalize to 0-1 where 0 = worst (highest deviation), 1 = best (lowest deviation)
      const normalized = 1 - (m.avgDeviation - minDev) / range;
      // Apply mild adjustment (not too extreme)
      // Use range of 0.5x to 1.5x of equal weight
      return linearAllocation * (0.5 + normalized);
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
  
  // Determine recommendation
  let recommendation: 'linear' | 'weighted' | 'hybrid' = 'linear';
  const reasoning: string[] = [];
  
  if (potentialImprovement > 0.02) {
    recommendation = 'weighted';
    reasoning.push(`Weighted distribution could improve returns by approximately ${(potentialImprovement).toFixed(3)}% per year.`);
    reasoning.push(`Invest more in historically cheaper months: ${monthlyData.filter(m => m.recommendedWeight > linearAllocation * 1.1).map(m => m.monthLabel).join(', ')}.`);
  } else if (potentialImprovement > 0.005) {
    recommendation = 'hybrid';
    reasoning.push(`Slight advantage to weighted distribution (${(potentialImprovement).toFixed(3)}%), but the difference is minimal.`);
    reasoning.push(`Consider a hybrid approach: standard SIP with occasional top-ups in favorable months.`);
  } else {
    recommendation = 'linear';
    reasoning.push(`Monthly patterns are not significant enough (${(potentialImprovement).toFixed(4)}% difference) to warrant complex allocation.`);
    reasoning.push(`Stick with regular monthly SIP - consistency and discipline matter more than timing.`);
  }
  
  // Add insight about volatility
  const cheapestMonth = [...monthlyData].sort((a, b) => a.avgDeviation - b.avgDeviation)[0];
  const expensiveMonth = [...monthlyData].sort((a, b) => b.avgDeviation - a.avgDeviation)[0];
  
  if (range > 0.05) {
    reasoning.push(`${cheapestMonth.monthLabel} tends to be the cheapest month (${cheapestMonth.avgDeviation.toFixed(3)}% below avg), while ${expensiveMonth.monthLabel} is typically more expensive (+${expensiveMonth.avgDeviation.toFixed(3)}%).`);
  }
  
  // Generate practical allocation (relative to ₹10,000 base)
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
