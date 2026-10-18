// ── C-POS Offline License & Hardware Protection Engine ──────────────

export const LICENSE_MASTER_SALT = 'CPOS_2026_OFFLINE_LICENSE_SECURE_SALT_KEY!#888';
export const LICENSE_STORAGE_KEY = 'cpos_license_certificate_v1';
export const FALLBACK_HWID_KEY = 'cpos_fallback_machine_hwid';

// Anda dapat mengisi nomor WhatsApp Anda di sini (format internasional tanpa +, contoh: '6281234567890')
// Jika dikosongkan (''), WhatsApp akan otomatis membuka daftar kontak pembeli untuk memilih penerima.
export const SELLER_WHATSAPP_NUMBER = '';

export interface LicenseCertificate {
  isActivated: boolean;
  licenseKey: string;
  machineId: string;
  licenseType: 'lifetime' | 'annual';
  storeName: string;
  activatedAt: string;
}

/**
 * Fetch the hardware Machine ID (HWID) from the Electron native host,
 * or generate a persistent local HWID for development / browser environments.
 */
export async function getMachineId(): Promise<string> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI && typeof electronAPI.getMachineId === 'function') {
    try {
      const hwid = await electronAPI.getMachineId();
      if (hwid && typeof hwid === 'string' && hwid.startsWith('CPOS-')) {
        return hwid.trim().toUpperCase();
      }
    } catch (err) {
      console.warn('Native HWID check fallback:', err);
    }
  }

  // Persistent fallback for browser / development preview
  let fallback = localStorage.getItem(FALLBACK_HWID_KEY);
  if (!fallback) {
    const randPart = Array.from({ length: 3 }, () =>
      Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, '0')
        .toUpperCase()
    ).join('-');
    fallback = `CPOS-${randPart}`;
    localStorage.setItem(FALLBACK_HWID_KEY, fallback);
  }
  return fallback;
}

/**
 * Compute the expected HMAC-SHA256 signature using the Web Crypto API
 */
export async function computeHmacSignature(message: string, salt: string = LICENSE_MASTER_SALT): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Generate expected Serial Key for a given HWID
 */
export async function calculateExpectedSerialKey(hwid: string, type: string = 'LIFE'): Promise<string> {
  const cleanHwid = hwid.trim().toUpperCase();
  const payload = `${cleanHwid}:${type}:${LICENSE_MASTER_SALT}`;
  const hmac = await computeHmacSignature(payload, LICENSE_MASTER_SALT);
  return `CPOS-${type}-${hmac.slice(0, 4)}-${hmac.slice(4, 8)}-${hmac.slice(8, 12)}`;
}

/**
 * Verify whether an entered Serial Key matches the target Machine ID
 */
export async function verifyLicenseKey(hwid: string, key: string): Promise<boolean> {
  if (!key || typeof key !== 'string') return false;
  const cleanKey = key.trim().toUpperCase().replace(/\s+/g, '');
  const parts = cleanKey.split('-');
  if (parts.length !== 5 || parts[0] !== 'CPOS') return false;

  const type = parts[1]; // e.g. 'LIFE'
  const expectedKey = await calculateExpectedSerialKey(hwid, type);
  return cleanKey === expectedKey;
}

export const TRIAL_STORAGE_KEY = 'cpos_trial_session_v1';

export interface TrialSession {
  machineId: string;
  startedAt: string;
  durationDays: number;
  maxTransactions: number;
  lastMonotonicTimestamp: number;
  signature: string;
  isTampered: boolean;
  tamperedReason?: string;
}

export interface TrialStatus {
  isTrial: boolean;
  isValid: boolean;
  daysRemaining: number;
  maxTransactions: number;
  completedTransactions: number;
  transactionsRemaining: number;
  isExpired: boolean;
  expiredReason?: 'time' | 'transactions' | 'tampering' | 'none';
  session?: TrialSession;
}

/**
 * Sync storage helper with Electron native persistent token fallback
 */
