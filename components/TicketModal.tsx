'use client';

import React, { useEffect } from 'react';
import { Printer, X, CheckCircle, Clock, UtensilsCrossed, Sparkles } from 'lucide-react';
import {
  TicketVianda,
  TarjetaBingoVenta,
  ConfiguracionEvento,
  DEFAULT_IMPRESION_CONFIG,
  formatPrecio,
} from '../lib/types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'vianda' | 'bingo';
  ticketVianda?: TicketVianda | null;
  tarjetaBingo?: TarjetaBingoVenta | null;
  config: ConfiguracionEvento;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  tipo,
  ticketVianda,
  tarjetaBingo,
  config,
}) => {
  // Close on Escape key and prevent background scroll
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isVianda = tipo === 'vianda' && ticketVianda;
  const isBingo = tipo === 'bingo' && tarjetaBingo;
  const imp = config.impresion || DEFAULT_IMPRESION_CONFIG;

  const ticketNumero = isVianda ? ticketVianda.numeroTicket : isBingo ? tarjetaBingo.numeroTicket : '';
  const comprador = isVianda
    ? ticketVianda.comprador || 'Al Portador'
    : isBingo
    ? tarjetaBingo.comprador || 'Al Portador'
    : 'Al Portador';
  const telefono = isVianda ? ticketVianda.telefono : isBingo ? tarjetaBingo.telefono : '';
  const fecha = isVianda ? ticketVianda.fechaFormateada : isBingo ? tarjetaBingo.fechaFormateada : '';
  const estadoPago = isVianda ? ticketVianda.estadoPago : isBingo ? tarjetaBingo.estadoPago : 'pagado';
  const modalidadPago = isVianda ? ticketVianda.modalidadPago : isBingo ? tarjetaBingo.modalidadPago : 'efectivo';

  const handlePrint = () => {
    const content = document.getElementById('printable-ticket');
    if (!content) {
      window.print();
      return;
    }

    // Create an isolated printing iframe to guarantee the print preview is never blank
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

    const isCompact = imp.modoAhorroPapel;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Ticket ${ticketNumero}</title>
          <style>
            @page {
              margin: ${isCompact ? '2mm' : '4mm'};
              size: auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
              font-size: ${isCompact ? '11px' : '13px'};
              color: #000000;
              background: #ffffff;
              margin: 0;
              padding: ${isCompact ? '4px' : '8px'};
              line-height: ${isCompact ? '1.15' : '1.35'};
              max-width: 360px;
              margin-left: auto;
              margin-right: auto;
            }
            * {
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .border-b { border-bottom: 1px dashed #444; }
            .border-t { border-top: 1px solid #444; }
            .pb-1 { padding-bottom: ${isCompact ? '3px' : '5px'}; }
            .pb-2 { padding-bottom: ${isCompact ? '4px' : '8px'}; }
            .pt-1 { padding-top: ${isCompact ? '3px' : '5px'}; }
            .pt-2 { padding-top: ${isCompact ? '4px' : '8px'}; }
            .my-1 { margin-top: 3px; margin-bottom: 3px; }
            .my-2 { margin-top: ${isCompact ? '3px' : '6px'}; margin-bottom: ${isCompact ? '3px' : '6px'}; }
            .ticket-badge {
              display: inline-block;
              border: 1px solid #000;
              padding: 2px 6px;
              font-weight: bold;
              border-radius: 4px;
              margin-top: 4px;
            }
            .status-stamp {
              display: inline-block;
              border: 1.5px solid #000;
              padding: 2px 8px;
              font-weight: 900;
              border-radius: 12px;
              margin: 4px 0;
              font-size: 11px;
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

  const hasMultipleBingoCards =
    isBingo && tarjetaBingo.numerosTarjetas && tarjetaBingo.numerosTarjetas.length > 1;

  const isCompact = imp.modoAhorroPapel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 print:shadow-none print:border-none print:max-w-full flex flex-col">
        {/* Modal Actions Header - Sticky & Hidden in Print */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Comprobante de Venta Listo</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt - Scrollable */}
        <div
          id="printable-ticket"
          className={`font-mono text-slate-900 print:p-2 overflow-y-auto flex-1 ${
            isCompact ? 'p-3 text-xs space-y-2' : 'p-6 text-sm space-y-4'
          }`}
        >
          {/* Header Ticket Section */}
          <div className={`text-center border-b border-dashed border-slate-300 ${isCompact ? 'pb-2' : 'pb-4'}`}>
            {imp.mostrarLogo && (
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black mb-1 text-xs">
                INA
              </div>
            )}

            {imp.mostrarEncabezado && (
              <h2 className="font-black text-base tracking-wider uppercase text-slate-900">
                {config.nombreEvento || 'EVENTOS INA'}
              </h2>
            )}

            {imp.mostrarSubtitulo && config.subtitulo && (
              <p className="text-[11px] text-slate-600">{config.subtitulo}</p>
            )}

            {imp.mostrarLugar && config.lugar && (
              <p className="text-[11px] text-slate-500">{config.lugar}</p>
            )}

            <div className="mt-1.5 inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold text-xs text-slate-800">
              TICKET N° {ticketNumero}
            </div>
          </div>

          {/* Metadata Section */}
          <div className={`text-xs space-y-1 text-slate-700 border-b border-dashed border-slate-300 ${isCompact ? 'pb-2' : 'pb-3'}`}>
            {imp.mostrarFechaHora && (
              <div className="flex justify-between">
                <span>Fecha / Hora:</span>
                <span className="font-bold">{fecha}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Titular:</span>
              <span className="font-bold text-slate-900">{comprador}</span>
            </div>

            {imp.mostrarTelefono && telefono && (
              <div className="flex justify-between">
                <span>Teléfono:</span>
                <span>{telefono}</span>
              </div>
            )}

            {imp.mostrarModalidadPago && (
              <div className="flex justify-between items-center pt-0.5">
                <span>Modalidad de Pago:</span>
                <span className="uppercase font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                  {modalidadPago}
                </span>
              </div>
            )}
          </div>

          {/* Ticket Body: Viandas */}
          {isVianda && (
            <div className={`border-b border-dashed border-slate-300 space-y-1.5 ${isCompact ? 'pb-2' : 'pb-3'}`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                DETALLE DE VIANDAS
              </div>
              <div className="space-y-1 text-xs">
                {ticketVianda.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900">{item.cantidad}x </span>
                      <span>{item.nombre}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({item.etiquetaPrecio})</span>
                    </div>
                    <span className="font-bold text-slate-900 whitespace-nowrap ml-2">
                      {formatPrecio(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>TOTAL A PAGAR:</span>
                <span className="text-emerald-700 font-extrabold text-base">
                  {formatPrecio(ticketVianda.total)}
                </span>
              </div>
            </div>
          )}

          {/* Ticket Body: Tarjetas de Bingo (1 o Múltiples) */}
          {isBingo && (
            <div className={`border-b border-dashed border-slate-300 text-center space-y-2 ${isCompact ? 'pb-2' : 'pb-4'}`}>
              <div className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                TARJETAS DE BINGO OFICIALES
              </div>

              {hasMultipleBingoCards ? (
                <div className={`bg-indigo-50 border border-indigo-200 rounded-xl ${isCompact ? 'p-2' : 'py-3 px-4'}`}>
                  <div className="text-[11px] uppercase text-indigo-700 font-bold">
                    {tarjetaBingo.numerosTarjetas!.length} TARJETAS ASIGNADAS
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1 py-1">
                    {tarjetaBingo.numerosTarjetas!.map((num) => (
                      <span
                        key={num}
                        className="inline-block px-2 py-0.5 bg-white border border-indigo-300 rounded text-sm font-black text-indigo-950 font-mono shadow-sm"
                      >
                        #{String(num).padStart(3, '0')}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium">
                    {tarjetaBingo.etiquetaPrecio} • ({tarjetaBingo.numerosTarjetas!.length} tarjetas)
                  </div>
                </div>
              ) : (
                <div className={`bg-indigo-50 border border-indigo-200 rounded-xl ${isCompact ? 'py-1.5 px-3' : 'py-3 px-4'}`}>
                  <div className="text-[10px] uppercase text-indigo-700 font-bold">NÚMERO ASIGNADO</div>
                  <div className="text-3xl font-black text-indigo-900 tracking-tight">
                    #{String(tarjetaBingo.numeroTarjeta).padStart(3, '0')}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium">
                    {tarjetaBingo.etiquetaPrecio}
                  </div>
                </div>
              )}

              <div className="pt-1.5 flex justify-between items-center text-sm font-black text-slate-900">
                <span>IMPORTE TOTAL:</span>
                <span className="text-indigo-700 text-base">
                  {formatPrecio(tarjetaBingo.precioCobrado)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Status Stamp */}
          {imp.mostrarEstadoPago && (
            <div className="text-center pt-1">
              {estadoPago === 'pagado' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                  ESTADO: PAGADO
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold border border-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  ESTADO: PENDIENTE DE PAGO
                </div>
              )}
            </div>
          )}

          {/* Simulated Barcode */}
          {imp.mostrarCodigoBarras && (
            <div className="text-center pt-1">
              <div className="inline-block p-1 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-center items-end gap-1 h-6 px-3">
                  <div className="w-1 h-5 bg-slate-900"></div>
                  <div className="w-1.5 h-6 bg-slate-900"></div>
                  <div className="w-0.5 h-4 bg-slate-900"></div>
                  <div className="w-2 h-6 bg-slate-900"></div>
                  <div className="w-1 h-4 bg-slate-900"></div>
                  <div className="w-2.5 h-6 bg-slate-900"></div>
                  <div className="w-1 h-5 bg-slate-900"></div>
                  <div className="w-0.5 h-6 bg-slate-900"></div>
                  <div className="w-2 h-5 bg-slate-900"></div>
                  <div className="w-1 h-6 bg-slate-900"></div>
                </div>
                <div className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">
                  {ticketNumero}
                </div>
              </div>
            </div>
          )}

          {/* Footer message */}
          {imp.mostrarMensajePie && config.mensajeTicket && (
            <p className="text-[10px] text-slate-600 text-center italic pt-1">
              {config.mensajeTicket}
            </p>
          )}
        </div>

        {/* Footer print note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden flex-shrink-0">
          <span className="text-xs text-slate-600">
            {imp.modoAhorroPapel ? 'Modo Ultra Compacto Activo' : 'Apto térmica 80mm/58mm o A4'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
