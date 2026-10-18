import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { Employee } from '../../types';
import { formatDate, formatTime } from '../../utils/helpers';
import {
  Sparkles,
  Lock,
  Check,
  Delete,
  Clock,
  Printer,
  HardDrive,
  Users,
} from 'lucide-react';
import backdropImg from '../../assets/pos_luxury_backdrop_blurred.jpg';
import logoImg from '../../assets/logo.png';

// ── ISOLATED DIGITAL CLOCK (Updates only itself, zero parent re-renders) ──
const LiveDigitalClock = memo(() => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#38BDF8',
          letterSpacing: '0.05em',
        }}
      >
        {formatTime(time)}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>
        {formatDate(time)}
      </div>
    </div>
  );
});
LiveDigitalClock.displayName = 'LiveDigitalClock';

// ── STATIC BACKDROP (Hardware-decoded pre-blurred texture, 0ms paint) ──
const StaticBackdrop = memo(() => (
  <>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url(${backdropImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        transform: 'translateZ(0)',
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 20, 0.62)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  </>
));
StaticBackdrop.displayName = 'StaticBackdrop';

export const WelcomeLoginScreen: React.FC = () => {
  const employees = useStore((s) => s.employees);
  const login = useStore((s) => s.login);
  const businessName = useStore((s) => s.businessName);
  const printerType = useStore((s) => s.printerType);
  const paperWidth = useStore((s) => s.paperWidth);
  const addToast = useStore((s) => s.addToast);
  const addAuditLog = useStore((s) => s.addAuditLog);

  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(
    () => employees.find((e) => e.isActive) || employees[0] || null
  );
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successEmpName, setSuccessEmpName] = useState<string>('');

  // Stable references to prevent keydown listener re-binding
  const pinRef = useRef<string>('');
  pinRef.current = pin;

  const selectedEmpRef = useRef<Employee | null>(selectedEmp);
  selectedEmpRef.current = selectedEmp;

  const employeesRef = useRef<Employee[]>(employees);
  employeesRef.current = employees;

  const isSuccessRef = useRef<boolean>(isSuccess);
  isSuccessRef.current = isSuccess;

  // Update selected employee if initial list was empty
  useEffect(() => {
    if (!selectedEmp && employees.length > 0) {
      setSelectedEmp(employees.find((e) => e.isActive) || employees[0]);
    }
  }, [employees, selectedEmp]);

  const executeLogin = useCallback(
    (emp: Employee) => {
      setIsSuccess(true);
      setSuccessEmpName(emp.name);
      addToast('success', `Selamat datang kembali, ${emp.name}!`);

      addAuditLog({
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.role,
        action: 'login',
        details: `Kasir masuk ke sistem: ${emp.name} (${emp.role.toUpperCase()})`,
      });

      setTimeout(() => {
        login(emp);
      }, 300);
    },
    [addToast, addAuditLog, login]
  );

  const verifyPin = useCallback(
    (pinToTest: string) => {
      const target = selectedEmpRef.current;
      const allEmps = employeesRef.current;

      if (target && target.pin === pinToTest && target.isActive) {
        executeLogin(target);
        return;
      }

      const matched = allEmps.find((e) => e.pin === pinToTest && e.isActive);
      if (matched) {
        executeLogin(matched);
        return;
      }

      setErrorMsg('PIN yang Anda masukkan salah.');
      setIsShaking(true);
      setPin('');
      setTimeout(() => setIsShaking(false), 350);
    },
    [executeLogin]
  );

  // Instant Digit Click (0ms Latency)
  const handleDigit = useCallback(
    (num: string) => {
      if (isSuccessRef.current) return;
      const current = pinRef.current;
      if (current.length >= 6) return;

      const nextPin = current + num;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [verifyPin]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccessRef.current) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  const handleClear = useCallback(() => {
    if (isSuccessRef.current) return;
    setPin('');
    setErrorMsg('');
  }, []);

  // Physical Keyboard Listener (ATTACHED EXACTLY ONCE — ZERO RE-BINDING LATENCY)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSuccessRef.current) return;

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
  }, [handleDigit, handleBackspace, handleClear]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        backgroundColor: '#070B14',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        color: '#FFFFFF',
      }}
    >
      {/* ── 1. STATIC ZERO-COST BACKGROUND ── */}
      <StaticBackdrop />

      {/* ── 2. TOP HEADER BAR ── */}
      <header
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 36px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(10, 15, 28, 0.72)',
          transform: 'translateZ(0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 2px 8px rgba(0, 242, 254, 0.35))',
            }}
          >
            <img src={logoImg} alt="C-POS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.04em', color: '#F8FAFC' }}>
                C-POS DESKTOP
              </span>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                ● Offline Mode
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '1px' }}>
              {businessName || 'Sistem Point of Sale Modern'}
            </div>
          </div>
        </div>

        {/* Live Digital Clock (Zero-lag isolated component) */}
        <LiveDigitalClock />
      </header>

      {/* ── 3. MAIN CONTENT: 2-COLUMN SPLIT ── */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          padding: '24px 48px',
          gap: '40px',
          alignItems: 'center',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* ── LEFT HERO: BRANDING & SYSTEM STATUS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
          <div
            style={{
              width: '88px',
              height: '88px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 10px 25px rgba(0, 184, 148, 0.3))',
            }}
          >
            <img src={logoImg} alt="C-POS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#38BDF8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              <Sparkles size={12} style={{ color: '#F59E0B' }} />
              <span>SISTEM KASIR SIAP DIGUNAKAN</span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 900,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
              }}
            >
              Selamat Datang di{' '}
              <span style={{ color: '#38BDF8' }}>
                {businessName || 'C-POS Store'}
              </span>
            </h1>

            <p style={{ margin: '10px 0 0 0', fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.6, maxWidth: '440px' }}>
              Silakan pilih profil kasir Anda dan masukkan 4-digit PIN keamanan untuk membuka sesi kasir dan memulai transaksi penjualan.
            </p>
          </div>

          {/* Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                color: '#CBD5E1',
                fontWeight: 600,
              }}
            >
              <Printer size={13} style={{ color: '#38BDF8' }} />
              <span>Thermal: {printerType.toUpperCase()} ({paperWidth})</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.72rem',
                color: '#CBD5E1',
                fontWeight: 600,
              }}
            >
              <HardDrive size={13} style={{ color: '#10B981' }} />
              <span>Database Offline Ready</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: HIGH PERFORMANCE INSTANT KEYPAD ── */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: isSuccess ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '28px 24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxWidth: '400px',
            width: '100%',
            margin: '0 auto',
            transform: isShaking ? 'translateX(-6px)' : 'translateZ(0)',
            transition: isShaking ? 'transform 0.05s ease' : 'border-color 0.15s ease',
            contain: 'paint layout',
          }}
        >
          {/* Header of Card */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.12)',
                color: isSuccess ? '#10B981' : '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}
            >
              {isSuccess ? <Check size={22} /> : <Lock size={20} />}
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
              {isSuccess ? `Selamat Bertugas, ${successEmpName}!` : 'Autentikasi Kasir'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '3px 0 0 0' }}>
              {isSuccess ? 'Membuka antarmuka kasir...' : 'Pilih akun & ketik 4 angka PIN'}
            </p>
          </div>

          {/* Cashier Selector Chips */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#64748B',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Pilih Profil Kasir:
            </label>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '2px',
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
                        flex: '0 0 auto',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: isSelected
                          ? '1.5px solid #38BDF8'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected
                          ? 'rgba(56, 189, 248, 0.18)'
                          : 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: emp.avatarColor || '#6C5CE7',
                          color: '#FFF',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {emp.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            color: isSelected ? '#FFFFFF' : '#CBD5E1',
                          }}
                        >
                          {emp.name}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: isSelected ? '#38BDF8' : '#64748B' }}>
                          {emp.role.toUpperCase()}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 4-PIN Indicator Dots (Zero-Transition Instant Response) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', gap: '14px' }}>
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: filled
                        ? (isSuccess ? '#10B981' : '#38BDF8')
                        : 'rgba(255, 255, 255, 0.14)',
                      border: filled
                        ? `2px solid ${isSuccess ? '#10B981' : '#38BDF8'}`
                        : '1.5px solid rgba(255, 255, 255, 0.22)',
                      boxShadow: filled
                        ? `0 0 10px ${isSuccess ? 'rgba(16, 185, 129, 0.7)' : 'rgba(56, 189, 248, 0.7)'}`
                        : 'none',
                    }}
                  />
                );
              })}
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#F87171',
                  textAlign: 'center',
                  marginTop: '4px',
                }}
              >
                {errorMsg}
              </div>
            )}
          </div>

          {/* Tactile 10-Key Numpad (Direct Event Handler, Instantaneous Response) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => {
              const isAction = k === 'C' || k === '⌫';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') handleClear();
                    else if (k === '⌫') handleBackspace();
                    else handleDigit(k);
                  }}
                  style={{
                    height: '48px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isAction ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.07)',
                    color: isAction ? '#94A3B8' : '#F8FAFC',
                    fontSize: isAction ? '0.86rem' : '1.25rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {k === '⌫' ? <Delete size={18} /> : k}
                </button>
              );
            })}
          </div>

          {/* Keyboard Hint */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.66rem',
              color: '#64748B',
            }}
          >
            Bisa mengetik langsung menggunakan keyboard fisik
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 36px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.7rem',
          color: '#64748B',
          backgroundColor: 'rgba(10, 15, 28, 0.72)',
        }}
      >
        <div>C-POS Offline Desktop System • Multi-Cashier Secure Access</div>
        <div>Tekan [ESC] untuk menghapus PIN</div>
      </footer>
    </div>
  );
};
