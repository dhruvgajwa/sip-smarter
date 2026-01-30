import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, IndianRupee } from 'lucide-react';
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
  const [baseAmount, setBaseAmount] = useState<number>(10000);
  
  // Get the current fund's multi-timeframe analysis
  const currentFundCode = selectedFund === 'all' ? FUNDS[0].code : selectedFund;
  const currentMultiAnalysis = multiAnalysis.get(currentFundCode) || null;
  
  const { optimalEntry, distributionStrategy } = useStrategyAnalysis(currentMultiAnalysis, weights);
  
  const fundName = currentMultiAnalysis?.fundName || 'Selected Fund';

  const handleBaseAmountChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num >= 0 && num <= 10000000) {
      setBaseAmount(num);
    } else if (value === '') {
      setBaseAmount(0);
    }
  };

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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimeframeWeightsInput weights={weights} onChange={setWeights} />
        
        <Card className="bg-muted/30 border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Monthly Base Amount</Label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">₹</span>
              <Input
                type="text"
                value={baseAmount.toLocaleString('en-IN')}
                onChange={(e) => handleBaseAmountChange(e.target.value)}
                className="font-mono text-lg"
                placeholder="10,000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your planned monthly SIP amount. Distribution percentages will be applied to this base.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimalEntryCard analysis={optimalEntry} />
        <DistributionStrategyCard strategy={distributionStrategy} baseAmount={baseAmount} />
      </div>
    </div>
  );
}
