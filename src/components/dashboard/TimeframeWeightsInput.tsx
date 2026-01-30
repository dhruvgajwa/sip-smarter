import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import type { TimeframeWeights } from '@/types/strategy';
import { TIMEFRAMES } from '@/types/mutualFund';
import { WEIGHT_PRESETS } from '@/services/strategyService';

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

  const applyPreset = (presetKey: string) => {
    const preset = WEIGHT_PRESETS[presetKey];
    if (preset) {
      onChange(preset.weights);
    }
  };

  // Check which preset matches current weights
  const activePreset = Object.entries(WEIGHT_PRESETS).find(([_, preset]) => 
    Object.entries(preset.weights).every(([tf, w]) => 
      Math.abs(weights[tf as keyof TimeframeWeights] - w) < 0.01
    )
  )?.[0];

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

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(WEIGHT_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant={activePreset === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset(key)}
              className="text-xs"
              title={preset.description}
            >
              {preset.label}
            </Button>
          ))}
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
          Long-term holders should weight 5Y/10Y data more heavily. Short-term patterns (1Y) are often noise.
        </p>
      </CardContent>
    </Card>
  );
}