async function saveTokenToStorage(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.saveSecureToken === 'function') {
      await electronAPI.saveSecureToken(key, value);
    }
  } catch (e) {}
}

async function loadTokenFromStorage(key: string): Promise<string | null> {
  try {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.loadSecureToken === 'function') {
      const nativeVal = await electronAPI.loadSecureToken(key);
      if (nativeVal && typeof nativeVal === 'string' && nativeVal.trim() !== '') {
        return nativeVal;
      }
    }
    return localStorage.getItem(key);
  } catch (e) {
    return localStorage.getItem(key);
  }
}

/**
 * Cryptographic HMAC signature for trial token to prevent manual tampering
 */
export async function computeTrialSignature(machineId: string, startedAt: string): Promise<string> {
  const payload = `${machineId.toUpperCase()}:TRIAL_V1:${startedAt}:${LICENSE_MASTER_SALT}`;
  return computeHmacSignature(payload, LICENSE_MASTER_SALT);
}

/**
 * Start instant 7-day free trial bound to this physical machine HWID
 */
export async function startInstantTrial(): Promise<{ success: boolean; message: string; trial?: TrialStatus }> {
  const hwid = await getMachineId();

  // Check if trial session already exists in system
  const existingRaw = await loadTokenFromStorage(TRIAL_STORAGE_KEY);
  if (existingRaw) {
    try {
      const session = JSON.parse(existingRaw) as TrialSession;
      if (session && session.machineId.toUpperCase() === hwid.toUpperCase()) {
        const status = await evaluateTrialStatus(0);
        if (status.isExpired) {
          let reasonMsg = 'Masa demo 7 hari untuk komputer ini telah habis.';
          if (status.expiredReason === 'tampering') {
            reasonMsg = 'Perubahan waktu sistem komputer terdeteksi. Masa demo dibekukan.';
          } else if (status.expiredReason === 'transactions') {
            reasonMsg = 'Batas 50 transaksi demo telah tercapai.';
          }
          return {
            success: false,
            message: `${reasonMsg} Silakan hubungi admin untuk aktivasi lisensi resmi.`,
            trial: status,
          };
        }
        return {
          success: true,
          message: 'Melanjutkan masa demo aktif.',
          trial: status,
        };
      }
    } catch (e) {}
  }

  const now = Date.now();
  const startedAt = new Date(now).toISOString();
  const signature = await computeTrialSignature(hwid, startedAt);

  const newSession: TrialSession = {
    machineId: hwid,
    startedAt,
    durationDays: 7,
    maxTransactions: 50,
    lastMonotonicTimestamp: now,
    signature,
    isTampered: false,
  };

  await saveTokenToStorage(TRIAL_STORAGE_KEY, JSON.stringify(newSession));
  const status = await evaluateTrialStatus(0);
  return {
    success: true,
    message: 'Mode demo 7 hari berhasil diaktifkan! Selamat mencoba C-POS.',
    trial: status,
  };
}

/**
 * Evaluate current trial status with anti-rollback clock check & transaction limits
 */
