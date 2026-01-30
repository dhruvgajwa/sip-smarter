import { useMemo } from 'react';
import type { FundData, FundAnalysis, Timeframe } from '@/types/mutualFund';
import { TIMEFRAMES } from '@/types/mutualFund';
import { analyzeFund } from '@/services/analysisService';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';

/**
 * Hook to compute analysis across all timeframes for comparison
 */
export function useMultiTimeframeAnalysis(
  fundsData: Map<number, FundData>,
  onLog?: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void
): Map<number, MultiTimeframeAnalysis> {
  return useMemo(() => {
    if (fundsData.size === 0) {
      return new Map();
    }
    
    onLog?.('Computing multi-timeframe analysis...', 'info');
    const results = new Map<number, MultiTimeframeAnalysis>();
    
    fundsData.forEach((fundData, code) => {
      const analyses: Record<Timeframe, FundAnalysis | null> = {
        '1Y': null,
        '3Y': null,
        '5Y': null,
        '10Y': null,
      };
      
      TIMEFRAMES.forEach(({ value: tf }) => {
        try {
          analyses[tf] = analyzeFund(fundData, tf);
        } catch (error) {
          // Some timeframes may not have enough data
          onLog?.(`${tf} data not available for ${fundData.meta.schemeName}`, 'warning');
          analyses[tf] = null;
        }
      });
      
      results.set(code, {
        fundCode: code,
        fundName: fundData.meta.schemeName,
        analyses,
      });
    });
    
    onLog?.('✓ Multi-timeframe analysis complete', 'success');
    return results;
  }, [fundsData, onLog]);
}
