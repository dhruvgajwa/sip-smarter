import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import type { OptimalEntryAnalysis } from '@/types/strategy';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface OptimalEntryCardProps {
  analysis: OptimalEntryAnalysis | null;
}

export function OptimalEntryCard({ analysis }: OptimalEntryCardProps) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Optimal SIP Entry Point
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const { primaryRecommendation, alternativeRecommendations, maxPotentialSavings, dataConfidence, reasoning, rankedDays } = analysis;

  // Prepare chart data - show top 10 and bottom 5 for context
  const top10 = rankedDays.slice(0, 10);
  const bottom5 = rankedDays.slice(-5);
  const chartData = [...top10, ...bottom5].map(day => ({
    day: day.day,
    label: day.dayLabel,
    deviation: day.avgDeviationAcrossTimeframes,
    consensus: day.consensusScore,
    isTop: top10.includes(day),
  }));

  const confidenceColor = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Optimal SIP Entry Point
          </CardTitle>
          <Badge variant="outline" className={confidenceColor[dataConfidence]}>
            {dataConfidence.toUpperCase()} CONFIDENCE
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Multi-timeframe consensus analysis for best SIP date
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Recommendation */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Recommended SIP Date</p>
              <p className="text-3xl font-bold text-primary">
                {primaryRecommendation?.dayLabel || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Avg Deviation</p>
              <p className="text-lg font-semibold text-emerald-400">
                {primaryRecommendation?.avgDeviationAcrossTimeframes.toFixed(3)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Consensus</p>
              <p className="text-lg font-semibold">
                {primaryRecommendation?.consensusScore.toFixed(0)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Max Savings</p>
              <p className="text-lg font-semibold text-emerald-400">
                {maxPotentialSavings.toFixed(3)}%
              </p>
            </div>
          </div>
        </div>

        {/* Risk/Reward Analysis */}
        {primaryRecommendation && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Best Case (Upside)</span>
              </div>
              <p className="text-xl font-semibold text-emerald-400">
                {primaryRecommendation.potentialUpside.toFixed(3)}%
              </p>
              <p className="text-xs text-muted-foreground">Below moving avg</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Worst Case (Downside)</span>
              </div>
              <p className="text-xl font-semibold text-red-400">
                +{primaryRecommendation.potentialDownside.toFixed(3)}%
              </p>
              <p className="text-xs text-muted-foreground">Above moving avg</p>
            </div>
          </div>
        )}

        {/* Alternative Recommendations */}
        {alternativeRecommendations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Alternative Dates (Ranked 2-4)</p>
            <div className="flex gap-2 flex-wrap">
              {alternativeRecommendations.map((alt, i) => (
                <Badge key={alt.day} variant="secondary" className="text-sm">
                  #{i + 2} {alt.dayLabel} ({alt.avgDeviationAcrossTimeframes.toFixed(3)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Chart: Best vs Worst Days */}
        <div>
          <p className="text-sm font-medium mb-2">Day Comparison (Top 10 vs Bottom 5)</p>
          <div className="h-48">
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
                  width={35}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(4)}%`, 'Deviation']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="deviation" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.deviation < 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'}
                      opacity={entry.isTop ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reasoning */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Analysis Insights
          </p>
          <ul className="space-y-1">
            {reasoning.map((reason, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
