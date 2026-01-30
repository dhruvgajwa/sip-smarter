import { useState } from 'react';
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
      <div className="text-muted-foreground text-sm">
        Fetch data to see monthly distribution strategies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TimeframeWeightsInput weights={weights} onChange={setWeights} />
        
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs font-medium">Monthly Base Amount</Label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">₹</span>
            <Input
              type="text"
              value={baseAmount.toLocaleString('en-IN')}
              onChange={(e) => handleBaseAmountChange(e.target.value)}
              className="font-mono h-8 text-sm"
              placeholder="10,000"
            />
          </div>
        </div>
      </div>
      
      {/* Distribution Strategy Analysis */}
      <DistributionStrategyCard strategy={distributionStrategy} baseAmount={baseAmount} />
    </div>
  );
}
