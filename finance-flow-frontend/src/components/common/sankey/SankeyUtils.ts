import { FINANCE_COLORS } from './SankeyConstants';

export const getNodeColor = (category: string): string => {
  switch (category) {
    case 'income': return FINANCE_COLORS.income;
    case 'expense': return FINANCE_COLORS.expense;
    case 'savings': return FINANCE_COLORS.savings;
    default: return FINANCE_COLORS.default;
  }
};

export const getLinkColor = (category: string): string => {
  const baseColor = getNodeColor(category);
  return baseColor + '80'; // Add 50% opacity
};