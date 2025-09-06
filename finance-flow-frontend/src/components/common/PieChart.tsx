import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { FinanceCategory, PieChartData } from '@/types/finances';

interface PieChartProps {
  data: FinanceCategory[];
  width?: number;
  height?: number;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 400,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<PieChartData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || !data.length) return;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const pieData: PieChartData[] = data.map(d => ({
      ...d,
      percentage: (d.value / total) * 100,
    }));

    const pie = d3
      .pie<PieChartData>()
      .value(d => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<PieChartData>>()
      .innerRadius(0)
      .outerRadius(radius * 0.8);

    const hoverArc = d3
      .arc<d3.PieArcDatum<PieChartData>>()
      .innerRadius(0)
      .outerRadius(radius * 0.85);

    const g = svg
      .append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    const slices = g
      .selectAll('.slice')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'slice');

    slices
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', hoverArc(d) as string);
        
        setHoveredSlice(d.data);
        setMousePosition({ x: event.clientX, y: event.clientY });
      })
      .on('mousemove', function(event) {
        setMousePosition({ x: event.clientX, y: event.clientY });
      })
      .on('mouseleave', function(_, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc(d) as string);
        
        setHoveredSlice(null);
      });

    // Add percentage labels
    slices
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(1)}%` : '');

    // Cleanup function to prevent memory leaks
    return () => {
      if (svgElement) {
        const svg = d3.select(svgElement);
        
        // Stop any running transitions
        svg.selectAll('*').interrupt();
        
        // Remove all event listeners before removing elements
        svg.selectAll('path')
          .on('mouseenter', null)
          .on('mousemove', null)
          .on('mouseleave', null);
        
        // Clear all selections and remove elements
        svg.selectAll('*').remove();
        
        // Clear the SVG itself
        svg.on('mousemove', null).on('mouseleave', null);
      }
      
      // Reset state
      setHoveredSlice(null);
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

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
      
      {/* Legend */}
      <div className="mt-4 flex flex-col items-center space-y-2 text-sm">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-3">
            <div
              className="flex-shrink-0"
              style={{ 
                backgroundColor: item.color,
                width: '16px',
                height: '16px',
                borderRadius: '2px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
            <span className="text-gray-300">{item.category}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredSlice && (
        <div
          className="fixed z-50 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">{hoveredSlice.category}</div>
          <div className="text-sm">
            {formatCurrency(hoveredSlice.value)} ({hoveredSlice.percentage.toFixed(1)}%)
          </div>
        </div>
      )}
    </div>
  );
};