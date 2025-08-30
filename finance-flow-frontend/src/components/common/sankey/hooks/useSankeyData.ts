import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import type { SankeyData } from '@/types/sankey';
import { getSankeyData, updateSankeyData, resetSankeyData } from '@/services/api';

interface UseSankeyDataProps {
  propData?: SankeyData;
  loadFromAPI?: boolean;
  editable?: boolean;
  onDataChange?: (data: SankeyData) => void;
  onDataReset?: () => void;
}

export const useSankeyData = ({
  propData,
  loadFromAPI = false,
  editable = false,
  onDataChange,
  onDataReset
}: UseSankeyDataProps) => {
  const [data, setData] = useState<SankeyData | null>(propData || null);
  const [loading, setLoading] = useState(loadFromAPI);
  const [error, setError] = useState<string | null>(null);
  
  // Debouncing for API updates
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<SankeyData | null>(null);

  // Load data from API if needed
  useEffect(() => {
    if (!loadFromAPI) {
      setData(propData || null);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiData = await getSankeyData();
        setData(apiData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Failed to load sankey data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadFromAPI, propData]);

  // Update data when prop changes
  useEffect(() => {
    if (!loadFromAPI && propData) {
      setData(propData);
    }
  }, [propData, loadFromAPI]);

  // Debounced API update function
  const debouncedUpdateAPI = useCallback((newData: SankeyData) => {
    if (!loadFromAPI) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Store the latest data
    pendingDataRef.current = newData;

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      const dataToUpdate = pendingDataRef.current;
      if (dataToUpdate) {
        try {
          await updateSankeyData(dataToUpdate);
          console.log('Data successfully updated on server');
          toast.success('Changes saved successfully');
        } catch (error) {
          console.error('Failed to update data on server:', error);
          const errorMessage = 'Failed to save changes to server';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    }, 500); // 500ms debounce delay
  }, [loadFromAPI]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Handle data editing
  const updateNodeName = useCallback((nodeId: string, newName: string) => {
    if (!data || !editable) return;
    
    const newData = {
      ...data,
      nodes: data.nodes.map(node => 
        node.id === nodeId ? { ...node, name: newName } : node
      )
    };
    setData(newData);
    onDataChange?.(newData);

    // Update backend with debouncing
    debouncedUpdateAPI(newData);
  }, [data, editable, onDataChange, debouncedUpdateAPI]);

  const updateLinkValue = useCallback((sourceId: string, targetId: string, newValue: number) => {
    if (!data || !editable) return;
    
    const newData = {
      ...data,
      links: data.links.map(link =>
        link.source === sourceId && link.target === targetId 
          ? { ...link, value: newValue }
          : link
      )
    };
    setData(newData);
    onDataChange?.(newData);

    // Update backend with debouncing
    debouncedUpdateAPI(newData);
  }, [data, editable, onDataChange, debouncedUpdateAPI]);

  // Handle data reset
  const handleReset = useCallback(async () => {
    if (!loadFromAPI) return;
    
    try {
      setLoading(true);
      const resetData = await resetSankeyData();
      setData(resetData.data);
      toast.success('Data reset successfully');
      onDataReset?.();
    } catch (error) {
      console.error('Failed to reset data:', error);
      const errorMessage = 'Failed to reset data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadFromAPI, onDataReset]);

  // Handle adding new nodes
  const handleAddNode = useCallback((
    nodeName: string, 
    category: 'income' | 'expense' | 'savings', 
    value?: number, 
    connectTo?: { nodeId: string; amount: number; direction: 'from' | 'to' }
  ) => {
    if (!data || !editable) return;
    
    const nodeId = nodeName.toLowerCase().replace(/\s+/g, '_');
    
    // Check if node ID already exists
    if (data.nodes.find(node => node.id === nodeId)) {
      toast.error('A node with this name already exists!');
      return;
    }
    
    const newNode = {
      id: nodeId,
      name: nodeName,
      category: category,
      ...(value !== undefined && { value })
    };
    
    let newData = {
      ...data,
      nodes: [...data.nodes, newNode]
    };
    
    // Add connection if specified
    if (connectTo) {
      const newLink = connectTo.direction === 'to' 
        ? { source: nodeId, target: connectTo.nodeId, value: connectTo.amount }
        : { source: connectTo.nodeId, target: nodeId, value: connectTo.amount };
      
      newData = {
        ...newData,
        links: [...newData.links, newLink]
      };
    }
    
    setData(newData);
    onDataChange?.(newData);

    // Update backend with debouncing
    debouncedUpdateAPI(newData);
  }, [data, editable, onDataChange, debouncedUpdateAPI]);

  // Handle editing existing nodes
  const handleEditNode = useCallback((
    nodeId: string, 
    newName: string, 
    newCategory: 'income' | 'expense' | 'savings'
  ) => {
    if (!data || !editable) return;
    
    const newData = {
      ...data,
      nodes: data.nodes.map(node => 
        node.id === nodeId 
          ? { ...node, name: newName, category: newCategory }
          : node
      )
    };
    
    setData(newData);
    onDataChange?.(newData);

    // Update backend with debouncing
    debouncedUpdateAPI(newData);
  }, [data, editable, onDataChange, debouncedUpdateAPI]);

  // Handle adding new links
  const handleAddLink = useCallback((sourceId: string, targetId: string, value: number) => {
    if (!data || !editable) return;
    
    // Check if link already exists
    const linkExists = data.links.find(link => 
      link.source === sourceId && link.target === targetId
    );
    
    if (linkExists) {
      toast.error('A link between these nodes already exists!');
      return;
    }
    
    const newLink = {
      source: sourceId,
      target: targetId,
      value: value
    };
    
    const newData = {
      ...data,
      links: [...data.links, newLink]
    };
    
    setData(newData);
    onDataChange?.(newData);

    // Update backend with debouncing
    debouncedUpdateAPI(newData);
  }, [data, editable, onDataChange, debouncedUpdateAPI]);

  return {
    data,
    loading,
    error,
    updateNodeName,
    updateLinkValue,
    handleReset,
    handleAddNode,
    handleEditNode,
    handleAddLink
  };
};