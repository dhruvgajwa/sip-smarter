import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  Target, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { CopyableWrapper } from './CopyableWrapper';
import type { CompleteMonthlyOptimalEntry, MonthConsensus } from '@/types/monthlyOptimalEntry';
import { FULL_MONTH_NAMES } from '@/types/monthlyOptimalEntry';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface MonthlyOptimalEntrySectionProps {
  analysis: CompleteMonthlyOptimalEntry | null;
  fundName: string;
}

export function MonthlyOptimalEntrySection({ analysis, fundName }: MonthlyOptimalEntrySectionProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Monthly Optimal Entry Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const confidenceColors = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const confidenceIcons = {
    high: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    medium: <AlertCircle className="h-4 w-4 text-amber-400" />,
    low: <XCircle className="h-4 w-4 text-red-400" />,
  };

  const selectedConsensus = analysis.monthlyConsensus[selectedMonth];

  return (
    <div className="space-y-6">
      {/* Global Insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Global Patterns
            </CardTitle>
            <Badge variant="outline" className={confidenceColors[analysis.dataQuality]}>
              {analysis.dataQuality.toUpperCase()} DATA QUALITY
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {analysis.globalInsights.map((insight, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 12-Month Overview List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Year-at-a-Glance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {analysis.monthlyConsensus.map((consensus) => (
              <button
                key={consensus.month}
                onClick={() => setSelectedMonth(consensus.month)}
                className={`w-full flex items-center justify-between py-3 px-2 text-left hover:bg-muted/50 transition-colors ${
                  selectedMonth === consensus.month ? 'bg-primary/10' : ''
                }`}
              >
                <span className="font-medium">{consensus.monthName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-primary font-bold">{consensus.consensusBestDayLabel}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      consensus.confidence === 'high' 
                        ? 'border-emerald-500/50 text-emerald-400'
                        : consensus.confidence === 'medium'
                        ? 'border-amber-500/50 text-amber-400'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {consensus.agreementScore.toFixed(0)}%
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Month Analysis */}
      {selectedConsensus && (
        <MonthDetailCard 
          consensus={selectedConsensus}
          timeframeAnalyses={analysis.timeframeAnalyses}
          confidenceColors={confidenceColors}
          confidenceIcons={confidenceIcons}
        />
      )}

      {/* Cross-Timeframe Comparison */}
      <CrossTimeframeComparison consensus={analysis.monthlyConsensus} />
    </div>
  );
}


/**
 * Detailed view for selected month
 */
