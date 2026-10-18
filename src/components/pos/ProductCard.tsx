import React, { useState } from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { Plus, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  cartQty: number;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, cartQty, onAddToCart }) => {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = product.trackStock && product.stock <= 0;
  const isLowStock = product.trackStock && product.stock > 0 && product.stock <= product.lowStockAlert;

  const hasRealImage = Boolean(product.imagePath && !imageError);

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) onAddToCart(product);
      }}
      style={{
        position: 'relative',
        backgroundColor: 'var(--surface)',
        borderRadius: '18px',
        border: cartQty > 0 ? '2px solid var(--primary-500)' : '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        opacity: isOutOfStock ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        height: '210px',
        boxShadow: cartQty > 0 ? '0 8px 20px rgba(108, 92, 231, 0.22)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.09)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = cartQty > 0 ? '0 8px 20px rgba(108, 92, 231, 0.22)' : '0 2px 8px rgba(0,0,0,0.04)';
        }
      }}
    >
      {/* ── Top Half: Real Product Image Banner ─────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '110px',
          backgroundColor: 'var(--bg)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasRealImage ? (
          <img
            src={product.imagePath}
            alt={product.name}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>{product.imageEmoji || '🍱'}</span>
          </div>
        )}

        {/* Gradient Overlay for contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top-Right: Cart Quantity Badge */}
        {cartQty > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'var(--primary-500)',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(108, 92, 231, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{cartQty}x</span>
          </div>
        )}

        {/* Top-Left: Low Stock or Out of Stock Tag */}
        {product.trackStock && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: isOutOfStock ? '#D63031' : isLowStock ? '#F0B429' : 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            {isOutOfStock ? (
              <span>Habis</span>
            ) : isLowStock ? (
              <>
                <AlertCircle size={10} />
                <span>Sisa {product.stock}</span>
              </>
            ) : (
              <span>Stok: {product.stock}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Half: Title, SKU & Price Tag ─────────── */}
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '0.92rem',
              color: 'var(--text)',
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={product.name}
          >
            {product.name}
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {product.sku && <span>SKU: {product.sku}</span>}
            <span>• {product.unit}</span>
          </div>
        </div>

        {/* Price & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary-600)' }}>
            {formatCurrency(product.sellPrice)}
          </div>

          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: cartQty > 0 ? 'var(--primary-500)' : 'var(--primary-50)',
              color: cartQty > 0 ? '#FFFFFF' : 'var(--primary-600)',
              border: cartQty > 0 ? 'none' : '1px solid var(--primary-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: cartQty > 0 ? '0 2px 6px rgba(108, 92, 231, 0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Plus size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};
