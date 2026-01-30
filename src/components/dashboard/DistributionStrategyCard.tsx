import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Scale, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import type { DistributionStrategy } from '@/types/strategy';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DistributionStrategyCardProps {
  strategy: DistributionStrategy | null;
}

export function DistributionStrategyCard({ strategy }: DistributionStrategyCardProps) {
  if (!strategy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5" />
            Monthly Distribution Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const { monthlyAllocations, linearVsWeighted, recommendation, reasoning, practicalAllocation } = strategy;

  // Chart data
  const chartData = monthlyAllocations.map(m => ({
    month: m.monthLabel.slice(0, 3),
    deviation: m.avgDeviation,
    weight: m.recommendedWeight * 100,
    equalWeight: 8.33,
  }));

  const recommendationColors = {
    linear: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    weighted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    hybrid: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const recommendationLabels = {
    linear: 'STICK WITH LINEAR SIP',
    weighted: 'USE WEIGHTED DISTRIBUTION',
    hybrid: 'CONSIDER HYBRID APPROACH',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Monthly Distribution Strategy
          </CardTitle>
          <Badge variant="outline" className={recommendationColors[recommendation]}>
            {recommendationLabels[recommendation]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Should you invest equally each month or follow a weighted pattern?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 border ${recommendation === 'linear' ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-border'}`}>
            <div className="flex items-center gap-2 mb-2">
              {recommendation === 'linear' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">Linear SIP</span>
            </div>
            <p className="text-2xl font-bold">8.33%</p>
            <p className="text-xs text-muted-foreground">Same amount every month</p>
            <p className="text-sm mt-2">
              Expected deviation: <span className="font-mono">{linearVsWeighted.linearExpectedDeviation.toFixed(4)}%</span>
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${recommendation === 'weighted' ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-border'}`}>
            <div className="flex items-center gap-2 mb-2">
              {recommendation === 'weighted' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">Weighted</span>
            </div>
            <p className="text-2xl font-bold">Variable</p>
            <p className="text-xs text-muted-foreground">Based on historical patterns</p>
            <p className="text-sm mt-2">
              Expected deviation: <span className="font-mono">{linearVsWeighted.weightedExpectedDeviation.toFixed(4)}%</span>
            </p>
          </div>
        </div>

        {/* Potential Improvement */}
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Potential Improvement with Weighted</p>
            <p className={`text-2xl font-bold ${linearVsWeighted.potentialImprovement > 0.01 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {linearVsWeighted.potentialImprovement > 0 ? '+' : ''}{linearVsWeighted.potentialImprovement.toFixed(4)}%
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Over ₹1,00,000/year</p>
            <p className="text-xl font-bold">
              ₹{Math.round(Math.abs(linearVsWeighted.potentialImprovement) * 1000).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Monthly Deviation Chart */}
        <div>
          <p className="text-sm font-medium mb-2">Monthly Deviation Pattern</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="month" fontSize={10} />
                <YAxis 
                  tickFormatter={(v) => `${v.toFixed(2)}%`}
                  fontSize={10}
                  width={45}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(4)}%`,
                    name === 'deviation' ? 'Deviation from Avg' : 'Weight'
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="deviation" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.deviation < 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Green = cheaper month (invest more) | Red = expensive month (invest less)
          </p>
        </div>

        {/* Practical Allocation Table */}
        {recommendation !== 'linear' && (
          <div>
            <p className="text-sm font-medium mb-2">Suggested Monthly Allocation (₹10,000 base)</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {practicalAllocation.map((alloc) => (
                <div key={alloc.month} className="bg-muted/30 rounded p-2 text-center">
                  <p className="font-medium">{alloc.month.slice(0, 3)}</p>
                  <p className="text-muted-foreground">{alloc.percentage.toFixed(1)}%</p>
                  <p className="font-mono text-primary">{alloc.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-2">Analysis Summary</p>
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
