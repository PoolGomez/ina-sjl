import {
  ConfiguracionEvento,
  DEFAULT_IMPRESION_CONFIG,
  MODALIDADES_PAGO_LABELS,
  TarjetaBingoVenta,
  TicketVianda,
  TicketEventoVenta,
  formatPrecio,
} from './types';

// ---- Web Bluetooth API Minimal TypeScript Definitions ----
interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    read: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothNavigator {
  bluetooth?: {
    requestDevice(options: {
      filters?: Array<{ services?: string[]; name?: string; namePrefix?: string }>;
      optionalServices?: string[];
      acceptAllDevices?: boolean;
    }): Promise<BluetoothDevice>;
    getDevices?: () => Promise<BluetoothDevice[]>;
  };
}

const BT_PRINTER_STORAGE_KEY = 'eventos_ina_bt_printer_name';

// Common GATT Service UUIDs used by 58mm / 80mm BLE Thermal Printers
// (Goojprt, MTP-II, MTP-3, Xprinter, POS-58, POS-80, Milestone, Netum, Bisofice, etc.)
export const THERMAL_PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS BLE Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // ISSC / Goojprt / MTP transparent UART
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip RN4870 / BM70 BLE UART
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic Chinese BLE thermal printer service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 BLE Serial service
  '0000ae30-0000-1000-8000-00805f9b34fb', // JDY / Portable printer BLE service
  '0000fee7-0000-1000-8000-00805f9b34fb', // WeChat BLE Printer profile
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
];

// Common Writable Characteristic UUIDs for BLE Thermal Printers
export const THERMAL_PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '49535343-1e4d-4bd9-ba61-23c647249616',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
];

// Singleton state in memory so the user does not have to re-pair on every ticket
let cachedDevice: BluetoothDevice | null = null;
let cachedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

/**
 * Checks whether the current browser supports Web Bluetooth API (`navigator.bluetooth`).
 */
export function isWebBluetoothSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as unknown as BluetoothNavigator;
  return Boolean(nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function');
}

/**
 * Checks whether the current page is loaded in a Secure Context (HTTPS or localhost),
 * which is required by browsers to enable Web Bluetooth.
 */
export function isSecureBluetoothContext(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.isSecureContext);
}

/**
 * Returns the saved Bluetooth printer name from localStorage (if configured previously).
 */
