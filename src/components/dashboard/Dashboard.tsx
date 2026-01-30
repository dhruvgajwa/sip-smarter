import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, CalendarDays, PieChart, BarChart3, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

import { useConsoleLog } from '@/hooks/useConsoleLog';
import { useMutualFundAnalysis } from '@/hooks/useMutualFundAnalysis';
import { useMultiTimeframeAnalysis } from '@/hooks/useMultiTimeframeAnalysis';
import { useMonthlyOptimalEntry } from '@/hooks/useMonthlyOptimalEntry';
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
import { MultiTimeframeSection } from './MultiTimeframeSection';
import { StrategySection } from './StrategySection';
import { MonthlyOptimalEntrySection } from './MonthlyOptimalEntrySection';

/**
 * Section wrapper component for visual hierarchy
 */
function DashboardSection({ 
  id,
  title, 
  subtitle, 
  icon: Icon, 
  children 
}: { 
  id: string;
  title: string; 
  subtitle?: string; 
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Table of Contents / Quick Nav for the report
 */
function ReportNav({ activeSection }: { activeSection: string }) {
  const sections = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'entry-point', label: 'Optimal Entry', icon: CalendarDays },
    { id: 'distribution', label: 'Distribution', icon: PieChart },
    { id: 'deep-dive', label: 'Deep Dive', icon: BarChart3 },
  ];

  return (
    <nav className="sticky top-[73px] z-10 bg-background/95 backdrop-blur border-b border-border py-2 px-4 -mx-4 mb-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto">
        <span className="text-xs text-muted-foreground mr-2 flex-shrink-0">Jump to:</span>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <section.icon className="h-3.5 w-3.5" />
            {section.label}
          </a>
        ))}
      </div>
    </nav>
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

  // Multi-timeframe analysis for comparison charts
  const multiAnalysis = useMultiTimeframeAnalysis(fundsData, log);
  
  // Monthly optimal entry analysis (comprehensive month-by-month)
  const monthlyOptimalEntry = useMonthlyOptimalEntry(fundsData, log);

  const [selectedFund, setSelectedFund] = useState<number | 'all'>('all');
  const [activeSection, setActiveSection] = useState('overview');

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Track active section based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'entry-point', 'distribution', 'deep-dive'];
      const scrollPosition = window.scrollY + 150;
      
      for (const section of sections.reverse()) {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Get monthly optimal entry for selected fund
  const currentMonthlyEntry = selectedFund === 'all'
    ? (monthlyOptimalEntry.size > 0 ? monthlyOptimalEntry.values().next().value : null)
    : monthlyOptimalEntry.get(selectedFund) || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
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
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Fund Selection */}
          <FundTabs selectedFund={selectedFund} onSelectFund={setSelectedFund} />

          {/* Quick Navigation */}
          <ReportNav activeSection={activeSection} />

          <div className="space-y-12">
            {/* ============================================== */}
            {/* SECTION 1: OVERVIEW                           */}
            {/* Quick snapshot of the fund and key metrics    */}
            {/* ============================================== */}
            <DashboardSection
              id="overview"
              title="Overview"
              subtitle={`Performance snapshot for ${currentFundName}`}
              icon={TrendingUp}
            >
              <div className="space-y-6">
                <SummaryCards analysis={currentAnalysis} />
                <NavTrendChart 
                  data={filteredNavData} 
                  title={`NAV Trend — ${currentFundName} (${timeframe})`}
                />
                <RecommendationCard analysis={currentAnalysis} />
              </div>
            </DashboardSection>

            <div className="border-t border-border" />

            {/* ============================================== */}
            {/* SECTION 2: OPTIMAL ENTRY POINT                */}
            {/* The main story: When should you invest?       */}
            {/* ============================================== */}
            <DashboardSection
              id="entry-point"
              title="Story 1: Optimal Entry Point"
              subtitle="When is the best time to invest each month? Find the optimal SIP date based on historical patterns."
              icon={CalendarDays}
            >
              <div className="space-y-8">
                {/* Monthly Optimal Entry - The comprehensive month-by-month analysis */}
                <MonthlyOptimalEntrySection 
                  analysis={currentMonthlyEntry}
                  fundName={currentFundName}
                />
              </div>
            </DashboardSection>

            <div className="border-t border-border" />

            {/* ============================================== */}
            {/* SECTION 3: DISTRIBUTION STRATEGY              */}
            {/* Secondary story: How to split your investment */}
            {/* ============================================== */}
            <DashboardSection
              id="distribution"
              title="Story 2: Investment Distribution"
              subtitle="Should you invest all at once or spread across multiple dates? Analysis of distribution strategies."
              icon={PieChart}
            >
              <StrategySection 
                multiAnalysis={multiAnalysis} 
                selectedFund={selectedFund} 
              />
            </DashboardSection>

            <div className="border-t border-border" />

            {/* ============================================== */}
            {/* SECTION 4: DEEP DIVE / RAW DATA               */}
            {/* Supporting analysis and raw data              */}
            {/* ============================================== */}
            <DashboardSection
              id="deep-dive"
              title="Deep Dive: Raw Analysis"
              subtitle="Explore the underlying data and multi-timeframe comparisons that power our recommendations."
              icon={BarChart3}
            >
              <Tabs defaultValue="factor-analysis" className="space-y-6">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="factor-analysis">By Factor</TabsTrigger>
                  <TabsTrigger value="timeframe-comparison">Timeframes</TabsTrigger>
                  <TabsTrigger value="data-table">Raw Data</TabsTrigger>
                </TabsList>

                <TabsContent value="factor-analysis" className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    How NAV deviation varies by different timing factors (selected timeframe: {timeframe}).
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DayAnalysisChart 
                      data={currentAnalysis?.dayOfMonth || []} 
                      title="Day of Month"
                    />
                    <WeekAnalysisChart 
                      data={currentAnalysis?.weekOfMonth || []} 
                      title="Week of Month"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WeekdayChart 
                      data={currentAnalysis?.dayOfWeek || []} 
                      title="Weekday"
                    />
                    <MonthAnalysisChart 
                      data={currentAnalysis?.monthOfYear || []} 
                      title="Month of Year"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuarterAnalysisChart 
                      data={currentAnalysis?.quarterOfYear || []} 
                      title="Quarter"
                    />
                    <div /> {/* Spacer */}
                  </div>
                </TabsContent>

                <TabsContent value="timeframe-comparison" className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Compare patterns across 1Y, 3Y, 5Y, and 10Y to identify consistent signals.
                  </p>
                  <MultiTimeframeSection 
                    multiAnalysis={multiAnalysis} 
                    selectedFund={selectedFund} 
                  />
                </TabsContent>

                <TabsContent value="data-table" className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Complete analysis data for {currentFundName} ({timeframe}).
                  </p>
                  <AnalysisTable analysis={currentAnalysis} />
                </TabsContent>
              </Tabs>
            </DashboardSection>
          </div>
        </div>
      </main>

      {/* Console Panel - Collapsed by default */}
      <ConsolePanel logs={logs} onClear={clear} />
    </div>
  );
}
