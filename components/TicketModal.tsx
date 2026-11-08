'use client';

import React, { useEffect, useState } from 'react';
import {
  Printer,
  X,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  TicketVianda,
  TarjetaBingoVenta,
  TicketEventoVenta,
  ConfiguracionEvento,
  DEFAULT_IMPRESION_CONFIG,
} from '../lib/types';
import {
  printTicketBluetooth,
  getPrintingConfigStatus,
  buildThermalTicketLines,
} from '../lib/bluetoothPrinter';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'vianda' | 'bingo' | 'ticket';
  ticketVianda?: TicketVianda | null;
  tarjetaBingo?: TarjetaBingoVenta | null;
  ticketEvento?: TicketEventoVenta | null;
  config: ConfiguracionEvento;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  tipo,
  ticketVianda,
  tarjetaBingo,
  ticketEvento,
  config,
}) => {
  const imp = {
    ...DEFAULT_IMPRESION_CONFIG,
    ...(config.impresion || {}),
  };
  const anchoPapel = imp.anchoPapel || '58mm';

  const [isPrinting, setIsPrinting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync configuration status when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSuccessMsg(null);
    const status = getPrintingConfigStatus(config);
    if (!status.isConfigured) {
      setErrorMsg(status.errorMessage);
    } else {
      setErrorMsg(null);
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, config]);

  if (!isOpen) return null;

  const isVianda = tipo === 'vianda' && ticketVianda;
  const isBingo = tipo === 'bingo' && tarjetaBingo;
  const isTicket = tipo === 'ticket' && ticketEvento;

  const activeDoc = isVianda ? ticketVianda : isBingo ? tarjetaBingo : isTicket ? ticketEvento : null;
  const ticketNumero = activeDoc?.numeroTicket || '';

  // Single source of truth: exact same thermal lines used for Bluetooth ESC/POS printing
  const thermalLayout = buildThermalTicketLines({
    tipo,
    ticketVianda,
    tarjetaBingo,
    ticketEvento,
    config,
    anchoPapel,
  });

  const handleSystemPrint = () => {
    const content = document.getElementById('printable-ticket');
    if (!content) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const isCompact = thermalLayout.compact;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Ticket ${ticketNumero}</title>
          <style>
            @page {
              margin: 1.5mm;
              size: ${anchoPapel} auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${anchoPapel === '58mm' ? '11.5px' : '12.5px'};
              color: #000000;
              background: #ffffff;
              margin: 0 auto;
              padding: 4px 2px;
              line-height: ${isCompact ? '1.18' : '1.32'};
              width: ${anchoPapel === '58mm' ? '30ch' : '46ch'};
            }
            * {
              box-sizing: border-box;
            }
            .thermal-line {
              white-space: pre;
              font-family: 'Courier New', Courier, monospace;
              overflow: hidden;
            }
            .align-center { text-align: center; }
            .align-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .size-double-height {
              font-weight: 900;
              font-size: 1.15em;
              line-height: 1.3;
              padding: 1px 0;
            }
            .size-double {
              font-weight: 900;
              font-size: 1.45em;
              line-height: 1.35;
              letter-spacing: 0.5px;
              padding: 2px 0;
            }
            .tear-space-hint {
              display: none;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print iframe error:', e);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  };

  const handlePrint = async () => {
    setSuccessMsg(null);
    const status = getPrintingConfigStatus(config);

    if (!status.isConfigured) {
      setErrorMsg(
        status.errorMessage ||
          'La impresora no está configurada. Configúrala en el módulo Opciones de Impresión.'
      );
      return;
    }

    if (status.metodo === 'sistema') {
      setErrorMsg(null);
      handleSystemPrint();
      return;
    }

    // Método configurado: Impresora Térmica Bluetooth
    setIsPrinting(true);
    setErrorMsg(null);
    try {
      const result = await printTicketBluetooth({
        tipo,
        ticketVianda,
        tarjetaBingo,
        ticketEvento,
        config,
        anchoPapel,
      });
      setSuccessMsg(`¡Ticket impreso en ${result.printerName}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('cancel')) {
        setErrorMsg(
          'No se completó la conexión con la impresora Bluetooth. Verifica su vinculación en Opciones de Impresión.'
        );
      } else {
        setErrorMsg(
          msg ||
            'No se pudo imprimir en la impresora Bluetooth. Verifica que esté encendida y configurada en Opciones de Impresión.'
        );
      }
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] bg-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 print:shadow-none print:border-none print:max-w-full flex flex-col">
        {/* Modal Actions Header - Only 1 "Imprimir" button */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">
              Previsualización Exacta ({anchoPapel})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              {isPrinting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Red Alert Message when Printer is Not Configured or Print Fails */}
        {errorMsg && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2 text-red-700 text-xs font-semibold print:hidden flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Brief confirmation message when printed via Bluetooth */}
        {successMsg && !errorMsg && (
          <div className="mx-4 mt-3 px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold print:hidden flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Printable Exact Thermal Paper Roll Preview */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 flex justify-center bg-slate-200/70 print:p-0 print:bg-white">
          <div
            id="printable-ticket"
            className="bg-white text-black shadow-md border border-slate-300 px-3 pt-4 pb-2 font-mono select-text print:shadow-none print:border-none"
            style={{
              width: anchoPapel === '58mm' ? '33ch' : '49ch',
              maxWidth: '100%',
              fontSize: anchoPapel === '58mm' ? '12px' : '11.5px',
              lineHeight: thermalLayout.compact ? '1.2' : '1.35',
            }}
          >
            {thermalLayout.lines.map((line, idx) => {
              const alignClass = line.align === 'center' ? 'align-center text-center' : 'align-left text-left';
              const boldClass = line.bold ? 'font-bold' : '';
              const sizeClass =
                line.size === 'double'
                  ? 'size-double font-black text-base py-0.5 tracking-wide'
                  : line.size === 'double-height'
                  ? 'size-double-height font-black text-[13px] py-0.5'
                  : '';

              return (
                <div
                  key={idx}
                  className={`thermal-line whitespace-pre ${alignClass} ${boldClass} ${sizeClass}`}
                >
                  {line.text || ' '}
                </div>
              );
            })}

            {/* Extra bottom tear-off feed space (identical to the physical paper feed) */}
            <div className="relative">
              {Array.from({ length: thermalLayout.tearFeedLines }).map((_, idx) => (
                <div key={`tear-${idx}`} className="thermal-line whitespace-pre">
                  {' '}
                </div>
              ))}
              <div className="tear-space-hint border-t border-dashed border-slate-300 pt-1 text-center text-[10px] text-slate-400 select-none print:hidden">
                ✂ Espacio libre de corte ({thermalLayout.tearFeedLines} líneas)
              </div>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center print:hidden flex-shrink-0">
          <span className="text-xs text-slate-500">
            Rollo {anchoPapel} ({thermalLayout.cols} caracteres/línea) •{' '}
            {thermalLayout.compact ? 'Modo Compacto' : 'Modo Normal'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
