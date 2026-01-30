import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FUNDS } from '@/types/mutualFund';

interface FundTabsProps {
  selectedFund: number | 'all';
  onSelectFund: (fund: number | 'all') => void;
  compact?: boolean;
}

export function FundTabs({ selectedFund, onSelectFund, compact = false }: FundTabsProps) {
  // Compact mode: dropdown selector
  if (compact) {
    return (
      <Select 
        value={selectedFund.toString()} 
        onValueChange={(v) => onSelectFund(v === 'all' ? 'all' : parseInt(v))}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Select fund" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Funds</SelectItem>
          {FUNDS.map((fund) => (
            <SelectItem key={fund.code} value={fund.code.toString()}>
              {fund.shortName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Full mode: tabs
  return (
    <Tabs 
      value={selectedFund.toString()} 
      onValueChange={(v) => onSelectFund(v === 'all' ? 'all' : parseInt(v))}
    >
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="all">All Funds</TabsTrigger>
        {FUNDS.map((fund) => (
          <TabsTrigger key={fund.code} value={fund.code.toString()}>
            {fund.shortName}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
