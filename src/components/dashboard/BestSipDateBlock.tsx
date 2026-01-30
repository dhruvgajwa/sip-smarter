import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Info,
  Target
} from 'lucide-react';
import { CopyableWrapper } from './CopyableWrapper';
import { CollapsibleBlock } from './CollapsibleBlock';
import type { CompleteMonthlyOptimalEntry, MonthConsensus } from '@/types/monthlyOptimalEntry';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

interface BestSipDateBlockProps {
  analysis: CompleteMonthlyOptimalEntry | null;
}

/**
 * Compact, information-dense Best SIP Date block.
 * Shows 12-month overview with expandable details.
 */
export function BestSipDateBlock({ analysis }: BestSipDateBlockProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  if (!analysis) {
    return (
      <div className="text-muted-foreground text-sm">Loading analysis...</div>
    );
  }

  const confidenceBadge = (c: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
      medium: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
      low: 'border-border text-muted-foreground',
    };
    return styles[c];
  };

  // Prepare copyable summary
  const copyData = analysis.monthlyConsensus.map(c => ({
    Month: c.monthName,
    'Best Day': c.consensusBestDayLabel,
    '1Y': c.timeframeRecommendations.find(r => r.timeframe === '1Y')?.bestDayLabel || '—',
    '3Y': c.timeframeRecommendations.find(r => r.timeframe === '3Y')?.bestDayLabel || '—',
    '5Y': c.timeframeRecommendations.find(r => r.timeframe === '5Y')?.bestDayLabel || '—',
    '10Y': c.timeframeRecommendations.find(r => r.timeframe === '10Y')?.bestDayLabel || '—',
    'Agreement': `${c.agreementScore.toFixed(0)}%`,
    Confidence: c.confidence,
  }));

  const selectedConsensus = selectedMonth !== null 
    ? analysis.monthlyConsensus[selectedMonth] 
    : null;

  return (
    <div className="space-y-4">
      {/* Global Insights - Compact */}
      {analysis.globalInsights.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Info className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          {analysis.globalInsights.slice(0, 2).map((insight, i) => (
            <span key={i} className="text-muted-foreground">{insight}</span>
          ))}
        </div>
      )}

      {/* 12-Month Grid */}
      <CopyableWrapper data={copyData} label="Monthly SIP Dates">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {analysis.monthlyConsensus.map((consensus) => (
            <button
              key={consensus.month}
              onClick={() => setSelectedMonth(
                selectedMonth === consensus.month ? null : consensus.month
              )}
              className={`p-2 rounded-lg border text-center transition-all hover:border-primary/50 ${
                selectedMonth === consensus.month 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="text-xs text-muted-foreground font-medium">
                {consensus.monthName.slice(0, 3)}
              </div>
              <div className="text-lg font-bold text-primary">
                {consensus.consensusBestDay}
              </div>
              <div className={`text-[10px] px-1 py-0.5 rounded ${confidenceBadge(consensus.confidence)}`}>
                {consensus.agreementScore.toFixed(0)}%
              </div>
            </button>
          ))}
        </div>
      </CopyableWrapper>

      {/* Selected Month Detail */}
      {selectedConsensus && (
        <MonthDetailPanel 
          consensus={selectedConsensus} 
          timeframeAnalyses={analysis.timeframeAnalyses}
          onClose={() => setSelectedMonth(null)}
        />
      )}

      {/* Cross-Timeframe Summary Table */}
      <CollapsibleBlock
        title="Timeframe Comparison"
        subtitle="How each timeframe sees the best day per month"
        compact
        defaultOpen={false}
        copyData={copyData}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                <th className="text-center py-2 font-medium text-primary">Best</th>
                <th className="text-center py-2 font-medium text-muted-foreground">1Y</th>
                <th className="text-center py-2 font-medium text-muted-foreground">3Y</th>
                <th className="text-center py-2 font-medium text-muted-foreground">5Y</th>
                <th className="text-center py-2 font-medium text-muted-foreground">10Y</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {analysis.monthlyConsensus.map(c => (
                <tr key={c.month} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 font-medium">{c.monthName.slice(0, 3)}</td>
                  <td className="py-1.5 text-center font-bold text-primary">{c.consensusBestDay}</td>
                  {c.timeframeRecommendations.map(rec => (
                    <td 
                      key={rec.timeframe} 
                      className={`py-1.5 text-center ${
                        rec.available && rec.bestDay === c.consensusBestDay 
                          ? 'text-emerald-400' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {rec.available ? rec.bestDay : '—'}
                    </td>
                  ))}
                  <td className="py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${confidenceBadge(c.confidence)}`}>
                      {c.agreementScore.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleBlock>
    </div>
  );
}

/**
 * Detail panel for selected month
 */
function MonthDetailPanel({ 
  consensus,
  timeframeAnalyses,
  onClose,
}: { 
  consensus: MonthConsensus;
  timeframeAnalyses: CompleteMonthlyOptimalEntry['timeframeAnalyses'];
  onClose: () => void;
}) {
  // Get day rankings from longest available timeframe
  const longestTf = (['10Y', '5Y', '3Y', '1Y'] as const).find(
    tf => timeframeAnalyses[tf]?.months[consensus.month]?.rankedDays?.length
  );
  
  const rankedDays = longestTf 
    ? timeframeAnalyses[longestTf]?.months[consensus.month]?.rankedDays 
    : null;

  // Top 5 days for chart
  const chartData = rankedDays?.slice(0, 8).map(d => ({
    day: d.day,
    label: d.dayLabel,
    score: d.compositeScore,
  })) || [];

  return (
    <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-semibold">{consensus.monthName}</h4>
            <p className="text-sm text-muted-foreground">{consensus.summary}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{consensus.consensusBestDayLabel}</div>
          <Badge variant="outline" className="text-xs">
            {consensus.confidence} confidence
          </Badge>
        </div>
      </div>

      {/* Timeframe breakdown + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Per-timeframe */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground">Per Timeframe</h5>
          <div className="grid grid-cols-2 gap-2">
            {consensus.timeframeRecommendations.map((rec) => (
              <div 
                key={rec.timeframe}
                className={`p-2 rounded border text-center ${
                  rec.available 
                    ? rec.bestDay === consensus.consensusBestDay
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/30 border-border'
                    : 'bg-muted/10 border-border/30 opacity-50'
                }`}
              >
                <div className="text-xs text-muted-foreground">{rec.timeframe}</div>
                <div className="text-lg font-bold">
                  {rec.available ? rec.bestDay : '—'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Alternatives */}
          {consensus.stableAlternatives.length > 0 && (
            <div className="pt-2">
              <h5 className="text-xs font-medium text-muted-foreground mb-1">Alternatives</h5>
              <div className="flex gap-2 flex-wrap">
                {consensus.stableAlternatives.map((alt) => (
                  <Badge key={alt.day} variant="secondary" className="text-xs">
                    {alt.dayLabel}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Day Rankings Chart */}
        {chartData.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-2">
              Day Rankings ({longestTf})
            </h5>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 10 }}>
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `${v.toFixed(2)}%`}
                    fontSize={9}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="label" 
                    fontSize={10}
                    width={30}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(4)}%`, 'Score']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.score < 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
