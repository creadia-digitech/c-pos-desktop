import React, { useState, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import { PAGE_PERMISSIONS } from '../../utils/rbac';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, KeyRound, Delete, X, CheckCircle2 } from 'lucide-react';

interface PageLockModalProps {
  isOpen: boolean;
  pageId: string | null;
  onClose: () => void;
  onSuccess: (pageId: string) => void;
}

export const PageLockModal: React.FC<PageLockModalProps> = ({
  isOpen,
  pageId,
  onClose,
  onSuccess,
}) => {
  const { employees, currentEmployee, authorizePage, addAuditLog, addToast } = useStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const config = pageId ? PAGE_PERMISSIONS[pageId] : null;

  // Filter employees that have required roles
  const authorizedStaff = employees.filter(
    (e) => e.isActive && config?.allowedRoles.includes(e.role)
  );

  const pinRef = React.useRef(pin);
  pinRef.current = pin;

  const authorizedStaffRef = React.useRef(authorizedStaff);
  authorizedStaffRef.current = authorizedStaff;

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
    }
  }, [isOpen, pageId]);

  const verifyPin = React.useCallback(
    (pinToTest: string) => {
      if (!config || !pageId) return;
      const matched = authorizedStaffRef.current.find((e) => e.pin === pinToTest);
      if (matched) {
        authorizePage(pageId);
        addAuditLog({
          employeeId: currentEmployee?.id || 'sys',
          employeeName: currentEmployee?.name || 'Kasir',
          employeeRole: currentEmployee?.role || 'cashier',
          action: 'settings_change',
          details: `Otorisasi akses menu ${config.label} (${config.id}) oleh ${matched.name} (${matched.role.toUpperCase()})`,
          authorizedBy: matched.name,
        });

        addToast('success', `Akses ${config.label} disetujui oleh ${matched.name} (${matched.role.toUpperCase()})`);
        onSuccess(pageId);
        onClose();
      } else {
        setErrorMsg(`PIN tidak cocok dengan akun staf yang berhak (${config.requiredRoleLabel})`);
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 400);
      }
    },
    [config, pageId, authorizePage, addAuditLog, currentEmployee, addToast, onSuccess, onClose]
  );

  const handleDigit = React.useCallback(
    (digit: string) => {
      const current = pinRef.current;
      if (current.length >= 6) return;
      const nextPin = current + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [verifyPin]
  );

  const handleBackspace = React.useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  const handleClear = React.useCallback(() => {
    setPin('');
    setErrorMsg('');
  }, []);

  // Physical keyboard listener: Attached ONCE per modal session
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, onClose]);

  if (!isOpen || !config || !pageId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 20, 0.82)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        transform: 'translateZ(0)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isShaking ? [-10, 10, -8, 8, -4, 4, 0] : 0,
        }}
        transition={{ duration: isShaking ? 0.4 : 0.2 }}
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Security Line Accent */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 60%, var(--primary-500) 100%)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px 14px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)' }}>
                Akses Terbatas: {config.label}
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#EF4444',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Memerlukan Hak Akses: {config.requiredRoleLabel}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p
            style={{
              fontSize: '0.77rem',
              color: 'var(--text-muted)',
              margin: '0 0 12px 0',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {config.description}. Silakan masukkan PIN Supervisor/Owner untuk membuka akses:
          </p>

          {/* Qualified Staff Pills */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
            {authorizedStaff.map((st) => (
              <span
                key={st.id}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: st.avatarColor || 'var(--primary-500)',
                  }}
                />
                {st.name} ({st.role.toUpperCase()})
              </span>
            ))}
          </div>

          {/* PIN Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '14px' }}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: isFilled ? 'var(--primary-500)' : 'var(--border)',
                    transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: isFilled ? '0 0 10px rgba(108, 92, 231, 0.45)' : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* Error Message */}
          <div style={{ minHeight: '20px', marginBottom: '8px', textAlign: 'center' }}>
            {errorMsg && (
              <span style={{ color: '#EF4444', fontSize: '0.74rem', fontWeight: 700 }}>
                {errorMsg}
              </span>
            )}
          </div>

          {/* Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              width: '100%',
              maxWidth: '280px',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.1s ease',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.93)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              HAPUS
            </button>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '1.25rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.93)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              style={{
                height: '48px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Delete size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
