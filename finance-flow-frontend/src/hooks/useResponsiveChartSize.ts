import { useState, useEffect } from 'react';

interface ChartDimensions {
  width: number;
  height: number;
}

interface ResponsiveChartOptions {
  maxWidth: number;
  aspectRatio: number;
  minWidth?: number;
  padding?: number;
}

export const useResponsiveChartSize = ({
  maxWidth,
  aspectRatio,
  minWidth = 280,
  padding = 40,
}: ResponsiveChartOptions): ChartDimensions => {
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: maxWidth,
    height: maxWidth / aspectRatio,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window === 'undefined') return;

      const screenWidth = window.innerWidth;
      let chartWidth = maxWidth;

      if (screenWidth < 640) {
        // Mobile: use almost full width minus padding
        chartWidth = Math.max(minWidth, screenWidth - padding);
      } else if (screenWidth < 1024) {
        // Tablet: use container width
        chartWidth = Math.min(maxWidth * 0.8, screenWidth - padding * 2);
      } else {
        // Desktop: use max width
        chartWidth = maxWidth;
      }

      const chartHeight = chartWidth / aspectRatio;

      setDimensions({ width: chartWidth, height: chartHeight });
    };

    // Set initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, [maxWidth, aspectRatio, minWidth, padding]);

  return dimensions;
};