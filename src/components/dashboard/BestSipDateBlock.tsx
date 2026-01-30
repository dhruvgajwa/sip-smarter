import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Info } from 'lucide-react';
import { CopyableWrapper } from './CopyableWrapper';
import type { CompleteMonthlyOptimalEntry, MonthConsensus } from '@/types/monthlyOptimalEntry';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

interface BestSipDateBlockProps {
  analysis: CompleteMonthlyOptimalEntry | null;
}

export function BestSipDateBlock({ analysis }: BestSipDateBlockProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  if (!analysis) {
    return <div className="text-muted-foreground text-sm">Loading analysis...</div>;
  }

  const confidenceBadge = (c: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
      medium: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
      low: 'border-border text-muted-foreground',
    };
    return styles[c];
  };

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

  const selectedConsensus = selectedMonth !== null ? analysis.monthlyConsensus[selectedMonth] : null;

  return (
    <div className="space-y-6">
      {/* Global Insights */}
      {analysis.globalInsights.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            {analysis.globalInsights.map((insight, i) => (
              <p key={i}>{insight}</p>
            ))}
          </div>
        </div>
      )}

      {/* 12-Month Grid */}
      <CopyableWrapper data={copyData} label="Monthly SIP Dates">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {analysis.monthlyConsensus.map((consensus) => (
            <button
              key={consensus.month}
              onClick={() => setSelectedMonth(selectedMonth === consensus.month ? null : consensus.month)}
              className={`p-2 rounded-lg border text-center transition-all hover:border-primary/50 ${
                selectedMonth === consensus.month 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-card'
              }`}
            >
              <div className="text-xs text-muted-foreground font-medium">
                {consensus.monthName.slice(0, 3)}
              </div>
              <div className="text-xl font-bold text-primary">
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
        />
      )}

      {/* Timeframe Comparison Table - always visible */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Timeframe Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <CopyableWrapper data={copyData} label="Timeframe Comparison">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                    <th className="text-center py-2 font-medium text-primary">Best</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">1Y</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">3Y</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">5Y</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">10Y</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.monthlyConsensus.map(c => (
                    <tr key={c.month} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 font-medium">{c.monthName}</td>
                      <td className="py-2 text-center font-bold text-primary text-lg">{c.consensusBestDay}</td>
                      {c.timeframeRecommendations.map(rec => (
                        <td 
                          key={rec.timeframe} 
                          className={`py-2 text-center ${
                            rec.available && rec.bestDay === c.consensusBestDay 
                              ? 'text-emerald-400 font-medium' 
                              : 'text-muted-foreground'
                          }`}
                        >
                          {rec.available ? rec.bestDay : '—'}
                        </td>
                      ))}
                      <td className="py-2 text-center">
                        <Badge variant="outline" className={`text-xs ${confidenceBadge(c.confidence)}`}>
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
    </div>
  );
}

function MonthDetailPanel({ 
  consensus,
  timeframeAnalyses,
}: { 
  consensus: MonthConsensus;
  timeframeAnalyses: CompleteMonthlyOptimalEntry['timeframeAnalyses'];
}) {
  const longestTf = (['10Y', '5Y', '3Y', '1Y'] as const).find(
    tf => timeframeAnalyses[tf]?.months[consensus.month]?.rankedDays?.length
  );
  
  const rankedDays = longestTf 
    ? timeframeAnalyses[longestTf]?.months[consensus.month]?.rankedDays 
    : null;

  const chartData = rankedDays?.slice(0, 8).map(d => ({
    day: d.day,
    label: d.dayLabel,
    score: d.compositeScore,
  })) || [];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{consensus.monthName}</CardTitle>
              <p className="text-xs text-muted-foreground">{consensus.summary}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{consensus.consensusBestDayLabel}</div>
            <Badge variant="outline" className="text-xs">{consensus.confidence} confidence</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Per-timeframe breakdown */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Per Timeframe</h5>
            <div className="grid grid-cols-4 gap-2">
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
                  <div className="text-lg font-bold">{rec.available ? rec.bestDay : '—'}</div>
                </div>
              ))}
            </div>
            
            {consensus.stableAlternatives.length > 0 && (
              <div>
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
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Top Days ({longestTf})</h5>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 10 }}>
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(2)}%`} fontSize={9} />
                    <YAxis type="category" dataKey="label" fontSize={10} width={30} />
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
      </CardContent>
    </Card>
  );
}
