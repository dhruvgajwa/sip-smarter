import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Settings2 } from 'lucide-react';
import type { TimeframeWeights } from '@/types/strategy';
import { TIMEFRAMES } from '@/types/mutualFund';

interface TimeframeWeightsInputProps {
  weights: TimeframeWeights;
  onChange: (weights: TimeframeWeights) => void;
}

export function TimeframeWeightsInput({ weights, onChange }: TimeframeWeightsInputProps) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(totalWeight - 1) < 0.01;

  const handleWeightChange = (tf: keyof TimeframeWeights, value: number) => {
    const newWeights = { ...weights, [tf]: value };
    onChange(newWeights);
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    
    const normalized: TimeframeWeights = {
      '1Y': weights['1Y'] / total,
      '3Y': weights['3Y'] / total,
      '5Y': weights['5Y'] / total,
      '10Y': weights['10Y'] / total,
    };
    onChange(normalized);
  };

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Timeframe Weights</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isValid ? 'text-emerald-400' : 'text-destructive'}`}>
              Total: {(totalWeight * 100).toFixed(0)}%
            </span>
            {!isValid && (
              <button
                onClick={normalizeWeights}
                className="text-xs text-primary hover:underline"
              >
                Normalize
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {TIMEFRAMES.map(({ value: tf, label }) => (
            <div key={tf} className="space-y-2">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[weights[tf] * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([val]) => handleWeightChange(tf, val / 100)}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-10 text-right">
                  {(weights[tf] * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Adjust how much each timeframe influences the recommendation. Higher weight = more importance.
        </p>
      </CardContent>
    </Card>
  );
}
