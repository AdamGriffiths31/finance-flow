import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { LineChartSeries } from '@/types/finances';

interface GrowthRateChartProps {
  data: LineChartSeries[];
  width?: number;
  height?: number;
  className?: string;
}

interface GrowthRateData {
  date: Date;
  series: { name: string; rate: number; color: string }[];
}

interface TooltipData {
  date: Date;
  values: { name: string; rate: number; color: string }[];
}

export const GrowthRateChart: React.FC<GrowthRateChartProps> = ({
  data,
  width = 600,
  height = 300,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || !data.length) return;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Calculate growth rates
    const growthRateData: GrowthRateData[] = [];
    
    if (data[0] && data[0].data.length > 1) {
      for (let i = 1; i < data[0].data.length; i++) {
        const currentDate = data[0].data[i].date;
        const seriesRates = data.map(series => {
          const currentValue = series.data[i]?.value || 0;
          const previousValue = series.data[i - 1]?.value || 0;
          const rate = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
          
          return {
            name: series.name,
            rate,
            color: series.color,
          };
        });

        growthRateData.push({
          date: currentDate,
          series: seriesRates,
        });
      }
    }

    if (!growthRateData.length) return;

    // Get min/max rates for scale
    const allRates = growthRateData.flatMap(d => d.series.map(s => s.rate));
    const minRate = Math.min(0, d3.min(allRates) || 0);
    const maxRate = Math.max(0, d3.max(allRates) || 0);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(growthRateData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([minRate - 1, maxRate + 1])
      .nice()
      .range([innerHeight, 0]);

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create line generator
    const line = d3
      .line<{ date: Date; rate: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.rate))
      .curve(d3.curveMonotoneX);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%b %y'))
        .ticks(6)
      )
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `${d}%`)
        .ticks(6)
      )
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px');

    // Style axis lines
    g.selectAll('.domain, .tick line')
      .style('stroke', '#4B5563')
      .style('stroke-width', 1);

    // Add zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .style('stroke', '#6B7280')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '3,3');

    // Add grid lines
    g.selectAll('.grid-line-y')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', '#374151')
      .style('stroke-width', 0.5)
      .style('opacity', 0.5);

    // Draw lines for each series
    data.forEach((series) => {
      const seriesData = growthRateData.map(d => ({
        date: d.date,
        rate: d.series.find(s => s.name === series.name)?.rate || 0,
      }));

      g.append('path')
        .datum(seriesData)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', 2)
        .attr('d', line)
        .style('opacity', 0)
        .transition()
        .duration(800)
        .style('opacity', 1);

      // Add dots
      g.selectAll(`.dot-${series.name.replace(/\s+/g, '-')}`)
        .data(seriesData)
        .enter()
        .append('circle')
        .attr('class', `dot-${series.name.replace(/\s+/g, '-')}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.rate))
        .attr('r', 4)
        .attr('fill', series.color)
        .style('opacity', 0)
        .transition()
        .delay(200)
        .duration(600)
        .style('opacity', 1);
    });

    // Add invisible overlay for mouse events
    g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const dateAtMouse = xScale.invert(mouseX);
        
        // Find closest data point
        const bisect = d3.bisector((d: GrowthRateData) => d.date).left;
        const closestIndex = bisect(growthRateData, dateAtMouse, 1);
        const d0 = growthRateData[closestIndex - 1];
        const d1 = growthRateData[closestIndex];
        
        if (!d0 || !d1) return;
        
        const closestPoint = dateAtMouse.getTime() - d0.date.getTime() > d1.date.getTime() - dateAtMouse.getTime() ? d1 : d0;
        
        setTooltip({
          date: closestPoint.date,
          values: closestPoint.series,
        });
        
        setMousePosition({ 
          x: event.clientX, 
          y: event.clientY 
        });
      })
      .on('mouseleave', () => {
        setTooltip(null);
      });

    // Cleanup function to prevent memory leaks
    return () => {
      if (svgElement) {
        const svg = d3.select(svgElement);
        svg.selectAll('*').remove();
        svg.on('mousemove', null);
        svg.on('mouseleave', null);
      }
      setTooltip(null);
    };
  }, [data, width, height]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRate = (rate: number) => {
    return `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {data.map((series) => (
          <div key={series.name} className="flex items-center gap-2">
            <div
              className="w-3 h-0.5"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-gray-300 text-sm">{series.name}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none min-w-48"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)',
          }}
        >
          <div className="font-semibold mb-2 text-center">
            {formatDate(tooltip.date)}
          </div>
          <div className="space-y-1">
            {tooltip.values.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className={`text-sm font-medium ${
                  item.rate > 0 ? 'text-green-400' : item.rate < 0 ? 'text-red-400' : 'text-gray-300'
                }`}>
                  {formatRate(item.rate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};