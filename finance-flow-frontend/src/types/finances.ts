export interface FinanceCategory {
  category: string;
  value: number;
  color: string;
}

export interface FinancesBreakdownData {
  breakdown: FinanceCategory[];
  total: number;
  lastUpdated: string;
}

export interface PieChartData extends FinanceCategory {
  percentage: number;
}

export interface FinanceHistoryPoint {
  date: string;
  data: Record<string, number>;
}

export interface FinanceCategoryInfo {
  name: string;
  color: string;
}

export interface FinancesHistoryData {
  history: FinanceHistoryPoint[];
  categories: FinanceCategoryInfo[];
}

export interface LineChartDataPoint {
  date: Date;
  value: number;
}

export interface LineChartSeries {
  name: string;
  color: string;
  data: LineChartDataPoint[];
}

export interface FinancesData {
  categories: FinanceCategoryInfo[];
  history: FinanceHistoryPoint[];
  lastUpdated: string;
}

export interface GrowthRate {
  category: string;
  monthlyRate: number;
  annualRate: number;
}

export interface ProjectionDataPoint {
  date: Date;
  value: number;
  isProjected: boolean;
}

export interface ProjectionSeries {
  name: string;
  color: string;
  data: ProjectionDataPoint[];
  growthRate: number;
}

export interface ProjectionConfig {
  calculationPeriodMonths: number;
  projectionPeriodMonths: number;
}

export interface ProjectionData {
  series: ProjectionSeries[];
  growthRates: GrowthRate[];
  config: ProjectionConfig;
  generatedAt: string;
}