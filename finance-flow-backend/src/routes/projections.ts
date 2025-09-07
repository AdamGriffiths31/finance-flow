import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { handleError } from '../utils/errorHandler';
import { FinancesDataService } from '../services/financesDataService';
import { PROJECTIONS, TIME, ERROR_CODES } from '../constants';

// Zod schemas for validation
const ProjectionConfigSchema = z.object({
  calculationPeriodMonths: z.coerce.number()
    .min(PROJECTIONS.MIN_CALCULATION_PERIOD_MONTHS)
    .max(PROJECTIONS.MAX_CALCULATION_PERIOD_MONTHS)
    .default(PROJECTIONS.DEFAULT_CALCULATION_PERIOD_MONTHS),
  projectionPeriodMonths: z.coerce.number()
    .min(PROJECTIONS.MIN_PROJECTION_PERIOD_MONTHS)
    .max(PROJECTIONS.MAX_PROJECTION_PERIOD_MONTHS)
    .default(PROJECTIONS.DEFAULT_PROJECTION_PERIOD_MONTHS),
});

type ProjectionConfig = z.infer<typeof ProjectionConfigSchema>;

interface HistoryRecord {
  date: string;
  data: Record<string, number>;
}


// Calculate growth rate for a category over a specific period (using linear method with smoothing)
const calculateGrowthRate = (
  values: number[],
  dates: Date[]
): { monthlyRate: number; annualRate: number } => {
  if (values.length < PROJECTIONS.MIN_HISTORY_POINTS_FOR_PROJECTION) {
    return { monthlyRate: 0, annualRate: 0 };
  }

  // For better projections, use average of recent months rather than just start/end
  if (values.length >= PROJECTIONS.MIN_HISTORY_POINTS_FOR_ADVANCED_CALCULATION) {
    // Use linear regression or moving average for more stable growth calculation
    const monthlyGrowths = [];
    
    for (let i = 1; i < values.length; i++) {
      const currentValue = values[i];
      const previousValue = values[i - 1];
      
      if (previousValue > 0) {
        const monthlyGrowth = (currentValue - previousValue) / previousValue;
        // Cap extreme growth rates to reduce impact of one-off deposits
        const cappedGrowth = Math.max(PROJECTIONS.MIN_MONTHLY_GROWTH_RATE, Math.min(PROJECTIONS.MAX_MONTHLY_GROWTH_RATE, monthlyGrowth));
        monthlyGrowths.push(cappedGrowth);
      }
    }
    
    if (monthlyGrowths.length > 0) {
      // Use median instead of mean to reduce impact of outliers
      monthlyGrowths.sort((a, b) => a - b);
      const medianIndex = Math.floor(monthlyGrowths.length / 2);
      const monthlyRate = monthlyGrowths.length % 2 === 0 
        ? (monthlyGrowths[medianIndex - 1] + monthlyGrowths[medianIndex]) / 2
        : monthlyGrowths[medianIndex];
      
      const annualRate = monthlyRate * TIME.MONTHS_PER_YEAR;
      
      return { monthlyRate, annualRate };
    }
  }

  // Fallback to simple start/end calculation for shorter time periods
  const startValue = values[0];
  const endValue = values[values.length - 1];
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  const monthsDiff = (endDate.getTime() - startDate.getTime()) / TIME.MILLISECONDS_PER_MONTH;
  
  if (monthsDiff <= 0 || startValue <= 0) {
    return { monthlyRate: 0, annualRate: 0 };
  }

  // Linear growth rate with cap
  const rawMonthlyRate = (endValue - startValue) / (startValue * monthsDiff);
  const monthlyRate = Math.max(PROJECTIONS.MIN_FALLBACK_MONTHLY_RATE, Math.min(PROJECTIONS.MAX_FALLBACK_MONTHLY_RATE, rawMonthlyRate));
  const annualRate = monthlyRate * TIME.MONTHS_PER_YEAR;

  return {
    monthlyRate,
    annualRate,
  };
};


// Generate projected values (using linear method)
const generateProjections = (
  lastValue: number,
  lastDate: Date,
  monthlyRate: number,
  projectionMonths: number
): Array<{ date: Date; value: number }> => {
  const projections = [];
  
  for (let i = 1; i <= projectionMonths; i++) {
    const projectedDate = new Date(lastDate);
    projectedDate.setMonth(projectedDate.getMonth() + i);
    
    // Linear growth: lastValue * (1 + monthlyRate * i)
    const projectedValue = Math.max(0, lastValue * (1 + monthlyRate * i));
    
    projections.push({
      date: projectedDate,
      value: projectedValue,
    });
  }
  
  return projections;
};

export default (financesService: FinancesDataService) => {
  const router = Router();

  // Main projections endpoint
  router.get('/data', async (req: Request, res: Response): Promise<void> => {
    try {
      const configParams: ProjectionConfig = ProjectionConfigSchema.parse(req.query);
      
      const financesData = await financesService.readFinancesData();
    const { categories, history } = financesData;
    
    if (!history || history.length === 0) {
      res.status(404).json({ error: 'No historical data available', code: ERROR_CODES.NO_DATA });
      return;
    }

    // Filter historical data to the calculation period
    const now = new Date();
    const calculationStartDate = new Date(now.getFullYear(), now.getMonth() - configParams.calculationPeriodMonths, now.getDate());
    
    const filteredHistory = (history as HistoryRecord[])
      .filter((record: HistoryRecord) => new Date(record.date) >= calculationStartDate)
      .sort((a: HistoryRecord, b: HistoryRecord) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (filteredHistory.length < PROJECTIONS.MIN_HISTORY_POINTS_FOR_PROJECTION) {
      res.status(400).json({ error: 'Insufficient historical data', code: ERROR_CODES.INSUFFICIENT_DATA });
      return;
    }

    const growthRates = [];
    const projectionSeries = [];

    // Calculate projections for each category
    for (const category of categories) {
      const categoryValues = filteredHistory.map((record: HistoryRecord) => record.data[category.name] || 0);
      const categoryDates = filteredHistory.map((record: HistoryRecord) => new Date(record.date));
      
      const growthData = calculateGrowthRate(categoryValues, categoryDates);
      
      growthRates.push({
        category: category.name,
        monthlyRate: growthData.monthlyRate,
        annualRate: growthData.annualRate,
      });

      // Combine historical and projected data
      const lastValue = categoryValues[categoryValues.length - 1];
      const lastDate = categoryDates[categoryDates.length - 1];
      
      const historicalData = filteredHistory.map((record: HistoryRecord) => ({
        date: new Date(record.date),
        value: record.data[category.name] || 0,
        isProjected: false,
      }));

      const projectedData = generateProjections(
        lastValue,
        lastDate,
        growthData.monthlyRate,
        configParams.projectionPeriodMonths
      ).map(point => ({
        ...point,
        isProjected: true,
      }));

      projectionSeries.push({
        name: category.name,
        color: category.color,
        data: [...historicalData, ...projectedData],
        growthRate: growthData.annualRate,
      });
    }

    const response = {
      series: projectionSeries,
      growthRates,
      config: configParams,
      generatedAt: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'generateProjections', req.id);
  }
});

  return router;
};