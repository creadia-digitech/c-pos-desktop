import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useStore } from '../../stores/useStore';
import { formatCurrency } from '../../utils/helpers';
import { sound } from '../../utils/sound';
import { Product } from '../../types';
import {
  Camera,
  X,
  Barcode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
} from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (barcode: string, product?: Product) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const { products, addToCart, addToast } = useStore();
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [lastScannedProduct, setLastScannedProduct] = useState<{
    product: Product;
    code: string;
    timestamp: number;
  } | null>(null);
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanCodeRef = useRef<string>('');

  // ── Handle Scanned Code ───────────────────────────────────────────
  const processScannedCode = (decodedText: string) => {
    const now = Date.now();
    const cleanCode = decodedText.trim();

    // Debounce duplicate scans within 1.4 seconds for continuous mode
    if (
      cleanCode === lastScanCodeRef.current &&
      now - lastScanTimeRef.current < 1400
    ) {
      return;
    }

    lastScanTimeRef.current = now;
    lastScanCodeRef.current = cleanCode;

    // Lookup in products catalog
    const matchedProduct = products.find(
      (p) =>
        p.isActive &&
        (p.barcode.toLowerCase() === cleanCode.toLowerCase() ||
          p.sku.toLowerCase() === cleanCode.toLowerCase())
    );

    if (matchedProduct) {
      sound.playBeepSuccess();
      addToCart(matchedProduct);
      setLastScannedProduct({
        product: matchedProduct,
        code: cleanCode,
        timestamp: now,
      });
      setUnrecognizedCode(null);
      addToast('success', `${matchedProduct.name} ditambahkan via barcode`);

      if (onScanSuccess) {
        onScanSuccess(cleanCode, matchedProduct);
      }

      if (!continuousMode) {
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } else {
      sound.playBeepError();
      setUnrecognizedCode(cleanCode);
      addToast('warning', `Barcode "${cleanCode}" tidak terdaftar di katalog`);
      if (onScanSuccess) {
        onScanSuccess(cleanCode, undefined);
      }
    }
  };

  // ── Start / Stop Camera ──────────────────────────────────────────
  const startCamera = async (cameraId?: string) => {
    try {
      setCameraError(null);
      setScannerReady(false);

      if (html5QrCodeRef.current && isScanningRef.current) {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      }

      const qrCode = new Html5Qrcode('c-pos-webcam-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = qrCode;

      const deviceIdToUse = cameraId || selectedCameraId;

      await qrCode.start(
        deviceIdToUse ? { deviceId: { exact: deviceIdToUse } } : { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.85),
              height: Math.floor(minEdge * 0.55),
            };
          },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          processScannedCode(decodedText);
        },
        () => {
          // Frame scan callback (silent)
        }
      );

      isScanningRef.current = true;
      setScannerReady(true);
    } catch (err: any) {
      console.warn('Camera scanner initialization error:', err);
      setCameraError(
        err.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada sistem Anda.'
      );
      setScannerReady(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      }
    } catch {
      // Ignore cleanup error
    }
  };

  // ── Enumerate Cameras & Lifecycle ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          const formatted = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || `Kamera ${idx + 1}`,
          }));
          setCameras(formatted);
          setSelectedCameraId(formatted[0].id);
          startCamera(formatted[0].id);
        } else {
          startCamera();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        startCamera();
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1200,
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
          maxWidth: '520px',
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
            padding: '18px 24px 14px 24px',
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
                background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(0, 184, 148, 0.12) 100%)',
                border: '1px solid rgba(108, 92, 231, 0.25)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(108, 92, 231, 0.12)',
              }}
            >
              <Camera size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text)' }}>
                  Scanner Barcode Kamera
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor:
                      cameraError
                        ? 'rgba(239, 68, 68, 0.1)'
                        : scannerReady
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(245, 158, 11, 0.12)',
                    color: cameraError ? '#EF4444' : scannerReady ? '#10B981' : '#F59E0B',
                    border: `1px solid ${
                      cameraError
                        ? 'rgba(239, 68, 68, 0.25)'
                        : scannerReady
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(245, 158, 11, 0.25)'
                    }`,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: cameraError ? '#EF4444' : scannerReady ? '#10B981' : '#F59E0B',
                    }}
                  />
                  {cameraError ? 'Kamera Tidak Terdeteksi' : scannerReady ? 'Kamera Aktif' : 'Menghubungkan...'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Arahkan barcode produk ke dalam kotak panduan kamera
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
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Camera Viewport Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '18px',
              overflow: 'hidden',
              backgroundColor: '#0F172A',
              border: '2px solid rgba(108, 92, 231, 0.35)',
              minHeight: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* The HTML5 QR Code Mount Element */}
            <div
              id="c-pos-webcam-reader"
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            />

            {/* Viewfinder Reticle Overlay */}
            {scannerReady && !cameraError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Laser scan line animation */}
                <div
                  style={{
                    position: 'absolute',
                    left: '12%',
                    right: '12%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, #10B981 50%, transparent 100%)',
                    boxShadow: '0 0 12px 2px #10B981',
                    animation: 'pulse 1.8s infinite ease-in-out',
                  }}
                />

                {/* Target Corners */}
                <div
                  style={{
                    width: '75%',
                    height: '60%',
                    border: '2px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '14px',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '16px', height: '16px', borderTop: '3px solid #10B981', borderLeft: '3px solid #10B981', borderTopLeftRadius: '6px' }} />
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderTop: '3px solid #10B981', borderRight: '3px solid #10B981', borderTopRightRadius: '6px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '16px', height: '16px', borderBottom: '3px solid #10B981', borderLeft: '3px solid #10B981', borderBottomLeftRadius: '6px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderBottom: '3px solid #10B981', borderRight: '3px solid #10B981', borderBottomRightRadius: '6px' }} />
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {cameraError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  gap: '10px',
                }}
              >
                <AlertCircle size={36} color="#EF4444" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>
                  Kamera Tidak Dapat Diakses
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', maxWidth: '300px' }}>
                  {cameraError}
                </span>
                <button
                  type="button"
                  onClick={() => startCamera(selectedCameraId)}
                  style={{
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback: Last Scanned Item Banner */}
          {lastScannedProduct && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px solid rgba(16, 185, 129, 0.25)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  {lastScannedProduct.product.imageEmoji || '🍱'}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' }}>
                    {lastScannedProduct.product.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                    {formatCurrency(lastScannedProduct.product.sellPrice)} • Masuk Keranjang
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.72rem', fontWeight: 800 }}>
                <CheckCircle2 size={16} />
                <span>+1</span>
              </div>
            </div>
          )}

          {/* Feedback: Unrecognized Barcode Alert */}
          {unrecognizedCode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                border: '1.5px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.75rem',
                color: '#EF4444',
                fontWeight: 700,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>Barcode <strong>"{unrecognizedCode}"</strong> belum terdaftar pada produk mana pun.</span>
            </div>
          )}

          {/* Controls: Camera Switch & Continuous Mode */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            {cameras.length > 1 ? (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startCamera(e.target.value);
                }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    📷 {c.label}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Volume2 size={13} style={{ color: 'var(--primary-500)' }} />
                <span>Efek suara beep aktif saat barcode terbaca</span>
              </div>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.73rem',
                fontWeight: 700,
                color: 'var(--text)',
                cursor: 'pointer',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }}
              />
              <span>Scan Beruntun</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Barcode size={14} style={{ color: 'var(--primary-500)' }} />
            <span>Alat scanner tembak fisik (USB/Wireless) juga otomatis aktif di latar belakang</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