export async function evaluateTrialStatus(transactionCount: number = 0): Promise<TrialStatus> {
  const hwid = await getMachineId();
  const raw = await loadTokenFromStorage(TRIAL_STORAGE_KEY);
  if (!raw) {
    return {
      isTrial: false,
      isValid: false,
      daysRemaining: 7,
      maxTransactions: 50,
      completedTransactions: 0,
      transactionsRemaining: 50,
      isExpired: false,
      expiredReason: 'none',
    };
  }

  try {
    const session = JSON.parse(raw) as TrialSession;
    if (session.machineId.toUpperCase() !== hwid.toUpperCase()) {
      return {
        isTrial: true,
        isValid: false,
        daysRemaining: 0,
        maxTransactions: 50,
        completedTransactions: transactionCount,
        transactionsRemaining: 0,
        isExpired: true,
        expiredReason: 'tampering',
      };
    }

    // Verify cryptographic signature of the trial start date
    const expectedSig = await computeTrialSignature(hwid, session.startedAt);
    if (expectedSig !== session.signature) {
      return {
        isTrial: true,
        isValid: false,
        daysRemaining: 0,
        maxTransactions: 50,
        completedTransactions: transactionCount,
        transactionsRemaining: 0,
        isExpired: true,
        expiredReason: 'tampering',
      };
    }

    const now = Date.now();

    // ── ANTI-ROLLBACK CLOCK CHECK ──
    // If current system time is set backwards more than 1 hour relative to the latest recorded time
    if (now < session.lastMonotonicTimestamp - 3600000) {
      session.isTampered = true;
      session.tamperedReason = 'Manipulasi waktu sistem (Clock Rollback) terdeteksi.';
      await saveTokenToStorage(TRIAL_STORAGE_KEY, JSON.stringify(session));
      return {
        isTrial: true,
        isValid: false,
        daysRemaining: 0,
        maxTransactions: session.maxTransactions || 50,
        completedTransactions: transactionCount,
        transactionsRemaining: 0,
        isExpired: true,
        expiredReason: 'tampering',
        session,
      };
    }

    // System time moves forward or within tolerance; update monotonic timestamp
    if (now > session.lastMonotonicTimestamp) {
      session.lastMonotonicTimestamp = now;
      await saveTokenToStorage(TRIAL_STORAGE_KEY, JSON.stringify(session));
    }

    if (session.isTampered) {
      return {
        isTrial: true,
        isValid: false,
        daysRemaining: 0,
        maxTransactions: session.maxTransactions || 50,
        completedTransactions: transactionCount,
        transactionsRemaining: 0,
        isExpired: true,
        expiredReason: 'tampering',
        session,
      };
    }

    const startedTime = new Date(session.startedAt).getTime();
    const elapsedDays = Math.floor((now - startedTime) / (24 * 60 * 60 * 1000));
    const durationDays = session.durationDays || 7;
    const daysRemaining = Math.max(0, durationDays - elapsedDays);
    const maxTransactions = session.maxTransactions || 50;
    const transactionsRemaining = Math.max(0, maxTransactions - transactionCount);

    if (daysRemaining <= 0) {
      return {
        isTrial: true,
        isValid: false,
        daysRemaining: 0,
        maxTransactions,
        completedTransactions: transactionCount,
        transactionsRemaining: 0,
        isExpired: true,
        expiredReason: 'time',
        session,
      };
    }

    if (transactionsRemaining <= 0) {
      return {
        isTrial: true,
        isValid: false,
        daysRemaining,
        maxTransactions,
        completedTransactions: transactionCount,
        transactionsRemaining: 0,
        isExpired: true,
        expiredReason: 'transactions',
        session,
      };
    }

    return {
      isTrial: true,
      isValid: true,
      daysRemaining,
      maxTransactions,
      completedTransactions: transactionCount,
      transactionsRemaining,
      isExpired: false,
      expiredReason: 'none',
      session,
    };
  } catch (err) {
    return {
      isTrial: false,
      isValid: false,
      daysRemaining: 0,
      maxTransactions: 50,
      completedTransactions: transactionCount,
      transactionsRemaining: 0,
      isExpired: true,
      expiredReason: 'tampering',
    };
  }
}

/**
 * Retrieve saved license certificate from local persistent storage
 */
export function getSavedLicense(): LicenseCertificate | null {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.isActivated && data.licenseKey && data.machineId) {
      return data as LicenseCertificate;
    }
  } catch (err) {
    console.error('Failed to parse license certificate:', err);
  }
  return null;
}

/**
 * Full check to determine if the local machine is currently licensed and activated
 * Returns true if activated permanently OR if currently in a valid trial session
 */
