import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { LineChartSeries, LineChartDataPoint } from '@/types/finances';

interface LineChartProps {
  data: LineChartSeries[];
  width?: number;
  height?: number;
  className?: string;
}

interface TooltipData {
  date: Date;
  values: { name: string; value: number; color: string }[];
}

export const LineChart: React.FC<LineChartProps> = ({
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

    // Get all dates and values for scales
    const allDates = data[0]?.data.map(d => d.date) || [];
    const allValues = data.flatMap(series => series.data.map(d => d.value));

    if (allDates.length === 0 || allValues.length === 0) return;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(allDates) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create line generator
    const line = d3
      .line<LineChartDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
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
    g.selectAll('.grid-line-x')
      .data(xScale.ticks(6))
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', '#374151')
      .style('stroke-width', 0.5)
      .style('opacity', 0.5);

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

    // Draw lines
    data.forEach((series) => {
      g.append('path')
        .datum(series.data)
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
        .data(series.data)
        .enter()
        .append('circle')
        .attr('class', `dot-${series.name.replace(/\s+/g, '-')}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
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
        const bisect = d3.bisector((d: LineChartDataPoint) => d.date).left;
        const closestIndex = bisect(data[0].data, dateAtMouse, 1);
        const d0 = data[0].data[closestIndex - 1];
        const d1 = data[0].data[closestIndex];
        
        if (!d0 || !d1) return;
        
        const closestPoint = dateAtMouse.getTime() - d0.date.getTime() > d1.date.getTime() - dateAtMouse.getTime() ? d1 : d0;
        
        // Get values for all series at this date
        const tooltipValues = data.map(series => {
          const point = series.data.find(p => p.date.getTime() === closestPoint.date.getTime());
          return {
            name: series.name,
            value: point?.value || 0,
            color: series.color,
          };
        });

        setTooltip({
          date: closestPoint.date,
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
                <span className="text-sm font-medium">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};