import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeframeComparisonChart } from './TimeframeComparisonChart';
import { ConsistencyTable } from './ConsistencyTable';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';
import { createComparisonData, analyzeFactorConsistency } from '@/types/multiTimeframeAnalysis';
import { FUNDS } from '@/types/mutualFund';

interface MultiTimeframeSectionProps {
  multiAnalysis: Map<number, MultiTimeframeAnalysis>;
  selectedFund: number | 'all';
}

export function MultiTimeframeSection({ multiAnalysis, selectedFund }: MultiTimeframeSectionProps) {
  // Get the analysis for the selected fund (or first fund if 'all')
  const currentAnalysis = useMemo(() => {
    if (selectedFund === 'all') {
      return multiAnalysis.values().next().value as MultiTimeframeAnalysis | undefined;
    }
    return multiAnalysis.get(selectedFund);
  }, [multiAnalysis, selectedFund]);

  // Generate comparison data for each factor
  const comparisonData = useMemo(() => {
    if (!currentAnalysis) return null;
    
    return {
      dayOfMonth: createComparisonData(currentAnalysis.analyses, a => a.dayOfMonth),
      weekOfMonth: createComparisonData(currentAnalysis.analyses, a => a.weekOfMonth),
      dayOfWeek: createComparisonData(currentAnalysis.analyses, a => a.dayOfWeek),
      monthOfYear: createComparisonData(currentAnalysis.analyses, a => a.monthOfYear),
      quarterOfYear: createComparisonData(currentAnalysis.analyses, a => a.quarterOfYear),
    };
  }, [currentAnalysis]);

  // Generate consistency analysis
  const consistencyData = useMemo(() => {
    if (!currentAnalysis) return [];
    return analyzeFactorConsistency(currentAnalysis.analyses);
  }, [currentAnalysis]);

  if (!currentAnalysis || !comparisonData) {
    return null;
  }

  const fundName = FUNDS.find(f => f.code === currentAnalysis.fundCode)?.shortName || currentAnalysis.fundName;

  return (
    <div className="space-y-6">
      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold mb-4">
          📊 Multi-Timeframe Comparison — {fundName}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Compare how patterns differ across 1, 3, 5, and 10 year periods. Consistent patterns across all timeframes 
          indicate stronger, more reliable signals.
        </p>
      </div>

      {/* Consistency Table First */}
      <ConsistencyTable data={consistencyData} fundName={fundName} />

      {/* Tabbed Comparison Charts */}
      <Tabs defaultValue="dayOfMonth" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dayOfMonth" className="text-xs">Day of Month</TabsTrigger>
          <TabsTrigger value="weekOfMonth" className="text-xs">Week of Month</TabsTrigger>
          <TabsTrigger value="dayOfWeek" className="text-xs">Weekday</TabsTrigger>
          <TabsTrigger value="monthOfYear" className="text-xs">Month</TabsTrigger>
          <TabsTrigger value="quarterOfYear" className="text-xs">Quarter</TabsTrigger>
        </TabsList>

        <TabsContent value="dayOfMonth" className="mt-4">
          <TimeframeComparisonChart
            data={comparisonData.dayOfMonth}
            title="Day of Month — All Timeframes"
            subtitle="Compare average deviation by calendar day across 1Y, 3Y, 5Y, and 10Y periods"
          />
        </TabsContent>

        <TabsContent value="weekOfMonth" className="mt-4">
          <TimeframeComparisonChart
            data={comparisonData.weekOfMonth}
            title="Week of Month — All Timeframes"
            subtitle="Compare average deviation by week (1-5) across all time periods"
          />
        </TabsContent>

        <TabsContent value="dayOfWeek" className="mt-4">
          <TimeframeComparisonChart
            data={comparisonData.dayOfWeek}
            title="Weekday — All Timeframes"
            subtitle="Compare Monday through Friday patterns across all time periods"
          />
        </TabsContent>

        <TabsContent value="monthOfYear" className="mt-4">
          <TimeframeComparisonChart
            data={comparisonData.monthOfYear}
            title="Month of Year — All Timeframes"
            subtitle="Compare January through December patterns across all time periods"
          />
        </TabsContent>

        <TabsContent value="quarterOfYear" className="mt-4">
          <TimeframeComparisonChart
            data={comparisonData.quarterOfYear}
            title="Quarter — All Timeframes"
            subtitle="Compare Q1-Q4 patterns across all time periods"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
