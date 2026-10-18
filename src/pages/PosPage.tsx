import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { useTranslation } from '../utils/useTranslation';
import { CategoryBar } from '../components/pos/CategoryBar';
import { ProductCard } from '../components/pos/ProductCard';
import { CartPanel } from '../components/pos/CartPanel';
import { CustomerModal } from '../components/pos/CustomerModal';
import { DiscountModal } from '../components/pos/DiscountModal';
import { CameraScannerModal } from '../components/pos/CameraScannerModal';
import { useBarcodeScanner } from '../utils/useBarcodeScanner';
import { sound } from '../utils/sound';
import { Search, Barcode, ArrowUp, Sparkles, Camera } from 'lucide-react';
import { Product } from '../types';

export const PosPage: React.FC = () => {
  const { products, cart, addToCart, addToast } = useStore();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);

  // Hardware Gun Scanner Listener (Global USB / Bluetooth / Wireless)
  useBarcodeScanner({
    onScan: (code) => {
      const matched = products.find(
        (p) =>
          p.isActive &&
          (p.barcode.toLowerCase() === code.toLowerCase() ||
            p.sku.toLowerCase() === code.toLowerCase())
      );

      if (matched) {
        sound.playBeepSuccess();
        addToCart(matched);
        addToast('success', `${matched.name} ditambahkan via scanner`);
      } else {
        sound.playBeepError();
        addToast('warning', `Barcode "${code}" tidak terdaftar di katalog produk`);
      }
    },
    enabled: true,
  });

  // Infinite Scroll / Lazy Load state
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter products by category & search query
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (!prod.isActive) return false;
      const matchesCat = selectedCategory === 'all' || prod.categoryId === selectedCategory;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Reset pagination count and scroll position whenever filter or search changes
  useEffect(() => {
    setVisibleCount(24);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedCategory, searchQuery]);

  // Handle smooth infinite scroll near bottom
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // Toggle Back to Top floating button
    setShowScrollTop(scrollTop > 350);

    // Infinite load next batch when within 250px of bottom
    if (scrollTop + clientHeight >= scrollHeight - 250) {
      if (visibleCount < filteredProducts.length) {
        setVisibleCount((prev) => Math.min(prev + 18, filteredProducts.length));
      }
    }
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fast Barcode Scan Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const exactMatch = products.find(
      (p) =>
        p.isActive &&
        (p.barcode.toLowerCase() === searchQuery.toLowerCase() ||
          p.sku.toLowerCase() === searchQuery.toLowerCase())
    );

    if (exactMatch) {
      sound.playBeepSuccess();
      addToCart(exactMatch);
      addToast('success', `${exactMatch.name} ditambahkan via barcode`);
      setSearchQuery('');
    } else {
      sound.playBeepError();
      addToast('warning', `Produk dengan barcode/SKU "${searchQuery}" tidak ditemukan`);
    }
  };

  // Slice displayed items for smooth 60 FPS performance
  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* ── Center Catalog Section ──────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg)',
          position: 'relative',
        }}
      >
        {/* ── Top Fixed Header: Search & Categories ─────── */}
        <div
          style={{
            padding: '16px 24px 10px 24px',
            flexShrink: 0,
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            zIndex: 10,
          }}
        >
          {/* Search & Barcode Input Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
            <form
              onSubmit={handleBarcodeSubmit}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('pos.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  {t('pos.clearSearch')}
                </button>
              )}
            </form>

            {/* Pilihan 1: Buka Kamera Webcam Scanner */}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(108, 92, 231, 0.08)',
                border: '1.5px solid rgba(108, 92, 231, 0.28)',
                color: 'var(--primary-600)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="Gunakan kamera laptop/PC untuk memindai barcode produk"
            >
              <Camera size={16} strokeWidth={2.4} />
              <span>Scan Kamera</span>
            </button>

            {/* Pilihan 2: Status Alat Scanner Tembak (USB/Bluetooth/Wireless) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 13px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="Scanner tembak fisik (USB/Wireless) otomatis aktif dan mendeteksi di latar belakang"
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  display: 'inline-block',
                }}
              />
              <Barcode size={16} style={{ color: 'var(--primary-500)' }} />
              <span>Alat Scanner: Siap</span>
            </div>
          </div>

          {/* Categories Pill Bar */}
          <CategoryBar
            selectedCategoryId={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* ── Scrollable Products Grid with Infinite Scroll ── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: '16px',
            }}
          >
            {displayedProducts.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                  {t('pos.noProducts')}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  {t('pos.noProductsDesc')}
                </div>
              </div>
            ) : (
              displayedProducts.map((prod) => {
                const cartItem = cart.find((item) => item.productId === prod.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;

                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    cartQty={qtyInCart}
                    onAddToCart={(p) => {
                      addToCart(p);
                      addToast('info', `+1 ${p.name}`);
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Infinite Scroll Footer Info */}
          {filteredProducts.length > 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0 36px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {visibleCount < filteredProducts.length ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <span>
                    Menampilkan <strong>{displayedProducts.length}</strong> dari <strong>{filteredProducts.length}</strong> produk
                  </span>
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 24, filteredProducts.length))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--primary-600)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Muat Lebih Banyak
                  </button>
                </div>
              ) : (
                <div style={{ opacity: 0.8 }}>
                  Semua <strong>{filteredProducts.length}</strong> produk dalam kategori ini telah ditampilkan ✓
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
              borderRadius: '9999px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              zIndex: 20,
              transition: 'all 0.2s ease',
            }}
            title={t('pos.backToTop')}
          >
            <ArrowUp size={16} style={{ color: 'var(--primary-500)' }} />
            <span>{t('pos.backToTop')}</span>
          </button>
        )}
      </div>

      {/* ── Right Cart Panel ────────────────────────────── */}
      <CartPanel
        onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
        onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
      />

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
      />
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
      />
    </div>
  );
};
