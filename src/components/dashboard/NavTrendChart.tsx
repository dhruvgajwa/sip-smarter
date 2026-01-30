import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { NavDataPoint } from '@/types/mutualFund';
import { format } from 'date-fns';

interface NavTrendChartProps {
  data: NavDataPoint[];
  title?: string;
}

// Calculate moving average
function calculateMA(data: NavDataPoint[], period: number): (number | null)[] {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    const slice = data.slice(index - period + 1, index + 1);
    const avg = slice.reduce((sum, d) => sum + d.nav, 0) / period;
    return avg;
  });
}

export function NavTrendChart({ data, title = 'NAV Trend' }: NavTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  const ma30 = calculateMA(data, 30);
  const ma90 = calculateMA(data, 90);

  const chartData = data.map((d, i) => ({
    date: d.date,
    dateStr: format(d.date, 'MMM yyyy'),
    nav: d.nav,
    ma30: ma30[i],
    ma90: ma90[i],
  }));

  // Sample data for performance (show every nth point for large datasets)
  const sampleRate = Math.max(1, Math.floor(chartData.length / 300));
  const sampledData = chartData.filter((_, i) => i % sampleRate === 0 || i === chartData.length - 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampledData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis 
                dataKey="dateStr" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{format(d.date, 'dd MMM yyyy')}</p>
                      <p className="text-sm">NAV: {d.nav.toFixed(2)}</p>
                      {d.ma30 && <p className="text-sm text-blue-500">MA30: {d.ma30.toFixed(2)}</p>}
                      {d.ma90 && <p className="text-sm text-orange-500">MA90: {d.ma90.toFixed(2)}</p>}
                    </div>
                  );
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="nav" 
                stroke="hsl(var(--primary))" 
                dot={false}
                strokeWidth={1.5}
                name="NAV"
              />
              <Line 
                type="monotone" 
                dataKey="ma30" 
                stroke="hsl(217, 91%, 60%)" 
                dot={false}
                strokeWidth={1}
                strokeDasharray="3 3"
                name="30-day MA"
              />
              <Line 
                type="monotone" 
                dataKey="ma90" 
                stroke="hsl(25, 95%, 53%)" 
                dot={false}
                strokeWidth={1}
                strokeDasharray="5 5"
                name="90-day MA"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
