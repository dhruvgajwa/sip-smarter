import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, TrendingDown, AlertTriangle, CheckCircle2, Info, Target, Calendar, Clock, BarChart3 } from 'lucide-react';
import { CopyableWrapper } from './CopyableWrapper';
import type { FundAnalysis, ComprehensiveRecommendation, TimingSignal } from '@/types/mutualFund';
import { generateComprehensiveRecommendation } from '@/services/analysisService';
import { format } from 'date-fns';

interface RecommendationCardProps {
  analysis: FundAnalysis | null;
  compact?: boolean;
}

function SignalRow({ signal }: { signal: TimingSignal }) {
  const getIcon = () => {
    switch (signal.factor) {
      case 'Day of Month': return Calendar;
      case 'Week of Month': return BarChart3;
      case 'Weekday': return Clock;
      default: return Target;
    }
  };
  
  const Icon = getIcon();
  
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{signal.factor}</span>
          <Badge 
            variant={signal.confidence === 'high' ? 'default' : signal.confidence === 'medium' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {signal.confidence}
          </Badge>
        </div>
        <p className="text-sm mt-1">
          <span className="text-green-500 font-medium">{signal.bestOption}</span>
          <span className="text-muted-foreground"> is best, </span>
          <span className="text-red-500 font-medium">{signal.worstOption}</span>
          <span className="text-muted-foreground"> is worst</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Difference: {signal.advantage.toFixed(3)} percentage points
        </p>
        <div className="text-xs text-muted-foreground mt-1">
          <span>Top 3: {signal.topThree.join(', ')}</span>
        </div>
      </div>
    </div>
  );
}

export function RecommendationCard({ analysis, compact = false }: RecommendationCardProps) {
  if (!analysis) {
    return compact ? (
      <div className="text-muted-foreground text-sm">Run analysis to see recommendations</div>
    ) : (
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

  const recommendation = generateComprehensiveRecommendation(analysis);

  // Prepare copyable summary
  const copyData = {
    primaryRecommendation: recommendation.primaryRecommendation,
    estimatedAdvantage: `${recommendation.estimatedAdvantage.toFixed(3)}%`,
    overallConfidence: recommendation.overallConfidence,
    secondaryRecommendations: recommendation.secondaryRecommendations,
    signals: recommendation.signals.map(s => ({
      factor: s.factor,
      best: s.bestOption,
      worst: s.worstOption,
      advantage: `${s.advantage.toFixed(3)}%`,
      confidence: s.confidence,
      topThree: s.topThree,
    })),
    caveats: recommendation.caveats,
  };

  // Compact mode: just show primary recommendation
  if (compact) {
    return (
      <CopyableWrapper data={copyData} label="Recommendations">
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-500 text-sm">{recommendation.primaryRecommendation}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ~{recommendation.estimatedAdvantage.toFixed(3)}% advantage • {recommendation.overallConfidence} confidence
                </p>
              </div>
            </div>
          </div>
          
          {recommendation.secondaryRecommendations.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {recommendation.secondaryRecommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CopyableWrapper>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            SIP Timing Recommendations
          </CardTitle>
          <Badge 
            variant={recommendation.overallConfidence === 'high' ? 'default' : recommendation.overallConfidence === 'medium' ? 'secondary' : 'outline'}
          >
            {recommendation.overallConfidence} confidence
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on {recommendation.dataQuality.totalSamples} data points from{' '}
          {format(recommendation.dataQuality.dateRange.start, 'MMM yyyy')} to{' '}
          {format(recommendation.dataQuality.dateRange.end, 'MMM yyyy')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <CopyableWrapper data={copyData} label="Recommendations">
        {/* Primary Recommendation */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-500">{recommendation.primaryRecommendation}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated advantage: {recommendation.estimatedAdvantage.toFixed(3)}% better entry point on average
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Recommendations */}
        {recommendation.secondaryRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Additional Insights
            </h4>
            <ul className="space-y-1">
              {recommendation.secondaryRecommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Signal Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Analysis by Factor (weighted by actionability)
          </h4>
          <div className="space-y-1 divide-y divide-border">
            {recommendation.signals.map((signal, i) => (
              <SignalRow key={i} signal={signal} />
            ))}
          </div>
        </div>

        {/* Caveats */}
        {recommendation.caveats.length > 0 && (
          <>
            <Separator />
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                Important Notes
              </h4>
              <ul className="mt-2 space-y-1">
                {recommendation.caveats.map((caveat, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {caveat}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Methodology Explanation */}
        <div className="pt-2 border-t border-border">
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              How this works ▸
            </summary>
            <div className="mt-2 text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Methodology:</strong> For each trading day, we calculate how much the NAV 
                deviated from its 30-day moving average. This normalizes the data across different 
                time periods (a NAV of ₹50 in 2020 vs ₹100 in 2024 can be meaningfully compared).
              </p>
              <p>
                <strong>Interpretation:</strong> Negative deviation means the NAV was below its 
                recent average — historically a better time to buy. We then group these deviations 
                by day of month, weekday, week, month, and quarter to find patterns.
              </p>
              <p>
                <strong>Confidence:</strong> Based on sample size and consistency of the pattern. 
                More data points + lower volatility = higher confidence.
              </p>
            </div>
          </details>
        </div>
        </CopyableWrapper>
      </CardContent>
    </Card>
  );
}
