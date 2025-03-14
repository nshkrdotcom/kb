// frontend/src/types/context.ts
export type ContentType = 'text' | 'code' | 'image' | 'list';

export interface ContentItem {
  id: string;
  type: ContentType;
  content: string;
  title?: string;
  selected: boolean;
  relevance: number; // 0-1 scale
  tokens: number;
  categoryId?: string;
  metadata?: {
    language?: string;
    source?: string;
    timestamp?: string;
    references?: string[];
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  items: string[]; // Content item IDs
}

export interface TokenUsage {
  used: number;
  total: number;
  percentage: number;
  breakdown: Record<ContentType, number>;
}

export interface SelectionState {
  selectedItems: string[];
  activeItem?: string;
  isDragging: boolean;
  dragStartPosition?: { x: number; y: number };
  selectionBox?: { x: number; y: number; width: number; height: number };
}

export interface GraphNode {
  id: string;
  label: string;
  type: ContentType;
  relevance: number;
  selected: boolean;
  neighbors: string[];
  x?: number;
  y?: number;
  size?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}