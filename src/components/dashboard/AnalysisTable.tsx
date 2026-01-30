import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  return (
    <div className="max-h-96 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead>{keyHeader}</TableHead>
            <TableHead className="text-right">Avg NAV</TableHead>
            <TableHead className="text-right">Min</TableHead>
            <TableHead className="text-right">Max</TableHead>
            <TableHead className="text-right">Volatility</TableHead>
            <TableHead className="text-right">Samples</TableHead>
            <TableHead className="text-right">vs Best</TableHead>
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
              <TableCell className="text-right">{bucket.avgNav.toFixed(2)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{bucket.minNav.toFixed(2)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{bucket.maxNav.toFixed(2)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{bucket.volatility.toFixed(2)}%</TableCell>
              <TableCell className="text-right text-muted-foreground">{bucket.samples}</TableCell>
              <TableCell className={`text-right ${bucket.vsBest > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {bucket.vsBest === 0 ? '-' : `+${bucket.vsBest.toFixed(2)}%`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
