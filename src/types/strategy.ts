import type { Timeframe } from './mutualFund';

/**
 * Optimal entry point recommendation with multi-timeframe consensus
 */
export interface OptimalEntryPoint {
  day: number;
  dayLabel: string;
  
  // Consensus across timeframes
  timeframeScores: Record<Timeframe, {
    avgDeviation: number;
    rank: number;
    available: boolean;
  }>;
  
  // Aggregated metrics
  consensusScore: number;      // 0-100, how many timeframes agree
  avgDeviationAcrossTimeframes: number;
  
  // Risk/Reward analysis
  potentialUpside: number;     // Best case deviation (most negative)
  potentialDownside: number;   // Worst case deviation (most positive)
  riskRewardRatio: number;     // |upside| / |downside|
  
  // Opportunity cost vs alternatives
  opportunityCostVsBest: number;  // How much worse than the best option
  opportunityCostVsWorst: number; // How much better than the worst option
}

export interface OptimalEntryAnalysis {
  fundCode: number;
  fundName: string;
  
  // Ranked list of all days
  rankedDays: OptimalEntryPoint[];
  
  // Top recommendations
  primaryRecommendation: OptimalEntryPoint;
  alternativeRecommendations: OptimalEntryPoint[];
  
  // Summary metrics
  maxPotentialSavings: number;  // Best vs worst in %
  dataConfidence: 'high' | 'medium' | 'low';
  
  // Explanation
  reasoning: string[];
}

/**
 * Monthly distribution strategy
 */
export interface MonthlyAllocation {
  month: number;
  monthLabel: string;
  
  // Historical performance
  avgDeviation: number;
  deviationsByTimeframe: Record<Timeframe, number | null>;
  
  // Recommended allocation
  recommendedWeight: number;  // 0-1, where 1/12 = 0.0833 is equal distribution
  
  // Comparison to equal distribution
  vsEqualWeight: number;  // Difference from 1/12
}

export interface DistributionStrategy {
  fundCode: number;
  fundName: string;
  
  // Linear SIP baseline
  linearAllocation: number;  // Always 1/12 = 8.33%
  
  // Weighted allocations by month
  monthlyAllocations: MonthlyAllocation[];
  
  // Strategy comparison
  linearVsWeighted: {
    linearExpectedDeviation: number;
    weightedExpectedDeviation: number;
    potentialImprovement: number;  // How much better weighted is
  };
  
  // Recommendation
  recommendation: 'linear' | 'weighted' | 'hybrid';
  reasoning: string[];
  
  // Practical guidance
  practicalAllocation: {
    month: string;
    percentage: number;
    amount: string;  // e.g., "₹10,000" or "1.2x"
  }[];
}
