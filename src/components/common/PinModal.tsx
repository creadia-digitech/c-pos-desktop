import React, { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { useTranslation } from '../../utils/useTranslation';
import { Employee } from '../../types';
import { Lock, Delete, X, Check, ShieldCheck } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose }) => {
  const { employees, login, addToast, currentEmployee } = useStore();
  const { t } = useTranslation();
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(currentEmployee || employees[0] || null);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const pinRef = React.useRef(pin);
  pinRef.current = pin;

  const selectedEmpRef = React.useRef(selectedEmp);
  selectedEmpRef.current = selectedEmp;

  const employeesRef = React.useRef(employees);
  employeesRef.current = employees;

  const verifyPin = React.useCallback(
    (pinToTest: string) => {
      const emp = selectedEmpRef.current;
      const allEmps = employeesRef.current;

      if (!emp) {
        const matched = allEmps.find((e) => e.pin === pinToTest && e.isActive);
        if (matched) {
          login(matched);
          addToast('success', `Selamat bekerja, ${matched.name}!`);
          setPin('');
          onClose();
          return;
        }
        setErrorMsg('PIN tidak cocok dengan karyawan manapun');
        setPin('');
        return;
      }

      if (emp.pin === pinToTest) {
        login(emp);
        addToast('success', `Berhasil masuk sebagai ${emp.name}`);
        setPin('');
        onClose();
      } else {
        setErrorMsg('PIN yang Anda masukkan salah');
        setPin('');
      }
    },
    [login, addToast, onClose]
  );

  const handleNumberClick = React.useCallback(
    (num: string) => {
      const current = pinRef.current;
      if (current.length < 6) {
        const nextPin = current + num;
        setPin(nextPin);
        setErrorMsg('');

        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
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

  // Physical keyboard listener for PinModal
  React.useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleNumberClick, handleBackspace, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 20, 0.78)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        transform: 'translateZ(0)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--surface)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{t('login.title')}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('login.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Employee avatars selector */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            {employees.map((emp) => {
              const isSelected = selectedEmp?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmp(emp);
                    setPin('');
                    setErrorMsg('');
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--primary-50)' : 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    minWidth: '85px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: emp.avatarColor || '#6C5CE7',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: isSelected ? '0 4px 10px rgba(108,92,231,0.3)' : 'none',
                    }}
                  >
                    {emp.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{emp.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{emp.role}</span>
                </button>
              );
            })}
          </div>

          {/* PIN Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: isFilled ? 'var(--primary-500)' : 'var(--border)',
                    transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: isFilled ? '0 0 10px rgba(108, 92, 231, 0.45)' : 'none',
                  }}
                />
              );
            })}
          </div>

          {errorMsg && (
            <div style={{ textAlign: 'center', color: '#D63031', fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}

          {/* Tactile Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              maxWidth: '300px',
              margin: '0 auto',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                style={{
                  height: '56px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {num}
              </button>
            ))}

            <button
              onClick={handleClear}
              style={{
                height: '56px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {t('pos.clear')}
            </button>

            <button
              onClick={() => handleNumberClick('0')}
              style={{
                height: '56px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              0
            </button>

            <button
              onClick={handleBackspace}
              style={{
                height: '56px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <Delete size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
