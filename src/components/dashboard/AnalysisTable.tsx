import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CopyableWrapper } from './CopyableWrapper';
import type { FundAnalysis, AnalysisBucket } from '@/types/mutualFund';

interface AnalysisTableProps {
  analysis: FundAnalysis | null;
}

function BucketTable({ data, keyHeader = 'Key' }: { data: AnalysisBucket[]; keyHeader?: string }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data available</p>;
  }

  // Sort by rank for display
  const sortedData = [...data].sort((a, b) => a.rank - b.rank);

  // Prepare copyable data
  const copyData = sortedData.map((b) => ({
    Rank: b.rank,
    [keyHeader]: b.label,
    'Avg Deviation (%)': b.avgDeviation,
    'Min Deviation (%)': b.minDeviation,
    'Max Deviation (%)': b.maxDeviation,
    'Volatility (%)': b.volatility,
    Samples: b.samples,
    Confidence: b.significance,
  }));

  return (
    <CopyableWrapper data={copyData} label={`${keyHeader} Analysis`}>
      <div className="max-h-96 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>{keyHeader}</TableHead>
              <TableHead className="text-right">Avg Deviation</TableHead>
              <TableHead className="text-right">Range</TableHead>
              <TableHead className="text-right">Volatility</TableHead>
              <TableHead className="text-right">Samples</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((bucket) => (
              <TableRow 
                key={bucket.key} 
                className={bucket.rank === 1 ? 'bg-green-500/10' : bucket.rank === sortedData.length ? 'bg-red-500/10' : ''}
              >
                <TableCell className="font-medium">#{bucket.rank}</TableCell>
                <TableCell className="font-medium">{bucket.label}</TableCell>
                <TableCell className={`text-right font-mono ${bucket.avgDeviation < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {bucket.avgDeviation > 0 ? '+' : ''}{bucket.avgDeviation.toFixed(4)}%
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {bucket.minDeviation.toFixed(2)}% to {bucket.maxDeviation.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{bucket.volatility.toFixed(2)}%</TableCell>
                <TableCell className="text-right text-muted-foreground">{bucket.samples}</TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant={bucket.significance === 'high' ? 'default' : bucket.significance === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {bucket.significance}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CopyableWrapper>
  );
}

export function AnalysisTable({ analysis }: AnalysisTableProps) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Run analysis to see detailed data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Detailed Analysis</CardTitle>
        <p className="text-xs text-muted-foreground">
          Sorted by rank (best to worst). Negative deviation = NAV below average = better for buying.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="weekday">Weekday</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
          </TabsList>
          <TabsContent value="day" className="mt-4">
            <BucketTable data={analysis.dayOfMonth} keyHeader="Day of Month" />
          </TabsContent>
          <TabsContent value="weekday" className="mt-4">
            <BucketTable data={analysis.dayOfWeek} keyHeader="Weekday" />
          </TabsContent>
          <TabsContent value="week" className="mt-4">
            <BucketTable data={analysis.weekOfMonth} keyHeader="Week" />
          </TabsContent>
          <TabsContent value="month" className="mt-4">
            <BucketTable data={analysis.monthOfYear} keyHeader="Month" />
          </TabsContent>
          <TabsContent value="quarter" className="mt-4">
            <BucketTable data={analysis.quarterOfYear} keyHeader="Quarter" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
