import { Annotation } from '@langchain/langgraph'

export interface MonthlyBreakdown {
  month: string
  predicted: number
  scenario: 'base' | 'optimistic' | 'conservative'
}

export interface CashflowGap {
  month: string
  gap: number
  severity: 'critical' | 'warning'
}

export const RevenueForecastAnnotation = Annotation.Root({
  // Pipeline metrics (computed)
  activePipelineCount: Annotation<number>,
  totalPipeline: Annotation<number>,
  weightedForecast: Annotation<number>,
  historicalWinRate: Annotation<number>,
  avgDealValue: Annotation<number>,
  avgSalesCycleDays: Annotation<number>,
  momGrowthRate: Annotation<number>,
  staleDeals: Annotation<any[]>,
  staleDealCount: Annotation<number>,

  // AI Forecast output
  forecast90Day: Annotation<number>,
  confidenceRange: Annotation<{ low: number; high: number }>,
  confidenceLevel: Annotation<'high' | 'medium' | 'low'>,
  monthlyBreakdown: Annotation<MonthlyBreakdown[]>,
  cashflowGaps: Annotation<CashflowGap[]>,
  topRisks: Annotation<string[]>,
  topOpportunities: Annotation<string[]>,
  recommendedActions: Annotation<string[]>,
  forecastSummary: Annotation<string>,

  // Output
  savedToDb: Annotation<boolean>,
  alertSent: Annotation<boolean>,
  emailSent: Annotation<boolean>,
  error: Annotation<string | null>,
})

export type RevenueForecastState = typeof RevenueForecastAnnotation.State
