import { useMemo } from 'react';
import type { FundData } from '@/types/mutualFund';
import type { CompleteMonthlyOptimalEntry } from '@/types/monthlyOptimalEntry';
import { calculateMonthlyOptimalEntry } from '@/services/monthlyOptimalEntryService';

/**
 * Hook to compute monthly optimal entry analysis for all funds
 */
export function useMonthlyOptimalEntry(
  fundsData: Map<number, FundData>,
  onLog?: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void
): Map<number, CompleteMonthlyOptimalEntry> {
  return useMemo(() => {
    if (fundsData.size === 0) {
      return new Map();
    }
    
    onLog?.('Computing monthly optimal entry analysis...', 'info');
    const results = new Map<number, CompleteMonthlyOptimalEntry>();
    
    fundsData.forEach((fundData, code) => {
      try {
        const analysis = calculateMonthlyOptimalEntry(fundData, (msg) => {
          onLog?.(msg, 'info');
        });
        results.set(code, analysis);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        onLog?.(`✗ Monthly analysis failed for ${code}: ${message}`, 'error');
      }
    });
    
    onLog?.('✓ Monthly optimal entry analysis complete', 'success');
    return results;
  }, [fundsData, onLog]);
}
