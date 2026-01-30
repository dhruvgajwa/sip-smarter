import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

import { useConsoleLog } from '@/hooks/useConsoleLog';
import { useMutualFundAnalysis } from '@/hooks/useMutualFundAnalysis';
import { useMultiTimeframeAnalysis } from '@/hooks/useMultiTimeframeAnalysis';
import { useMonthlyOptimalEntry } from '@/hooks/useMonthlyOptimalEntry';
import { FUNDS } from '@/types/mutualFund';
import { filterByTimeframe } from '@/services/dateUtils';

import { ConsolePanel } from './ConsolePanel';
import { TimeframeSelector } from './TimeframeSelector';
import { FundTabs } from './FundTabs';

// Components
import { SummaryCards } from './SummaryCards';
import { RecommendationCard } from './RecommendationCard';
import { NavTrendChart } from './NavTrendChart';
import { DayAnalysisChart } from './DayAnalysisChart';
import { WeekAnalysisChart } from './WeekAnalysisChart';
import { WeekdayChart } from './WeekdayChart';
import { MonthAnalysisChart } from './MonthAnalysisChart';
import { QuarterAnalysisChart } from './QuarterAnalysisChart';
import { AnalysisTable } from './AnalysisTable';
import { MultiTimeframeSection } from './MultiTimeframeSection';
import { MonthlyDistributionSection } from './MonthlyDistributionSection';
import { BestSipDateBlock } from './BestSipDateBlock';

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

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

  const multiAnalysis = useMultiTimeframeAnalysis(fundsData, log);
  const monthlyOptimalEntry = useMonthlyOptimalEntry(fundsData, log);

  const [selectedFund, setSelectedFund] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const currentAnalysis = selectedFund === 'all' 
    ? (analysisResults.size > 0 ? analysisResults.values().next().value : null)
    : analysisResults.get(selectedFund) || null;

  const currentFundCode = selectedFund === 'all' ? FUNDS[0].code : selectedFund;
  const currentFundData = fundsData.get(currentFundCode);
  const filteredNavData = currentFundData 
    ? filterByTimeframe(currentFundData.navData, timeframe)
    : [];

  const currentFundName = selectedFund === 'all' 
    ? 'All Funds'
    : FUNDS.find(f => f.code === selectedFund)?.shortName || '';

  const currentMonthlyEntry = selectedFund === 'all'
    ? (monthlyOptimalEntry.size > 0 ? monthlyOptimalEntry.values().next().value : null)
    : monthlyOptimalEntry.get(selectedFund) || null;

  const currentMultiAnalysis = multiAnalysis.get(currentFundCode) || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold leading-tight">MF SIP Timing Analyzer</h1>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Updated: {format(lastUpdated, 'dd MMM, hh:mm a')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FundTabs selectedFund={selectedFund} onSelectFund={setSelectedFund} compact />
            <TimeframeSelector value={timeframe} onChange={setTimeframe} disabled={isLoading} />
            <Button onClick={fetchData} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* ========================================= */}
          {/* SECTION 1: OVERVIEW                      */}
          {/* ========================================= */}
          <section>
            <SectionHeader 
              title="Overview" 
              subtitle={`${currentFundName} — ${timeframe} performance snapshot`} 
            />
            
            {/* Key Metrics */}
            <SummaryCards analysis={currentAnalysis} />
            
            {/* NAV Trend + Recommendation side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <div className="lg:col-span-2">
                <NavTrendChart 
                  data={filteredNavData} 
                  title={`NAV Trend — ${currentFundName}`}
                />
              </div>
              <div>
                <RecommendationCard analysis={currentAnalysis} compact />
              </div>
            </div>
          </section>

          {/* ========================================= */}
          {/* SECTION 2: BEST SIP DATE                 */}
          {/* ========================================= */}
          <section>
            <SectionHeader 
              title="Best SIP Date by Month" 
              subtitle="Which day of each month should you set your SIP? Based on nDCG ranking across timeframes."
            />
            <BestSipDateBlock analysis={currentMonthlyEntry} />
          </section>

          {/* ========================================= */}
          {/* SECTION 3: FACTOR ANALYSIS               */}
          {/* ========================================= */}
          <section>
            <SectionHeader 
              title="Factor Analysis" 
              subtitle={`How does NAV deviation vary by timing factors? (${timeframe} data)`}
            />
            
            {/* 2x2 grid of factor charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DayAnalysisChart data={currentAnalysis?.dayOfMonth || []} title="Day of Month" />
              <WeekAnalysisChart data={currentAnalysis?.weekOfMonth || []} title="Week of Month" />
              <WeekdayChart data={currentAnalysis?.dayOfWeek || []} title="Weekday" />
              <MonthAnalysisChart data={currentAnalysis?.monthOfYear || []} title="Month of Year" />
            </div>
            
            {/* Quarter gets its own row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <QuarterAnalysisChart data={currentAnalysis?.quarterOfYear || []} title="Quarter" />
            </div>
          </section>

          {/* ========================================= */}
          {/* SECTION 4: MONTHLY ALLOCATION            */}
          {/* ========================================= */}
          <section>
            <SectionHeader 
              title="Monthly Allocation Strategy" 
              subtitle="Should you vary your SIP amount by month? Compare constant vs weighted distribution."
            />
            <MonthlyDistributionSection multiAnalysis={currentMultiAnalysis} />
          </section>

          {/* ========================================= */}
          {/* SECTION 5: TIMEFRAME COMPARISON          */}
          {/* ========================================= */}
          <section>
            <SectionHeader 
              title="Cross-Timeframe Comparison" 
              subtitle="How consistent are patterns across 1Y, 3Y, 5Y, and 10Y?"
            />
            <MultiTimeframeSection multiAnalysis={multiAnalysis} selectedFund={selectedFund} />
          </section>

          {/* ========================================= */}
          {/* SECTION 6: RAW DATA                      */}
          {/* ========================================= */}
          <section>
            <SectionHeader 
              title="Raw Data Table" 
              subtitle="Complete analysis breakdown for export"
            />
            <AnalysisTable analysis={currentAnalysis} />
          </section>

        </div>
      </main>

      <ConsolePanel logs={logs} onClear={clear} />
    </div>
  );
}
