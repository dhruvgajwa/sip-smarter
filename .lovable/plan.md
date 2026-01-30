# 📊 Mutual Fund SIP Timing Analyzer Dashboard

## Overview
A comprehensive analytical dashboard that fetches NAV data from 3 Indian mutual funds and provides detailed insights through charts, statistics, and recommendations to determine optimal SIP investment timing.

---

## 🎯 Dashboard Features

### Analysis Methodology (CORRECTED v2)

**Problem with raw NAV comparison:**
Comparing raw NAV values across time is meaningless because funds grow over time. A NAV of ₹50 in 2020 vs ₹100 in 2024 cannot be meaningfully compared.

**Solution: Normalized Deviation Analysis**
1. Calculate the **30-day moving average** for each data point
2. Measure the **% deviation** of each NAV from its moving average
3. Group these normalized deviations by timing factor
4. **Negative deviation = NAV below average = GOOD for buying**
5. **Positive deviation = NAV above average = BAD for buying**

### Timing Factors Analyzed
1. **Day of Month (1-31)** - Which calendar day has historically lower NAV?
2. **Week of Month (1-5)** - Week 1 (days 1-7), Week 2 (days 8-14), etc.
3. **Day of Week (Mon-Fri)** - Which weekday is cheapest?
4. **Month of Year (Jan-Dec)** - Seasonal patterns
5. **Quarter (Q1-Q4)** - Broader market cycles

### Multi-Timeframe Analysis
- **1 Year** - Recent short-term patterns
- **3 Years** - Medium-term trends (default)
- **5 Years** - Long-term patterns
- **10 Years** - Historical full-cycle analysis

### Funds to Analyze
- HDFC Flexi Cap Fund (101762)
- Parag Parikh Flexi Cap Fund (122640)  
- Bandhan Small Cap Fund (147944)

---

## 📈 Chart Design (Tufte Principles)

All charts follow Edward Tufte's data visualization principles:

1. **High data-ink ratio** - Minimal chartjunk, focus on data
2. **Clear color coding**:
   - 🟢 Green = Negative deviation (below average = GOOD for buying)
   - 🔴 Red = Positive deviation (above average = BAD for buying)
   - 🟡 Yellow = Near zero (neutral)
3. **Reference line at 0** - Shows the average baseline
4. **Informative tooltips** - Show deviation %, samples, rank
5. **Context in headers** - Best/worst clearly labeled
6. **Explanatory subtitles** - What the chart means

---

## 🎯 Comprehensive Recommendation Engine

### Weighted Multi-Factor Analysis
Recommendations are based on ALL factors, not just one:

| Factor | Weight | Reasoning |
|--------|--------|-----------|
| Day of Month | 30% | Most actionable for SIP scheduling |
| Week of Month | 25% | Flexible SIP timing within weeks |
| Weekday | 20% | Fine-tuning within a week |
| Month | 15% | Lump sum timing |
| Quarter | 10% | Broad market cycles |

### Confidence Scoring
- **High**: 20+ samples, low volatility, consistent pattern
- **Medium**: 15+ samples
- **Low**: <15 samples or high volatility

### Output Components
1. **Primary Recommendation** - e.g., "Set SIP to 15th of each month"
2. **Secondary Insights** - Weekday preferences, month patterns
3. **Caveats** - Data limitations, minimal differences warning
4. **Methodology Explanation** - How the analysis works

---

## 🛠️ Technical Implementation

### Key Types
```typescript
interface AnalysisBucket {
  avgDeviation: number;  // % deviation from moving average
  minDeviation: number;
  maxDeviation: number;
  samples: number;
  rank: number;
  significance: 'high' | 'medium' | 'low';
}

interface ComprehensiveRecommendation {
  signals: TimingSignal[];
  primaryRecommendation: string;
  secondaryRecommendations: string[];
  caveats: string[];
  estimatedAdvantage: number;
  overallConfidence: 'high' | 'medium' | 'low';
}
```

### Services
- `mfApiService.ts` - Fetch and parse NAV data from mfapi.in
- `analysisService.ts` - Normalized deviation calculations + recommendation engine
- `dateUtils.ts` - Date parsing, week-of-month, quarter calculations

### UI Components
- `Dashboard.tsx` - Main layout with fund tabs and timeframe selector
- `TimeframeSelector.tsx` - 1Y/3Y/5Y/10Y toggle
- `FundTabs.tsx` - Fund selector tabs
- `SummaryCards.tsx` - Best day/week/weekday/month + period return
- `NavTrendChart.tsx` - Line chart with moving averages
- `DayAnalysisChart.tsx` - Day 1-31 deviation bar chart
- `WeekAnalysisChart.tsx` - Week 1-5 with day ranges
- `WeekdayChart.tsx` - Mon-Fri patterns
- `MonthAnalysisChart.tsx` - Jan-Dec seasonal patterns
- `QuarterAnalysisChart.tsx` - Q1-Q4 cycles
- `RecommendationCard.tsx` - Comprehensive weighted recommendations
- `AnalysisTable.tsx` - Tabbed detailed data with confidence badges
- `ConsolePanel.tsx` - Analysis progress logs

---

## 📝 How to Read the Charts

1. **Look at the zero line** - Bars below are "good", above are "bad"
2. **Green = Buy zone** - NAV historically below average
3. **Red = Avoid zone** - NAV historically above average
4. **Check the range** - Large ranges mean high volatility
5. **Check samples** - More samples = more reliable
6. **Compare across timeframes** - Consistent patterns are more reliable

---

## 🚀 Implementation Status

1. ✅ Create analysis services - API fetching, date utilities
2. ✅ Build dashboard layout - Header, tabs, grid structure  
3. ✅ Implement timeframe selector - 1Y/3Y/5Y/10Y toggle
4. ✅ Add all chart types - Day, Week, Weekday, Month, Quarter
5. ✅ Fix analysis logic - Normalized deviation instead of raw NAV
6. ✅ Apply Tufte principles - Clean charts, clear color coding
7. ✅ Create comprehensive recommendations - Multi-factor weighted analysis
8. ✅ Add confidence scoring - Based on samples and volatility
9. ✅ Add methodology explanation - How it works section
