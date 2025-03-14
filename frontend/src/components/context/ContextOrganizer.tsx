// frontend/src/components/context/ContextOrganizer.tsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { ContentItem, Category } from '../../types/context';
import { 
  reorderItems,
  addCategory,
  removeCategory,
  assignItemsToCategory
} from '../../store/slices/contextSelectionSlice';
import CategoryManager from './CategoryManager';
import { v4 as uuidv4 } from 'uuid';

const ContextOrganizer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { contentItems, categories } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [activeTab, setActiveTab] = useState<'organize' | 'categories'>('organize');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Get selected items
  const selectedItems = Object.values(contentItems).filter(item => item.selected);
  
  // Group items by category
  const itemsByCategory: Record<string, ContentItem[]> = {
    uncategorized: []
  };
  
  // Initialize categories from state
  Object.values(categories).forEach(category => {
    itemsByCategory[category.id] = [];
  });
  
  // Populate categories with items
  selectedItems.forEach(item => {
    if (item.categoryId && itemsByCategory[item.categoryId]) {
      itemsByCategory[item.categoryId].push(item);
    } else {
      itemsByCategory.uncategorized.push(item);
    }
  });
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // If moving between different lists (categories)
    if (source.droppableId !== destination.droppableId) {
      // Move item to a different category
      const itemId = selectedItems.find(
        (_, index) => index === source.index
      )?.id;
      
      if (itemId) {
        dispatch(assignItemsToCategory({
          categoryId: destination.droppableId === 'uncategorized' ? '' : destination.droppableId,
          itemIds: [itemId]
        }));
      }
    } else {
      // Reorder within the same category
      dispatch(reorderItems({
        sourceIndex: source.index,
        destinationIndex: destination.index
      }));
    }
  };
  
  // Create a new category
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const category: Category = {
      id: uuidv4(),
      name: newCategoryName.trim(),
      color: getRandomColor(),
      items: []
    };
    
    dispatch(addCategory(category));
    setNewCategoryName('');
  };
  
  // Delete a category
  const handleDeleteCategory = (categoryId: string) => {
    dispatch(removeCategory(categoryId));
  };
  
  // Get a random color for new categories
  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#06B6D4', // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'organize'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('organize')}
          >
            Organize Content
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'categories'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('categories')}
          >
            Manage Categories
          </button>
        </nav>
      </div>
      
      {/* Active Tab Content */}
      <div className="p-4">
        {activeTab === 'organize' ? (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Organize Selected Content</h3>
              <p className="text-sm text-gray-500">
                Drag and drop items to reorder or categorize them. Items with higher relevance will be prioritized in context.
              </p>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Render each category section */}
              {Object.entries(itemsByCategory).map(([categoryId, items]) => {
                // Skip empty categories
                if (items.length === 0) return null;
                
                const categoryName = categoryId === 'uncategorized' 
                  ? 'Uncategorized' 
                  : categories[categoryId]?.name || 'Unknown';
                
                const categoryColor = categoryId === 'uncategorized'
                  ? '#6B7280' // gray
                  : categories[categoryId]?.color || '#6B7280';
                
                return (
                  <div key={categoryId} className="mb-6">
                    <div className="flex items-center mb-2">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: categoryColor }}
                      ></div>
                      <h4 className="text-sm font-medium text-gray-700">{categoryName}</h4>
                      <span className="ml-2 text-xs text-gray-500">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <Droppable droppableId={categoryId}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="bg-gray-50 rounded-md p-2 min-h-[100px]"
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 mb-2 rounded border ${
                                    snapshot.isDragging ? 'border-primary-300 shadow-md' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {item.title || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} content`}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate mt-1">
                                        {item.content.substring(0, 50)}...
                                      </p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {item.tokens} tokens
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </DragDropContext>
          </div>
        ) : (
          <CategoryManager />
        )}
      </div>
      
      {/* Bottom Controls */}
      {activeTab === 'categories' && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Add Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextOrganizer;