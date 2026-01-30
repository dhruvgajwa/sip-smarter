import { useMemo } from 'react';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';
import type { OptimalEntryAnalysis, DistributionStrategy } from '@/types/strategy';
import { calculateOptimalEntry, calculateDistributionStrategy } from '@/services/strategyService';

interface UseStrategyAnalysisReturn {
  optimalEntry: OptimalEntryAnalysis | null;
  distributionStrategy: DistributionStrategy | null;
}

/**
 * Hook to compute optimal entry and distribution strategies
 */
export function useStrategyAnalysis(
  multiAnalysis: MultiTimeframeAnalysis | null
): UseStrategyAnalysisReturn {
  return useMemo(() => {
    if (!multiAnalysis) {
      return { optimalEntry: null, distributionStrategy: null };
    }
    
    const optimalEntry = calculateOptimalEntry(multiAnalysis);
    const distributionStrategy = calculateDistributionStrategy(multiAnalysis);
    
    return { optimalEntry, distributionStrategy };
  }, [multiAnalysis]);
}
