import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTime } from './helpers';
import { useStore } from '../stores/useStore';

export interface BusinessInfo {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  paperWidth?: '58mm' | '80mm';
}

/**
 * Generate formatted HTML string for thermal receipt
 */
export function generateThermalReceiptHtml(tx: Transaction, info: BusinessInfo): string {
  const is80 = info.paperWidth === '80mm';
  // 58mm paper: roll width 57mm, physical printable width 44-46mm. Flush-left with zero margin prevents right-side cutoff
  const widthMm = is80 ? '68mm' : '44mm';
  const baseFontSize = is80 ? '12.5px' : '11px';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk #${tx.receiptNumber}</title>
        <style>
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
            width: ${widthMm};
            max-width: ${widthMm};
            margin: 0 !important;
            padding: 0 0 12mm 0 !important;
            text-align: left;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Consolas', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, monospace, sans-serif;
            font-size: ${baseFontSize};
            font-weight: 700;
            line-height: 1.25;
            text-rendering: geometricPrecision;
            -webkit-font-smoothing: antialiased;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: 900 !important; }
          .title {
            font-size: 1.3em;
            font-weight: 900 !important;
            margin-bottom: 2px;
            letter-spacing: -0.2px;
            line-height: 1.15;
            text-align: center;
          }
          .store-sub {
            font-size: 0.9em;
            font-weight: 700;
            line-height: 1.2;
            text-align: center;
          }
          .dashed {
            border-bottom: 1.5px dashed #000000 !important;
            margin: 4px 0;
            width: 100%;
          }
          .solid {
            border-bottom: 2px solid #000000 !important;
            margin: 5px 0;
            width: 100%;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2px;
            width: 100%;
          }
          .item-row {
            margin-bottom: 4px;
            width: 100%;
          }
          .item-name {
            font-weight: 900 !important;
            font-size: 1.05em;
            line-height: 1.2;
            word-break: break-word;
          }
          .item-sub {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 0.95em;
            font-weight: 700;
            width: 100%;
          }
          .price-val {
            flex-shrink: 0;
            text-align: right;
            white-space: nowrap;
            margin-left: 4px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 1.25em;
            font-weight: 900 !important;
            margin: 3px 0;
            line-height: 1.2;
            width: 100%;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 0.88em;
            font-weight: 700;
            line-height: 1.25;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${info.businessName || 'C-POS STORE'}</div>
          ${info.businessAddress ? `<div class="store-sub">${info.businessAddress}</div>` : ''}
          ${info.businessPhone ? `<div class="store-sub">Telp: ${info.businessPhone}</div>` : ''}
        </div>


        <div class="dashed"></div>

        <div class="row">
          <span>No: #${tx.receiptNumber}</span>
          <span>${formatDate(tx.createdAt, 'short')} ${formatTime(tx.createdAt)}</span>
        </div>
        <div class="row">
          <span>Kasir: ${tx.employeeName}</span>
          ${tx.orderType ? `<span>${tx.orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}</span>` : ''}
        </div>
        ${tx.customerName ? `<div class="row"><span>Pelanggan: ${tx.customerName}</span></div>` : ''}

        <div class="dashed"></div>

        <!-- ITEMS -->
        <div>
          ${tx.items
            .map(
              (item) => `
            <div class="item-row">
              <div class="item-name">${item.productName}</div>
              <div class="item-sub">
                <span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
                <span class="bold">${formatCurrency(item.total)}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="dashed"></div>

        <!-- FINANCIALS -->
        <div class="row">
          <span>Subtotal</span>
          <span>${formatCurrency(tx.subtotal)}</span>
        </div>

        ${
          tx.discountAmount > 0
            ? `<div class="row"><span>Diskon</span><span>-${formatCurrency(tx.discountAmount)}</span></div>`
            : ''
        }
        ${
          tx.pointsDiscountAmount && tx.pointsDiscountAmount > 0
            ? `<div class="row"><span>Tukar Poin (${tx.pointsRedeemed || 0} Poin)</span><span>-${formatCurrency(tx.pointsDiscountAmount)}</span></div>`
            : ''
        }
        ${
          tx.serviceChargeAmount > 0
            ? `<div class="row"><span>Service Charge</span><span>${formatCurrency(tx.serviceChargeAmount)}</span></div>`
            : ''
        }
        ${
          tx.taxAmount > 0
            ? `<div class="row"><span>PPN</span><span>${formatCurrency(tx.taxAmount)}</span></div>`
            : ''
        }

        <div class="solid"></div>

        <div class="total-row">
          <span>TOTAL</span>
          <span>${formatCurrency(tx.total)}</span>
        </div>

        <div class="row" style="text-transform: capitalize;">
          <span>Bayar (${tx.paymentMethod})</span>
          <span>${formatCurrency(tx.paymentAmount)}</span>
        </div>

        <div class="row bold">
          <span>Kembalian</span>
          <span>${formatCurrency(tx.changeAmount)}</span>
        </div>

        ${
          tx.pointsEarned && tx.pointsEarned > 0
            ? `<div class="row bold" style="margin-top: 2px;"><span>Poin Didapat (+)</span><span>+${tx.pointsEarned} Poin</span></div>`
            : ''
        }

        <div class="dashed"></div>

        <div class="footer">
          <div>Terima kasih atas kunjungan Anda!</div>
          <div style="font-size: 0.8em; margin-top: 3px;">Powered by C-POS Offline Kasir</div>
        </div>
      </body>
    </html>
  `;
}

export function getElectronAPI() {
  if (typeof window === 'undefined') return null;
  if ((window as any).electronAPI) return (window as any).electronAPI;
  try {
    const electron = (window as any).require?.('electron');
    if (electron?.ipcRenderer) {
      return {
        getPrinters: () => electron.ipcRenderer.invoke('get-printers'),
        printReceipt: (html: string, printer?: string) => electron.ipcRenderer.invoke('print-receipt', html, printer),
        openCashDrawer: () => electron.ipcRenderer.invoke('open-cash-drawer'),
      };
    }
  } catch (e) {}
  return null;
}

/**
 * Print receipt using silent printing directly to POS-58
 * In Electron desktop: utilizes silent print targeting POS-58 without native dialog
 * In standard browser: falls back to isolated hidden iframe
 */
export async function printViaIsolatedIframe(receiptHtml: string, targetPrinterName?: string): Promise<boolean> {
  const electronAPI = getElectronAPI();

  if (electronAPI?.printReceipt) {
    try {
      const state = useStore.getState();
      const printer = targetPrinterName || state.selectedPrinter || 'POS-58';
      const res = await electronAPI.printReceipt(receiptHtml, printer);
      // In Electron, silent print was dispatched. Never open browser dialog!
      return res?.success ?? true;
    } catch (err) {
      console.error('Electron silent print error:', err);
      return false;
    }
  }

  // Fallback for standard browser preview environment:
  return new Promise((resolve) => {
    try {
      const existingIframe = document.getElementById('cpos-print-frame');
      if (existingIframe) {
        existingIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'cpos-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        resolve(true);
        return;
      }

      frameDoc.open();
      frameDoc.write(receiptHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch {
          window.print();
          resolve(true);
        }
      }, 250);
    } catch {
      window.print();
      resolve(true);
    }
  });
}

/**
 * Direct ESC/POS byte builder for Bluetooth thermal printers
 */
export function buildEscPosBytes(tx: Transaction, info: BusinessInfo): Uint8Array {
  const encoder = new TextEncoder();
  const bytes: number[] = [];

  const write = (str: string) => {
    const encoded = encoder.encode(str);
    for (let i = 0; i < encoded.length; i++) {
      bytes.push(encoded[i]);
    }
  };

  const lineLen = info.paperWidth === '80mm' ? 48 : 32;

  const padLine = (left: string, right: string) => {
    const spaceCount = Math.max(1, lineLen - left.length - right.length);
    return left + ' '.repeat(spaceCount) + right + '\n';
  };

  // Init printer
  bytes.push(0x1b, 0x40);

  // Center align
  bytes.push(0x1b, 0x61, 0x01);

  // Double height & bold for business title
  bytes.push(0x1b, 0x45, 0x01); // bold on
  bytes.push(0x1d, 0x21, 0x11); // 2x size
  write(`${info.businessName || 'C-POS STORE'}\n`);

  // Normal font
  bytes.push(0x1d, 0x21, 0x00); // normal size
  bytes.push(0x1b, 0x45, 0x00); // bold off

  if (info.businessAddress) write(`${info.businessAddress}\n`);
  if (info.businessPhone) write(`Telp: ${info.businessPhone}\n`);

  // Dashed line
  write('-'.repeat(lineLen) + '\n');

  // Left align for transaction details
  bytes.push(0x1b, 0x61, 0x00);
  write(padLine(`No: #${tx.receiptNumber}`, `${formatTime(tx.createdAt)}`));
  write(padLine(`Tgl: ${formatDate(tx.createdAt, 'short')}`, `Kasir: ${tx.employeeName}`));
  if (tx.customerName) write(`Plg: ${tx.customerName}\n`);

  write('-'.repeat(lineLen) + '\n');

  // Items
  tx.items.forEach((item) => {
    write(`${item.productName}\n`);
    const sub = `${item.quantity} x ${formatCurrency(item.unitPrice)}`;
    const total = formatCurrency(item.total);
    write(padLine(`  ${sub}`, total));
  });

  write('-'.repeat(lineLen) + '\n');

  // Subtotal & taxes
  write(padLine('Subtotal', formatCurrency(tx.subtotal)));
  if (tx.discountAmount > 0) write(padLine('Diskon', `-${formatCurrency(tx.discountAmount)}`));
  if (tx.serviceChargeAmount > 0) write(padLine('Service Charge', formatCurrency(tx.serviceChargeAmount)));
  if (tx.taxAmount > 0) write(padLine('PPN', formatCurrency(tx.taxAmount)));

  write('='.repeat(lineLen) + '\n');

  // TOTAL in bold & large
  bytes.push(0x1b, 0x45, 0x01);
  bytes.push(0x1d, 0x21, 0x01); // double height
  write(padLine('TOTAL', formatCurrency(tx.total)));
  bytes.push(0x1d, 0x21, 0x00);
  bytes.push(0x1b, 0x45, 0x00);

  write(padLine(`Bayar (${tx.paymentMethod})`, formatCurrency(tx.paymentAmount)));
  write(padLine('Kembalian', formatCurrency(tx.changeAmount)));

  write('-'.repeat(lineLen) + '\n');

  // Center align footer
  bytes.push(0x1b, 0x61, 0x01);
  write('Terima kasih atas kunjungan Anda!\n');
  write('Powered by C-POS Offline Kasir\n\n\n\n');

  // Cut paper command
  bytes.push(0x1d, 0x56, 0x41, 0x03);

  // Cash drawer kick: ESC p 0 25 250
  bytes.push(0x1b, 0x70, 0x00, 0x19, 0xfa);

  return new Uint8Array(bytes);
}

/**
 * Direct Bluetooth ESC/POS print
 * Connects directly to thermal printer over Web Bluetooth without any browser print preview or PDF dialog!
 */
export async function printDirectBluetooth(tx: Transaction, info: BusinessInfo): Promise<{ success: boolean; message: string }> {
  if (!(navigator as any).bluetooth) {
    return {
      success: false,
      message: 'Browser ini belum mendukung Web Bluetooth. Gunakan browser berbasis Chromium seperti Google Chrome atau Edge.',
    };
  }

  try {
    // Request device with common thermal printer services or any Bluetooth device
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common BLE Serial
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent
        '0000ffe0-0000-1000-8000-00805f9b34fb', // HC-05/08 BLE
      ],
    });

    if (!device.gatt) {
      return { success: false, message: 'Tidak dapat membuka koneksi GATT ke printer Bluetooth.' };
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();

    if (services.length === 0) {
      return { success: false, message: 'Layanan printer thermal tidak ditemukan pada perangkat Bluetooth ini.' };
    }

    let writeChar: any = null;
    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeChar = char;
          break;
        }
      }
      if (writeChar) break;
    }

    if (!writeChar) {
      return { success: false, message: 'Tidak dapat menemukan jalur kirim data (Write Characteristic) printer.' };
    }

    // Build raw ESC/POS bytes
    const escposData = buildEscPosBytes(tx, info);

    // Send in chunks (BLE standard MTU typically 20 - 100 bytes)
    const chunkSize = 64;
    for (let i = 0; i < escposData.length; i += chunkSize) {
      const chunk = escposData.slice(i, i + chunkSize);
      await writeChar.writeValue(chunk);
      await new Promise((r) => setTimeout(r, 20));
    }

    return {
      success: true,
      message: `Berhasil mencetak langsung ke printer Bluetooth ${device.name || 'Thermal'}!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Batal menyambungkan ke printer Bluetooth.',
    };
  }
}

/**
 * Format phone number for WhatsApp (e.g., 08123... -> 628123...)
 */
export function formatPhoneNumberForWa(phone: string): string {
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Generate formatted text receipt for WhatsApp
 */
export function generateWhatsAppReceiptText(tx: Transaction, info: BusinessInfo): string {
  const line = '--------------------------------';
  const doubleLine = '================================';

  let text = `*${(info.businessName || 'C-POS STORE').toUpperCase()}*\n`;
  if (info.businessAddress) text += `${info.businessAddress}\n`;
  if (info.businessPhone) text += `Telp: ${info.businessPhone}\n`;
  text += `${line}\n`;
  text += `*BUKTI PEMBAYARAN DIGITAL*\n`;
  text += `No. Struk : #${tx.receiptNumber}\n`;
  text += `Waktu     : ${formatDate(tx.createdAt, 'short')} ${formatTime(tx.createdAt)}\n`;
  text += `Kasir     : ${tx.employeeName}\n`;
  if (tx.customerName) text += `Pelanggan : ${tx.customerName}\n`;
  if (tx.orderType) text += `Tipe      : ${tx.orderType === 'dine_in' ? 'Dine In' : 'Takeaway'}\n`;
  text += `${line}\n`;
  text += `*RINCIAN PESANAN:*\n`;

  tx.items.forEach((item) => {
    text += `• *${item.productName}*\n`;
    text += `  ${item.quantity} x ${formatCurrency(item.unitPrice)} = *${formatCurrency(item.total)}*\n`;
  });

  text += `${line}\n`;
  text += `Subtotal  : ${formatCurrency(tx.subtotal)}\n`;
  if (tx.discountAmount > 0) text += `Diskon    : -${formatCurrency(tx.discountAmount)}\n`;
  if (tx.serviceChargeAmount > 0) text += `Service   : ${formatCurrency(tx.serviceChargeAmount)}\n`;
  if (tx.taxAmount > 0) text += `PPN       : ${formatCurrency(tx.taxAmount)}\n`;
  text += `${doubleLine}\n`;
  text += `*TOTAL    : ${formatCurrency(tx.total)}*\n`;
  text += `Bayar (${tx.paymentMethod.toUpperCase()}) : ${formatCurrency(tx.paymentAmount)}\n`;
  text += `Kembalian : ${formatCurrency(tx.changeAmount)}\n`;
  text += `${line}\n`;
  text += `Terima kasih atas kunjungan Anda! 🙏\n`;
  text += `_Struk ini adalah bukti pembayaran sah_\n`;

  return text;
}