function MonthDetailCard({ 
  consensus,
  timeframeAnalyses,
  confidenceColors,
  confidenceIcons,
}: { 
  consensus: MonthConsensus;
  timeframeAnalyses: CompleteMonthlyOptimalEntry['timeframeAnalyses'];
  confidenceColors: Record<string, string>;
  confidenceIcons: Record<string, React.ReactNode>;
}) {
  const monthAnalysis = Object.entries(timeframeAnalyses)
    .filter(([_, a]) => a !== null)
    .map(([tf, a]) => ({
      timeframe: tf,
      analysis: a!.months[consensus.month],
    }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {consensus.monthName} — Optimal Entry Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {confidenceIcons[consensus.confidence]}
            <Badge variant="outline" className={confidenceColors[consensus.confidence]}>
              {consensus.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Recommendation */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Best SIP Date</p>
              <p className="text-4xl font-bold text-primary">{consensus.consensusBestDayLabel}</p>
            </div>
            <div className="flex-1 border-l border-border pl-4">
              <p className="text-sm text-muted-foreground mb-2">{consensus.summary}</p>
              {consensus.stableAlternatives.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Alternatives:</span>
                  {consensus.stableAlternatives.map((alt) => (
                    <Badge key={alt.day} variant="secondary" className="text-xs">
                      {alt.dayLabel} (avg rank: {alt.avgRank.toFixed(1)})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeframe Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Per-Timeframe Recommendations</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {consensus.timeframeRecommendations.map((rec) => (
              <div 
                key={rec.timeframe}
                className={`p-3 rounded-lg border ${
                  rec.available 
                    ? rec.bestDay === consensus.consensusBestDay
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/50 border-border'
                    : 'bg-muted/20 border-border/50 opacity-50'
                }`}
              >
                <div className="text-xs text-muted-foreground">{rec.timeframe}</div>
                <div className="text-xl font-bold">
                  {rec.available ? rec.bestDayLabel : 'N/A'}
                </div>
                {rec.available && (
                  <div className="text-xs text-muted-foreground">
                    {rec.deviation.toFixed(3)}% dev
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Day Rankings Chart (from longest available timeframe) */}
        {monthAnalysis.length > 0 && monthAnalysis[monthAnalysis.length - 1].analysis?.rankedDays && (
          <DayRankingsChart 
            rankedDays={monthAnalysis[monthAnalysis.length - 1].analysis.rankedDays}
            timeframe={monthAnalysis[monthAnalysis.length - 1].timeframe}
          />
        )}

        {/* Month Insights */}
        {monthAnalysis.length > 0 && monthAnalysis[0].analysis?.insights && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Month Insights
            </h4>
            <ul className="space-y-1">
              {monthAnalysis[monthAnalysis.length - 1].analysis.insights.map((insight, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Horizontal bar chart showing day rankings
 */
function DayRankingsChart({ 
  rankedDays, 
  timeframe 
}: { 
  rankedDays: CompleteMonthlyOptimalEntry['timeframeAnalyses']['1Y'] extends { months: Array<{ rankedDays: infer T }> } ? T extends Array<infer U> ? U[] : never : never;
  timeframe: string;
}) {
  // Show top 5 and bottom 3
  const top5 = rankedDays.slice(0, 5);
  const bottom3 = rankedDays.slice(-3);
  const chartData = [...top5, ...bottom3].map((day, idx) => ({
    day: day.day,
    label: day.dayLabel,
    deviation: day.avgDeviation,
    composite: day.compositeScore,
    isTop: idx < 5,
  }));

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Day Rankings ({timeframe}) — Top 5 vs Bottom 3</h4>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
            <XAxis 
              type="number" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `${v.toFixed(2)}%`}
              fontSize={10}
            />
            <YAxis 
              type="category" 
              dataKey="label" 
              fontSize={10}
              width={40}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(4)}%`, 'Composite Score']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar dataKey="composite" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.composite < 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'}
                  opacity={entry.isTop ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Radar chart showing consensus across all months
 */
function CrossTimeframeComparison({ consensus }: { consensus: MonthConsensus[] }) {
  const radarData = consensus.map(c => ({
    month: c.monthName.slice(0, 3),
    agreement: c.agreementScore,
    fullMonth: c.monthName,
    bestDay: c.consensusBestDay,
  }));

  // Prepare copyable data for the summary table
  const copyData = consensus.map(c => {
    const row: Record<string, string | number> = {
      Month: c.monthName,
      'Best Day': c.consensusBestDayLabel,
    };
    c.timeframeRecommendations.forEach(rec => {
      row[rec.timeframe] = rec.available ? rec.bestDayLabel : '—';
    });
    row['Agreement (%)'] = c.agreementScore;
    row['Confidence'] = c.confidence;
    return row;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Timeframe Agreement by Month</CardTitle>
        <p className="text-xs text-muted-foreground">
          Higher values indicate stronger consensus across 1Y, 3Y, 5Y, and 10Y periods
        </p>
      </CardHeader>
      <CardContent>
        <CopyableWrapper data={radarData} label="Radar Chart Data" className="mb-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Agreement %"
                  dataKey="agreement"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(0)}%`,
                    `${props.payload.fullMonth}: Best day is ${props.payload.bestDay}`,
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CopyableWrapper>

        {/* Summary Table */}
        <CopyableWrapper data={copyData} label="Monthly Summary">
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Best Day</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">1Y</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">3Y</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">5Y</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">10Y</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Agreement</th>
                </tr>
              </thead>
              <tbody>
                {consensus.map(c => (
                  <tr key={c.month} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 font-medium">{c.monthName}</td>
                    <td className="py-2 text-center">
                      <span className="font-bold text-primary">{c.consensusBestDayLabel}</span>
                    </td>
                    {c.timeframeRecommendations.map(rec => (
                      <td 
                        key={rec.timeframe} 
                        className={`py-2 text-center ${
                          rec.available && rec.bestDay === c.consensusBestDay 
                            ? 'text-emerald-400' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {rec.available ? rec.bestDayLabel : '—'}
                      </td>
                    ))}
                    <td className="py-2 text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          c.confidence === 'high' 
                            ? 'border-emerald-500/50 text-emerald-400'
                            : c.confidence === 'medium'
                            ? 'border-amber-500/50 text-amber-400'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {c.agreementScore.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CopyableWrapper>
      </CardContent>
    </Card>
  );
}
