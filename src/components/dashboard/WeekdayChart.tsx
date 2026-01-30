import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Info } from 'lucide-react';
import { CopyableWrapper } from './CopyableWrapper';
import type { AnalysisBucket } from '@/types/mutualFund';

interface WeekdayChartProps {
  data: AnalysisBucket[];
  title?: string;
}

/**
 * WEEKDAY ANALYSIS
 * 
 * Shows which day of the week (Monday-Friday) tends to have better NAV prices.
 * Useful for timing within a week when you have flexibility.
 */
export function WeekdayChart({ data, title = 'Weekday Analysis' }: WeekdayChartProps) {
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
    if (value < -0.02) return 'hsl(142, 76%, 36%)';
    if (value < 0) return 'hsl(142, 50%, 50%)';
    if (value > 0.02) return 'hsl(0, 84%, 60%)';
    return 'hsl(48, 96%, 53%)';
  };

  const sorted = [...data].sort((a, b) => a.avgDeviation - b.avgDeviation);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Shorten day names for display
  const chartData = data.map(d => ({
    ...d,
    shortLabel: d.label.slice(0, 3),
  }));

  // Prepare copyable data
  const copyData = data.map((d) => ({
    Weekday: d.label,
    'Avg Deviation (%)': d.avgDeviation,
    Samples: d.samples,
    Rank: d.rank,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              % deviation from average • Which weekday is cheapest?
            </p>
          </div>
          <div className="text-xs text-right text-muted-foreground">
            <span className="text-green-500">Best: {best?.label.slice(0, 3)}</span>
            <span className="mx-2">|</span>
            <span className="text-red-500">Worst: {worst?.label.slice(0, 3)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CopyableWrapper data={copyData} label="Weekday Analysis">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="shortLabel" 
                  tick={{ fontSize: 11 }}
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
                        <p className="font-semibold">{d.label}</p>
                        <div className="mt-2 space-y-1">
                          <p className={d.avgDeviation < 0 ? 'text-green-500' : 'text-red-500'}>
                            Avg: {d.avgDeviation > 0 ? '+' : ''}{d.avgDeviation.toFixed(3)}%
                          </p>
                          <p className="text-muted-foreground">Based on {d.samples} observations</p>
                          <p className="text-muted-foreground">Rank: #{d.rank} of {data.length}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="avgDeviation" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.avgDeviation)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CopyableWrapper>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          <Info className="h-3 w-3" />
          Markets are closed on weekends; only trading days analyzed
        </div>
      </CardContent>
    </Card>
  );
}
