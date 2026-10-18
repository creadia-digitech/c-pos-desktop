import React from 'react';
import { useStore } from '../../stores/useStore';
import { useTranslation } from '../../utils/useTranslation';
import { Category } from '../../types';
import { LayoutGrid } from 'lucide-react';

interface CategoryBarProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ selectedCategoryId, onSelectCategory }) => {
  const { categories, products } = useStore();
  const { t } = useTranslation();

  const totalAllProducts = products.filter((p) => p.isActive).length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '4px 0 12px 0',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* All Categories Pill */}
      <button
        onClick={() => onSelectCategory('all')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '12px',
          border: selectedCategoryId === 'all' ? '2px solid var(--primary-500)' : '1px solid var(--border)',
          backgroundColor: selectedCategoryId === 'all' ? 'var(--primary-500)' : 'var(--surface)',
          color: selectedCategoryId === 'all' ? '#FFFFFF' : 'var(--text)',
          fontWeight: selectedCategoryId === 'all' ? 700 : 500,
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          boxShadow: selectedCategoryId === 'all' ? '0 4px 12px rgba(108, 92, 231, 0.25)' : 'none',
        }}
      >
        <LayoutGrid size={16} />
        <span>{t('pos.allCategories')}</span>
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '8px',
            backgroundColor: selectedCategoryId === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg)',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          {totalAllProducts}
        </span>
      </button>

      {/* Individual Categories */}
      {categories
        .filter((c) => c.isActive)
        .map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const count = products.filter((p) => p.categoryId === cat.id && p.isActive).length;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--surface)',
                color: isSelected ? '#FFFFFF' : 'var(--text)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(108, 92, 231, 0.25)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
              <span>{cat.name}</span>
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
    </div>
  );
};
