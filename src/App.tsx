import React, { useState, useEffect } from 'react';
import { useStore } from './stores/useStore';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { PinModal } from './components/common/PinModal';
import { PaymentModal } from './components/pos/PaymentModal';
import { SuccessReceiptModal } from './components/pos/SuccessReceiptModal';
import { ShiftModal } from './components/pos/ShiftModal';
import { ScreenLockOverlay } from './components/common/ScreenLockOverlay';
import { PageLockModal } from './components/common/PageLockModal';
import { hasPageAccess, PAGE_PERMISSIONS } from './utils/rbac';
import { Lock, KeyRound } from 'lucide-react';

// Pages
import { PosPage } from './pages/PosPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupWizard } from './pages/SetupWizard';

import { checkIsMachineActivated } from './utils/license';
import { LicenseActivationScreen } from './components/common/LicenseActivationScreen';
import { WelcomeSplashScreen } from './components/common/WelcomeSplashScreen';
import { WelcomeLoginScreen } from './components/common/WelcomeLoginScreen';

export const App: React.FC = () => {
  const {
    setupCompleted,
    theme,
    currentPage,
    setCurrentPage,
    currentEmployee,
    employees,
    authorizedPages,
    login,
    transactions,
    setIsTrial,
    setTrialStatus,
  } = useStore();

  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pageGuardModalTarget, setPageGuardModalTarget] = useState<string | null>(null);

  // Check hardware lock & license on startup with timeout safeguard
  useEffect(() => {
    let mounted = true;

    // Timeout safety fallback: never allow app to hang on blank/loading screen
    const timeoutTimer = setTimeout(() => {
      if (mounted && isLicensed === null) {
        console.warn('License check timed out, defaulting to activation screen');
        setIsLicensed(false);
      }
    }, 2000);

    checkIsMachineActivated(transactions.length)
      .then((res) => {
        if (mounted) {
          clearTimeout(timeoutTimer);
          setIsLicensed(res.isActivated);
          setIsTrial(res.isTrial);
          setTrialStatus(res.trialStatus);
        }
      })
      .catch((err) => {
        console.error('License check error:', err);
        if (mounted) {
          clearTimeout(timeoutTimer);
          setIsLicensed(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutTimer);
    };
  }, []);

  // Sync theme with HTML root attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // If still checking license integrity on cold start
  if (isLicensed === null) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#090D16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(59, 130, 246, 0.2)',
              borderTopColor: '#3B82F6',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
            MEMERIKSA INTEGRITAS PERANGKAT C-POS...
          </p>
        </div>
      </div>
    );
  }

  // If machine is not activated, IMMEDIATELY lock app (No trial, serial key required)
  if (!isLicensed) {
    return (
      <>
        <LicenseActivationScreen
          onActivated={() => {
            setIsLicensed(true);
            checkIsMachineActivated(transactions.length).then((r) => {
              setIsTrial(r.isTrial);
              setTrialStatus(r.trialStatus);
            });
          }}
        />
        <ToastContainer />
      </>
    );
  }

  // Render initial Onboarding wizard if first time
  if (!setupCompleted) {
    return (
      <>
        <SetupWizard />
        <ToastContainer />
      </>
    );
  }

  // ── LUXURIOUS WELCOME SPLASH SCREEN (Cold Start / App Launch) ──
  if (showSplash) {
    return (
      <>
        <WelcomeSplashScreen onComplete={() => setShowSplash(false)} />
        <ToastContainer />
      </>
    );
  }

  // ── LUXURIOUS WELCOME & CASHIER AUTHENTICATION SCREEN (When Logged Out) ──
  if (!currentEmployee) {
    return (
      <>
        <WelcomeLoginScreen />
        <ToastContainer />
      </>
    );
  }

  const renderCurrentPage = () => {
    // RBAC Route Guard: Verify access permission
    const isPageAllowed = hasPageAccess(currentEmployee?.role, currentPage, authorizedPages);
    if (!isPageAllowed) {
      const config = PAGE_PERMISSIONS[currentPage];
      return (
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '450px',
              backgroundColor: 'var(--surface)',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              padding: '36px 28px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Lock size={30} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px 0' }}>
              Akses Menu Dibatasi
            </h2>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '4px 12px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                marginBottom: '12px',
              }}
            >
              Wajib Otorisasi: {config?.requiredRoleLabel || 'Supervisor'}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: '0 0 22px 0' }}>
              Halaman <strong>{config?.label || currentPage}</strong> dibatasi untuk menjaga keamanan data & pembukuan toko.
              Masuk sebagai Manager/Owner atau masukkan PIN untuk membuka.
            </p>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={() => setCurrentPage('pos')}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Kembali ke Kasir
              </button>
              <button
                onClick={() => setPageGuardModalTarget(currentPage)}
                style={{
                  flex: 1.4,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--primary-500)',
                  color: '#FFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
                }}
              >
                <KeyRound size={15} />
                <span>Buka dengan PIN</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'pos':
        return <PosPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'products':
        return <ProductsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'shifts':
        return <ShiftsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PosPage />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header onOpenPinModal={() => setIsPinModalOpen(true)} />

      {/* Main Layout Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {renderCurrentPage()}
        </main>
      </div>

      {/* Modals & Notifications */}
      <PaymentModal />
      <SuccessReceiptModal />
      <ShiftModal />
      <PinModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} />
      <ScreenLockOverlay />
      <PageLockModal
        isOpen={!!pageGuardModalTarget}
        pageId={pageGuardModalTarget}
        onClose={() => setPageGuardModalTarget(null)}
        onSuccess={() => setPageGuardModalTarget(null)}
      />
      <ToastContainer />
    </div>
  );
};

export default App;
