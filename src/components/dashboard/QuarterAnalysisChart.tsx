import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AnalysisBucket } from '@/types/mutualFund';

interface QuarterAnalysisChartProps {
  data: AnalysisBucket[];
  title?: string;
}

export function QuarterAnalysisChart({ data, title = 'Quarterly Analysis' }: QuarterAnalysisChartProps) {
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

  const minAvg = Math.min(...data.map(d => d.avgNav));
  const maxAvg = Math.max(...data.map(d => d.avgNav));
  const range = maxAvg - minAvg;

  const getBarColor = (value: number) => {
    const normalized = range > 0 ? (value - minAvg) / range : 0.5;
    if (normalized < 0.33) return 'hsl(142, 76%, 36%)';
    if (normalized < 0.66) return 'hsl(48, 96%, 53%)';
    return 'hsl(0, 84%, 60%)';
  };

  // Shorten quarter labels
  const chartData = data.map(d => ({
    ...d,
    shortLabel: `Q${d.key}`,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis 
                dataKey="shortLabel" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as AnalysisBucket;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{d.label}</p>
                      <p className="text-sm">Avg NAV: {d.avgNav.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Samples: {d.samples}</p>
                      <p className="text-sm text-muted-foreground">Rank: #{d.rank}</p>
                      {d.vsBest > 0 && (
                        <p className="text-sm text-red-500">+{d.vsBest.toFixed(2)}% vs best</p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="avgNav" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.avgNav)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
