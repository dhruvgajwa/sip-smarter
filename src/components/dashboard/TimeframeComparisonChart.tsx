import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts';
import { CopyableWrapper } from './CopyableWrapper';
import type { TimeframeComparisonPoint } from '@/types/multiTimeframeAnalysis';

interface TimeframeComparisonChartProps {
  data: TimeframeComparisonPoint[];
  title: string;
  subtitle?: string;
}

const TIMEFRAME_COLORS = {
  '1Y': 'hsl(200, 70%, 50%)',  // Blue
  '3Y': 'hsl(160, 60%, 45%)',  // Teal
  '5Y': 'hsl(280, 60%, 55%)',  // Purple
  '10Y': 'hsl(30, 80%, 55%)',  // Orange
};

export function TimeframeComparisonChart({ data, title, subtitle }: TimeframeComparisonChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(3)}%`;
  };

  // Prepare copyable data
  const copyData = data.map((d) => ({
    Label: d.label,
    '1Y (%)': d['1Y'],
    '3Y (%)': d['3Y'],
    '5Y (%)': d['5Y'],
    '10Y (%)': d['10Y'],
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <CopyableWrapper data={copyData} label="Timeframe Comparison">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="font-medium mb-2">{label}</p>
                        <div className="space-y-1">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">{entry.name}:</span>
                              <span className={`font-mono ${
                                (entry.value as number) < 0 
                                  ? 'text-green-500' 
                                  : (entry.value as number) > 0 
                                    ? 'text-red-500' 
                                    : ''
                              }`}>
                                {formatValue(entry.value as number | null)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span className="text-xs">{value}</span>}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="1Y" name="1 Year" fill={TIMEFRAME_COLORS['1Y']} radius={[2, 2, 0, 0]} />
                <Bar dataKey="3Y" name="3 Years" fill={TIMEFRAME_COLORS['3Y']} radius={[2, 2, 0, 0]} />
                <Bar dataKey="5Y" name="5 Years" fill={TIMEFRAME_COLORS['5Y']} radius={[2, 2, 0, 0]} />
                <Bar dataKey="10Y" name="10 Years" fill={TIMEFRAME_COLORS['10Y']} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CopyableWrapper>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Negative values (below zero) indicate historically good entry points
        </p>
      </CardContent>
    </Card>
  );
}