export function getSavedBluetoothPrinterName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(BT_PRINTER_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Returns the name of the currently connected Bluetooth thermal printer, if any.
 */
export function getConnectedPrinterName(): string | null {
  if (cachedDevice && cachedDevice.gatt?.connected && cachedCharacteristic) {
    return cachedDevice.name || 'Impresora Térmica BT';
  }
  return null;
}

/**
 * Checks whether a Bluetooth printer is currently connected and ready.
 */
export function isPrinterConnected(): boolean {
  return Boolean(cachedDevice && cachedDevice.gatt?.connected && cachedCharacteristic);
}

/**
 * Evaluates whether printing is properly configured in the module "Opciones de Impresión".
 */
export function getPrintingConfigStatus(config: ConfiguracionEvento): {
  isConfigured: boolean;
  metodo: 'bluetooth' | 'sistema';
  printerName: string | null;
  errorMessage: string | null;
} {
  const imp = {
    ...DEFAULT_IMPRESION_CONFIG,
    ...(config.impresion || {}),
  };
  const metodo = imp.metodoImpresion || 'bluetooth';

  if (metodo === 'sistema') {
    if (imp.impresoraConfigurada) {
      return {
        isConfigured: true,
        metodo: 'sistema',
        printerName: 'Impresora del Sistema',
        errorMessage: null,
      };
    }
    return {
      isConfigured: false,
      metodo: 'sistema',
      printerName: null,
      errorMessage:
        'La impresión no está configurada. Ve a Administración → Impresión para guardar tu configuración de impresión.',
    };
  }

  // Bluetooth method
  const activeName = getConnectedPrinterName();
  const savedName = imp.impresoraBluetoothNombre || getSavedBluetoothPrinterName();

  if (activeName) {
    return {
      isConfigured: true,
      metodo: 'bluetooth',
      printerName: activeName,
      errorMessage: null,
    };
  }

  if (savedName && imp.impresoraConfigurada) {
    return {
      isConfigured: true,
      metodo: 'bluetooth',
      printerName: savedName,
      errorMessage: null,
    };
  }

  return {
    isConfigured: false,
    metodo: 'bluetooth',
    printerName: null,
    errorMessage:
      'Impresora no configurada. Ve al módulo de Administración → Opciones de Impresión para vincular tu impresora térmica Bluetooth.',
  };
}

/**
 * Disconnects the currently paired Bluetooth printer.
 */
export function disconnectBluetoothPrinter(): void {
  try {
    if (cachedDevice?.gatt?.connected) {
      cachedDevice.gatt.disconnect();
    }
  } catch {
    // Ignore disconnect errors
  } finally {
    cachedDevice = null;
    cachedCharacteristic = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(BT_PRINTER_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }
}

/**
 * Finds the first writable GATT characteristic from the connected BLE printer.
 */
async function discoverWritableCharacteristic(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic> {
  // 1. Try known printer service UUIDs first
  for (const serviceUuid of THERMAL_PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      // Try known characteristic UUIDs inside this service
      for (const charUuid of THERMAL_PRINTER_CHAR_UUIDS) {
        try {
          const char = await service.getCharacteristic(charUuid);
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        } catch {
          // Try next characteristic
        }
      }
      // Or inspect all characteristics in this service
      const chars = await service.getCharacteristics();
      const writable = chars.find(
        (c) => c.properties.writeWithoutResponse || c.properties.write
      );
      if (writable) return writable;
    } catch {
      // Service not present on this device, continue
    }
  }

  // 2. Fallback: scan all available primary services on the device
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        const writable = chars.find(
          (c) => c.properties.writeWithoutResponse || c.properties.write
        );
        if (writable) return writable;
      } catch {
        // Continue scanning next service
      }
    }
  } catch {
    // Ignore if getPrimaryServices fails
  }

  throw new Error(
    'No se encontró un canal de escritura compatible en el dispositivo Bluetooth seleccionado. Verifica que sea una impresora térmica BLE.'
  );
}

/**
 * Connects to a Bluetooth thermal printer (or reuses the active connection).
 * Opens the native browser Bluetooth picker if no device is paired yet.
 */
