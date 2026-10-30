'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  Clock,
  User,
  Phone,
  Search,
  RotateCcw,
  FileText,
} from 'lucide-react';
import {
  TicketProducto,
  getPreciosTicket,
  TicketEventoVenta,
  ItemVentaTicket,
  ModalidadPago,
  ModalidadPagoConfig,
  EstadoPago,
  ConfiguracionEvento,
  formatPrecio,
} from '../lib/types';
import {
  getTicketsProductos,
  getTicketsEventoVentas,
  saveTicketEventoVenta,
  updateTicketEventoEstado,
  getModalidadesPago,
} from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { TicketModal } from './TicketModal';
import { AdaptiveDataView } from './AdaptiveDataView';

interface TicketsSalesProps {
  config: ConfiguracionEvento;
}

export const TicketsSales: React.FC<TicketsSalesProps> = ({ config }) => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<TicketProducto[]>([]);
  const [tickets, setTickets] = useState<TicketEventoVenta[]>([]);
  const [cart, setCart] = useState<ItemVentaTicket[]>([]);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcionImpresion, setDescripcionImpresion] = useState('');
  const [notas, setNotas] = useState('');
  const [modalidadPago, setModalidadPago] = useState<ModalidadPago>('efectivo');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pagado');
  const [modalidades, setModalidades] = useState<ModalidadPagoConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal ticket printing
  const [selectedTicket, setSelectedTicket] = useState<TicketEventoVenta | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const loadData = async () => {
    const prods = await getTicketsProductos();
    setProductos(prods.filter((p) => p.activo));
    const tks = await getTicketsEventoVentas();
    setTickets(tks);
    const mods = await getModalidadesPago();
    setModalidades(mods.filter((m) => m.activo));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModalidadChange = (modalidad: ModalidadPago) => {
    setModalidadPago(modalidad);
    if (modalidad === 'pendiente') {
      setEstadoPago('pendiente');
    } else {
      setEstadoPago('pagado');
    }
  };

  const handleAddToCart = (
    producto: TicketProducto,
    precio: number,
    etiquetaPrecio: string
  ) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productoId === producto.id && i.etiquetaPrecio === etiquetaPrecio
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = updated[existingIdx];
        const newQty = item.cantidad + 1;
        updated[existingIdx] = {
          ...item,
          cantidad: newQty,
          subtotal: Math.round(newQty * item.precioUnitario * 100) / 100,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productoId: producto.id,
            nombre: producto.nombre,
            descripcionImpresion: producto.descripcionImpresion || '',
            precioUnitario: precio,
            etiquetaPrecio,
            cantidad: 1,
            subtotal: precio,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.cantidad + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = {
        ...item,
        cantidad: newQty,
        subtotal: Math.round(newQty * item.precioUnitario * 100) / 100,
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    setComprador('');
    setTelefono('');
    setDescripcionImpresion('');
    setNotas('');
  };

  const totalCart = Math.round(cart.reduce((acc, item) => acc + item.subtotal, 0) * 100) / 100;

  // Filter tickets belonging to the active event
  const ticketsDelEvento = tickets.filter((t) => {
    if (!config.id) return true;
    if (t.eventoId) return t.eventoId === config.id;
    return config.id === 'evento-principal';
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSaving(true);
    const correlativo = (ticketsDelEvento.length + 1).toString().padStart(4, '0');
    const nuevoNumeroTicket = `T-${correlativo}`;
    const now = new Date();

    const nuevoTicket: TicketEventoVenta = {
      id: 'ticket-t-' + Date.now(),
      numeroTicket: nuevoNumeroTicket,
      eventoId: config.id || '',
      nombreEvento: config.nombreEvento || '',
      comprador: comprador.trim() ? comprador.trim() : 'Al Portador',
      telefono: telefono.trim(),
      descripcionImpresion: descripcionImpresion.trim(),
      items: [...cart],
      total: totalCart,
      modalidadPago,
      estadoPago,
      entregado: false,
      fecha: now.toISOString(),
      fechaFormateada: now.toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      notas: notas.trim(),
      vendedorEmail: user?.email || 'cajero@eventosina.com',
    };

    await saveTicketEventoVenta(nuevoTicket);
    setTickets((prev) => [nuevoTicket, ...prev]);

    // Open printable ticket
    setSelectedTicket(nuevoTicket);
    setIsTicketModalOpen(true);

    // Reset cart
    handleClearCart();
    setSaving(false);
  };

  const handleToggleEstadoPago = async (ticket: TicketEventoVenta) => {
    const nuevoEstado: EstadoPago = ticket.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    const updated = await updateTicketEventoEstado(ticket.id, nuevoEstado);
    if (updated) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, estadoPago: nuevoEstado } : t))
      );
    }
  };

  const filteredTickets = ticketsDelEvento.filter(
    (t) =>
      t.comprador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.numeroTicket.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-cyan-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <Receipt className="w-3.5 h-3.5" /> Punto de Venta de Tickets
            </div>
            {config.nombreEvento && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/30 border border-white/25 text-white text-xs font-black">
                <span>Evento Activo: {config.nombreEvento}</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Venta de Tickets y Entradas</h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Selecciona tickets, entradas o bonos disponibles, registra el comprador e imprime el comprobante instantáneamente.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Tickets Emitidos</div>
            <div className="text-2xl font-black">{ticketsDelEvento.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Total Recaudado</div>
            <div className="text-2xl font-black">
              {formatPrecio(
                ticketsDelEvento
                  .filter((t) => t.estadoPago === 'pagado')
                  .reduce((acc, t) => acc + t.total, 0)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Products Catalog & Cart / Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Tickets (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-cyan-500" />
              Tickets Disponibles ({productos.length})
            </h2>
            <button
              onClick={loadData}
              title="Refrescar catálogo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productos.map((prod) => {
              const preciosProd = getPreciosTicket(prod);
              const priceBtnThemes = [
                {
                  btn: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border-cyan-200 dark:border-cyan-800',
                  label: 'text-cyan-700 dark:text-cyan-400',
                  amount: 'text-cyan-900 dark:text-cyan-200',
                },
                {
                  btn: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border-sky-200 dark:border-sky-800',
                  label: 'text-sky-700 dark:text-sky-400',
                  amount: 'text-sky-900 dark:text-sky-200',
                },
                {
                  btn: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800',
                  label: 'text-emerald-700 dark:text-emerald-400',
                  amount: 'text-emerald-900 dark:text-emerald-200',
                },
                {
                  btn: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800',
                  label: 'text-indigo-700 dark:text-indigo-400',
                  amount: 'text-indigo-900 dark:text-indigo-200',
                },
              ];

              return (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-cyan-500 transition-colors">
                        {prod.nombre}
                      </h3>
                      {prod.categoria && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {prod.categoria}
                        </span>
                      )}
                    </div>
                    {prod.descripcion && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {prod.descripcion}
                      </p>
                    )}
                    {prod.descripcionImpresion && (
                      <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 font-medium flex items-center gap-1">
                        <Printer className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Impresión: {prod.descripcionImpresion}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    {preciosProd.length > 1 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {preciosProd.map((p, idx) => {
                          const theme = priceBtnThemes[idx % priceBtnThemes.length];
                          return (
                            <button
                              key={p.id || idx}
                              onClick={() => handleAddToCart(prod, p.monto, p.etiqueta)}
                              className={`p-2.5 border rounded-xl text-left transition group/btn ${theme.btn}`}
                            >
                              <div className={`text-[10px] font-bold uppercase truncate ${theme.label}`}>
                                {p.etiqueta}
                              </div>
                              <div className={`text-sm font-black flex items-center justify-between ${theme.amount}`}>
                                <span>{formatPrecio(p.monto)}</span>
                                <Plus className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleAddToCart(
                            prod,
                            preciosProd[0]?.monto ?? prod.precio1,
                            preciosProd[0]?.etiqueta || prod.etiquetaPrecio1 || 'General'
                          )
                        }
                        className="w-full py-2.5 px-4 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between transition group/btn"
                      >
                        <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300">
                          {preciosProd[0]?.etiqueta || prod.etiquetaPrecio1 || 'Precio General'}
                        </span>
                        <span className="text-sm font-black text-cyan-950 dark:text-cyan-100 flex items-center gap-1.5">
                          {formatPrecio(preciosProd[0]?.monto ?? prod.precio1)}
                          <Plus className="w-4 h-4 text-cyan-600 group-hover/btn:scale-125 transition-transform" />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart & Checkout Panel (5 cols on lg) */}
        <div id="checkout-panel-tickets" className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl lg:sticky lg:top-20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Orden de Tickets</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 text-xs font-bold">
                  {cart.reduce((acc, i) => acc + i.cantidad, 0)} ítems
                </span>
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium">El carrito está vacío</p>
                <p className="text-xs text-slate-400">Selecciona tickets a la izquierda para armar la orden</p>
              </div>
            ) : (
              <div className="py-3 max-h-56 overflow-y-auto space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
                {cart.map((item, index) => (
                  <div key={index} className="pt-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.nombre}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.etiquetaPrecio} • {formatPrecio(item.precioUnitario)} c/u
                      </div>
                      {item.descripcionImpresion && (
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate">
                          🖨️ {item.descripcionImpresion}
                        </div>
                      )}
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQty(index, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-xs px-1 text-slate-900 dark:text-white">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(index, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {formatPrecio(item.subtotal)}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-[10px] text-rose-400 hover:text-rose-600 transition"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total calculation */}
            <div className="py-3 border-t border-b border-slate-100 dark:border-slate-800 flex justify-between items-center my-3">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">TOTAL ORDEN:</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {formatPrecio(totalCart)}
              </span>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Comprador <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={comprador}
                    onChange={(e) => setComprador(e.target.value)}
                    placeholder="Ej. Juan Pérez (o dejar vacío)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / Contacto <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 11 2345-6789"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modalidad de Pago Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Modalidad de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {modalidades.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleModalidadChange(m.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        modalidadPago === m.id
                          ? `bg-gradient-to-r ${m.gradient} text-white border-transparent shadow-sm`
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base leading-none">{m.icono}</span>
                      {m.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Estado del Pago:</span>
                <button
                  type="button"
                  onClick={() =>
                    setEstadoPago((prev) => (prev === 'pagado' ? 'pendiente' : 'pagado'))
                  }
                  className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition ${
                    estadoPago === 'pagado'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {estadoPago === 'pagado' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Pagado
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> Pendiente
                    </>
                  )}
                </button>
              </div>

              {/* Submit & Print Button */}
              <button
                type="submit"
                disabled={cart.length === 0 || saving}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <Printer className="w-4 h-4" />
                {saving ? 'Registrando Venta...' : 'Confirmar Venta e Imprimir Ticket'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recent Sales History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Historial de Ventas de Tickets
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Consulta y reimpresión de comprobantes emitidos
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente o N° ticket..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <AdaptiveDataView
            items={filteredTickets}
            pageSize={15}
            itemLabel="ventas de tickets"
            emptyState={
              <div className="py-8 text-center text-xs text-slate-400">
                No hay tickets registrados que coincidan con la búsqueda.
              </div>
            }
            renderTable={(visibleTickets) => (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3 whitespace-nowrap">N° Ticket</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Cliente</th>
                    <th className="py-2.5 px-3">Detalle</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Total</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Modalidad</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Estado</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {visibleTickets.map((tk) => (
                    <tr key={tk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {tk.numeroTicket}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {tk.comprador}
                        {tk.telefono && (
                          <span className="block text-[10px] text-slate-400">{tk.telefono}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {tk.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatPrecio(tk.total)}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[11px] text-slate-500 whitespace-nowrap">
                        {tk.modalidadPago}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEstadoPago(tk)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                            tk.estadoPago === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {tk.estadoPago === 'pagado' ? 'PAGADO' : 'PENDIENTE'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedTicket(tk);
                            setIsTicketModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-cyan-500" /> Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            renderCards={(visibleTickets) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleTickets.map((tk) => (
                  <div
                    key={tk.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg">
                          {tk.numeroTicket}
                        </span>
                        <button
                          onClick={() => handleToggleEstadoPago(tk)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition ${
                            tk.estadoPago === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {tk.estadoPago === 'pagado' ? 'PAGADO' : 'PENDIENTE'}
                        </button>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">
                        {tk.comprador}
                      </h4>
                      {tk.telefono && (
                        <p className="text-[11px] text-slate-400">📞 {tk.telefono}</p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        {tk.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
                      </p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {formatPrecio(tk.total)}
                        </span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold ml-2">
                          {tk.modalidadPago}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTicket(tk);
                          setIsTicketModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-cyan-500" /> Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* Floating mobile quick cart button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-3 right-3 z-30 animate-fade-in">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('checkout-panel-tickets');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl shadow-2xl shadow-cyan-600/40 font-black text-sm flex items-center justify-between border border-white/20"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-black">
                {cart.reduce((acc, i) => acc + i.cantidad, 0)}
              </span>
              <span>Completar Venta y Cobrar</span>
            </span>
            <span className="text-base font-black">{formatPrecio(totalCart)}</span>
          </button>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        tipo="ticket"
        ticketEvento={selectedTicket}
        config={config}
      />
    </div>
  );
};
