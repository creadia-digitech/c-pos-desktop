import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '../../stores/useStore';
import logoImg from '../../assets/logo.png';

interface WelcomeSplashScreenProps {
  onComplete: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({ onComplete }) => {
  const { businessName } = useStore();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Menginisialisasi Engine Offline...');
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds cinematic intro

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(pct);

      if (pct < 30) {
        setStatusText('Menginisialisasi Engine Offline C-POS...');
      } else if (pct < 60) {
        setStatusText('Memverifikasi Basis Data & Katalog Produk...');
      } else if (pct < 90) {
        setStatusText('Menyiapkan Antarmuka Kasir & Hardware...');
      } else {
        setStatusText('Sistem Siap Digunakan! Selamat Bertugas.');
      }

      if (pct >= 100) {
        clearInterval(timer);
        setIsFinishing(true);
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 40);

    // Keyboard listener for instant skip on Enter or Space
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        clearInterval(timer);
        setIsFinishing(true);
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isFinishing ? 0 : 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#060912',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── CINEMATIC BLURRED STORE BACKDROP ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/pos_luxury_backdrop_blurred.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 0.35,
          transform: 'translateZ(0)',
          pointerEvents: 'none',
        }}
      />

      {/* Dark Ambient Radial Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, rgba(6, 10, 20, 0.55) 0%, rgba(4, 7, 17, 0.94) 85%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Luminous Embers */}
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: `${(i * 6.5 + 2)}%`,
            y: '105vh',
            opacity: 0,
          }}
          animate={{
            y: '-5vh',
            opacity: [0, 0.7, 0.9, 0],
            x: `calc(${(i * 6.5 + 2)}% + ${(i % 2 === 0 ? 30 : -30)}px)`,
          }}
          transition={{
            duration: 10 + (i % 6) * 2,
            repeat: Infinity,
            delay: (i * 0.6) % 8,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: i % 3 === 0 ? '5px' : '3px',
            height: i % 3 === 0 ? '5px' : '3px',
            borderRadius: '50%',
            backgroundColor: i % 2 === 0 ? '#00F2FE' : '#FFB300',
            boxShadow: i % 2 === 0 ? '0 0 10px #00F2FE, 0 0 20px #00F2FE' : '0 0 10px #FFB300, 0 0 20px #FFB300',
            pointerEvents: 'none',
            filter: 'blur(0.5px)',
          }}
        />
      ))}

      {/* ── AMBIENT MOTION GRAPHIC BACKGROUND GLOWS ── */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.55, 0.35],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.22) 0%, rgba(79, 172, 254, 0.08) 50%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.25, 0.45, 0.25],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 153, 0, 0.18) 0%, rgba(108, 92, 231, 0.12) 50%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Grid Pattern overlay for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── MOTION GRAPHIC CENTERPIECE ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* LOGO CONTAINER WITH ROTATING HALO RINGS */}
        <div
          style={{
            position: 'relative',
            width: '210px',
            height: '210px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '28px',
          }}
        >
          {/* Outer Slow Rotating Ring with Sparkle Points */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-18px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(0, 242, 254, 0.35)',
              boxShadow: '0 0 25px rgba(0, 242, 254, 0.15)',
            }}
          >
            {/* Orbiting Sparkle Dot */}
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#00F2FE',
                boxShadow: '0 0 12px #00F2FE, 0 0 24px #00F2FE',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FF9900',
                boxShadow: '0 0 12px #FF9900, 0 0 24px #FF9900',
              }}
            />
          </motion.div>

          {/* Inner Counter-Rotating Thin Aura */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.05) 0%, transparent 70%)',
            }}
          />

          {/* Glowing Aura Behind Logo */}
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, rgba(79, 172, 254, 0.15) 50%, transparent 80%)',
              filter: 'blur(16px)',
            }}
          />

          {/* Main Logo with Floating Physics & Entrance */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: [0, -6, 0],
            }}
            transition={{
              scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.6 },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
            }}
            style={{
              position: 'relative',
              width: '160px',
              height: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 15px 35px rgba(0, 242, 254, 0.3)) drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5))',
            }}
          >
            <img
              src={logoImg}
              alt="C-POS Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </motion.div>
        </div>

        {/* ── BRANDING & TITLES ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          {/* Top Pill Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              color: '#00F2FE',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={12} style={{ color: '#FF9900' }} />
            <span>OFFLINE DESKTOP SYSTEM</span>
            <ShieldCheck size={12} style={{ color: '#00B894' }} />
          </div>

          {/* Main App Title */}
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #00F2FE 50%, #4FACFE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 10px 30px rgba(0, 242, 254, 0.25)',
            }}
          >
            C - P O S
          </h1>

          {/* Store Name & Tagline */}
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.04em',
            }}
          >
            {businessName ? (
              <>
                Selamat Datang di <strong style={{ color: '#F8FAFC' }}>{businessName}</strong>
              </>
            ) : (
              'Point of Sale & Inventory Management'
            )}
          </p>
        </motion.div>

        {/* ── PROGRESS BAR & DYNAMIC STATUS ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            marginTop: '36px',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Glowing Track */}
          <div
            style={{
              width: '100%',
              height: '5px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.6)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00F2FE, #4FACFE 60%, #FF9900)',
                borderRadius: '10px',
                boxShadow: '0 0 12px rgba(0, 242, 254, 0.7)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          {/* Live Status Text */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#64748B',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: progress >= 100 ? '#00B894' : '#00F2FE',
                  boxShadow: progress >= 100 ? '0 0 8px #00B894' : '0 0 8px #00F2FE',
                }}
              />
              <span style={{ color: progress >= 100 ? '#00B894' : '#94A3B8' }}>{statusText}</span>
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#00F2FE' }}>
              {progress}%
            </span>
          </div>
        </motion.div>

        {/* Skip Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsFinishing(true);
            onComplete();
          }}
          style={{
            marginTop: '32px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '7px 18px',
            borderRadius: '20px',
            color: '#94A3B8',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <span>Mulai Langsung</span>
          <ArrowRight size={13} />
        </motion.button>
      </div>

      {/* Footer Version info */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          color: '#475569',
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        C-POS Offline Desktop v1.0 • Enterprise Edition
      </div>
    </motion.div>
  );
};
