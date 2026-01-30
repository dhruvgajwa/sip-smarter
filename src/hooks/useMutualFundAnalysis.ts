import { useState, useCallback } from 'react';
import type { FundData, FundAnalysis, Timeframe } from '@/types/mutualFund';
import { FUNDS, TIMEFRAMES } from '@/types/mutualFund';
import { fetchAllFundsData } from '@/services/mfApiService';
import { analyzeAllFunds } from '@/services/analysisService';

interface UseMutualFundAnalysisReturn {
  fundsData: Map<number, FundData>;
  analysisResults: Map<number, FundAnalysis>;
  timeframe: Timeframe;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  
  setTimeframe: (tf: Timeframe) => void;
  fetchData: () => Promise<void>;
  runAnalysis: () => void;
}

export function useMutualFundAnalysis(
  onLog?: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void
): UseMutualFundAnalysisReturn {
  const [fundsData, setFundsData] = useState<Map<number, FundData>>(new Map());
  const [analysisResults, setAnalysisResults] = useState<Map<number, FundAnalysis>>(new Map());
  const [timeframe, setTimeframe] = useState<Timeframe>('3Y');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    onLog?.('Starting data fetch...', 'info');
    
    const startTime = Date.now();
    
    try {
      const schemeCodes = FUNDS.map(f => f.code);
      const data = await fetchAllFundsData(schemeCodes, onLog);
      setFundsData(data);
      
      // Run analysis immediately after fetch
      onLog?.(`Running analysis for ${timeframe} timeframe...`, 'info');
      const analysis = analyzeAllFunds(data, timeframe, (msg) => onLog?.(msg, 'info'));
      setAnalysisResults(analysis);
      
      setLastUpdated(new Date());
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      onLog?.(`✓ Analysis complete in ${duration}s`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      onLog?.(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, onLog]);

  const runAnalysis = useCallback(() => {
    if (fundsData.size === 0) {
      onLog?.('No data available. Please fetch data first.', 'warning');
      return;
    }
    
    onLog?.(`Re-analyzing for ${timeframe} timeframe...`, 'info');
    const analysis = analyzeAllFunds(fundsData, timeframe, (msg) => onLog?.(msg, 'info'));
    setAnalysisResults(analysis);
    onLog?.(`✓ Analysis updated for ${timeframe}`, 'success');
  }, [fundsData, timeframe, onLog]);

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
    if (fundsData.size > 0) {
      onLog?.(`Switching to ${tf} timeframe...`, 'info');
      const analysis = analyzeAllFunds(fundsData, tf, (msg) => onLog?.(msg, 'info'));
      setAnalysisResults(analysis);
      onLog?.(`✓ Analysis updated for ${tf}`, 'success');
    }
  }, [fundsData, onLog]);

  return {
    fundsData,
    analysisResults,
    timeframe,
    isLoading,
    lastUpdated,
    error,
    setTimeframe: handleTimeframeChange,
    fetchData,
    runAnalysis,
  };
}
