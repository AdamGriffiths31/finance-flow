export interface SankeyNode {
  id: string;
  name: string;
  category?: string;
  value?: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  category?: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

// D3 Sankey computed node with required positioning properties
export interface D3SankeyNode extends SankeyNode {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  dx?: number;
  dy?: number;
  index?: number;
  depth?: number;
  height?: number;
  sourceLinks?: D3SankeyLink[];
  targetLinks?: D3SankeyLink[];
}

// D3 Sankey computed link with required properties
export interface D3SankeyLink {
  source: D3SankeyNode;
  target: D3SankeyNode;
  value: number;
  width: number;
  y0?: number;
  y1?: number;
  index?: number;
  category?: string;
}

// D3 Sankey layout result
export interface D3SankeyGraph {
  nodes: D3SankeyNode[];
  links: D3SankeyLink[];
}