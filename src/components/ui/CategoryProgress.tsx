import React from 'react';

interface CategoryProgressProps {
  categories: any[];
  currentCategoryIndex: number;
  questionsAnsweredByCategory: Record<string, number>;
  totalQuestionsByCategory: Record<string, number>;
  onSelectCategory: (index: number) => void;
}

export const CategoryProgress: React.FC<CategoryProgressProps> = ({
  categories,
  currentCategoryIndex,
  questionsAnsweredByCategory,
  totalQuestionsByCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex space-x-2">
      {categories.map((category, index) => (
        <button
          key={category.name}
          onClick={() => onSelectCategory(index)}
          className={`px-4 py-2 rounded ${
            currentCategoryIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          {category.name} ({questionsAnsweredByCategory[category.name]}/{totalQuestionsByCategory[category.name]})
        </button>
      ))}
    </div>
  );
}; 