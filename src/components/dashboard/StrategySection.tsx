import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';
import type { TimeframeWeights } from '@/types/strategy';
import { OptimalEntryCard } from './OptimalEntryCard';
import { DistributionStrategyCard } from './DistributionStrategyCard';
import { TimeframeWeightsInput } from './TimeframeWeightsInput';
import { useStrategyAnalysis } from '@/hooks/useStrategyAnalysis';
import { FUNDS } from '@/types/mutualFund';
import { DEFAULT_TIMEFRAME_WEIGHTS } from '@/services/strategyService';

interface StrategySectionProps {
  multiAnalysis: Map<number, MultiTimeframeAnalysis>;
  selectedFund: number | 'all';
}

export function StrategySection({ multiAnalysis, selectedFund }: StrategySectionProps) {
  const [weights, setWeights] = useState<TimeframeWeights>(DEFAULT_TIMEFRAME_WEIGHTS);
  
  // Get the current fund's multi-timeframe analysis
  const currentFundCode = selectedFund === 'all' ? FUNDS[0].code : selectedFund;
  const currentMultiAnalysis = multiAnalysis.get(currentFundCode) || null;
  
  const { optimalEntry, distributionStrategy } = useStrategyAnalysis(currentMultiAnalysis, weights);
  
  const fundName = currentMultiAnalysis?.fundName || 'Selected Fund';

  if (multiAnalysis.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Investment Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Fetch data to see optimal entry points and distribution strategies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Investment Strategy</h2>
          <p className="text-sm text-muted-foreground">
            Optimized recommendations for {fundName} based on multi-timeframe analysis
          </p>
        </div>
      </div>
      
      <TimeframeWeightsInput weights={weights} onChange={setWeights} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimalEntryCard analysis={optimalEntry} />
        <DistributionStrategyCard strategy={distributionStrategy} />
      </div>
    </div>
  );
}
