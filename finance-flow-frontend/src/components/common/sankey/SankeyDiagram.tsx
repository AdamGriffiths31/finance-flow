import React, { useState } from 'react';
import type { SankeyData } from '@/types/sankey';
import { useSankeyData, useSankeyVisualization, useSankeyDimensions, useSankeyModals } from './hooks';
import { AddNodeModal, EditNodeModal, AddLinkModal, EditLinkModal } from './modals';

interface SankeyDiagramProps {
  /** Sankey diagram data containing nodes and links (optional if loading from API) */
  data?: SankeyData;
  /** Whether to load data from API instead of using provided data */
  loadFromAPI?: boolean;
  /** Whether to enable editing capabilities */
  editable?: boolean;
  /** Callback when data is updated through editing */
  onDataChange?: (data: SankeyData) => void;
  /** Callback when data is reset */
  onDataReset?: () => void;
  /** Whether to show reset button */
  showReset?: boolean;
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
  data: propData,
  loadFromAPI = false,
  editable = false,
  onDataChange,
  onDataReset,
  showReset = false,
  width: propWidth,
  height: propHeight,
  className = '',
}) => {
  // Modal state management
  const {
    showAddNode,
    showEditNode,
    editingNode,
    showAddLink,
    showEditLink,
    editingLink,
    selectedSourceNode,
    openAddNodeModal,
    closeAddNodeModal,
    openEditNodeModal,
    closeEditNodeModal,
    openAddLinkModal,
    closeAddLinkModal,
    openEditLinkModal,
    closeEditLinkModal,
  } = useSankeyModals();

  // Force redraw counter for reset functionality
  const [forceRedrawCounter, setForceRedrawCounter] = useState(0);

  // Data management
  const {
    data,
    loading,
    error,
    handleReset,
    handleAddNode,
    handleEditNode,
    handleAddLink,
    updateLinkValue
  } = useSankeyData({
    propData,
    loadFromAPI,
    editable,
    onDataChange,
    onDataReset
  });

  // Retry handler for error state
  const handleRetry = () => {
    setForceRedrawCounter(prev => prev + 1);
    // Force a data reload by remounting the hook
    if (loadFromAPI) {
      handleReset();
    }
  };

  // Responsive dimensions
  const { containerRef, dimensions } = useSankeyDimensions({
    propWidth,
    propHeight,
    data
  });

  // D3 visualization
  const { svgRef } = useSankeyVisualization({
    data,
    dimensions,
    editable,
    onEditNode: openEditNodeModal,
    onEditLink: openEditLinkModal,
    onAddLink: openAddLinkModal,
    forceRedraw: forceRedrawCounter
  });

  // Modal handlers
  const handleAddNodeComplete = (
    nodeName: string,
    category: 'income' | 'expense' | 'savings',
    value?: number,
    connectTo?: { nodeId: string; amount: number; direction: 'from' | 'to' }
  ) => {
    handleAddNode(nodeName, category, value, connectTo);
    closeAddNodeModal();
  };

  const handleEditNodeComplete = (
    nodeId: string,
    newName: string,
    newCategory: 'income' | 'expense' | 'savings'
  ) => {
    handleEditNode(nodeId, newName, newCategory);
    closeEditNodeModal();
  };

  const handleAddLinkComplete = (sourceId: string, targetId: string, value: number) => {
    handleAddLink(sourceId, targetId, value);
    closeAddLinkModal();
  };

  const handleEditLinkComplete = (sourceId: string, targetId: string, newValue: number) => {
    updateLinkValue(sourceId, targetId, newValue);
    closeEditLinkModal();
  };

  // Custom reset handler that forces a redraw
  const handleCustomReset = async () => {
    await handleReset();
    setForceRedrawCounter(prev => prev + 1);
  };

  // Show loading state
  if (loading) {
    return (
      <div ref={containerRef} className={`sankey-container w-full flex items-center justify-center ${className}`} style={{ height: dimensions.height }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading diagram...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div ref={containerRef} className={`sankey-container w-full flex items-center justify-center ${className}`} style={{ height: dimensions.height }}>
        <div className="text-center text-red-600">
          <p className="text-sm">Error loading diagram: {error}</p>
          <button 
            onClick={handleRetry} 
            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!data || !data.nodes.length) {
    return (
      <div ref={containerRef} className={`sankey-container w-full flex items-center justify-center ${className}`} style={{ height: dimensions.height }}>
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`sankey-container w-full ${className}`}>
      {(showReset || editable) && (
        <div className="flex justify-center items-center mb-3 relative">
          {editable && (
            <button
              onClick={openAddNodeModal}
              disabled={loading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Node
            </button>
          )}
          {showReset && loadFromAPI && (
            <button
              onClick={handleCustomReset}
              disabled={loading}
              className="absolute right-0 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset to Original'}
            </button>
          )}
        </div>
      )}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="sankey-svg block mx-auto"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Modals */}
      {showAddNode && (
        <AddNodeModal
          data={data}
          onAdd={handleAddNodeComplete}
          onClose={closeAddNodeModal}
        />
      )}
      
      {showEditNode && editingNode && (
        <EditNodeModal
          nodeId={editingNode}
          data={data}
          onEdit={handleEditNodeComplete}
          onClose={closeEditNodeModal}
        />
      )}
      
      {showEditLink && editingLink && (
        <EditLinkModal
          sourceId={editingLink.sourceId}
          targetId={editingLink.targetId}
          currentValue={editingLink.currentValue}
          data={data}
          onEdit={handleEditLinkComplete}
          onClose={closeEditLinkModal}
        />
      )}
      
      {showAddLink && selectedSourceNode && (
        <AddLinkModal
          sourceNodeId={selectedSourceNode}
          data={data}
          onAdd={handleAddLinkComplete}
          onClose={closeAddLinkModal}
        />
      )}
    </div>
  );
};