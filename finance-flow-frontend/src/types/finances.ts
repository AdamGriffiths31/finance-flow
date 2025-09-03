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