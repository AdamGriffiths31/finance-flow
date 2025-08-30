import { useState, useEffect, useCallback, useRef } from 'react';
import type { SankeyData } from '@/types/sankey';
import { DEFAULT_DIMENSIONS } from '../SankeyConstants';

interface UseSankeyDimensionsProps {
  propWidth?: number;
  propHeight?: number;
  data?: SankeyData | null;
}

export const useSankeyDimensions = ({ propWidth, propHeight, data }: UseSankeyDimensionsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
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
    
    // Dynamic height based on number of nodes
    const nodeCount = data?.nodes.length || 0;
    const minHeight = isMobile ? 400 : 500;
    const calculatedHeight = Math.max(minHeight, nodeCount * 60); // ~60px per node
    const newHeight = propHeight || calculatedHeight;
    
    setDimensions({ width: newWidth, height: newHeight });
  }, [propWidth, propHeight, data]);

  // Set up responsive listener
  useEffect(() => {
    updateDimensions();
    
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  return { containerRef, dimensions };
};