import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { LineChartSeries } from '@/types/finances';

interface StackDataPoint {
  date: Date;
  [key: string]: number | Date;
}

type StackedDataPoint = d3.SeriesPoint<StackDataPoint>;

interface StackedAreaChartProps {
  data: LineChartSeries[];
  width?: number;
  height?: number;
  className?: string;
}

interface TooltipData {
  date: Date;
  total: number;
  values: { name: string; value: number; color: string }[];
}

export const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
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

    // Prepare data for stacking
    const dates = data[0]?.data.map(d => d.date) || [];
    const stackData = dates.map(date => {
      const point: StackDataPoint = { date };
      data.forEach(series => {
        const dataPoint = series.data.find(d => d.date.getTime() === date.getTime());
        point[series.name] = dataPoint?.value || 0;
      });
      return point;
    });

    if (!stackData.length) return;

    // Create stack generator
    const stack = d3.stack<StackDataPoint>()
      .keys(data.map(d => d.name))
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(stackData);

    // Get max value for y-scale
    const maxValue = d3.max(stackedData, layer => d3.max(layer, d => d[1])) || 0;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([innerHeight, 0]);

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create area generator
    const area = d3
      .area<StackedDataPoint>()
      .x(d => xScale(d.data.date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat('%b %y')(d as Date))
        .ticks(6)
      )
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `£${(d as number / 1000).toFixed(0)}k`)
        .ticks(6)
      )
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px');

    // Style axis lines
    g.selectAll('.domain, .tick line')
      .style('stroke', '#4B5563')
      .style('stroke-width', 1);

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

    // Draw areas
    stackedData.forEach((layer, index) => {
      const series = data[index];
      g.append('path')
        .datum(layer)
        .attr('fill', series.color)
        .attr('d', area)
        .style('opacity', 0.8)
        .transition()
        .duration(800)
        .style('opacity', 0.8);
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
        const bisect = d3.bisector((d: StackDataPoint) => d.date).left;
        const closestIndex = bisect(stackData, dateAtMouse, 1);
        const d0 = stackData[closestIndex - 1];
        const d1 = stackData[closestIndex];
        
        if (!d0 || !d1) return;
        
        const closestPoint = dateAtMouse.getTime() - d0.date.getTime() > d1.date.getTime() - dateAtMouse.getTime() ? d1 : d0;
        
        // Get values for all series at this date
        const tooltipValues = data.map(series => ({
          name: series.name,
          value: (typeof closestPoint[series.name] === 'number' ? closestPoint[series.name] : 0) as number,
          color: series.color,
        }));

        const total = tooltipValues.reduce((sum, item) => sum + item.value, 0);

        setTooltip({
          date: closestPoint.date,
          total,
          values: tooltipValues,
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
        
        // Stop any running transitions
        svg.selectAll('*').interrupt();
        
        // Remove all event listeners from overlay and other elements
        svg.selectAll('rect')
          .on('mousemove', null)
          .on('mouseleave', null);
        
        // Clear all transitions and remove elements
        svg.selectAll('*').remove();
        
        // Clear the SVG itself of any remaining event listeners
        svg.on('mousemove', null).on('mouseleave', null);
      }
      
      // Reset state
      setTooltip(null);
      setMousePosition({ x: 0, y: 0 });
    };
  }, [data, width, height]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: 'numeric',
    });
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
              className="w-4 h-3"
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
                <span className="text-sm font-medium">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(tooltip.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};