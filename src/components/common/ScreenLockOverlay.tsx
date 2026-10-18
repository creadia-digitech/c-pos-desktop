import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useStore } from '../../stores/useStore';
import { formatDate, formatTime } from '../../utils/helpers';
import { Lock, Delete, Clock, ShieldCheck } from 'lucide-react';
import logoImg from '../../assets/logo.png';

// ── ISOLATED DIGITAL CLOCK FOR LOCK SCREEN ──
const ScreenLockClock = memo(() => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginTop: '4px',
      }}
    >
      <Clock size={13} style={{ color: 'var(--primary-500)' }} />
      <span>{formatDate(time, 'long')}</span>
      <span>•</span>
      <span style={{ fontWeight: 800, color: 'var(--text)' }}>{formatTime(time)}</span>
    </div>
  );
});
ScreenLockClock.displayName = 'ScreenLockClock';

export const ScreenLockOverlay: React.FC = () => {
  const isScreenLocked = useStore((s) => s.isScreenLocked);
  const unlockScreen = useStore((s) => s.unlockScreen);
  const businessName = useStore((s) => s.businessName);
  const currentEmployee = useStore((s) => s.currentEmployee);
  const employees = useStore((s) => s.employees);
  const login = useStore((s) => s.login);
  const addToast = useStore((s) => s.addToast);

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(currentEmployee || employees[0] || null);

  // Stable references for instant keyboard events without listener re-binding
  const pinRef = useRef(pin);
  pinRef.current = pin;

  const selectedEmpRef = useRef(selectedEmp);
  selectedEmpRef.current = selectedEmp;

  const employeesRef = useRef(employees);
  employeesRef.current = employees;

  // Reset state when screen is locked
  useEffect(() => {
    if (isScreenLocked) {
      setSelectedEmp(currentEmployee || employees[0] || null);
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
    }
  }, [isScreenLocked, currentEmployee, employees]);

  const attemptUnlock = useCallback(
    (pinToTest: string) => {
      const target = selectedEmpRef.current;
      if (target && target.pin === pinToTest) {
        login(target);
        unlockScreen(pinToTest);
        addToast('success', `Layar terbuka. Selamat bertugas kembali, ${target.name}!`);
        setPin('');
        return;
      }

      const success = unlockScreen(pinToTest);
      if (success) {
        addToast('success', 'Layar kasir berhasil dibuka!');
        setPin('');
      } else {
        setErrorMsg('PIN kasir tidak cocok!');
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 350);
      }
    },
    [login, unlockScreen, addToast]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      const current = pinRef.current;
      if (current.length >= 6) return;
      const nextPin = current + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        attemptUnlock(nextPin);
      }
    },
    [attemptUnlock]
  );

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setErrorMsg('');
  }, []);

  // Physical keyboard listener: Attached ONCE per lock session
  useEffect(() => {
    if (!isScreenLocked) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isScreenLocked, handleDigit, handleBackspace, handleClear]);

  if (!isScreenLocked) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(7, 11, 20, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        userSelect: 'none',
        transform: 'translateZ(0)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: 'var(--surface)',
          borderRadius: '26px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 24px 24px 24px',
          position: 'relative',
          transform: isShaking ? 'translateX(-6px)' : 'translateZ(0)',
          transition: isShaking ? 'transform 0.05s ease' : 'none',
          contain: 'paint layout',
        }}
      >
        {/* Top Gold Security Accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #F59E0B 0%, var(--primary-500) 50%, #10B981 100%)',
          }}
        />

        {/* Logo + Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              filter: 'drop-shadow(0 4px 12px rgba(0, 242, 254, 0.35))',
            }}
          >
            <img
              src={logoImg}
              alt="C-POS"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.2px' }}>
            {businessName || 'C-POS Store'}
          </h2>

          {/* Isolated Digital Clock */}
          <ScreenLockClock />
        </div>

        {/* Staff Chips Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            maxWidth: '100%',
          }}
        >
          {employees
            .filter((e) => e.isActive)
            .map((emp) => {
              const isSelected = selectedEmp?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    setSelectedEmp(emp);
                    setPin('');
                    setErrorMsg('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px 4px 5px',
                    borderRadius: '20px',
                    border: isSelected ? '1.5px solid var(--primary-500)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg)',
                    color: isSelected ? 'var(--primary-700)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 800 : 600,
                    outline: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: emp.avatarColor || '#6C5CE7',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                    }}
                  >
                    {emp.name.charAt(0)}
                  </div>
                  <span>{emp.name}</span>
                </button>
              );
            })}
        </div>

        {/* Instruction */}
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 14px 0', textAlign: 'center' }}>
          Masukkan 4 digit PIN kasir <strong>{selectedEmp?.name || ''}</strong> untuk membuka kunci:
        </p>

        {/* PIN Dots Indicator (Instantaneous Response) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
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
        {errorMsg && (
          <div
            style={{
              color: '#EF4444',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '14px',
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Numeric Keypad (Instant Response) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              style={{
                height: '52px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '1.3rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
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
              height: '52px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            HAPUS
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{
              height: '52px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '1.3rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
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
              height: '52px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            <Delete size={20} />
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Ketik angka melalui keyboard fisik atau layar sentuh
        </div>
      </div>
    </div>
  );
};
