// frontend/src/components/context/CategoryManager.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { Category } from '../../types/context';
import { removeCategory } from '../../store/slices/contextSelectionSlice';

const CategoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, contentItems } = useSelector(
    (state: RootState) => state.contextSelection
  );
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // Count items per category
  const itemCountByCategory: Record<string, number> = {};
  
  Object.values(contentItems).forEach(item => {
    if (item.categoryId) {
      itemCountByCategory[item.categoryId] = (itemCountByCategory[item.categoryId] || 0) + 1;
    }
  });
  
  // Delete category after confirmation
  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? Items will be moved to Uncategorized.')) {
      dispatch(removeCategory(categoryId));
    }
  };
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Categories</h3>
        <p className="text-sm text-gray-500">
          Organize your content with custom categories. Deleting a category will move all its items to Uncategorized.
        </p>
      </div>
      
      <div className="bg-white rounded-md overflow-hidden">
        <ul>
          {Object.keys(categories).length === 0 ? (
            <li className="p-4 text-sm text-gray-500 italic">
              No categories created yet. Add a category to organize your content.
            </li>
          ) : (
            Object.values(categories).map((category) => (
              <li
                key={category.id}
                className="border-b last:border-b-0 border-gray-200"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {editingCategoryId === category.id ? (
                      <input
                        type="text"
                        className="border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={category.name}
                        // In a real implementation, you'd handle the update here
                        onBlur={() => setEditingCategoryId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingCategoryId(null);
                          if (e.key === 'Escape') setEditingCategoryId(null);
                        }}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    )}
                    <span className="ml-2 text-xs text-gray-500">
                      {itemCountByCategory[category.id] || 0} item{(itemCountByCategory[category.id] || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setEditingCategoryId(category.id)}
                      aria-label="Edit category"
                      title="Edit category"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteCategory(category.id)}
                      aria-label="Delete category"
                      title="Delete category"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default CategoryManager;