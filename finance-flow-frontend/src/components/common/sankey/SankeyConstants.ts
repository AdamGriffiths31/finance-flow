export const FINANCE_COLORS = {
  income: '#10b981',     // Green - positive income
  expense: '#ef4444',    // Red - outgoing expenses  
  savings: '#3b82f6',    // Blue - savings/investments
  default: '#6b7280'     // Gray - neutral
} as const;

export const DEFAULT_DIMENSIONS = {
  width: 800,
  height: 600,
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
  nodeWidth: 15,
  nodePadding: 8
} as const;