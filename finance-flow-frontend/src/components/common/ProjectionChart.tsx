import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ProjectionSeries, ProjectionDataPoint } from '@/types/finances';

interface ProjectionChartProps {
  data: ProjectionSeries[];
  width?: number;
  height?: number;
  className?: string;
}

interface TooltipData {
  date: Date;
  values: { name: string; value: number; color: string; isProjected: boolean }[];
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  data,
  width = 800,
  height = 400,
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

    const margin = { top: 20, right: 100, bottom: 80, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Get all dates and values for scales
    const allDates = data[0]?.data.map(d => d.date) || [];
    const allValues = data.flatMap(series => series.data.map(d => d.value));

    if (allDates.length === 0 || allValues.length === 0) return;

    // Find the boundary between historical and projected data
    const projectionStartDate = data[0]?.data.find(d => d.isProjected)?.date;

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

    // Add projection boundary line
    if (projectionStartDate) {
      g.append('line')
        .attr('x1', xScale(projectionStartDate))
        .attr('x2', xScale(projectionStartDate))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .style('stroke', '#FCD34D')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.8);

      // Add label for projection start
      g.append('text')
        .attr('x', xScale(projectionStartDate))
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('fill', '#FCD34D')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Projections');
    }

    // Create line generator
    const line = d3
      .line<ProjectionDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat('%b %y')(d as Date))
        .ticks(8)
      )
      .selectAll('text')
      .style('fill', '#9CA3AF')
      .style('font-size', '12px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `£${(d as number / 1000).toFixed(0)}k`)
        .ticks(8)
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
      .data(xScale.ticks(8))
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('stroke', '#374151')
      .style('stroke-width', 0.5)
      .style('opacity', 0.3);

    g.selectAll('.grid-line-y')
      .data(yScale.ticks(8))
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', '#374151')
      .style('stroke-width', 0.5)
      .style('opacity', 0.3);

    // Draw lines for each series
    data.forEach((series) => {
      // Split data into historical and projected segments
      const historicalData = series.data.filter(d => !d.isProjected);
      const projectedData = series.data.filter(d => d.isProjected);
      
      // Add the last historical point to projected data for continuity
      if (historicalData.length > 0 && projectedData.length > 0) {
        projectedData.unshift(historicalData[historicalData.length - 1]);
      }

      // Draw historical line (solid)
      if (historicalData.length > 1) {
        g.append('path')
          .datum(historicalData)
          .attr('fill', 'none')
          .attr('stroke', series.color)
          .attr('stroke-width', 3)
          .attr('d', line)
          .style('opacity', 0)
          .transition()
          .duration(800)
          .style('opacity', 1);
      }

      // Draw projected line (dashed)
      if (projectedData.length > 1) {
        g.append('path')
          .datum(projectedData)
          .attr('fill', 'none')
          .attr('stroke', series.color)
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '8,5')
          .attr('d', line)
          .style('opacity', 0)
          .transition()
          .delay(400)
          .duration(800)
          .style('opacity', 0.8);
      }

      // Add dots for data points
      g.selectAll(`.dot-${series.name.replace(/\s+/g, '-')}`)
        .data(series.data.filter((_, i) => i % Math.max(1, Math.floor(series.data.length / 20)) === 0))
        .enter()
        .append('circle')
        .attr('class', `dot-${series.name.replace(/\s+/g, '-')}`)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.value))
        .attr('r', 3)
        .attr('fill', series.color)
        .style('opacity', d => d.isProjected ? 0.6 : 0.9)
        .style('stroke', '#1F2937')
        .style('stroke-width', 1);
    });

    // Add invisible overlay for mouse events
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const dateAtMouse = xScale.invert(mouseX);
        
        // Find closest data point across all series
        let closestPoint: ProjectionDataPoint | null = null;
        let minDistance = Infinity;

        data.forEach(series => {
          series.data.forEach((point: ProjectionDataPoint) => {
            const distance = Math.abs(point.date.getTime() - dateAtMouse.getTime());
            if (distance < minDistance) {
              minDistance = distance;
              closestPoint = point;
            }
          });
        });

        if (!closestPoint) return;

        // Get values for all series at this date
        const closestPointDate = (closestPoint as ProjectionDataPoint).date;
        const tooltipValues = data.map(series => {
          const point = series.data.find(p => 
            Math.abs(p.date.getTime() - closestPointDate.getTime()) < 24 * 60 * 60 * 1000 * 15 // Within 15 days
          );
          return {
            name: series.name,
            value: point?.value || 0,
            color: series.color,
            isProjected: point?.isProjected || false,
          };
        }).filter(v => v.value > 0);

        if (tooltipValues.length === 0) return;

        setTooltip({
          date: closestPointDate,
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

    return () => {
      if (svgElement) {
        const svg = d3.select(svgElement);
        svg.selectAll('*').interrupt();
        svg.selectAll('rect').on('mousemove', null).on('mouseleave', null);
        svg.selectAll('*').remove();
        svg.on('mousemove', null).on('mouseleave', null);
      }
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
      <div className="mt-4 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400" />
          <span className="text-gray-300 text-sm">Historical Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400 opacity-80" style={{borderTop: '2px dashed'}} />
          <span className="text-gray-300 text-sm">Projected Data</span>
        </div>
        {data.map((series) => (
          <div key={series.name} className="flex items-center gap-2">
            <div
              className="w-3 h-0.5"
              style={{ backgroundColor: series.color }}
            />
            <span className="text-gray-300 text-sm">
              {series.name} ({(series.growthRate * 100).toFixed(1)}% annual)
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none min-w-56"
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
                  <span className="text-sm">
                    {item.name}
                    {item.isProjected && (
                      <span className="text-yellow-400 ml-1 text-xs">(proj.)</span>
                    )}
                  </span>
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