export async function connectBluetoothPrinter(forceNewDevice = false): Promise<string> {
  if (!isSecureBluetoothContext()) {
    throw new Error(
      'Web Bluetooth requiere una conexión segura (HTTPS o localhost). Abre la plataforma con https:// para conectar la impresora.'
    );
  }

  if (!isWebBluetoothSupported()) {
    throw new Error(
      'Tu navegador no soporta Web Bluetooth directo. En celular Android usa Google Chrome o Microsoft Edge.'
    );
  }

  if (forceNewDevice) {
    disconnectBluetoothPrinter();
  }

  // Reuse existing active connection if still connected
  if (cachedDevice && cachedDevice.gatt?.connected && cachedCharacteristic) {
    return cachedDevice.name || 'Impresora Térmica BT';
  }

  // If we have a previously selected device in this session that disconnected, try reconnecting first
  if (cachedDevice && cachedDevice.gatt && !forceNewDevice) {
    try {
      const server = await cachedDevice.gatt.connect();
      cachedCharacteristic = await discoverWritableCharacteristic(server);
      const name = cachedDevice.name || 'Impresora Térmica BT';
      try {
        localStorage.setItem(BT_PRINTER_STORAGE_KEY, name);
      } catch {
        // Ignore
      }
      return name;
    } catch {
      cachedDevice = null;
      cachedCharacteristic = null;
    }
  }

  const nav = navigator as unknown as BluetoothNavigator;

  // Try reconnecting to previously permitted devices via navigator.bluetooth.getDevices() if available
  if (!forceNewDevice && nav.bluetooth?.getDevices) {
    try {
      const permittedDevices = await nav.bluetooth.getDevices();
      const savedName = getSavedBluetoothPrinterName();
      const target =
        permittedDevices.find((d) => savedName && d.name === savedName) ||
        permittedDevices[0];
      if (target && target.gatt) {
        const server = await target.gatt.connect();
        cachedCharacteristic = await discoverWritableCharacteristic(server);
        cachedDevice = target;
        const name = target.name || 'Impresora Térmica BT';
        try {
          localStorage.setItem(BT_PRINTER_STORAGE_KEY, name);
        } catch {
          // Ignore
        }
        return name;
      }
    } catch {
      // Fall through to requestDevice
    }
  }

  const device = await nav.bluetooth!.requestDevice({
    acceptAllDevices: true,
    optionalServices: THERMAL_PRINTER_SERVICE_UUIDS,
  });

  if (!device.gatt) {
    throw new Error('El dispositivo Bluetooth seleccionado no soporta conexión GATT.');
  }

  device.addEventListener('gattserverdisconnected', () => {
    cachedCharacteristic = null;
  });

  const server = await device.gatt.connect();
  const characteristic = await discoverWritableCharacteristic(server);

  cachedDevice = device;
  cachedCharacteristic = characteristic;

  const connectedName = device.name || 'Impresora Térmica BT';
  try {
    localStorage.setItem(BT_PRINTER_STORAGE_KEY, connectedName);
  } catch {
    // Ignore
  }

  return connectedName;
}

/**
 * Sends raw ESC/POS bytes to the connected Bluetooth printer in safe BLE chunks
 * ( prevents buffer overflow on portable 58mm/80mm thermal printers ).
 */
export async function sendBytesToPrinter(
  data: Uint8Array,
  chunkSize = 100,
  delayMs = 18
): Promise<void> {
  if (!cachedDevice || !cachedDevice.gatt?.connected || !cachedCharacteristic) {
    await connectBluetoothPrinter(false);
  }

  const char = cachedCharacteristic;
  if (!char) {
    throw new Error('No hay impresora Bluetooth conectada.');
  }

  for (let offset = 0; offset < data.length; offset += chunkSize) {
    const slice = data.slice(offset, Math.min(offset + chunkSize, data.length));

    if (char.properties.writeWithoutResponse && char.writeValueWithoutResponse) {
      await char.writeValueWithoutResponse(slice);
    } else if (char.writeValueWithResponse && char.properties.write) {
      await char.writeValueWithResponse(slice);
    } else {
      await char.writeValue(slice);
    }

    if (delayMs > 0 && offset + chunkSize < data.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// ============================================================================
// ESC/POS Command Builder & Text Formatting Utilities
// ============================================================================

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD_INIT = [ESC, 0x40]; // Initialize printer
const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00];
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
const CMD_BOLD_ON = [ESC, 0x45, 0x01];
const CMD_BOLD_OFF = [ESC, 0x45, 0x00];
const CMD_SIZE_NORMAL = [GS, 0x21, 0x00]; // 1x width, 1x height
const CMD_SIZE_DOUBLE_HEIGHT = [GS, 0x21, 0x01]; // 1x width, 2x height
const CMD_SIZE_DOUBLE = [GS, 0x21, 0x11]; // 2x width, 2x height
const CMD_LINE_SPACING_COMPACT = [ESC, 0x33, 22]; // Tighter line spacing for paper saving mode
const CMD_LINE_SPACING_DEFAULT = [ESC, 0x32]; // Default line spacing
const CMD_CUT_PARTIAL = [GS, 0x56, 0x42, 0x00]; // Partial cut (if printer has cutter)

/**
 * Normalizes Spanish characters & symbols into clean ASCII / CP437 compatible bytes
 * so that all portable thermal printers print cleanly without garbled symbols.
 */
function normalizeThermalText(input: string): string {
  return (input || '')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/Á/g, 'A')
    .replace(/É/g, 'E')
    .replace(/Í/g, 'I')
    .replace(/Ó/g, 'O')
    .replace(/Ú/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/°/g, '.')
    .replace(/º/g, '.')
    .replace(/¡/g, '')
    .replace(/¿/g, '')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[^\x20-\x7E]/g, '');
}

