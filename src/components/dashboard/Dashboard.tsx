import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, CalendarDays, PieChart, BarChart3, Info, Target, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { CollapsibleBlock } from './CollapsibleBlock';
import { DashboardLayout, BlockGrid, BlockStack } from './DashboardLayout';

// Chart/Table components
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

  // Get current analysis based on selection
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
      {/* Compact Header */}
      <header className="border-b border-border bg-card px-4 py-3 sticky top-0 z-20">
        <DashboardLayout className="flex flex-wrap items-center justify-between gap-3">
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
        </DashboardLayout>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <DashboardLayout>
          <BlockStack gap="md">
            {/* Row 1: Key Metrics + NAV Trend */}
            <BlockGrid cols={2}>
              {/* Left: Summary + Recommendation */}
              <BlockStack gap="sm">
                <CollapsibleBlock
                  title="Key Metrics"
                  icon={<BarChart3 className="h-4 w-4" />}
                  defaultOpen={true}
                  compact
                  badge={
                    <Badge variant="outline" className="text-xs">
                      {timeframe}
                    </Badge>
                  }
                >
                  <SummaryCards analysis={currentAnalysis} />
                </CollapsibleBlock>

                <CollapsibleBlock
                  title="Quick Recommendation"
                  icon={<Target className="h-4 w-4" />}
                  defaultOpen={true}
                  compact
                >
                  <RecommendationCard analysis={currentAnalysis} compact />
                </CollapsibleBlock>
              </BlockStack>

              {/* Right: NAV Trend */}
              <CollapsibleBlock
                title="NAV Trend"
                subtitle={`${currentFundName} — ${timeframe}`}
                icon={<TrendingUp className="h-4 w-4" />}
                defaultOpen={true}
                compact
                copyData={filteredNavData.map(d => ({ date: d.date, nav: d.nav }))}
              >
                <NavTrendChart data={filteredNavData} compact />
              </CollapsibleBlock>
            </BlockGrid>

            {/* Row 2: Best SIP Date (Primary Question) */}
            <CollapsibleBlock
              title="Best SIP Date"
              subtitle="Which day of the month should you set your SIP?"
              icon={<CalendarDays className="h-4 w-4" />}
              defaultOpen={true}
              badge={
                currentMonthlyEntry && (
                  <Badge variant="outline" className="text-xs">
                    {currentMonthlyEntry.dataQuality.toUpperCase()}
                  </Badge>
                )
              }
            >
              <BestSipDateBlock analysis={currentMonthlyEntry} />
            </CollapsibleBlock>

            {/* Row 3: Monthly Allocation */}
            <CollapsibleBlock
              title="Monthly Allocation Strategy"
              subtitle="Should you vary your SIP amount by month?"
              icon={<PieChart className="h-4 w-4" />}
              defaultOpen={false}
            >
              <MonthlyDistributionSection multiAnalysis={currentMultiAnalysis} />
            </CollapsibleBlock>

            {/* Row 4: Deep Dive / Raw Data */}
            <CollapsibleBlock
              title="Factor Analysis & Raw Data"
              subtitle="Explore underlying patterns by day, week, month, and quarter"
              icon={<Layers className="h-4 w-4" />}
              defaultOpen={false}
            >
              <Tabs defaultValue="factors" className="space-y-4">
                <TabsList className="h-8">
                  <TabsTrigger value="factors" className="text-xs px-3">By Factor</TabsTrigger>
                  <TabsTrigger value="timeframes" className="text-xs px-3">Timeframes</TabsTrigger>
                  <TabsTrigger value="table" className="text-xs px-3">Raw Table</TabsTrigger>
                </TabsList>

                <TabsContent value="factors">
                  <BlockGrid cols={2}>
                    <DayAnalysisChart data={currentAnalysis?.dayOfMonth || []} title="Day of Month" />
                    <WeekAnalysisChart data={currentAnalysis?.weekOfMonth || []} title="Week of Month" />
                    <WeekdayChart data={currentAnalysis?.dayOfWeek || []} title="Weekday" />
                    <MonthAnalysisChart data={currentAnalysis?.monthOfYear || []} title="Month of Year" />
                    <QuarterAnalysisChart data={currentAnalysis?.quarterOfYear || []} title="Quarter" />
                  </BlockGrid>
                </TabsContent>

                <TabsContent value="timeframes">
                  <MultiTimeframeSection multiAnalysis={multiAnalysis} selectedFund={selectedFund} />
                </TabsContent>

                <TabsContent value="table">
                  <AnalysisTable analysis={currentAnalysis} />
                </TabsContent>
              </Tabs>
            </CollapsibleBlock>
          </BlockStack>
        </DashboardLayout>
      </main>

      <ConsolePanel logs={logs} onClear={clear} />
    </div>
  );
}
