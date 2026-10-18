import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useStore } from '../../stores/useStore';
import { formatCurrency, generateEan13Barcode } from '../../utils/helpers';
import { Product } from '../../types';
import {
  Printer,
  X,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  Sliders,
  Eye,
  Plus,
  Minus,
  Layers,
  Sparkles,
  Zap,
  AlertTriangle,
  Info,
  Scissors,
} from 'lucide-react';

/**
 * Generate a standalone, offline, base64 PNG image of the barcode using in-memory Canvas.
 * ZERO dependencies on external CDNs or network scripts!
 */
export const generateBarcodeBase64 = (
  code: string,
  options?: { width?: number; height?: number; displayValue?: boolean; fontSize?: number }
): string => {
  try {
    const canvas = document.createElement('canvas');
    const isEan13 = code.length === 13 && /^\d+$/.test(code);
    JsBarcode(canvas, code, {
      format: isEan13 ? 'EAN13' : 'CODE128',
      width: options?.width || 2,
      height: options?.height || 42,
      displayValue: options?.displayValue ?? true,
      fontSize: options?.fontSize || 12,
      margin: 4,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, code, {
        format: 'CODE128',
        width: options?.width || 2,
        height: options?.height || 42,
        displayValue: options?.displayValue ?? true,
        fontSize: options?.fontSize || 12,
        margin: 4,
        background: '#ffffff',
        lineColor: '#000000',
      });
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }
};

// Single Barcode SVG Renderer component for In-App Live Previews
export const BarcodeSvgItem: React.FC<{
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
}> = ({ value, width = 1.4, height = 34, fontSize = 10 }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      const isEan13 = value.length === 13 && /^\d+$/.test(value);
      JsBarcode(svgRef.current, value, {
        format: isEan13 ? 'EAN13' : 'CODE128',
        width,
        height,
        displayValue: true,
        fontSize,
        textMargin: 2,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          fontSize,
          textMargin: 2,
          margin: 2,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch {
        // Ignore fallback error
      }
    }
  }, [value, width, height, fontSize]);

  return <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />;
};

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedProductId?: string;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  initialSelectedProductId,
}) => {
  const {
    products,
    categories,
    businessName,
    addToast,
    updateProduct,
    updateProductsBatch,
    paperWidth,
  } = useStore();

  // Selected products with count to print: { [productId]: quantity }
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Label configuration:
  // 'continuous': Printer Struk Thermal Kasir Roll (58mm/80mm) - DEFAULT! Anti paper-runaway
  // 'label': Printer Label Thermal khusus stiker kupas dengan gap sensor (40x30mm)
  // 'a4': Kertas Stiker Lembaran A4 Grid 3 Kolom
  const [paperType, setPaperType] = useState<'continuous' | 'label' | 'a4'>('continuous');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);

  // Initialize selected items when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialSelectedProductId) {
      const prod = products.find((p) => p.id === initialSelectedProductId);
      if (prod) {
        setSelectedItems({ [prod.id]: 1 });
        return;
      }
    }

    // Default: select first 6 active products with barcodes
    const defaults: Record<string, number> = {};
    products
      .filter((p) => p.isActive && p.barcode)
      .slice(0, 6)
      .forEach((p) => {
        defaults[p.id] = 1;
      });
    setSelectedItems(defaults);
  }, [isOpen, initialSelectedProductId, products]);

  if (!isOpen) return null;

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      return matchName || matchSku || matchBarcode;
    }
    return true;
  });

  // Calculate totals
  const totalSelectedProducts = Object.keys(selectedItems).filter((id) => selectedItems[id] > 0).length;
  const totalLabelsToPrint = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);

  // Toggle single product selection
  const toggleProduct = (prodId: string) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (updated[prodId]) {
        delete updated[prodId];
      } else {
        updated[prodId] = 1;
      }
      return updated;
    });
  };

  // Adjust print quantity
  const updateQuantity = (prodId: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[prodId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[prodId];
      } else {
        updated[prodId] = next;
      }
      return updated;
    });
  };

  const setExactQuantity = (prodId: string, val: number) => {
    const qty = Math.max(0, Math.floor(val));
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (qty === 0) {
        delete updated[prodId];
      } else {
        updated[prodId] = qty;
      }
      return updated;
    });
  };

  // Select all / Deselect all
  const selectAllFiltered = () => {
    const updated = { ...selectedItems };
    filteredProducts.forEach((p) => {
      if (!updated[p.id]) updated[p.id] = 1;
    });
    setSelectedItems(updated);
  };

  const deselectAllFiltered = () => {
    const updated = { ...selectedItems };
    filteredProducts.forEach((p) => {
      delete updated[p.id];
    });
    setSelectedItems(updated);
  };

  // Quick Action: Match current stock
  const setQuantityToStock = () => {
    const updated: Record<string, number> = {};
    products
      .filter((p) => p.isActive && p.barcode)
      .forEach((p) => {
        const stockQty = p.trackStock ? Math.max(1, p.stock) : 1;
        updated[p.id] = stockQty;
      });
    setSelectedItems(updated);
    addToast('info', 'Jumlah cetak barcode disesuaikan dengan stok produk');
  };

  // Mass Barcode Generation
  const missingBarcodeCount = products.filter((p) => p.isActive && !p.barcode).length;
  const filteredMissingCount = filteredProducts.filter((p) => !p.barcode).length;

  const handleGenerateMissingBarcodes = () => {
    const existing = new Set(products.map((p) => p.barcode).filter(Boolean));
    const toUpdate: Product[] = [];
    const newSelected: Record<string, number> = { ...selectedItems };

    const targetList =
      filteredProducts.filter((p) => !p.barcode).length > 0
        ? filteredProducts.filter((p) => !p.barcode)
        : products.filter((p) => p.isActive && !p.barcode);

    if (targetList.length === 0) {
      addToast('info', 'Semua produk sudah memiliki barcode.');
      return;
    }

    targetList.forEach((p) => {
      const newBarcode = generateEan13Barcode(existing);
      existing.add(newBarcode);
      toUpdate.push({
        ...p,
        barcode: newBarcode,
      });
      if (!newSelected[p.id]) {
        newSelected[p.id] = 1;
      }
    });

    updateProductsBatch(toUpdate);
    setSelectedItems(newSelected);
    addToast('success', `Berhasil membuat ${toUpdate.length} barcode baru secara otomatis!`);
  };

  const handleGenerateSingleBarcode = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const existing = new Set(products.map((p) => p.barcode).filter(Boolean));
    const newBarcode = generateEan13Barcode(existing);
    updateProduct({ ...prod, barcode: newBarcode });
    setSelectedItems((prev) => ({ ...prev, [prodId]: prev[prodId] || 1 }));
    addToast('success', `Barcode baru untuk ${prod.name}: ${newBarcode}`);
  };

  // Flattened array of labels for printing and preview
  const printableList: Array<{ product: Product; index: number }> = [];
  Object.entries(selectedItems).forEach(([prodId, qty]) => {
    const prod = products.find((p) => p.id === prodId);
    if (prod && qty > 0) {
      for (let i = 0; i < qty; i++) {
        printableList.push({ product: prod, index: i });
      }
    }
  });

  // ── Bulletproof Handle Print Action (Zero CDN, Zero Infinite Feed) ──
  const handlePrint = () => {
    if (printableList.length === 0) {
      addToast('warning', 'Pilih minimal 1 produk untuk dicetak');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('error', 'Popup print diblokir browser. Izinkan popup untuk mencetak label.');
      return;
    }

    const storeTitle = businessName || 'C-POS Store';
    const is80 = paperWidth === '80mm';
    // Printable width: 44mm for 58mm paper, 68mm for 80mm paper
    const rollWidthMm = is80 ? '68mm' : '44mm';

    // 1. Generate standalone Base64 PNG images locally in memory
    // NO external CDN scripts, works 100% offline, immediate render!
    const items = printableList.map(({ product }) => {
      const barcodeVal = product.barcode || product.sku || '000000000000';
      const imgData = generateBarcodeBase64(barcodeVal, {
        width: 2,
        height: paperType === 'a4' ? 44 : 36,
        displayValue: showBarcodeText,
        fontSize: 12,
      });
      return { product, barcodeVal, imgData };
    });

    let pageCss = '';
    let bodyHtml = '';

    if (paperType === 'continuous') {
      // ══════════════════════════════════════════════════════════════
      // FORMAT 1: CONTINUOUS ROLL THERMAL (POS-58 / POS-80)
      // Kertas roll kasir biasa: NO PAGE BREAK!
      // Output adalah satu strip vertikal kontinu seperti struk belanja.
      // Driver printer thermal TIDAK AKAN PERNAH narik kertas berlebih!
      // ══════════════════════════════════════════════════════════════
      pageCss = `
        @page {
          size: auto;
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: #000000 !important;
        }
        html, body {
          width: ${rollWidthMm};
          max-width: ${rollWidthMm};
          margin: 0 !important;
          padding: 2mm 1mm 10mm 1mm !important;
          background: #ffffff !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          text-align: center;
        }
        .label-item {
          padding: 2mm 0;
          page-break-inside: avoid;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .store-name {
          font-size: 7.5pt;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 1mm;
          line-height: 1.1;
          word-break: break-word;
        }
        .product-name {
          font-size: 8pt;
          font-weight: 900;
          margin-bottom: 1.5mm;
          line-height: 1.2;
          word-break: break-word;
        }
        .barcode-img {
          width: 92%;
          max-width: ${is80 ? '58mm' : '38mm'};
          height: auto;
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .price {
          font-size: 8.5pt;
          font-weight: 900;
          margin-top: 1.5mm;
        }
        .cut-line {
          width: 100%;
          border-bottom: 1.5px dashed #000000;
          margin: 3.5mm 0;
          font-size: 7pt;
          line-height: 1;
          color: #333333;
          padding-bottom: 1mm;
        }
      `;

      bodyHtml = items
        .map(
          ({ product, imgData }, idx) => `
          <div class="label-item">
            ${showStoreName ? `<div class="store-name">${storeTitle}</div>` : ''}
            ${showProductName ? `<div class="product-name">${product.name}</div>` : ''}
            <img src="${imgData}" class="barcode-img" alt="Barcode" />
            ${showPrice ? `<div class="price">${formatCurrency(product.sellPrice)}</div>` : ''}
          </div>
          ${
            idx < items.length - 1
              ? `<div class="cut-line">- - - ✂️ GUNTING DISINI - - -</div>`
              : `<div style="font-size: 7pt; margin-top: 4mm; color: #666;">- - - SELESAI - - -</div>`
          }
        `
        )
        .join('');
    } else if (paperType === 'label') {
      // ══════════════════════════════════════════════════════════════
      // FORMAT 2: STIKER THERMAL LABEL KHUSUS (40x30mm)
      // Hanya untuk printer label yang memakai kertas stiker celah (gap sensor)!
      // ══════════════════════════════════════════════════════════════
      pageCss = `
        @page {
          size: 40mm 30mm;
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: #000000 !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .labels-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .label-item {
          width: 38mm;
          height: 28mm;
          box-sizing: border-box;
          padding: 1.5mm 1mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          page-break-after: always;
          break-after: page;
        }
        .store-name {
          font-size: 7pt;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 1mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .product-name {
          font-size: 7.5pt;
          font-weight: 800;
          margin-bottom: 1mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .barcode-img {
          width: 34mm;
          height: auto;
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .price {
          font-size: 8pt;
          font-weight: 900;
          margin-top: 1mm;
        }
      `;

      bodyHtml = `
        <div class="labels-container">
          ${items
            .map(
              ({ product, imgData }) => `
            <div class="label-item">
              ${showStoreName ? `<div class="store-name">${storeTitle}</div>` : ''}
              ${showProductName ? `<div class="product-name">${product.name}</div>` : ''}
              <img src="${imgData}" class="barcode-img" alt="Barcode" />
              ${showPrice ? `<div class="price">${formatCurrency(product.sellPrice)}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } else {
      // ══════════════════════════════════════════════════════════════
      // FORMAT 3: KERTAS STIKER LEMBARAN A4 (3 Kolom Grid)
      // Untuk printer inkjet / laser biasa
      // ══════════════════════════════════════════════════════════════
      pageCss = `
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color: #000000 !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          background: #ffffff;
        }
        .labels-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4mm 4mm;
          justify-content: center;
        }
        .label-item {
          border: 1px dashed #bbb;
          border-radius: 4px;
          padding: 2.5mm 1.5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 32mm;
          page-break-inside: avoid;
        }
        .store-name {
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 1mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .product-name {
          font-size: 8.5pt;
          font-weight: 800;
          margin-bottom: 1.5mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .barcode-img {
          width: 48mm;
          height: auto;
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .price {
          font-size: 9.5pt;
          font-weight: 900;
          margin-top: 1.5mm;
        }
      `;

      bodyHtml = `
        <div class="labels-container">
          ${items
            .map(
              ({ product, imgData }) => `
            <div class="label-item">
              ${showStoreName ? `<div class="store-name">${storeTitle}</div>` : ''}
              ${showProductName ? `<div class="product-name">${product.name}</div>` : ''}
              <img src="${imgData}" class="barcode-img" alt="Barcode" />
              ${showPrice ? `<div class="price">${formatCurrency(product.sellPrice)}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>C-POS Cetak Label Barcode (${printableList.length} Label)</title>
          <style>${pageCss}</style>
        </head>
        <body>
          ${bodyHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 150);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    addToast('success', `Menyiapkan ${printableList.length} label untuk dicetak...`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1060px',
          height: '92vh',
          maxHeight: '760px',
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Accent Gradient */}
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
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(0, 184, 148, 0.12) 100%)',
                border: '1px solid rgba(108, 92, 231, 0.25)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Printer size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text)' }}>
                  Cetak Label Barcode Massal
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(108, 92, 231, 0.12)',
                    color: 'var(--primary-600)',
                  }}
                >
                  {totalLabelsToPrint} Label Siap Cetak
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Format aman untuk Printer Kasir Roll Thermal (anti-kertas los), Printer Label Stiker, dan Kertas A4
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Split Content: Left (Product Selection) & Right (Config & Preview) */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', minHeight: 0 }}>
          {/* ── Left Column: Product Selection Table ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--border)',
              minHeight: 0,
              backgroundColor: 'var(--surface)',
            }}
          >
            {/* Search & Filter Toolbar */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: 'var(--bg)',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Search Box */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                  }}
                >
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, SKU, atau kode barcode..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontSize: '0.8rem',
                      width: '100%',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Select */}
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Semua Kategori ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Batch Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <CheckSquare size={12} style={{ color: 'var(--primary-500)' }} />
                    <span>Pilih Semua</span>
                  </button>

                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Square size={12} />
                    <span>Kosongkan</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {filteredMissingCount > 0 && (
                    <button
                      type="button"
                      onClick={handleGenerateMissingBarcodes}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(108, 92, 231, 0.4)',
                        backgroundColor: 'rgba(108, 92, 231, 0.12)',
                        color: 'var(--primary-600)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="Buat barcode otomatis untuk semua produk yang belum memiliki barcode"
                    >
                      <Zap size={12} style={{ color: '#F39C12' }} />
                      <span>Buat Barcode ({filteredMissingCount})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={setQuantityToStock}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(0, 184, 148, 0.3)',
                      backgroundColor: 'rgba(0, 184, 148, 0.08)',
                      color: '#009B7D',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Set Sesuai Stok</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Missing Barcode Warning Banner */}
            {filteredMissingCount > 0 && (
              <div
                style={{
                  margin: '8px 12px 2px 12px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '0.74rem',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontWeight: 600 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>
                    Ada <strong>{filteredMissingCount} produk</strong> belum memiliki barcode.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateMissingBarcodes}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#F59E0B',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Zap size={12} />
                  <span>Generate Barcode Massal</span>
                </button>
              </div>
            )}

            {/* Product Items List (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredProducts.map((p) => {
                    const isSelected = !!selectedItems[p.id];
                    const currentQty = selectedItems[p.id] || 0;
                    const hasBarcode = !!p.barcode;

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: `1.5px solid ${isSelected ? 'var(--primary-500)' : 'var(--border)'}`,
                          backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.05)' : 'var(--surface)',
                          transition: 'all 0.15s ease',
                          gap: '10px',
                        }}
                      >
                        {/* Checkbox & Product Meta */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            flex: 1,
                            minWidth: 0,
                          }}
                          onClick={() => toggleProduct(p.id)}
                        >
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: `1.5px solid ${isSelected ? 'var(--primary-500)' : 'var(--border)'}`,
                              backgroundColor: isSelected ? 'var(--primary-500)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFF',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                          </div>

                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              border: '1px solid var(--border)',
                              flexShrink: 0,
                            }}
                          >
                            {p.imageEmoji || '📦'}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: 'var(--text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {p.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {hasBarcode ? (
                                <span style={{ fontFamily: 'monospace', color: 'var(--primary-600)', fontWeight: 600 }}>
                                  {p.barcode}
                                </span>
                              ) : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ color: '#EF4444', fontWeight: 600 }}>Belum ada barcode</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateSingleBarcode(p.id);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(108, 92, 231, 0.3)',
                                      backgroundColor: 'rgba(108, 92, 231, 0.1)',
                                      color: 'var(--primary-600)',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                    title="Buat barcode otomatis untuk produk ini"
                                  >
                                    <Zap size={10} style={{ color: '#F39C12' }} />
                                    <span>+ Buat</span>
                                  </button>
                                </div>
                              )}
                              <span>•</span>
                              <span>{formatCurrency(p.sellPrice)}</span>
                              {p.trackStock && (
                                <>
                                  <span>•</span>
                                  <span>Stok: {p.stock}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, -1)}
                            disabled={!isSelected}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg)',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: isSelected ? 'pointer' : 'default',
                              opacity: isSelected ? 1 : 0.4,
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) => setExactQuantity(p.id, Number(e.target.value))}
                            style={{
                              width: '42px',
                              textAlign: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              padding: '2px 4px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg)',
                              color: 'var(--text)',
                              outline: 'none',
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, 1)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg)',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Settings & Live Preview ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              backgroundColor: 'var(--bg)',
            }}
          >
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Paper Selection Card */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} style={{ color: 'var(--primary-500)' }} />
                  <span>Format Kertas Label</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {/* Option 1: Continuous Thermal Roll (Default & Recommended for standard POS) */}
                  <button
                    type="button"
                    onClick={() => setPaperType('continuous')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${paperType === 'continuous' ? '#00B894' : 'var(--border)'}`,
                      backgroundColor: paperType === 'continuous' ? 'rgba(0, 184, 148, 0.08)' : 'var(--bg)',
                      color: paperType === 'continuous' ? '#009B7D' : 'var(--text)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Roll Kasir Thermal (58mm / 80mm)</span>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#00B894',
                            color: '#FFF',
                          }}
                        >
                          Rekomendasi Thermal
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Continuous roll struk biasa — Berurutan dengan garis potong (anti-narik kertas berlebih)
                      </div>
                    </div>
                    {paperType === 'continuous' && <CheckCircle2 size={16} color="#00B894" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Option 2: Dedicated Label Sticker Thermal (40x30mm) */}
                    <button
                      type="button"
                      onClick={() => setPaperType('label')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${paperType === 'label' ? 'var(--primary-500)' : 'var(--border)'}`,
                        backgroundColor: paperType === 'label' ? 'rgba(108, 92, 231, 0.08)' : 'var(--bg)',
                        color: paperType === 'label' ? 'var(--primary-600)' : 'var(--text)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>Stiker Label 40x30</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Khusus printer label stiker celah (gap)
                      </div>
                    </button>

                    {/* Option 3: A4 Sheet */}
                    <button
                      type="button"
                      onClick={() => setPaperType('a4')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${paperType === 'a4' ? 'var(--primary-500)' : 'var(--border)'}`,
                        backgroundColor: paperType === 'a4' ? 'rgba(108, 92, 231, 0.08)' : 'var(--bg)',
                        color: paperType === 'a4' ? 'var(--primary-600)' : 'var(--text)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>Kertas Stiker A4</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Grid 3 Kolom (Tom & Jerry / Fox)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Helpful Guidance Alert for Users */}
                {paperType === 'continuous' ? (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 184, 148, 0.08)',
                      border: '1px solid rgba(0, 184, 148, 0.25)',
                      fontSize: '0.7rem',
                      color: '#009B7D',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Info size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Aman & Hemat Kertas:</strong> Barcode dicetak memanjang ke bawah seperti struk belanja dan langsung berhenti setelah label terakhir selesai dicetak.
                    </span>
                  </div>
                ) : paperType === 'label' ? (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontSize: '0.7rem',
                      color: '#D97706',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Perhatian:</strong> Hanya pilih mode ini jika Anda menggunakan <strong>printer khusus stiker label berkulit/celah</strong> (seperti Xprinter XP-365B). Jika memakai printer struk kasir biasa, pilih <em>Roll Kasir Thermal</em>.
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Elements Visibility Toggle */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} style={{ color: 'var(--primary-500)' }} />
                  <span>Elemen Pada Stiker</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showStoreName}
                      onChange={(e) => setShowStoreName(e.target.checked)}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    <span>Nama Toko</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showProductName}
                      onChange={(e) => setShowProductName(e.target.checked)}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    <span>Nama Produk</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    <span>Harga Jual (Rp)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showBarcodeText}
                      onChange={(e) => setShowBarcodeText(e.target.checked)}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    <span>Nomor Kode Barcode</span>
                  </label>
                </div>
              </div>

              {/* Live Preview Sticker Box */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={14} style={{ color: 'var(--primary-500)' }} />
                    <span>Pratinjau Hasil Cetak</span>
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {paperType === 'continuous' ? 'Format Roll Struk Kasir' : 'Format Stiker Label'}
                  </span>
                </div>

                {printableList.length > 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg)',
                      border: '1px dashed var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    {/* Simulated Real Physical Sticker / Receipt Strip */}
                    <div
                      style={{
                        width: paperType === 'continuous' ? '200px' : '180px',
                        padding: '12px 10px',
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        borderRadius: paperType === 'continuous' ? '2px' : '6px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      {showStoreName && (
                        <div
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            color: '#475569',
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {businessName || 'C-POS Store'}
                        </div>
                      )}

                      {showProductName && (
                        <div
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#0F172A',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {printableList[0].product.name}
                        </div>
                      )}

                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <BarcodeSvgItem
                          value={printableList[0].product.barcode || printableList[0].product.sku || '8991001000018'}
                          width={1.2}
                          height={28}
                          fontSize={9}
                        />
                      </div>

                      {showPrice && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            color: '#000000',
                            marginTop: '2px',
                          }}
                        >
                          {formatCurrency(printableList[0].product.sellPrice)}
                        </div>
                      )}

                      {/* Continuous Mode Cut Guide Preview */}
                      {paperType === 'continuous' && (
                        <div
                          style={{
                            width: '100%',
                            borderBottom: '1.5px dashed #CBD5E1',
                            margin: '8px 0 2px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '0.58rem',
                            color: '#94A3B8',
                          }}
                        >
                          <Scissors size={10} />
                          <span>Garis Potong Stiker</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                    Pilih produk pada daftar sebelah kiri untuk melihat pratinjau.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Print Action Bar */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>
                  {totalSelectedProducts} Produk Terpilih
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Total {totalLabelsToPrint} stiker siap cetak
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={totalLabelsToPrint === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    backgroundColor: totalLabelsToPrint > 0 ? 'var(--primary-500)' : 'var(--border)',
                    color: '#FFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: totalLabelsToPrint > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: totalLabelsToPrint > 0 ? '0 4px 14px rgba(108, 92, 231, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Printer size={15} />
                  <span>Cetak {totalLabelsToPrint} Label</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
