import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CalendarDays, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import type { FundAnalysis } from '@/types/mutualFund';

interface SummaryCardsProps {
  analysis: FundAnalysis | null;
}

export function SummaryCards({ analysis }: SummaryCardsProps) {
  if (!analysis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Best Day',
      value: analysis.bestDay?.label || '-',
      subtext: analysis.bestDay ? `${analysis.bestDay.avgDeviation.toFixed(3)}% below avg` : '',
      icon: Calendar,
      color: 'text-green-500',
    },
    {
      label: 'Best Week',
      value: analysis.bestWeek?.label || '-',
      subtext: analysis.bestWeek ? `${analysis.bestWeek.avgDeviation.toFixed(3)}% below avg` : '',
      icon: CalendarDays,
      color: 'text-blue-500',
    },
    {
      label: 'Best Weekday',
      value: analysis.bestWeekday?.label || '-',
      subtext: analysis.bestWeekday ? `${analysis.bestWeekday.avgDeviation.toFixed(3)}% below avg` : '',
      icon: Clock,
      color: 'text-purple-500',
    },
    {
      label: 'Best Month',
      value: analysis.bestMonth?.label || '-',
      subtext: analysis.bestMonth ? `${analysis.bestMonth.avgDeviation.toFixed(3)}% below avg` : '',
      icon: BarChart3,
      color: 'text-orange-500',
    },
    {
      label: `${analysis.timeframe} Return`,
      value: `${analysis.periodReturn >= 0 ? '+' : ''}${analysis.periodReturn.toFixed(1)}%`,
      subtext: `${analysis.totalSamples} data points`,
      icon: TrendingUp,
      color: analysis.periodReturn >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              {card.label}
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {card.subtext}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
