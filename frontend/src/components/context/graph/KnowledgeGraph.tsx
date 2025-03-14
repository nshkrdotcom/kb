// frontend/src/components/graph/KnowledgeGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { GraphData, GraphNode, GraphEdge } from '../../types/context';
import GraphControls from './GraphControls';
import NodeDetail from './NodeDetail';
import ForceGraph2D from 'react-force-graph-2d';

const KnowledgeGraph: React.FC = () => {
  const graphRef = useRef<any>(null);
  const { contentItems, categories } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filters, setFilters] = useState({
    showSelected: true,
    showUnselected: true,
    minRelevance: 0,
    contentTypes: {
      text: true,
      code: true,
      image: true,
      list: true
    },
    categories: {} as Record<string, boolean>
  });
  
  // Build graph data from content items
  useEffect(() => {
    // Build initial nodes from content items
    const nodes: GraphNode[] = Object.values(contentItems).map(item => ({
      id: item.id,
      label: item.title || `${item.type} content`,
      type: item.type,
      relevance: item.relevance,
      selected: item.selected,
      neighbors: [], // Will be filled later
      size: 5 + (item.relevance * 10) // Size based on relevance
    }));
    
    // Build edges based on categories and metadata connections
    const edges: GraphEdge[] = [];
    
    // Connect items within the same category
    Object.values(categories).forEach(category => {
      const categoryItems = category.items;
      
      // Connect each item to others in same category
      categoryItems.forEach((sourceId, i) => {
        categoryItems.slice(i + 1).forEach(targetId => {
          edges.push({
            source: sourceId,
            target: targetId,
            weight: 0.5 // Medium strength connection
          });
        });
      });
    });
    
    // Connect items with references between them
    Object.values(contentItems).forEach(item => {
      if (item.metadata?.references) {
        item.metadata.references.forEach(refId => {
          if (contentItems[refId]) {
            edges.push({
              source: item.id,
              target: refId,
              weight: 1 // Strong connection
            });
          }
        });
      }
    });
    
    // Update neighbor information on nodes
    const nodeMap = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<string, GraphNode>);
    
    edges.forEach(edge => {
      if (nodeMap[edge.source] && nodeMap[edge.target]) {
        nodeMap[edge.source].neighbors.push(edge.target);
        nodeMap[edge.target].neighbors.push(edge.source);
      }
    });
    
    setGraphData({ nodes, edges });
  }, [contentItems, categories]);
  
  // Apply filters to graph data
  const filteredData = React.useMemo(() => {
    const filteredNodes = graphData.nodes.filter(node => {
      // Apply selection filter
      if (node.selected && !filters.showSelected) return false;
      if (!node.selected && !filters.showUnselected) return false;
      
      // Apply relevance filter
      if (node.relevance < filters.minRelevance) return false;
      
      // Apply content type filter
      if (!filters.contentTypes[node.type]) return false;
      
      // Apply category filter
      const nodeItem = contentItems[node.id];
      if (nodeItem?.categoryId && !filters.categories[nodeItem.categoryId]) {
        return false;
      }
      
      return true;
    });
    
    // Filter edges to only include connections between visible nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, filters, contentItems]);
  
  // Handle zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(zoomLevel * 1.2);
      setZoomLevel(zoomLevel * 1.2);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(zoomLevel / 1.2);
      setZoomLevel(zoomLevel / 1.2);
    }
  };
  
  const handleResetZoom = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1);
      setZoomLevel(1);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  // Node styling
  const getNodeColor = (node: GraphNode) => {
    // Different colors for different content types
    const typeColors: Record<string, string> = {
      text: '#3B82F6', // blue
      code: '#8B5CF6', // purple
      list: '#10B981', // green
      image: '#EC4899', // pink
    };
    
    // Base color on type
    const baseColor = typeColors[node.type] || '#6B7280';
    
    // Adjust opacity based on selection
    return node.selected ? baseColor : `${baseColor}80`; // 50% opacity if not selected
  };
  
  // Edge styling
  const getEdgeColor = (edge: GraphEdge) => {
    // Transparent gray for all edges
    return 'rgba(160, 174, 192, 0.5)';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Graph Controls */}
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
      />
      
      {/* Graph Visualization */}
      <div className="h-[600px] relative">
        <ForceGraph2D
          ref={graphRef}
          graphData={filteredData}
          nodeId="id"
          nodeLabel="label"
          nodeColor={getNodeColor}
          nodeRelSize={8}
          nodeVal={node => node.size}
          linkColor={getEdgeColor}
          linkWidth={link => (link as GraphEdge).weight}
          onNodeClick={(node) => setSelectedNode(node as GraphNode)}
          cooldownTicks={100}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const { x, y, id, label, selected } = node as any;
            
            // Node circle
            const size = (node as any).size || 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = getNodeColor(node as GraphNode);
            ctx.fill();
            
            // Selection ring for selected nodes
            if (selected) {
              ctx.beginPath();
              ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
              ctx.strokeStyle = '#F59E0B';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
            
            // Node label (only show if zoomed in enough)
            if (globalScale >= 1.2) {
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'black';
              ctx.fillText(label, x, y + size + 1 + fontSize);
            }
          }}
        />
        
        {/* Node Details Panel (when a node is selected) */}
        {selectedNode && (
          <div className="absolute right-4 top-4 w-64 bg-white rounded-lg shadow-lg p-4">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
              onClick={() => setSelectedNode(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <NodeDetail 
              nodeId={selectedNode.id} 
              neighbors={selectedNode.neighbors} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;