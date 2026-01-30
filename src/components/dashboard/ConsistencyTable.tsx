import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { CopyableWrapper } from './CopyableWrapper';
import type { FactorConsistency } from '@/types/multiTimeframeAnalysis';
import { TIMEFRAMES } from '@/types/mutualFund';

interface ConsistencyTableProps {
  data: FactorConsistency[];
  fundName?: string;
}

export function ConsistencyTable({ data, fundName }: ConsistencyTableProps) {
  if (data.length === 0) {
    return null;
  }

  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    };
    return (
      <Badge variant={variants[confidence]} className="text-xs">
        {confidence}
      </Badge>
    );
  };

  // Prepare copyable data
  const copyData = data.map((row) => {
    const rowData: Record<string, string | undefined> = {
      Factor: row.factor,
    };
    TIMEFRAMES.forEach((tf) => {
      rowData[tf.value] = row.bestByTimeframe[tf.value] || '—';
    });
    rowData['Consensus'] = row.consensusBest || '—';
    rowData['Confidence'] = row.confidence;
    return rowData;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Cross-Timeframe Consistency
          {fundName && <span className="text-muted-foreground font-normal">— {fundName}</span>}
        </CardTitle>
        <CardDescription className="text-xs">
          Shows if the best option for each factor is consistent across all time periods. 
          High confidence means the pattern is reliable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CopyableWrapper data={copyData} label="Consistency Analysis">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Factor</TableHead>
                  {TIMEFRAMES.map(tf => (
                    <TableHead key={tf.value} className="text-center min-w-[80px]">
                      {tf.value}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Consensus</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const allMatch = row.isConsistent;
                  return (
                    <TableRow key={row.factor}>
                      <TableCell className="font-medium">{row.factor}</TableCell>
                      {TIMEFRAMES.map(tf => {
                        const value = row.bestByTimeframe[tf.value];
                        const isConsensus = value === row.consensusBest;
                        return (
                          <TableCell 
                            key={tf.value} 
                            className={`text-center text-sm ${
                              !value 
                                ? 'text-muted-foreground' 
                                : isConsensus 
                                  ? 'font-medium text-green-600 dark:text-green-400' 
                                  : ''
                            }`}
                          >
                            {value || '—'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getConfidenceIcon(row.confidence)}
                          <span className="font-medium">{row.consensusBest || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getConfidenceBadge(row.confidence)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CopyableWrapper>
      </CardContent>
    </Card>
  );
}
