import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { SankeyData, D3SankeyNode, D3SankeyLink } from '@/types/sankey';

/** Finance-themed color palette for different transaction categories */
const FINANCE_COLORS = {
  income: '#10b981',     // Green - positive income
  expense: '#ef4444',    // Red - outgoing expenses  
  savings: '#3b82f6',    // Blue - savings/investments
  default: '#6b7280'     // Gray - neutral
} as const;

/** Default diagram dimensions */
const DEFAULT_DIMENSIONS = {
  width: 800,
  height: 600,
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  nodeWidth: 15,
  nodePadding: 10
} as const;

/**
 * Get the color for a node based on its category
 */
const getNodeColor = (category: string): string => {
  switch (category) {
    case 'income': return FINANCE_COLORS.income;
    case 'expense': return FINANCE_COLORS.expense;
    case 'savings': return FINANCE_COLORS.savings;
    default: return FINANCE_COLORS.default;
  }
};

/**
 * Get the color for a link with transparency based on source category
 */
const getLinkColor = (category: string): string => {
  const baseColor = getNodeColor(category);
  return baseColor + '80'; // Add 50% opacity
};

interface SankeyDiagramProps {
  /** Sankey diagram data containing nodes and links */
  data: SankeyData;
  /** Width of the SVG canvas in pixels */
  width?: number;
  /** Height of the SVG canvas in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Interactive Sankey diagram component for visualizing financial flow data.
 * Features hover tooltips, custom color schemes, and proper memory management.
 */
export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  data,
  width: propWidth,
  height: propHeight,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth || DEFAULT_DIMENSIONS.width,
    height: propHeight || DEFAULT_DIMENSIONS.height
  });

  // Handle responsive sizing
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const isMobile = window.innerWidth < 640;
    
    const newWidth = propWidth || (isMobile 
      ? Math.min(containerWidth - 20, 360) 
      : Math.min(containerWidth - 40, DEFAULT_DIMENSIONS.width)
    );
    
    const newHeight = propHeight || (isMobile ? 400 : DEFAULT_DIMENSIONS.height);
    
    setDimensions({ width: newWidth, height: newHeight });
  }, [propWidth, propHeight]);

  // Set up responsive listener
  useEffect(() => {
    updateDimensions();
    
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  useEffect(() => {
    // Early validation
    if (!svgRef.current) {
      console.warn('SankeyDiagram: SVG ref not available');
      return;
    }
    
    if (!data || !data.nodes.length || !data.links.length) {
      console.warn('SankeyDiagram: Invalid or empty data provided');
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create or reuse tooltip with proper cleanup
    if (!tooltipRef.current) {
      // First, remove any existing tooltips to prevent duplicates
      d3.selectAll('.sankey-tooltip').remove();
      
      tooltipRef.current = d3.select('body')
        .append('div')
        .attr('class', 'sankey-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('opacity', '0')
        .style('visibility', 'hidden');
    }

    const tooltip = tooltipRef.current;

    const showTooltip = (title: string, value: string, event: MouseEvent) => {
      tooltip
        .selectAll('*').remove(); // Clear previous content safely
      
      // Create title element
      tooltip.append('div')
        .style('font-weight', 'bold')
        .style('margin-bottom', '4px')
        .text(title);
      
      // Create value element
      tooltip.append('div')
        .text(value);
      
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .style('opacity', '1')
        .style('visibility', 'visible');
    };

    const hideTooltip = () => {
      tooltip
        .style('opacity', '0')
        .style('visibility', 'hidden');
    };

    const { width, height } = dimensions;
    const { margin, nodeWidth, nodePadding } = DEFAULT_DIMENSIONS;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create sankey generator
    const sankeyGenerator = sankey<D3SankeyNode, D3SankeyLink>()
      .nodeId((d: D3SankeyNode) => d.id)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [1, 1],
        [innerWidth - 1, innerHeight - 5],
      ]);

    // Process the data
    const sankeyData = sankeyGenerator({
      nodes: data.nodes.map((d) => ({ ...d })) as D3SankeyNode[],
      links: data.links.map((d) => ({ ...d })) as D3SankeyLink[],
    }) as { nodes: D3SankeyNode[]; links: D3SankeyLink[] };

    // Draw links
    const links = g
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(sankeyData.links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: D3SankeyLink) => {
        // Use source node's category for link color
        const sourceCategory = d.source.category || 'default';
        return getLinkColor(sourceCategory);
      })
      .attr('stroke-width', (d: D3SankeyLink) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.7)
      .on('mouseover.tooltip', function (event: MouseEvent, d: D3SankeyLink) {
        d3.select(this).attr('opacity', 1);
        showTooltip(`${d.source.name} → ${d.target.name}`, `Value: $${d.value.toLocaleString()}`, event);
      })
      .on('mouseout.tooltip', function () {
        d3.select(this).attr('opacity', 0.7);
        hideTooltip();
      });

    // Draw nodes
    const nodes = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('rect')
      .data(sankeyData.nodes)
      .enter()
      .append('rect')
      .attr('x', (d: D3SankeyNode) => d.x0)
      .attr('y', (d: D3SankeyNode) => d.y0)
      .attr('width', (d: D3SankeyNode) => d.x1 - d.x0)
      .attr('height', (d: D3SankeyNode) => d.y1 - d.y0)
      .attr('fill', (d: D3SankeyNode) => getNodeColor(d.category || 'default'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover.tooltip', function (event: MouseEvent, d: D3SankeyNode) {
        d3.select(this).attr('opacity', 0.8);
        const valueText = d.value ? `$${d.value.toLocaleString()}` : 'N/A';
        showTooltip(d.name, `Total: ${valueText}`, event);
      })
      .on('mouseout.tooltip', function () {
        d3.select(this).attr('opacity', 1);
        hideTooltip();
      });

    // Add node labels
    g.append('g')
      .attr('class', 'node-labels')
      .selectAll('text')
      .data(sankeyData.nodes)
      .enter()
      .append('text')
      .attr('x', (d: D3SankeyNode) => {
        // Position text based on node position
        const nodeWidth = d.x1 - d.x0;
        const nodeCenter = (d.x0 + d.x1) / 2;
        
        // For narrow nodes, position text to the side
        if (nodeWidth < 30) {
          return d.x0 < innerWidth / 2 ? d.x1 + 5 : d.x0 - 5;
        }
        return nodeCenter;
      })
      .attr('y', (d: D3SankeyNode) => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: D3SankeyNode) => {
        const nodeWidth = d.x1 - d.x0;
        if (nodeWidth < 30) {
          return d.x0 < innerWidth / 2 ? 'start' : 'end';
        }
        return 'middle';
      })
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('font-weight', '500')
      .text((d: D3SankeyNode) => d.name);

    // Cleanup function for tooltip and event listeners
    return () => {
      // Hide tooltip and ensure it's properly cleaned up
      if (tooltip) {
        tooltip
          .style('opacity', '0')
          .style('visibility', 'hidden');
        
        // Clear any pending content to prevent memory leaks
        tooltip.selectAll('*').remove();
      }
      
      // Remove all event listeners from SVG elements
      svg.selectAll('*').on('.tooltip', null);
    };
  }, [data, dimensions]);

  // Cleanup tooltip on component unmount
  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        // Ensure tooltip is hidden before removal
        tooltipRef.current
          .style('opacity', '0')
          .style('visibility', 'hidden');
        
        // Clear all content to prevent memory leaks
        tooltipRef.current.selectAll('*').remove();
        
        // Remove tooltip from DOM
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      
      // Clean up any orphaned tooltips as a safety measure
      d3.selectAll('.sankey-tooltip').remove();
    };
  }, []);

  return (
    <div ref={containerRef} className={`sankey-container w-full ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="sankey-svg block mx-auto"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};