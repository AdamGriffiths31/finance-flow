import { useState, useCallback } from 'react';

export interface ModalState {
  showAddNode: boolean;
  showEditNode: boolean;
  editingNode: string | null;
  showAddLink: boolean;
  showEditLink: boolean;
  editingLink: { sourceId: string; targetId: string; currentValue: number } | null;
  selectedSourceNode: string | null;
}

export interface ModalActions {
  openAddNodeModal: () => void;
  closeAddNodeModal: () => void;
  openEditNodeModal: (nodeId: string) => void;
  closeEditNodeModal: () => void;
  openAddLinkModal: (sourceId: string) => void;
  closeAddLinkModal: () => void;
  openEditLinkModal: (sourceId: string, targetId: string, currentValue: number) => void;
  closeEditLinkModal: () => void;
  resetAllModals: () => void;
}

export interface UseSankeyModalsReturn extends ModalState, ModalActions {}

/**
 * Custom hook to manage all modal states for Sankey diagram editing
 * Extracts modal state management from the main component for better separation of concerns
 */
export const useSankeyModals = (): UseSankeyModalsReturn => {
  // Modal state
  const [showAddNode, setShowAddNode] = useState(false);
  const [showEditNode, setShowEditNode] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showEditLink, setShowEditLink] = useState(false);
  const [editingLink, setEditingLink] = useState<{ sourceId: string; targetId: string; currentValue: number } | null>(null);
  const [selectedSourceNode, setSelectedSourceNode] = useState<string | null>(null);

  // Modal actions
  const openAddNodeModal = useCallback(() => {
    setShowAddNode(true);
  }, []);

  const closeAddNodeModal = useCallback(() => {
    setShowAddNode(false);
  }, []);

  const openEditNodeModal = useCallback((nodeId: string) => {
    setEditingNode(nodeId);
    setShowEditNode(true);
  }, []);

  const closeEditNodeModal = useCallback(() => {
    setShowEditNode(false);
    setEditingNode(null);
  }, []);

  const openAddLinkModal = useCallback((sourceId: string) => {
    setSelectedSourceNode(sourceId);
    setShowAddLink(true);
  }, []);

  const closeAddLinkModal = useCallback(() => {
    setShowAddLink(false);
    setSelectedSourceNode(null);
  }, []);

  const openEditLinkModal = useCallback((sourceId: string, targetId: string, currentValue: number) => {
    setEditingLink({ sourceId, targetId, currentValue });
    setShowEditLink(true);
  }, []);

  const closeEditLinkModal = useCallback(() => {
    setShowEditLink(false);
    setEditingLink(null);
  }, []);

  const resetAllModals = useCallback(() => {
    setShowAddNode(false);
    setShowEditNode(false);
    setEditingNode(null);
    setShowAddLink(false);
    setShowEditLink(false);
    setEditingLink(null);
    setSelectedSourceNode(null);
  }, []);

  return {
    // State
    showAddNode,
    showEditNode,
    editingNode,
    showAddLink,
    showEditLink,
    editingLink,
    selectedSourceNode,
    // Actions
    openAddNodeModal,
    closeAddNodeModal,
    openEditNodeModal,
    closeEditNodeModal,
    openAddLinkModal,
    closeAddLinkModal,
    openEditLinkModal,
    closeEditLinkModal,
    resetAllModals,
  };
};