import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingDown, Calendar, Clock, BarChart3 } from 'lucide-react';
import type { FundAnalysis } from '@/types/mutualFund';

interface RecommendationCardProps {
  analysis: FundAnalysis | null;
}

export function RecommendationCard({ analysis }: RecommendationCardProps) {
  if (!analysis) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Run analysis to see recommendations
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = [
    {
      icon: Calendar,
      primary: `Best day: ${analysis.bestDay?.label}`,
      secondary: `${analysis.worstDay?.vsBest?.toFixed(2)}% potential savings vs worst day`,
    },
    {
      icon: Clock,
      primary: `Best weekday: ${analysis.bestWeekday?.label}`,
      secondary: `${analysis.worstWeekday?.vsBest?.toFixed(2)}% potential savings vs worst weekday`,
    },
    {
      icon: TrendingDown,
      primary: `Best week: ${analysis.bestWeek?.label}`,
      secondary: `${analysis.worstWeek?.vsBest?.toFixed(2)}% potential savings vs worst week`,
    },
    {
      icon: BarChart3,
      primary: `Best month: ${analysis.bestMonth?.label}`,
      secondary: `${analysis.worstMonth?.vsBest?.toFixed(2)}% potential savings vs worst month`,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          SIP Timing Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3">
            <rec.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{rec.primary}</p>
              <p className="text-sm text-muted-foreground">{rec.secondary}</p>
            </div>
          </div>
        ))}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Based on {analysis.totalSamples} data points over {analysis.timeframe} period.
            Patterns may vary in actual market conditions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
