import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { Product, Category } from '../types';
import { formatCurrency, generateId } from '../utils/helpers';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tags,
  Sparkles,
  Camera,
  Zap,
  Printer,
} from 'lucide-react';
import { CameraScannerModal } from '../components/pos/CameraScannerModal';
import { BarcodePrintModal } from '../components/products/BarcodePrintModal';

export const ProductsPage: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addToast,
    productsPageSize,
    setProductsPageSize,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6C5CE7');
  const [catIcon, setCatIcon] = useState('🍱');
  const [deleteConfirmCatId, setDeleteConfirmCatId] = useState<string | null>(null);

  // Product Barcode Camera & Generator State
  const [isProductCameraScannerOpen, setIsProductCameraScannerOpen] = useState(false);
  const [isBarcodePrintModalOpen, setIsBarcodePrintModalOpen] = useState(false);
  const [printTargetProductId, setPrintTargetProductId] = useState<string | undefined>(undefined);

  const generateRandomBarcode = () => {
    // Generate valid EAN-13 barcode starting with 899 (Indonesia country code)
    const code = '899' + Math.floor(100000000 + Math.random() * 900000000).toString();
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const finalBarcode = code + checkDigit.toString();
    setFormBarcode(finalBarcode);
    addToast('success', `Barcode 13-digit berhasil dibuat: ${finalBarcode}`);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = productsPageSize || 8;
  const setPageSize = setProductsPageSize;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCat(val);
    setCurrentPage(1);
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formCatId, setFormCatId] = useState(categories[0]?.id || 'cat-1');
  const [formPrice, setFormPrice] = useState<number>(20000);
  const [formCostPrice, setFormCostPrice] = useState<number>(10000);
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formEmoji, setFormEmoji] = useState('🍱');
  const [formImagePath, setFormImagePath] = useState('');
  const [formUnit, setFormUnit] = useState('porsi');
  const [formTrackStock, setFormTrackStock] = useState(false);
  const [formStock, setFormStock] = useState<number>(50);
  const [formLowStockAlert, setFormLowStockAlert] = useState<number>(10);

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Pagination Math
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedProducts = filtered.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safePage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (safePage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImagePath(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCatId(categories[0]?.id || 'cat-1');
    setFormPrice(20000);
    setFormCostPrice(10000);
    setFormSku('');
    setFormBarcode('');
    setFormEmoji('🍱');
    setFormImagePath('');
    setFormUnit('porsi');
    setFormTrackStock(false);
    setFormStock(50);
    setFormLowStockAlert(10);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCatId(p.categoryId);
    setFormPrice(p.sellPrice);
    setFormCostPrice(p.costPrice);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormEmoji(p.imageEmoji || '🍱');
    setFormImagePath(p.imagePath || '');
    setFormUnit(p.unit);
    setFormTrackStock(p.trackStock);
    setFormStock(p.stock);
    setFormLowStockAlert(p.lowStockAlert);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: formName,
        categoryId: formCatId,
        sellPrice: formPrice,
        costPrice: formCostPrice,
        sku: formSku,
        barcode: formBarcode,
        imageEmoji: formEmoji,
        imagePath: formImagePath,
        unit: formUnit,
        trackStock: formTrackStock,
        stock: formStock,
        lowStockAlert: formLowStockAlert,
      });
      addToast('success', `Produk ${formName} berhasil diperbarui!`);
    } else {
      const newProd: Product = {
        id: generateId(),
        categoryId: formCatId,
        name: formName,
        sku: formSku || `SKU-${Date.now().toString().slice(-4)}`,
        barcode: formBarcode,
        imagePath: formImagePath,
        imageEmoji: formEmoji,
        costPrice: formCostPrice,
        sellPrice: formPrice,
        unit: formUnit,
        trackStock: formTrackStock,
        isActive: true,
        stock: formStock,
        lowStockAlert: formLowStockAlert,
        createdAt: new Date().toISOString(),
      };
      addProduct(newProd);
      addToast('success', `Produk baru ${formName} berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus produk "${name}" dari katalog?`)) {
      deleteProduct(id);
      addToast('warning', `Produk ${name} telah dihapus`);
    }
  };

  // ── Category Handlers ──
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatColor('#6C5CE7');
    setCatIcon('🍱');
    setDeleteConfirmCatId(null);
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color || '#6C5CE7');
    setCatIcon(cat.icon || '🍱');
    setDeleteConfirmCatId(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      addToast('error', 'Nama kategori tidak boleh kosong!');
      return;
    }

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        name: catName.trim(),
        color: catColor,
        icon: catIcon.trim() || '🍱',
      });
      addToast('success', `Kategori "${catName.trim()}" berhasil diperbarui!`);
      handleOpenAddCategory();
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: catName.trim(),
        color: catColor,
        icon: catIcon.trim() || '🍱',
        sortOrder: categories.length,
        isActive: true,
      };
      addCategory(newCat);
      addToast('success', `Kategori baru "${catName.trim()}" berhasil ditambahkan!`);
      setFormCatId(newCat.id);
      handleOpenAddCategory();
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      addToast('error', 'Minimal harus ada 1 kategori!');
      return;
    }
    const catToDelete = categories.find((c) => c.id === catId);
    const affectedProductsCount = products.filter((p) => p.categoryId === catId).length;

    deleteCategory(catId);
    if (affectedProductsCount > 0) {
      addToast('info', `Kategori "${catToDelete?.name}" dihapus. ${affectedProductsCount} produk dipindahkan ke kategori lain.`);
    } else {
      addToast('success', `Kategori "${catToDelete?.name}" berhasil dihapus.`);
    }

    if (editingCategory?.id === catId) {
      handleOpenAddCategory();
    }
    if (formCatId === catId) {
      const remaining = categories.filter((c) => c.id !== catId);
      if (remaining[0]) setFormCatId(remaining[0].id);
    }
    if (selectedCat === catId) {
      setSelectedCat('all');
    }
    setDeleteConfirmCatId(null);
  };

  return (
    <div
      style={{
        padding: '20px 24px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Header Title & Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Katalog Produk & Inventaris Stok
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Kelola daftar menu, varian harga modal/jual, serta alarm pengingat stok
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setPrintTargetProductId(undefined);
              setIsBarcodePrintModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
          >
            <Printer size={16} style={{ color: 'var(--primary-500)' }} />
            <span>Cetak Label Barcode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleOpenAddCategory();
              setIsCategoryModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              transition: 'all 0.15s ease',
            }}
          >
            <Tags size={16} style={{ color: 'var(--primary-500)' }} />
            <span>Kelola Kategori ({categories.length})</span>
          </button>

          <button
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-500)',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(108, 92, 231, 0.3)',
            }}
          >
            <Plus size={18} />
            <span>Tambah Menu / Produk</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '14px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              fontSize: '0.88rem',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => handleCategoryChange(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: '0.88rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">Semua Kategori ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table Container with Embedded Pagination */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Scrollable Table Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Produk</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>Kategori</th>
                <th style={{ padding: '14px 18px', fontWeight: 600 }}>SKU / Barcode</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Harga Modal</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Harga Jual</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>Stok</th>
                <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada produk yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  const isLowStock = prod.trackStock && prod.stock <= prod.lowStockAlert;

                  return (
                    <tr
                      key={prod.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {prod.imagePath ? (
                            <img
                              src={prod.imagePath}
                              alt={prod.name}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                objectFit: 'cover',
                                border: '1px solid var(--border)',
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.4rem' }}>{prod.imageEmoji || '📦'}</span>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Satuan: {prod.unit}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>
                        {cat ? `${cat.icon} ${cat.name}` : '—'}
                      </td>

                      <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {prod.sku || '—'}
                      </td>

                      <td style={{ padding: '12px 18px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(prod.costPrice)}
                      </td>

                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-600)' }}>
                        {formatCurrency(prod.sellPrice)}
                      </td>

                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        {prod.trackStock ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              backgroundColor: isLowStock ? 'rgba(214, 48, 49, 0.12)' : 'rgba(0, 184, 148, 0.12)',
                              color: isLowStock ? '#D63031' : '#009B7D',
                            }}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Unlimited</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setPrintTargetProductId(prod.id);
                              setIsBarcodePrintModalOpen(true);
                            }}
                            title="Cetak Label Barcode Produk Ini"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              cursor: 'pointer',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Barcode size={15} style={{ color: 'var(--primary-600)' }} />
                          </button>
                          <button
                            onClick={() => openEditModal(prod)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              cursor: 'pointer',
                              color: 'var(--text)',
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #D63031',
                              backgroundColor: 'rgba(214, 48, 49, 0.08)',
                              color: '#D63031',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Embedded Pagination Footer (Always Visible at bottom of table) */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 18px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          {/* Info & Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>
              Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> -{' '}
              <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> dari <strong>{totalItems}</strong> produk
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={8}>8 (Pas Layar)</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage <= 1 ? 'transparent' : 'var(--bg)',
                color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.4 : 1,
              }}
              title="Halaman Pertama"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage <= 1 ? 'transparent' : 'var(--bg)',
                color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.4 : 1,
              }}
              title="Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>
                    ...
                  </span>
                );
              }
              const isCurrent = p === safePage;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p as number)}
                  style={{
                    minWidth: '30px',
                    height: '30px',
                    padding: '0 6px',
                    borderRadius: '8px',
                    border: isCurrent ? 'none' : '1px solid var(--border)',
                    backgroundColor: isCurrent ? 'var(--primary-500)' : 'var(--bg)',
                    color: isCurrent ? '#FFFFFF' : 'var(--text)',
                    fontWeight: isCurrent ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 2px 6px rgba(108, 92, 231, 0.3)' : 'none',
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage >= totalPages ? 'transparent' : 'var(--bg)',
                color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: safePage >= totalPages ? 0.4 : 1,
              }}
              title="Berikutnya"
            >
              <ChevronRight size={16} />
            </button>

            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage >= totalPages ? 'transparent' : 'var(--bg)',
                color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: safePage >= totalPages ? 0.4 : 1,
              }}
              title="Halaman Terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'var(--surface)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Photo Upload & Preview Section */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Foto Asli Menu / Produk
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px dashed var(--border)',
                    backgroundColor: 'var(--bg)',
                  }}
                >
                  {formImagePath ? (
                    <img
                      src={formImagePath}
                      alt="Preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {formEmoji || '📷'}
                    </div>
                  )}

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--primary-500)',
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Upload Foto dari PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {formImagePath && (
                        <button
                          type="button"
                          onClick={() => setFormImagePath('')}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid #D63031',
                            backgroundColor: 'transparent',
                            color: '#D63031',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="Atau tempel link gambar (https://...)"
                      value={formImagePath.startsWith('data:') ? '' : formImagePath}
                      onChange={(e) => setFormImagePath(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.78rem',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Ikon/Emoji
                  </label>
                  <input
                    type="text"
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '1.4rem',
                      textAlign: 'center',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    Nama Menu / Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Aren"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                      Kategori
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAddCategory();
                        setIsCategoryModalOpen(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 4px',
                      }}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      <span>Atur / Baru</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={formCatId}
                      onChange={(e) => setFormCatId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAddCategory();
                        setIsCategoryModalOpen(true);
                      }}
                      title="Tambah Kategori Baru"
                      style={{
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Plus size={14} />
                      <span>Baru</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    Satuan (Unit)
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="porsi / gelas / pcs"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice || ''}
                    onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Harga Modal / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    value={formCostPrice || ''}
                    onChange={(e) => setFormCostPrice(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="KS-001"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Barcode Scanner
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={generateRandomBarcode}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary-600)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 4px',
                        }}
                        title="Buat kode 13-digit barcode acak otomatis"
                      >
                        <Zap size={11} />
                        <span>Generate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsProductCameraScannerOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#00B894',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 4px',
                        }}
                        title="Pindai barcode produk lewat kamera webcam"
                      >
                        <Camera size={11} />
                        <span>Scan</span>
                      </button>
                      {formBarcode && (
                        <button
                          type="button"
                          onClick={() => {
                            if (editingProduct) {
                              setPrintTargetProductId(editingProduct.id);
                              setIsBarcodePrintModalOpen(true);
                            } else {
                              addToast('info', 'Simpan produk terlebih dahulu untuk mencetak label stiker');
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '1px 4px',
                          }}
                          title="Cetak label barcode untuk produk ini"
                        >
                          <Printer size={11} />
                          <span>Cetak</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="Contoh: 8991001000018"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      fontFamily: formBarcode ? 'monospace' : 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Stock Tracking Toggle */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formTrackStock}
                    onChange={(e) => setFormTrackStock(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Lacak Stok Otomatis (Inventaris)</span>
                </label>

                {formTrackStock && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Jumlah Stok Saat Ini
                      </label>
                      <input
                        type="number"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Peringatan Stok Menipis
                      </label>
                      <input
                        type="number"
                        value={formLowStockAlert}
                        onChange={(e) => setFormLowStockAlert(Number(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Kelola Kategori Menu (Modern Theme) ── */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCategoryModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              backgroundColor: 'var(--surface)',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Top Tri-Tone Accent Line */}
            <div
              style={{
                height: '4px',
                width: '100%',
                background: 'linear-gradient(90deg, var(--primary-500) 0%, #00B894 100%)',
              }}
            />

            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(0, 184, 148, 0.1) 100%)',
                    border: '1px solid rgba(108, 92, 231, 0.25)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(108, 92, 231, 0.12)',
                  }}
                >
                  <Tags size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                    Manajemen Kategori Menu
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Kelola pengelompokan menu kasir, nama, ikon & warna aksen
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Form Tambah / Edit Kategori */}
              <form
                onSubmit={handleSaveCategory}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {editingCategory ? (
                      <>
                        <Edit2 size={14} style={{ color: 'var(--primary-500)' }} />
                        <span>Edit Kategori: <strong style={{ color: 'var(--primary-600)' }}>{editingCategory.name}</strong></span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} style={{ color: 'var(--primary-500)' }} />
                        <span>Tambah Kategori Baru</span>
                      </>
                    )}
                  </div>

                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleOpenAddCategory}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                {/* Input Nama & Ikon */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                      Nama Kategori *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Dimsum, Kopi, Paket Hemat"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.86rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ width: '80px' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                      Ikon
                    </label>
                    <input
                      type="text"
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 8px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Preset Ikon Cepat */}
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Pilihan Ikon Cepat:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['🍚', '🥤', '☕', '🍗', '🍜', '🍰', '🍪', '🍱', '🥗', '🎁', '🥟', '🍔', '🍟', '🍦', '🥩', '🍢', '🍳'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCatIcon(emoji)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          border: catIcon === emoji ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                          backgroundColor: catIcon === emoji ? 'var(--primary-50)' : 'var(--surface)',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.1s ease',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Warna Aksen */}
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Warna Aksen Tag:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {['#6C5CE7', '#00B894', '#0984E3', '#E17055', '#FD79A8', '#FDCB6E', '#E84393', '#636E72'].map((color) => {
                      const isSelected = catColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCatColor(color)}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: isSelected ? '3px solid #FFF' : '2px solid transparent',
                            boxShadow: isSelected ? `0 0 0 2px ${color}` : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tombol Simpan Form Kategori */}
                <button
                  type="submit"
                  style={{
                    marginTop: '4px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
                  }}
                >
                  <Plus size={15} />
                  <span>{editingCategory ? 'Simpan Perubahan Kategori' : 'Tambahkan Kategori Ini'}</span>
                </button>
              </form>

              {/* Daftar Kategori Saat Ini */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>
                    Daftar Kategori Aktif ({categories.length})
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Produk akan berpindah otomatis jika kategori dihapus
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map((cat) => {
                    const prodCount = products.filter((p) => p.categoryId === cat.id).length;
                    const isConfirmingDelete = deleteConfirmCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg)',
                          border: `1.5px solid ${editingCategory?.id === cat.id ? 'var(--primary-500)' : 'var(--border)'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Kiri: Ikon & Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              backgroundColor: `${cat.color || '#6C5CE7'}20`,
                              border: `1px solid ${cat.color || '#6C5CE7'}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              flexShrink: 0,
                            }}
                          >
                            {cat.icon || '🍱'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text)' }}>
                                {cat.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '5px',
                                  backgroundColor: `${cat.color || '#6C5CE7'}18`,
                                  color: cat.color || 'var(--primary-600)',
                                }}
                              >
                                {prodCount} Menu
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              ID: {cat.id}
                            </span>
                          </div>
                        </div>

                        {/* Kanan: Aksi Edit & Hapus */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isConfirmingDelete ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#EF4444',
                                  color: '#FFF',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                Yakin Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmCatId(null)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--text)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                title="Edit Kategori"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--primary-600)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Edit2 size={13} />
                              </button>

                              <button
                                type="button"
                                disabled={categories.length <= 1}
                                onClick={() => setDeleteConfirmCatId(cat.id)}
                                title={categories.length <= 1 ? 'Minimal harus ada 1 kategori' : 'Hapus Kategori'}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--surface)',
                                  color: categories.length <= 1 ? 'var(--text-muted)' : '#EF4444',
                                  opacity: categories.length <= 1 ? 0.4 : 1,
                                  cursor: categories.length <= 1 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: 'var(--bg)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Scan Barcode Kamera untuk Form Produk ── */}
      <CameraScannerModal
        isOpen={isProductCameraScannerOpen}
        onClose={() => setIsProductCameraScannerOpen(false)}
        onScanSuccess={(code) => {
          setFormBarcode(code);
          addToast('success', `Barcode "${code}" berhasil terdeteksi dan diisi ke form!`);
        }}
      />

      {/* ── MODAL: Cetak Label Barcode Massal ── */}
      <BarcodePrintModal
        isOpen={isBarcodePrintModalOpen}
        onClose={() => setIsBarcodePrintModalOpen(false)}
        initialSelectedProductId={printTargetProductId}
      />
    </div>
  );
};
