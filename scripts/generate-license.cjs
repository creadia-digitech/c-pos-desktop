#!/usr/bin/env node
const crypto = require('crypto');

const MASTER_SALT = 'CPOS_2026_OFFLINE_LICENSE_SECURE_SALT_KEY!#888';

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║             C-POS OFFICIAL LICENSE KEY GENERATOR                 ║
║                   (Tool Khusus Developer)                       ║
╚══════════════════════════════════════════════════════════════════╝

Penggunaan:
  npm run gen-key <HWID> [NAMA_TOKO] [TIPE_LISENSI]

Contoh:
  npm run gen-key CPOS-4F8E-903D-4844 "Kopi Kenangan"
  npm run gen-key CPOS-4F8E-903D-4844 "Warung Berkah" LIFE
`);
  process.exit(0);
}

const rawHwid = args[0].trim().toUpperCase();
const storeName = args[1] ? args[1].trim() : 'Toko Pelanggan C-POS';
const type = (args[2] || 'LIFE').trim().toUpperCase();

// Basic HWID pattern check
if (!rawHwid.startsWith('CPOS-') || rawHwid.split('-').length < 4) {
  console.error(`\n❌ Error: Format HWID tidak valid! Format harus seperti: CPOS-XXXX-XXXX-XXXX (diterima: ${rawHwid})\n`);
  process.exit(1);
}

// Generate HMAC signature
const payload = `${rawHwid}:${type}:${MASTER_SALT}`;
const hmac = crypto.createHmac('sha256', MASTER_SALT).update(payload).digest('hex').toUpperCase();

// Group into CPOS-LIFE-XXXX-XXXX-XXXX
const serialKey = `CPOS-${type}-${hmac.slice(0, 4)}-${hmac.slice(4, 8)}-${hmac.slice(8, 12)}`;

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               C-POS LICENSE KEY GENERATED                        ║
╚══════════════════════════════════════════════════════════════════╝

  📋 ID Perangkat (HWID) : ${rawHwid}
  🏪 Nama Toko           : ${storeName}
  🏷️  Tipe Lisensi        : ${type === 'LIFE' ? 'LIFETIME (Seumur Hidup / Permanen)' : type}
  📅 Tanggal Dibuat      : ${new Date().toLocaleString('id-ID')}

  🔑 SERIAL KEY RESMI    :
  ┌──────────────────────────────────────────────────────────────┐
  │  ${serialKey}                              │
  └──────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────
💬 TEMPLATE PESAN WHATSAPP SIAP KIRIM KE PEMBELI:
────────────────────────────────────────────────────────────────────
Halo ${storeName}! Terima kasih atas pembelian software kasir C-POS.

Berikut Serial Key aktivasi resmi untuk perangkat Anda:
🔑 Serial Key : *${serialKey}*
💻 ID HWID    : ${rawHwid}
🏷️ Lisensi    : Lifetime (Permanen Seumur Hidup)

Cara Aktivasi:
1. Buka aplikasi C-POS di komputer kasir Anda.
2. Tempelkan Serial Key di atas pada kolom aktivasi.
3. Klik tombol [⚡ Aktivasi Sekarang].

Aplikasi Anda akan langsung aktif permanen dan siap digunakan berjualan!
────────────────────────────────────────────────────────────────────
`);
