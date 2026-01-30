import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Info } from 'lucide-react';
import type { AnalysisBucket } from '@/types/mutualFund';

interface DayAnalysisChartProps {
  data: AnalysisBucket[];
  title?: string;
}

/**
 * DAY OF MONTH ANALYSIS
 * 
 * Shows which calendar days (1st-31st) tend to have NAV prices 
 * below or above the monthly average.
 * 
 * How to read:
 * - Negative values (green): NAV tends to be BELOW average → GOOD for buying
 * - Positive values (red): NAV tends to be ABOVE average → BAD for buying
 * - The taller the bar below zero, the better that day is for SIP
 */
export function DayAnalysisChart({ data, title = 'Day of Month Analysis' }: DayAnalysisChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  const getBarColor = (value: number) => {
    // Green for negative (below average = good), Red for positive (above average = bad)
    if (value < -0.02) return 'hsl(142, 76%, 36%)'; // Strong green
    if (value < 0) return 'hsl(142, 50%, 50%)'; // Light green
    if (value > 0.02) return 'hsl(0, 84%, 60%)'; // Strong red
    return 'hsl(48, 96%, 53%)'; // Yellow for near zero
  };

  // Find best and worst for annotation
  const sorted = [...data].sort((a, b) => a.avgDeviation - b.avgDeviation);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              % deviation from 30-day average • Negative = cheaper buying day
            </p>
          </div>
          <div className="text-xs text-right text-muted-foreground">
            <span className="text-green-500">Best: {best?.label}</span>
            <span className="mx-2">|</span>
            <span className="text-red-500">Worst: {worst?.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="key" 
                tick={{ fontSize: 9 }}
                interval={2}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9 }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as AnalysisBucket;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold">{d.label} of month</p>
                      <div className="mt-2 space-y-1">
                        <p className={d.avgDeviation < 0 ? 'text-green-500' : 'text-red-500'}>
                          Avg: {d.avgDeviation > 0 ? '+' : ''}{d.avgDeviation.toFixed(3)}%
                        </p>
                        <p className="text-muted-foreground">Range: {d.minDeviation.toFixed(2)}% to {d.maxDeviation.toFixed(2)}%</p>
                        <p className="text-muted-foreground">Based on {d.samples} observations</p>
                        <p className="text-muted-foreground">Rank: #{d.rank} of {data.length}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="avgDeviation" radius={[2, 2, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.avgDeviation)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'hsl(142, 76%, 36%)' }} />
              Below avg (buy)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'hsl(0, 84%, 60%)' }} />
              Above avg (avoid)
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            Days 1-31 of calendar month
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
