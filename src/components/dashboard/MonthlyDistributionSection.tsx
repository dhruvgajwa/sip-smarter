import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee } from 'lucide-react';
import type { MultiTimeframeAnalysis } from '@/types/multiTimeframeAnalysis';
import type { TimeframeWeights } from '@/types/strategy';
import { DistributionStrategyCard } from './DistributionStrategyCard';
import { TimeframeWeightsInput } from './TimeframeWeightsInput';
import { useStrategyAnalysis } from '@/hooks/useStrategyAnalysis';
import { DEFAULT_TIMEFRAME_WEIGHTS } from '@/services/strategyService';

interface MonthlyDistributionSectionProps {
  multiAnalysis: MultiTimeframeAnalysis | null;
}

/**
 * Section for monthly allocation distribution analysis.
 * 
 * This answers: "Should I invest the same amount every month, 
 * or allocate more during months that are historically cheaper?"
 * 
 * This is DIFFERENT from "Best SIP Date" which answers:
 * "Which DAY of the month should I set my SIP?"
 */
export function MonthlyDistributionSection({ multiAnalysis }: MonthlyDistributionSectionProps) {
  const [weights, setWeights] = useState<TimeframeWeights>(DEFAULT_TIMEFRAME_WEIGHTS);
  const [baseAmount, setBaseAmount] = useState<number>(10000);
  
  const { distributionStrategy } = useStrategyAnalysis(multiAnalysis, weights);

  const handleBaseAmountChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num >= 0 && num <= 10000000) {
      setBaseAmount(num);
    } else if (value === '') {
      setBaseAmount(0);
    }
  };

  if (!multiAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Allocation Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Fetch data to see monthly distribution strategies.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
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
              Enter your planned monthly SIP amount. Analysis will show if a weighted distribution makes sense.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Distribution Strategy Analysis */}
      <DistributionStrategyCard strategy={distributionStrategy} baseAmount={baseAmount} />
    </div>
  );
}
