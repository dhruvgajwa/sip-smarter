import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, ArrowRight, CheckCircle2, XCircle, TrendingUp, Calculator } from 'lucide-react';
import type { DistributionStrategy } from '@/types/strategy';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DistributionStrategyCardProps {
  strategy: DistributionStrategy | null;
  baseAmount?: number;
}

export function DistributionStrategyCard({ strategy, baseAmount = 10000 }: DistributionStrategyCardProps) {
  const yearlyAmount = baseAmount * 12;
  
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

  const { monthlyAllocations, linearVsWeighted, recommendation, reasoning } = strategy;
  
  // Calculate practical allocation based on provided base amount
  const practicalAllocation = monthlyAllocations.map(m => ({
    month: m.monthLabel,
    percentage: m.recommendedWeight * 100,
    linearAmount: baseAmount,
    weightedAmount: Math.round(m.recommendedWeight * 12 * baseAmount),
    difference: Math.round(m.recommendedWeight * 12 * baseAmount) - baseAmount,
  }));

  // Calculate detailed benefit analysis
  const improvementPercentage = linearVsWeighted.potentialImprovement;
  const yearlyBenefitAmount = Math.round(Math.abs(improvementPercentage) * yearlyAmount / 100);
  
  // Project benefits over multiple years (compound effect approximation)
  const projections = [
    { years: 1, linear: yearlyAmount, weighted: yearlyAmount, benefit: yearlyBenefitAmount },
    { years: 3, linear: yearlyAmount * 3, weighted: yearlyAmount * 3, benefit: yearlyBenefitAmount * 3 },
    { years: 5, linear: yearlyAmount * 5, weighted: yearlyAmount * 5, benefit: yearlyBenefitAmount * 5 },
    { years: 10, linear: yearlyAmount * 10, weighted: yearlyAmount * 10, benefit: yearlyBenefitAmount * 10 },
  ];

  // Chart data - use actual linear allocation from strategy, not hardcoded
  const equalWeightPercent = strategy.linearAllocation * 100;
  const chartData = monthlyAllocations.map(m => ({
    month: m.monthLabel.slice(0, 3),
    deviation: m.avgDeviation,
    weight: m.recommendedWeight * 100,
    equalWeight: equalWeightPercent,
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
          Comparing constant ₹{baseAmount.toLocaleString('en-IN')}/month vs weighted allocation
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
              <span className="font-medium">Constant SIP</span>
            </div>
            <p className="text-2xl font-bold font-mono">₹{baseAmount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">Same amount every month</p>
            <p className="text-sm mt-2">
              Yearly: <span className="font-mono">₹{yearlyAmount.toLocaleString('en-IN')}</span>
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${recommendation === 'weighted' ? 'bg-primary/10 border-primary/20' : 'bg-muted/30 border-border'}`}>
            <div className="flex items-center gap-2 mb-2">
              {recommendation === 'weighted' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">Weighted SIP</span>
            </div>
            <p className="text-2xl font-bold font-mono">Variable</p>
            <p className="text-xs text-muted-foreground">₹{Math.min(...practicalAllocation.map(p => p.weightedAmount)).toLocaleString('en-IN')} - ₹{Math.max(...practicalAllocation.map(p => p.weightedAmount)).toLocaleString('en-IN')}</p>
            <p className="text-sm mt-2">
              Yearly: <span className="font-mono">₹{yearlyAmount.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* Benefit Calculator */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 rounded-lg p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <span className="font-medium">Your Potential Benefit</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Improvement %</p>
              <p className={`text-3xl font-bold ${improvementPercentage > 0.01 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {improvementPercentage > 0 ? '+' : ''}{improvementPercentage.toFixed(3)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">per transaction on average</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly Benefit</p>
              <p className={`text-3xl font-bold ${yearlyBenefitAmount > 100 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                ₹{yearlyBenefitAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">on ₹{yearlyAmount.toLocaleString('en-IN')}/year</p>
            </div>
          </div>

          {/* Multi-year projection */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-xs font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Projected Savings Over Time
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {projections.map((proj) => (
                <div key={proj.years} className="bg-background/50 rounded p-2">
                  <p className="text-xs text-muted-foreground">{proj.years}Y</p>
                  <p className="font-mono font-bold text-emerald-400 text-sm">
                    ₹{proj.benefit.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reality Check */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-xs font-medium mb-1">⚠️ Reality Check</p>
          <p className="text-xs text-muted-foreground">
            {yearlyBenefitAmount < 500 
              ? `The benefit of ₹${yearlyBenefitAmount.toLocaleString('en-IN')}/year is marginal. The complexity of variable allocation may not be worth it. Stick with regular SIP.`
              : yearlyBenefitAmount < 2000
              ? `Modest benefit of ₹${yearlyBenefitAmount.toLocaleString('en-IN')}/year. Consider if the extra effort of variable allocation is worth it for you.`
              : `Meaningful benefit of ₹${yearlyBenefitAmount.toLocaleString('en-IN')}/year. Variable allocation could be worthwhile if you can maintain discipline.`
            }
          </p>
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
            <p className="text-sm font-medium mb-2">Monthly Breakdown: Constant vs Weighted</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {practicalAllocation.map((alloc) => (
                <div key={alloc.month} className="bg-muted/30 rounded p-2 text-center">
                  <p className="font-medium">{alloc.month.slice(0, 3)}</p>
                  <p className="text-muted-foreground line-through">₹{alloc.linearAmount.toLocaleString('en-IN')}</p>
                  <p className="font-mono text-primary">₹{alloc.weightedAmount.toLocaleString('en-IN')}</p>
                  <p className={`text-xs ${alloc.difference > 0 ? 'text-emerald-400' : alloc.difference < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {alloc.difference > 0 ? '+' : ''}{alloc.difference.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Total yearly investment remains the same: ₹{yearlyAmount.toLocaleString('en-IN')}
            </p>
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
