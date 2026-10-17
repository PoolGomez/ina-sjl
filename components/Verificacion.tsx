'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  UtensilsCrossed,
  Ticket,
  User,
  Phone,
  DollarSign,
  AlertCircle,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import {
  TicketVianda,
  TarjetaBingoVenta,
  ConfiguracionEvento,
  formatPrecio,
} from '../lib/types';
import {
  getTicketsViandas,
  getTarjetasBingoVentas,
  updateTicketViandaEstado,
  updateTarjetaBingoEstado,
} from '../lib/storage';
import { TicketModal } from './TicketModal';

interface VerificacionProps {
  config: ConfiguracionEvento;
}

export const Verificacion: React.FC<VerificacionProps> = ({ config }) => {
  const [query, setQuery] = useState('');
  const [ticketsViandas, setTicketsViandas] = useState<TicketVianda[]>([]);
  const [tarjetasBingo, setTarjetasBingo] = useState<TarjetaBingoVenta[]>([]);
  const [searchResult, setSearchResult] = useState<{
    tipo: 'vianda' | 'bingo';
    ticketVianda?: TicketVianda;
    tarjetaBingo?: TarjetaBingoVenta;
  } | null>(null);

  const [hasSearched, setHasSearched] = useState(false);

  // Modal print
  const [selectedTicketPrint, setSelectedTicketPrint] = useState<TicketVianda | null>(null);
  const [selectedBingoPrint, setSelectedBingoPrint] = useState<TarjetaBingoVenta | null>(null);
  const [modalType, setModalType] = useState<'vianda' | 'bingo'>('vianda');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const [tks, tbs] = await Promise.all([getTicketsViandas(), getTarjetasBingoVentas()]);
    setTicketsViandas(tks);
    setTarjetasBingo(tbs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (termToSearch?: string) => {
    const term = (termToSearch !== undefined ? termToSearch : query).trim().toLowerCase();
    if (!term) return;

    setHasSearched(true);

    // 1. Check exact or partial match in Viandas Tickets
    const matchVianda = ticketsViandas.find(
      (t) =>
        t.numeroTicket.toLowerCase() === term ||
        t.numeroTicket.toLowerCase() === `v-${term}` ||
        t.comprador.toLowerCase().includes(term)
    );

    if (matchVianda) {
      setSearchResult({ tipo: 'vianda', ticketVianda: matchVianda });
      return;
    }

    // 2. Check exact or partial match in Bingo Cards
    const matchBingo = tarjetasBingo.find(
      (b) =>
        b.numeroTicket.toLowerCase() === term ||
        b.numeroTicket.toLowerCase() === `b-${term}` ||
        String(b.numeroTarjeta) === term ||
        `#${b.numeroTarjeta}` === term ||
        (b.numerosTarjetas && b.numerosTarjetas.some((num) => String(num) === term || `#${num}` === term)) ||
        b.comprador.toLowerCase().includes(term)
    );

    if (matchBingo) {
      setSearchResult({ tipo: 'bingo', tarjetaBingo: matchBingo });
      return;
    }

    setSearchResult(null);
  };

  const handleToggleEstadoVianda = async (ticket: TicketVianda) => {
    const nuevo = ticket.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    const updated = await updateTicketViandaEstado(ticket.id, nuevo);
    if (updated) {
      setTicketsViandas((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (searchResult?.ticketVianda?.id === ticket.id) {
        setSearchResult({ tipo: 'vianda', ticketVianda: updated });
      }
    }
  };

  const handleToggleEntregado = async (ticket: TicketVianda) => {
    const nuevo = !ticket.entregado;
    const updated = await updateTicketViandaEstado(ticket.id, ticket.estadoPago, nuevo);
    if (updated) {
      setTicketsViandas((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (searchResult?.ticketVianda?.id === ticket.id) {
        setSearchResult({ tipo: 'vianda', ticketVianda: updated });
      }
    }
  };

  const handleToggleEstadoBingo = async (tarjeta: TarjetaBingoVenta) => {
    const nuevo = tarjeta.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    const updated = await updateTarjetaBingoEstado(tarjeta.id, nuevo);
    if (updated) {
      setTarjetasBingo((prev) => prev.map((t) => (t.id === tarjeta.id ? updated : t)));
      if (searchResult?.tarjetaBingo?.id === tarjeta.id) {
        setSearchResult({ tipo: 'bingo', tarjetaBingo: updated });
      }
    }
  };

  const viandasPendientes = ticketsViandas.filter((t) => t.estadoPago === 'pendiente');
  const bingoPendientes = tarjetasBingo.filter((b) => b.estadoPago === 'pendiente');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Control de Admisión y Caja
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Verificación de Pagos y Tickets
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Verifica al instante si un ticket de vianda o tarjeta de bingo está PAGADO o PENDIENTE, y actualiza su estado con un solo clic.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Viandas Pendientes</div>
            <div className="text-2xl font-black">{viandasPendientes.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Tarjetas Pendientes</div>
            <div className="text-2xl font-black">{bingoPendientes.length}</div>
          </div>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl max-w-3xl mx-auto">
        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          Buscar por N° Ticket (V-1001), N° de Bingo (15) o Nombre de Cliente:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length > 1) {
                  handleSearch(e.target.value);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ej. V-1001, B-1001, 15, o Juan..."
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/25 transition text-sm flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Verificar
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {searchResult ? (
        <div className="max-w-3xl mx-auto animate-fade-in">
          {searchResult.tipo === 'vianda' && searchResult.ticketVianda && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
              {/* Header result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Ticket de Vianda Oficial
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {searchResult.ticketVianda.numeroTicket}
                    </h3>
                  </div>
                </div>

                {/* Big Status Badge */}
                <div>
                  {searchResult.ticketVianda.estadoPago === 'pagado' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                      ESTADO: PAGADO
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30">
                      <Clock className="w-5 h-5" />
                      ESTADO: PENDIENTE DE COBRO
                    </div>
                  )}
                </div>
              </div>

              {/* Body Details */}
              <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Comprador:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {searchResult.ticketVianda.comprador}
                    </strong>
                  </div>
                  {searchResult.ticketVianda.telefono && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>Teléfono:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {searchResult.ticketVianda.telefono}
                      </strong>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span>Modalidad de Pago:</span>
                    <span className="uppercase font-bold text-slate-800 dark:text-slate-200">
                      {searchResult.ticketVianda.modalidadPago}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase block">
                    Productos del Pedido:
                  </span>
                  {searchResult.ticketVianda.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>
                        {it.cantidad}x {it.nombre} ({it.etiquetaPrecio})
                      </span>
                      <strong className="text-slate-900 dark:text-white">
                        {formatPrecio(it.subtotal)}
                      </strong>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                    <span>TOTAL:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base">
                      {formatPrecio(searchResult.ticketVianda.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 justify-end">
                <button
                  onClick={() => handleToggleEstadoVianda(searchResult.ticketVianda!)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    searchResult.ticketVianda.estadoPago === 'pagado'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {searchResult.ticketVianda.estadoPago === 'pagado'
                    ? 'Marcar como Pendiente'
                    : 'Marcar como Pagado Ahora'}
                </button>

                <button
                  onClick={() => handleToggleEntregado(searchResult.ticketVianda!)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    searchResult.ticketVianda.entregado
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                  {searchResult.ticketVianda.entregado
                    ? 'Entregado en Mostrador'
                    : 'Marcar como Entregado'}
                </button>

                <button
                  onClick={() => {
                    setSelectedTicketPrint(searchResult.ticketVianda!);
                    setModalType('vianda');
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" /> Reimprimir Ticket
                </button>
              </div>
            </div>
          )}

          {searchResult.tipo === 'bingo' && searchResult.tarjetaBingo && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Ticket de Bingo {searchResult.tarjetaBingo.numeroTicket}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {searchResult.tarjetaBingo.numerosTarjetas && searchResult.tarjetaBingo.numerosTarjetas.length > 1
                        ? `Tarjetas: ${searchResult.tarjetaBingo.numerosTarjetas.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')} (${searchResult.tarjetaBingo.numerosTarjetas.length} tarjetas)`
                        : `Tarjeta #${String(searchResult.tarjetaBingo.numeroTarjeta).padStart(3, '0')}`}
                    </h3>
                  </div>
                </div>

                {/* Big Status Badge */}
                <div>
                  {searchResult.tarjetaBingo.estadoPago === 'pagado' ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                      ESTADO: PAGADO
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30">
                      <Clock className="w-5 h-5" />
                      ESTADO: PENDIENTE DE COBRO
                    </div>
                  )}
                </div>
              </div>

              {/* Body Details */}
              <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Titular / Comprador:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {searchResult.tarjetaBingo.comprador}
                    </strong>
                  </div>
                  {searchResult.tarjetaBingo.telefono && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>Teléfono:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {searchResult.tarjetaBingo.telefono}
                      </strong>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span>Modalidad de Pago:</span>
                    <span className="uppercase font-bold text-slate-800 dark:text-slate-200">
                      {searchResult.tarjetaBingo.modalidadPago}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase block">
                    Comprobante N° {searchResult.tarjetaBingo.numeroTicket}
                  </span>
                  <div className="flex justify-between text-xs">
                    <span>Tarifa Aplicada:</span>
                    <strong>{searchResult.tarjetaBingo.etiquetaPrecio}</strong>
                  </div>
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 flex justify-between font-black text-sm">
                    <span>IMPORTE COBRADO:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 text-base">
                      {formatPrecio(searchResult.tarjetaBingo.precioCobrado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 justify-end">
                <button
                  onClick={() => handleToggleEstadoBingo(searchResult.tarjetaBingo!)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    searchResult.tarjetaBingo.estadoPago === 'pagado'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {searchResult.tarjetaBingo.estadoPago === 'pagado'
                    ? 'Marcar como Pendiente'
                    : 'Marcar como Pagado Ahora'}
                </button>

                <button
                  onClick={() => {
                    setSelectedBingoPrint(searchResult.tarjetaBingo!);
                    setModalType('bingo');
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" /> Reimprimir Comprobante
                </button>
              </div>
            </div>
          )}
        </div>
      ) : hasSearched ? (
        <div className="max-w-md mx-auto text-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">
            No se encontró ningún ticket o tarjeta
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Verifica que el número o nombre ingresado sea correcto (ej. V-1001, B-1001 o el número de tarjeta de bingo).
          </p>
        </div>
      ) : null}

      {/* Quick Glance of Pending Debts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Viandas Pendientes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Viandas por Cobrar ({viandasPendientes.length})
            </h4>
            <button
              onClick={loadData}
              className="p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {viandasPendientes.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              ¡Excelente! Todas las viandas están al día.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {viandasPendientes.map((tk) => (
                <div
                  key={tk.id}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer"
                  onClick={() => setSearchResult({ tipo: 'vianda', ticketVianda: tk })}
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {tk.numeroTicket}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2">{tk.comprador}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-600">
                      {formatPrecio(tk.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bingo Pendientes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Tarjetas de Bingo por Cobrar ({bingoPendientes.length})
            </h4>
            <button
              onClick={loadData}
              className="p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {bingoPendientes.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              ¡Excelente! Todas las tarjetas de bingo están pagadas.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {bingoPendientes.map((tb) => (
                <div
                  key={tb.id}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer"
                  onClick={() => setSearchResult({ tipo: 'bingo', tarjetaBingo: tb })}
                >
                  <div>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Tarjeta #{String(tb.numeroTarjeta).padStart(3, '0')}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 ml-2">{tb.comprador}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-600">
                      {formatPrecio(tb.precioCobrado)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tipo={modalType}
        ticketVianda={selectedTicketPrint}
        tarjetaBingo={selectedBingoPrint}
        config={config}
      />
    </div>
  );
};