/**
 * Formats a two-column line (`left ... right`) padded to `width` characters.
 */
function formatRow(left: string, right: string, width: number): string {
  const cleanLeft = normalizeThermalText(left);
  const cleanRight = normalizeThermalText(right);
  const maxLeft = Math.max(4, width - cleanRight.length - 1);
  const truncatedLeft =
    cleanLeft.length > maxLeft ? cleanLeft.slice(0, maxLeft - 1) + '.' : cleanLeft;
  const spaces = Math.max(1, width - truncatedLeft.length - cleanRight.length);
  return truncatedLeft + ' '.repeat(spaces) + cleanRight;
}

/**
 * Wraps long text into lines of at most `width` characters without losing any characters.
 */
function wrapText(text: string, width: number): string[] {
  const cleaned = normalizeThermalText(text).trim();
  if (!cleaned) return [];
  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (let word of words) {
    while (word.length > width) {
      if (current) {
        lines.push(current);
        current = '';
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Formats a label + value (e.g. "Titular:", "Juan Carlos Perez...") so that
 * if it fits on one line it aligns left/right, and if the value is long it wraps
 * across multiple lines without cutting off any part of the name.
 */
function formatLabelAndValueLines(label: string, value: string, width: number): string[] {
  const cleanLabel = normalizeThermalText(label).trim();
  const cleanValue = normalizeThermalText(value).trim();
  if (!cleanValue) return [cleanLabel];

  if (cleanLabel.length + 1 + cleanValue.length <= width) {
    const spaces = width - cleanLabel.length - cleanValue.length;
    return [cleanLabel + ' '.repeat(spaces) + cleanValue];
  }

  return wrapText(`${cleanLabel} ${cleanValue}`, width);
}

/**
 * Formats an item description + price on the right so the full item name is printed
 * across as many lines as needed without truncating the name.
 */
function formatItemWithPriceLines(itemText: string, priceText: string, width: number): string[] {
  const cleanItem = normalizeThermalText(itemText).trim();
  const cleanPrice = normalizeThermalText(priceText).trim();

  if (cleanItem.length + 1 + cleanPrice.length <= width) {
    const spaces = width - cleanItem.length - cleanPrice.length;
    return [cleanItem + ' '.repeat(spaces) + cleanPrice];
  }

  const wrapped = wrapText(cleanItem, width);
  if (wrapped.length === 0) {
    return [cleanPrice];
  }

  const lastIdx = wrapped.length - 1;
  const lastLine = wrapped[lastIdx];
  if (lastLine.length + 1 + cleanPrice.length <= width) {
    const spaces = width - lastLine.length - cleanPrice.length;
    wrapped[lastIdx] = lastLine + ' '.repeat(spaces) + cleanPrice;
  } else {
    const spaces = Math.max(0, width - cleanPrice.length);
    wrapped.push(' '.repeat(spaces) + cleanPrice);
  }

  return wrapped;
}

class EscPosBuffer {
  private bytes: number[] = [];

  init(compactMode = false): this {
    this.bytes.push(...CMD_INIT);
    if (compactMode) {
      this.bytes.push(...CMD_LINE_SPACING_COMPACT);
    } else {
      this.bytes.push(...CMD_LINE_SPACING_DEFAULT);
    }
    return this;
  }

  alignLeft(): this {
    this.bytes.push(...CMD_ALIGN_LEFT);
    return this;
  }

  alignCenter(): this {
    this.bytes.push(...CMD_ALIGN_CENTER);
    return this;
  }

  bold(enabled: boolean): this {
    this.bytes.push(...(enabled ? CMD_BOLD_ON : CMD_BOLD_OFF));
    return this;
  }

  sizeNormal(): this {
    this.bytes.push(...CMD_SIZE_NORMAL);
    return this;
  }

  sizeDoubleHeight(): this {
    this.bytes.push(...CMD_SIZE_DOUBLE_HEIGHT);
    return this;
  }

  sizeDouble(): this {
    this.bytes.push(...CMD_SIZE_DOUBLE);
    return this;
  }

  line(text = ''): this {
    const normalized = normalizeThermalText(text);
    for (let i = 0; i < normalized.length; i++) {
      this.bytes.push(normalized.charCodeAt(i) & 0xff);
    }
    this.bytes.push(LF);
    return this;
  }

  lines(items: string[]): this {
    for (const l of items) {
      this.line(l);
    }
    return this;
  }

  wrappedLines(text: string, width: number): this {
    const lines = wrapText(text, width);
    for (const l of lines) {
      this.line(l);
    }
    return this;
  }

  divider(width: number, char = '-'): this {
    this.line(char.repeat(width));
    return this;
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.bytes.push(LF);
    }
    return this;
  }

  cut(): this {
    this.bytes.push(...CMD_CUT_PARTIAL);
    return this;
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

export interface BuildEscPosTicketParams {
  tipo: 'vianda' | 'bingo' | 'ticket';
  ticketVianda?: TicketVianda | null;
  tarjetaBingo?: TarjetaBingoVenta | null;
  ticketEvento?: TicketEventoVenta | null;
  config: ConfiguracionEvento;
  anchoPapel?: '58mm' | '80mm';
}

export interface ThermalTicketLine {
  text: string;
  align: 'left' | 'center';
  bold?: boolean;
  size?: 'normal' | 'double-height' | 'double';
}

export interface ThermalTicketLayout {
  lines: ThermalTicketLine[];
  cols: number;
  paper: '58mm' | '80mm';
  compact: boolean;
  tearFeedLines: number;
}

/**
 * Single source of truth that builds the exact formatted thermal lines
 * used both by the on-screen preview / system print and the ESC/POS Bluetooth printer.
 * Uses 30 safe columns for 58mm portable printers (and 46 for 80mm) so no character
 * is ever clipped on the right margin of handheld thermal rolls.
 */
export function buildThermalTicketLines({
  tipo,
  ticketVianda,
  tarjetaBingo,
  ticketEvento,
  config,
  anchoPapel,
}: BuildEscPosTicketParams): ThermalTicketLayout {
  const imp = {
    ...DEFAULT_IMPRESION_CONFIG,
    ...(config.impresion || {}),
  };
  const paper = anchoPapel || imp.anchoPapel || '58mm';
  const cols = paper === '80mm' ? 46 : 30;
  const compact = Boolean(imp.modoAhorroPapel);
  const tearFeedLines = compact ? 6 : 7;

  const data =
    tipo === 'vianda' ? ticketVianda : tipo === 'bingo' ? tarjetaBingo : ticketEvento;
  if (!data) {
    return { lines: [], cols, paper, compact, tearFeedLines };
  }

  const lines: ThermalTicketLine[] = [];
  const pushLine = (
    text: string,
    align: 'left' | 'center' = 'left',
    bold = false,
    size: 'normal' | 'double-height' | 'double' = 'normal'
  ) => {
    lines.push({
      text: normalizeThermalText(text),
      align,
      bold,
      size,
    });
  };

  const pushWrapped = (
    text: string,
    width: number,
    align: 'left' | 'center' = 'left',
    bold = false,
    size: 'normal' | 'double-height' | 'double' = 'normal'
  ) => {
    for (const l of wrapText(text, width)) {
      pushLine(l, align, bold, size);
    }
  };

  const pushDivider = (char = '-') => {
    pushLine(char.repeat(cols), 'left', false, 'normal');
  };

  const formatSingleLineFechaHora = (
    isoDate?: string,
    formattedFallback?: string
  ): string => {
    if (isoDate) {
      const d = new Date(isoDate);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      }
    }
    if (formattedFallback) {
      return normalizeThermalText(formattedFallback)
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return '-';
  };

  const fechaCompacta = formatSingleLineFechaHora(data.fecha, data.fechaFormateada);

  const modalidadLabel =
    MODALIDADES_PAGO_LABELS[data.modalidadPago] || String(data.modalidadPago).toUpperCase();

  // ---- HEADER ----
  if (imp.mostrarLogo) {
    pushLine('[ INA ]', 'center', true, 'normal');
  }

  if (imp.mostrarEncabezado && config.nombreEvento) {
    pushWrapped(config.nombreEvento.toUpperCase(), cols, 'center', true, 'double-height');
  }

  if (imp.mostrarSubtitulo && config.subtitulo) {
    pushWrapped(config.subtitulo, cols, 'center', false, 'normal');
  }

  if (imp.mostrarLugar && config.lugar) {
    pushWrapped(config.lugar, cols, 'center', false, 'normal');
  }

  const ticketTitle = `TICKET Nro ${data.numeroTicket || ''}`;
  pushWrapped(ticketTitle, cols, 'center', true, 'normal');
  pushDivider('-');

  // ---- CUSTOMER & SALE INFO ----
  if (imp.mostrarFechaHora) {
    pushLine(formatRow('Fecha:', fechaCompacta, cols), 'left', false, 'normal');
  }

  for (const l of formatLabelAndValueLines('Titular:', data.comprador || 'Al Portador', cols)) {
    pushLine(l, 'left', true, 'normal');
  }

  if (imp.mostrarTelefono && data.telefono) {
    for (const l of formatLabelAndValueLines('Telefono:', data.telefono, cols)) {
      pushLine(l, 'left', false, 'normal');
    }
  }

  if (imp.mostrarModalidadPago) {
    for (const l of formatLabelAndValueLines('Pago:', modalidadLabel.toUpperCase(), cols)) {
      pushLine(l, 'left', false, 'normal');
    }
  }

  if (data.notas) {
    pushWrapped(`Nota: ${data.notas}`, cols, 'left', false, 'normal');
  }

  pushDivider('-');

  // ---- ITEMS / BINGO CARDS / TICKETS ----
  if (tipo === 'vianda' && ticketVianda) {
    if (!compact) {
      pushLine(formatRow('CANT / DETALLE', 'SUBTOTAL', cols), 'left', true, 'normal');
    }

    for (const item of ticketVianda.items) {
      const nombreImpreso = item.descripcionImpresion?.trim() || item.nombre;
      const tag = item.etiquetaPrecio ? ` (${item.etiquetaPrecio})` : '';
      const itemLabel = `${item.cantidad}x ${nombreImpreso}${tag}`;
      const priceLabel = formatPrecio(item.subtotal);
      for (const l of formatItemWithPriceLines(itemLabel, priceLabel, cols)) {
        pushLine(l, 'left', false, 'normal');
      }
    }

    pushDivider('=');
    pushLine(
      formatRow('TOTAL:', formatPrecio(ticketVianda.total), cols),
      'left',
      true,
      'double-height'
    );
  } else if (tipo === 'ticket' && ticketEvento) {
    if (!compact) {
      pushLine(formatRow('CANT / TICKET', 'SUBTOTAL', cols), 'left', true, 'normal');
    }

    for (const item of ticketEvento.items) {
      const nombreImpreso = item.descripcionImpresion?.trim() || item.nombre;
      const tag = item.etiquetaPrecio ? ` (${item.etiquetaPrecio})` : '';
      const itemLabel = `${item.cantidad}x ${nombreImpreso}${tag}`;
      const priceLabel = formatPrecio(item.subtotal);
      for (const l of formatItemWithPriceLines(itemLabel, priceLabel, cols)) {
        pushLine(l, 'left', false, 'normal');
      }
    }

    pushDivider('=');
    pushLine(
      formatRow('TOTAL:', formatPrecio(ticketEvento.total), cols),
      'left',
      true,
      'double-height'
    );
  } else if (tipo === 'bingo' && tarjetaBingo) {
    const tarjetasList =
      tarjetaBingo.numerosTarjetas && tarjetaBingo.numerosTarjetas.length > 0
        ? tarjetaBingo.numerosTarjetas
        : [tarjetaBingo.numeroTarjeta];

    const bingoNombreImpreso = (
      tarjetaBingo.descripcionImpresion?.trim() ||
      config.bingoPrecios?.descripcionImpresion?.trim() ||
      ''
    ).toUpperCase();

    pushWrapped(
      bingoNombreImpreso
        ? tarjetasList.length === 1
          ? bingoNombreImpreso
          : `${bingoNombreImpreso} (${tarjetasList.length})`
        : tarjetasList.length === 1
        ? 'TARJETA DE BINGO Nro'
        : `TARJETAS ASIGNADAS (${tarjetasList.length})`,
      cols,
      'center',
      true,
      'normal'
    );

    const numsFormatted = tarjetasList
      .map((n) => `#${String(n).padStart(3, '0')}`)
      .join('  ');
    pushWrapped(numsFormatted, Math.floor(cols / 2), 'center', true, 'double');

    if (!compact && tarjetaBingo.etiquetaPrecio) {
      for (const l of formatLabelAndValueLines('Tarifa:', tarjetaBingo.etiquetaPrecio, cols)) {
        pushLine(l, 'left', false, 'normal');
      }
    }
    if (tarjetasList.length > 1 && tarjetaBingo.precioUnitario) {
      for (const l of formatLabelAndValueLines(
        'Detalle:',
        `${tarjetasList.length} x ${formatPrecio(tarjetaBingo.precioUnitario)}`,
        cols
      )) {
        pushLine(l, 'left', false, 'normal');
      }
    }

    pushDivider('=');
    pushLine(
      formatRow('TOTAL:', formatPrecio(tarjetaBingo.precioCobrado), cols),
      'left',
      true,
      'double-height'
    );
  }

  // ---- PAYMENT STATUS ----
  if (imp.mostrarEstadoPago) {
    pushDivider('-');
    pushLine(
      data.estadoPago === 'pagado'
        ? '[ ESTADO: PAGADO ]'
        : data.estadoPago === 'anulado'
        ? '[ ESTADO: ANULADO ]'
        : '[ ESTADO: PENDIENTE DE PAGO ]',
      'center',
      true,
      'normal'
    );
  }

  // ---- SIMULATED BARCODE / TICKET CODE ----
  if (imp.mostrarCodigoBarras && data.numeroTicket) {
    pushLine('||| || ||| | |||| |||', 'center', false, 'normal');
    pushLine(data.numeroTicket, 'center', false, 'normal');
  }

  // ---- FOOTER MESSAGE ----
  if (imp.mostrarMensajePie && config.mensajeTicket) {
    if (!compact) {
      pushLine('', 'center', false, 'normal');
    }
    pushWrapped(config.mensajeTicket, cols, 'center', false, 'normal');
  }

  return { lines, cols, paper, compact, tearFeedLines };
}

/**
 * Generates the ESC/POS byte array for a Vianda, Bingo, or General Event Ticket,
 * using the exact same lines as `buildThermalTicketLines` so the preview and printout
 * are 100% identical, plus extra bottom feed space for easy tearing.
 */
export function buildEscPosTicket(params: BuildEscPosTicketParams): Uint8Array {
  const { lines, compact, tearFeedLines } = buildThermalTicketLines(params);
  if (lines.length === 0) {
    throw new Error('No hay datos del ticket para imprimir.');
  }

  const buf = new EscPosBuffer().init(compact);
  let currentAlign: 'left' | 'center' | null = null;
  let currentBold = false;
  let currentSize: 'normal' | 'double-height' | 'double' = 'normal';

  for (const item of lines) {
    if (item.align !== currentAlign) {
      if (item.align === 'center') buf.alignCenter();
      else buf.alignLeft();
      currentAlign = item.align;
    }

    const wantBold = Boolean(item.bold);
    if (wantBold !== currentBold) {
      buf.bold(wantBold);
      currentBold = wantBold;
    }

    const wantSize = item.size || 'normal';
    if (wantSize !== currentSize) {
      if (wantSize === 'double') buf.sizeDouble();
      else if (wantSize === 'double-height') buf.sizeDoubleHeight();
      else buf.sizeNormal();
      currentSize = wantSize;
    }

    buf.line(item.text);
  }

  // Reset style before feeding extra tear-off space
  buf.sizeNormal().bold(false).alignLeft();

  // Feed extra blank lines with space + LF so all portable 58mm thermal printers
  // physically advance the paper well past the serrated tear bar for easy tearing
  for (let i = 0; i < tearFeedLines; i++) {
    buf.line(' ');
  }
  buf.cut();

  return buf.toUint8Array();
}

/**
 * Connects (if needed) and prints a Vianda or Bingo ticket directly via Web Bluetooth.
 */
export async function printTicketBluetooth(
  params: BuildEscPosTicketParams
): Promise<{ printerName: string }> {
  const printerName = await connectBluetoothPrinter(false);
  const bytes = buildEscPosTicket(params);
  await sendBytesToPrinter(bytes);
  return { printerName };
}

/**
 * Prints a test receipt on the Bluetooth thermal printer to verify alignment and paper width.
 */
export async function printTestTicketBluetooth(
  config: ConfiguracionEvento,
  anchoPapel: '58mm' | '80mm' = '58mm'
): Promise<{ printerName: string }> {
  const printerName = await connectBluetoothPrinter(false);
  const cols = anchoPapel === '80mm' ? 46 : 30;
  const compact = Boolean(config.impresion?.modoAhorroPapel);
  const tearFeedLines = compact ? 6 : 7;

  const buf = new EscPosBuffer().init(compact);
  buf
    .alignCenter()
    .bold(true)
    .sizeDoubleHeight()
    .line('PRUEBA BLUETOOTH')
    .sizeNormal()
    .wrappedLines(config.nombreEvento || 'EVENTOS INA', cols)
    .bold(false)
    .divider(cols, '-')
    .alignLeft()
    .lines(formatLabelAndValueLines('Impresora:', printerName, cols))
    .lines(formatLabelAndValueLines('Ancho Papel:', `${anchoPapel} (${cols} cols)`, cols))
    .lines(
      formatLabelAndValueLines(
        'Modo Ahorro:',
        compact ? 'Activado (Compacto)' : 'Normal',
        cols
      )
    )
    .divider(cols, '-')
    .line(formatRow('1x Vianda Prueba', formatPrecio(25), cols))
    .bold(true)
    .line(formatRow('TOTAL PRUEBA:', formatPrecio(25), cols))
    .bold(false)
    .divider(cols, '-')
    .alignCenter()
    .line('Impresion termica directa OK!')
    .alignLeft();

  for (let i = 0; i < tearFeedLines; i++) {
    buf.line(' ');
  }
  buf.cut();

  await sendBytesToPrinter(buf.toUint8Array());
  return { printerName };
}