export async function checkIsMachineActivated(transactionCount: number = 0): Promise<{
  isActivated: boolean;
  machineId: string;
  certificate: LicenseCertificate | null;
  isTrial: boolean;
  trialStatus: TrialStatus | null;
}> {
  const currentHwid = await getMachineId();
  const cert = getSavedLicense();

  if (cert) {
    // Strict check: Certificate MUST match current physical machine HWID
    if (cert.machineId.toUpperCase() === currentHwid.toUpperCase()) {
      const isValid = await verifyLicenseKey(currentHwid, cert.licenseKey);
      if (isValid) {
        return {
          isActivated: true,
          machineId: currentHwid,
          certificate: cert,
          isTrial: false,
          trialStatus: null,
        };
      }
    }
  }

  // Check trial session
  const trial = await evaluateTrialStatus(transactionCount);
  if (trial.isTrial && trial.isValid && !trial.isExpired) {
    return {
      isActivated: true,
      machineId: currentHwid,
      certificate: null,
      isTrial: true,
      trialStatus: trial,
    };
  }

  return {
    isActivated: false,
    machineId: currentHwid,
    certificate: null,
    isTrial: trial.isTrial,
    trialStatus: trial,
  };
}

/**
 * Activate the current machine with a serial key
 */
export async function activateMachineLicense(
  serialKey: string,
  storeName: string = 'Toko C-POS'
): Promise<{ success: boolean; message: string }> {
  const hwid = await getMachineId();
  const isValid = await verifyLicenseKey(hwid, serialKey);

  if (!isValid) {
    return {
      success: false,
      message: 'Serial Key tidak cocok dengan ID Perangkat (HWID) komputer ini.',
    };
  }

  const parts = serialKey.trim().toUpperCase().split('-');
  const typeCode = parts[1] || 'LIFE';

  // If activating using a Trial key from the Keygen generator
  if (typeCode.startsWith('TR')) {
    const days = parseInt(typeCode.replace(/\D/g, ''), 10) || 7;
    const now = Date.now();
    const startedAt = new Date(now).toISOString();
    const signature = await computeTrialSignature(hwid, startedAt);

    const newSession: TrialSession = {
      machineId: hwid,
      startedAt,
      durationDays: days,
      maxTransactions: 50,
      lastMonotonicTimestamp: now,
      signature,
      isTampered: false,
    };

    await saveTokenToStorage(TRIAL_STORAGE_KEY, JSON.stringify(newSession));
    return {
      success: true,
      message: `Masa demo ${days} hari berhasil diaktivasi via Serial Key!`,
    };
  }

  const cert: LicenseCertificate = {
    isActivated: true,
    licenseKey: serialKey.trim().toUpperCase(),
    machineId: hwid,
    licenseType: typeCode === 'YEAR' ? 'annual' : 'lifetime',
    storeName: storeName.trim(),
    activatedAt: new Date().toISOString(),
  };

  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(cert));
  return {
    success: true,
    message:
      typeCode === 'YEAR'
        ? 'Lisensi C-POS (1 Tahun) berhasil diaktivasi!'
        : 'Lisensi C-POS berhasil diaktivasi secara permanen (LIFETIME)!',
  };
}

/**
 * Remove stored license certificate
 */
export function removeLicense(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
}

/**
 * Build pre-filled text for WhatsApp message
 */
export function buildWhatsAppMessageText(hwid: string, storeName?: string): string {
  const name = storeName && storeName.trim() ? storeName.trim() : 'Toko Saya';
  return (
    `Halo Admin C-POS, saya ingin melakukan aktivasi lisensi software kasir C-POS.\n\n` +
    `• Nama Toko           : ${name}\n` +
    `• ID Perangkat (HWID) : ${hwid}\n` +
    `• Tipe Lisensi        : Lifetime (Permanen Seumur Hidup)\n\n` +
    `Mohon kirimkan Serial Key aktivasi resmi untuk perangkat saya. Terima kasih!`
  );
}

/**
 * Build direct WhatsApp Web / app click URL
 */
export function buildWhatsAppUrl(hwid: string, storeName?: string, phone: string = SELLER_WHATSAPP_NUMBER): string {
  const text = encodeURIComponent(buildWhatsAppMessageText(hwid, storeName));
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }
  return `https://api.whatsapp.com/send?text=${text}`;
}
