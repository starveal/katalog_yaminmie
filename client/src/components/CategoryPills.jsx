import React from 'react';
import { Utensils, Coffee, Cookie, Layers } from 'lucide-react';

export const CategoryPills = ({ categories, activeCategoryId, onSelectCategory, totalProductsCount }) => {
  // Category icon helper
  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('makan')) return <Utensils size={15} />;
    if (lower.includes('minum')) return <Coffee size={15} />;
    if (lower.includes('camil') || lower.includes('snack')) return <Cookie size={15} />;
    return <Layers size={15} />;
  };

  return (
    <div className="category-pills-wrapper">
      <div className="category-pills-scroll">
        {/* All Products Pill */}
        <button
          className={`category-pill ${activeCategoryId === '' ? 'active' : ''}`}
          onClick={() => onSelectCategory('')}
          id="cat-pill-all"
          aria-pressed={activeCategoryId === ''}
        >
          <Layers size={15} />
          <span>Semua Menu</span>
          <span className="pill-count">{totalProductsCount}</span>
        </button>

        {/* Dynamic Category Pills */}
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              id={`cat-pill-${cat.slug || cat.id}`}
              aria-pressed={isActive}
            >
              {getCategoryIcon(cat.name)}
              <span>{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className="pill-count">{cat.productCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};