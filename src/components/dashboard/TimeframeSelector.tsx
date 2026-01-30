import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Timeframe } from '@/types/mutualFund';
import { TIMEFRAMES } from '@/types/mutualFund';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
  disabled?: boolean;
}

export function TimeframeSelector({ value, onChange, disabled }: TimeframeSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Timeframe)}>
      <TabsList className="grid grid-cols-4 w-fit">
        {TIMEFRAMES.map((tf) => (
          <TabsTrigger key={tf.value} value={tf.value} disabled={disabled}>
            {tf.value}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
