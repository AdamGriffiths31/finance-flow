import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { SankeyData, D3SankeyNode, D3SankeyLink } from '@/types/sankey';
import { DEFAULT_DIMENSIONS } from '../SankeyConstants';
import { getNodeColor, getLinkColor } from '../SankeyUtils';

interface UseSankeyVisualizationProps {
  data: SankeyData | null;
  dimensions: { width: number; height: number };
  editable?: boolean;
  onEditNode?: (nodeId: string) => void;
  onEditLink?: (sourceId: string, targetId: string, currentValue: number) => void;
  onAddLink?: (sourceId: string) => void;
  forceRedraw?: number; // Increment this to force a full redraw
}

export const useSankeyVisualization = ({
  data,
  dimensions,
  editable = false,
  onEditNode,
  onEditLink,
  onAddLink,
  forceRedraw = 0
}: UseSankeyVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const lastDataRef = useRef<SankeyData | null>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const lastForceRedrawRef = useRef<number>(0);


  // Memoize whether we need a full redraw or can use incremental updates
  const needsFullRedraw = useMemo(() => {
    if (!lastDataRef.current || !lastDimensionsRef.current) return true;
    if (!data) return false;
    
    // Check if dimensions changed significantly
    const dimensionsChanged = 
      Math.abs(dimensions.width - lastDimensionsRef.current.width) > 1 ||
      Math.abs(dimensions.height - lastDimensionsRef.current.height) > 1;
    
    // Check if structure changed (different number of nodes/links)
    const structureChanged = 
      data.nodes.length !== lastDataRef.current.nodes.length ||
      data.links.length !== lastDataRef.current.links.length;
    
    // Check if data content changed significantly (node IDs or link connections)
    const nodeIdsChanged = !data.nodes.every(node => 
      lastDataRef.current!.nodes.some(lastNode => lastNode.id === node.id)
    );
    const linkConnectionsChanged = !data.links.every(link => 
      lastDataRef.current!.links.some(lastLink => 
        lastLink.source === link.source && lastLink.target === link.target
      )
    );
    
    // Check if forceRedraw was incremented
    const forceRedrawChanged = forceRedraw !== lastForceRedrawRef.current;
    
    const needsRedraw = dimensionsChanged || structureChanged || nodeIdsChanged || linkConnectionsChanged || forceRedrawChanged;
    
    return needsRedraw;
  }, [data, dimensions, forceRedraw]);

  useEffect(() => {
    // Early validation
    if (!svgRef.current) {
      console.warn('SankeyDiagram: SVG ref not available');
      return;
    }
    
    if (!data || !data.nodes.length || !data.links.length) {
      console.warn('SankeyDiagram: Invalid or empty data provided');
      if (containerRef.current) {
        containerRef.current.selectAll('*').remove();
      }
      // Reset refs to ensure next valid data triggers a full redraw
      lastDataRef.current = null;
      lastDimensionsRef.current = null;
      return;
    }

    const svg = d3.select(svgRef.current);
    
    // Only clear and recreate if we need a full redraw
    if (needsFullRedraw) {
      svg.selectAll('*').remove();
      containerRef.current = null;
    }
    
    // Create container if it doesn't exist
    if (!containerRef.current) {
      containerRef.current = svg.append('g')
        .attr('transform', `translate(${DEFAULT_DIMENSIONS.margin.left},${DEFAULT_DIMENSIONS.margin.top})`);
    }


    const { width, height } = dimensions;
    const { margin, nodeWidth, nodePadding } = DEFAULT_DIMENSIONS;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = containerRef.current!;

    // Create sankey generator with dynamic padding
    const dynamicNodePadding = Math.max(5, Math.min(nodePadding, innerHeight / (data.nodes.length * 2)));
    const sankeyGenerator = sankey<D3SankeyNode, D3SankeyLink>()
      .nodeId((d: D3SankeyNode) => d.id)
      .nodeWidth(nodeWidth)
      .nodePadding(dynamicNodePadding)
      .extent([
        [1, 1],
        [innerWidth - 1, innerHeight - 5],
      ]);

    // Process the data
    const sankeyData = sankeyGenerator({
      nodes: data.nodes.map((d) => ({ ...d })) as D3SankeyNode[],
      links: data.links.map((d) => ({ ...d })) as unknown as D3SankeyLink[],
    }) as { nodes: D3SankeyNode[]; links: D3SankeyLink[] };

    // Draw links with enter/update/exit pattern
    let linksContainer = g.select('.links');
    if (linksContainer.empty()) {
      linksContainer = g.append('g').attr('class', 'links');
    }
    
    const linksSelection = linksContainer
      .selectAll('path')
      .data(sankeyData.links, (d: D3SankeyLink) => `${d.source.id}-${d.target.id}`);
    
    // Remove old links
    linksSelection.exit().remove();
    
    // Update existing links and add new ones
    const linksEnter = linksSelection
      .enter()
      .append('path');
    
    const linksMerged = linksEnter.merge(linksSelection)
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: D3SankeyLink) => {
        // Use source node's category for link color
        const sourceCategory = d.source.category || 'default';
        return getLinkColor(sourceCategory);
      })
      .attr('stroke-width', (d: D3SankeyLink) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.7)
      .style('cursor', editable ? 'pointer' : 'default');
    
    if (editable) {
      linksMerged.on('click', function (event: MouseEvent, d: D3SankeyLink) {
        event.stopPropagation();
        onEditLink?.(d.source.id, d.target.id, d.value);
      });
    }

    // Draw nodes with enter/update/exit pattern
    let nodesContainer = g.select('.nodes');
    if (nodesContainer.empty()) {
      nodesContainer = g.append('g').attr('class', 'nodes');
    }
    
    const nodesSelection = nodesContainer
      .selectAll('rect')
      .data(sankeyData.nodes, (d: D3SankeyNode) => d.id);
    
    // Remove old nodes
    nodesSelection.exit().remove();
    
    // Update existing nodes and add new ones
    const nodesEnter = nodesSelection
      .enter()
      .append('rect');
    
    const nodesMerged = nodesEnter.merge(nodesSelection)
      .attr('x', (d: D3SankeyNode) => d.x0)
      .attr('y', (d: D3SankeyNode) => d.y0)
      .attr('width', (d: D3SankeyNode) => d.x1 - d.x0)
      .attr('height', (d: D3SankeyNode) => d.y1 - d.y0)
      .attr('fill', (d: D3SankeyNode) => getNodeColor(d.category || 'default'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', editable ? 'pointer' : 'default');
    
    if (editable) {
      nodesMerged
        .on('click', function (event: MouseEvent, d: D3SankeyNode) {
          event.stopPropagation();
          onEditNode?.(d.id);
        })
        .on('contextmenu', function (event: MouseEvent, d: D3SankeyNode) {
          event.preventDefault();
          event.stopPropagation();
          onAddLink?.(d.id);
        });
    }

    // Add node labels with enter/update/exit pattern
    let labelsContainer = g.select('.node-labels');
    if (labelsContainer.empty()) {
      labelsContainer = g.append('g').attr('class', 'node-labels');
    }
    
    const labelsSelection = labelsContainer
      .selectAll('text')
      .data(sankeyData.nodes, (d: D3SankeyNode) => d.id);
    
    // Remove old labels
    labelsSelection.exit().remove();
    
    // Update existing labels and add new ones
    const labelsEnter = labelsSelection
      .enter()
      .append('text');
    
    labelsEnter.merge(labelsSelection)
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
      .text((d: D3SankeyNode) => {
        const value = d.value ? ` $${d.value.toLocaleString()}` : '';
        return `${d.name}${value}`;
      });

    // Update refs to track current state for next render
    lastDataRef.current = data;
    lastDimensionsRef.current = dimensions;
    lastForceRedrawRef.current = forceRedraw;
  }, [data, dimensions, editable, onEditNode, onEditLink, onAddLink, needsFullRedraw, forceRedraw]);


  return { svgRef };
};