import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

import { useConsoleLog } from '@/hooks/useConsoleLog';
import { useMutualFundAnalysis } from '@/hooks/useMutualFundAnalysis';
import { FUNDS } from '@/types/mutualFund';
import { filterByTimeframe } from '@/services/dateUtils';

import { ConsolePanel } from './ConsolePanel';
import { SummaryCards } from './SummaryCards';
import { TimeframeSelector } from './TimeframeSelector';
import { FundTabs } from './FundTabs';
import { RecommendationCard } from './RecommendationCard';
import { NavTrendChart } from './NavTrendChart';
import { DayAnalysisChart } from './DayAnalysisChart';
import { WeekAnalysisChart } from './WeekAnalysisChart';
import { WeekdayChart } from './WeekdayChart';
import { MonthAnalysisChart } from './MonthAnalysisChart';
import { QuarterAnalysisChart } from './QuarterAnalysisChart';
import { AnalysisTable } from './AnalysisTable';

export function Dashboard() {
  const { logs, log, clear } = useConsoleLog();
  const {
    fundsData,
    analysisResults,
    timeframe,
    isLoading,
    lastUpdated,
    setTimeframe,
    fetchData,
  } = useMutualFundAnalysis(log);

  const [selectedFund, setSelectedFund] = useState<number | 'all'>('all');

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Get current analysis based on selection
  const currentAnalysis = selectedFund === 'all' 
    ? (analysisResults.size > 0 ? analysisResults.values().next().value : null)
    : analysisResults.get(selectedFund) || null;

  // Get current fund data for trend chart
  const currentFundCode = selectedFund === 'all' ? FUNDS[0].code : selectedFund;
  const currentFundData = fundsData.get(currentFundCode);
  const filteredNavData = currentFundData 
    ? filterByTimeframe(currentFundData.navData, timeframe)
    : [];

  const currentFundName = selectedFund === 'all' 
    ? 'All Funds (showing first)'
    : FUNDS.find(f => f.code === selectedFund)?.shortName || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">MF SIP Timing Analyzer</h1>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(lastUpdated, 'dd MMM yyyy, hh:mm a')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TimeframeSelector 
              value={timeframe} 
              onChange={setTimeframe}
              disabled={isLoading}
            />
            <Button 
              onClick={fetchData} 
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Fund Tabs */}
          <FundTabs selectedFund={selectedFund} onSelectFund={setSelectedFund} />

          {/* Summary Cards */}
          <SummaryCards analysis={currentAnalysis} />

          {/* NAV Trend Chart */}
          <NavTrendChart 
            data={filteredNavData} 
            title={`NAV Trend - ${currentFundName} (${timeframe})`}
          />

          {/* Analysis Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DayAnalysisChart 
              data={currentAnalysis?.dayOfMonth || []} 
              title="Day of Month Analysis"
            />
            <WeekAnalysisChart 
              data={currentAnalysis?.weekOfMonth || []} 
              title="Week of Month Analysis"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WeekdayChart 
              data={currentAnalysis?.dayOfWeek || []} 
              title="Weekday Analysis"
            />
            <MonthAnalysisChart 
              data={currentAnalysis?.monthOfYear || []} 
              title="Monthly Analysis"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuarterAnalysisChart 
              data={currentAnalysis?.quarterOfYear || []} 
              title="Quarterly Analysis"
            />
            <RecommendationCard analysis={currentAnalysis} />
          </div>

          {/* Detailed Analysis Table */}
          <AnalysisTable analysis={currentAnalysis} />
        </div>
      </main>

      {/* Console Panel */}
      <ConsolePanel logs={logs} onClear={clear} />
    </div>
  );
}
