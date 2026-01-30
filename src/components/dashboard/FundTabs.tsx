import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FUNDS } from '@/types/mutualFund';

interface FundTabsProps {
  selectedFund: number | 'all';
  onSelectFund: (fund: number | 'all') => void;
}

export function FundTabs({ selectedFund, onSelectFund }: FundTabsProps) {
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
