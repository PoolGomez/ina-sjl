'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
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
  X,
  ShoppingBag,
  Edit2,
  Ban,
} from 'lucide-react';
import {
  ViandaProducto,
  getPreciosVianda,
  TicketVianda,
  ItemVentaVianda,
  ModalidadPago,
  ModalidadPagoConfig,
  EstadoPago,
  ConfiguracionEvento,
  formatPrecio,
} from '../lib/types';
import {
  getViandasProductos,
  getTicketsViandas,
  saveTicketVianda,
  updateTicketViandaEstado,
  getModalidadesPago,
} from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { TicketModal } from './TicketModal';
import { AdaptiveDataView } from './AdaptiveDataView';

interface ViandasSalesProps {
  config: ConfiguracionEvento;
  mode?: 'history' | 'pos';
}

export const ViandasSales: React.FC<ViandasSalesProps> = ({
  config,
  mode = 'history',
}) => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ViandaProducto[]>([]);
  const [tickets, setTickets] = useState<TicketVianda[]>([]);
  const [cart, setCart] = useState<ItemVentaVianda[]>([]);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcionImpresion, setDescripcionImpresion] = useState('');
  const [notas, setNotas] = useState('');
  const [modalidadPago, setModalidadPago] = useState<ModalidadPago>('efectivo');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pagado');
  const [modalidades, setModalidades] = useState<ModalidadPagoConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // New Sale Modal (used in 'history' mode)
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

  // Modal ticket printing
  const [selectedTicket, setSelectedTicket] = useState<TicketVianda | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Modal edit estado
  const [editingEstadoTicket, setEditingEstadoTicket] = useState<TicketVianda | null>(null);
  const [nuevoEstadoSeleccionado, setNuevoEstadoSeleccionado] = useState<EstadoPago>('pagado');
  const [savingEstado, setSavingEstado] = useState(false);

  const loadData = async () => {
    const prods = await getViandasProductos();
    setProductos(prods.filter((p) => p.activo));
    const tks = await getTicketsViandas();
    setTickets(tks);
    const mods = await getModalidadesPago();
    setModalidades(mods.filter((m) => m.activo));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update estadoPago automatically based on modalidadPago
  const handleModalidadChange = (modalidad: ModalidadPago) => {
    setModalidadPago(modalidad);
    if (modalidad === 'pendiente') {
      setEstadoPago('pendiente');
    } else {
      setEstadoPago('pagado');
    }
  };

  // Add item to cart with selected price tag
  const handleAddToCart = (
    producto: ViandaProducto,
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

  const totalCart =
    Math.round(cart.reduce((acc, item) => acc + item.subtotal, 0) * 100) / 100;

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
    const nuevoNumeroTicket = `V-${correlativo}`;
    const now = new Date();

    const nuevoTicket: TicketVianda = {
      id: 'ticket-v-' + Date.now(),
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

    await saveTicketVianda(nuevoTicket);
    setTickets((prev) => [nuevoTicket, ...prev]);

    // Close New Sale modal if in history mode & open printable ticket
    setIsNewSaleOpen(false);
    setSelectedTicket(nuevoTicket);
    setIsTicketModalOpen(true);

    // Reset cart
    handleClearCart();
    setSaving(false);
  };

  const handleOpenEditEstado = (ticket: TicketVianda) => {
    setEditingEstadoTicket(ticket);
    setNuevoEstadoSeleccionado(ticket.estadoPago);
  };

  const handleSaveEstado = async () => {
    if (!editingEstadoTicket) return;
    setSavingEstado(true);
    const updated = await updateTicketViandaEstado(
      editingEstadoTicket.id,
      nuevoEstadoSeleccionado
    );
    if (updated) {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === editingEstadoTicket.id
            ? { ...t, estadoPago: nuevoEstadoSeleccionado }
            : t
        )
      );
    }
    setSavingEstado(false);
    setEditingEstadoTicket(null);
  };

  const getEstadoBadgeClass = (estado: EstadoPago) => {
    if (estado === 'pagado') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    }
    if (estado === 'anulado') {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  };

  const getEstadoLabel = (estado: EstadoPago) => {
    if (estado === 'pagado') return 'PAGADO';
    if (estado === 'anulado') return 'ANULADO';
    return 'PENDIENTE';
  };

  const filteredTickets = ticketsDelEvento.filter(
    (t) =>
      t.comprador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.numeroTicket.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSalesInterface = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Available Products (7 cols on lg) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            Menú y Productos Disponibles ({productos.length})
          </h2>
          <button
            type="button"
            onClick={loadData}
            title="Refrescar catálogo"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {productos.map((prod) => {
            const preciosProd = getPreciosVianda(prod);
            const priceBtnThemes = [
              {
                btn: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800',
                label: 'text-amber-700 dark:text-amber-400',
                amount: 'text-amber-900 dark:text-amber-200',
              },
              {
                btn: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-800',
                label: 'text-orange-700 dark:text-orange-400',
                amount: 'text-orange-900 dark:text-orange-200',
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
                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-amber-500 transition-colors">
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
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                      <Printer className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        Impresión: {prod.descripcionImpresion}
                      </span>
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
                            type="button"
                            onClick={() =>
                              handleAddToCart(prod, p.monto, p.etiqueta)
                            }
                            className={`p-2.5 border rounded-xl text-left transition group/btn ${theme.btn}`}
                          >
                            <div
                              className={`text-[10px] font-bold uppercase truncate ${theme.label}`}
                            >
                              {p.etiqueta}
                            </div>
                            <div
                              className={`text-sm font-black flex items-center justify-between ${theme.amount}`}
                            >
                              <span>{formatPrecio(p.monto)}</span>
                              <Plus className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleAddToCart(
                          prod,
                          preciosProd[0]?.monto ?? prod.precio1,
                          preciosProd[0]?.etiqueta ||
                          prod.etiquetaPrecio1 ||
                          'General'
                        )
                      }
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between transition group/btn"
                    >
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {preciosProd[0]?.etiqueta ||
                          prod.etiquetaPrecio1 ||
                          'Precio General'}
                      </span>
                      <span className="text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                        {formatPrecio(preciosProd[0]?.monto ?? prod.precio1)}
                        <Plus className="w-4 h-4 text-amber-600 group-hover/btn:scale-125 transition-transform" />
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
      <div id="checkout-panel" className="lg:col-span-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl lg:sticky lg:top-20">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Orden Actual</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold">
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
              <UtensilsCrossed className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-medium">El carrito está vacío</p>
              <p className="text-xs text-slate-400">
                Selecciona productos a la izquierda para armar la orden
              </p>
            </div>
          ) : (
            <div className="py-3 max-h-56 overflow-y-auto space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="pt-2 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.nombre}
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.etiquetaPrecio} • {formatPrecio(item.precioUnitario)}{' '}
                      c/u
                    </div>
                    {item.descripcionImpresion && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                        🖨️ {item.descripcionImpresion}
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(index, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-xs px-1 text-slate-900 dark:text-white">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
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
                      type="button"
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
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              TOTAL ORDEN:
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatPrecio(totalCart)}
            </span>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handleCheckout} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Comprador{' '}
                <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={comprador}
                  onChange={(e) => setComprador(e.target.value)}
                  placeholder="Ej. Juan Pérez (o dejar vacío)"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / Contacto{' '}
                <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 11 2345-6789"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${modalidadPago === m.id
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
                  setEstadoPago((prev) =>
                    prev === 'pagado' ? 'pendiente' : 'pagado'
                  )
                }
                className={`px-3 py-1 rounded-full font-bold flex items-center gap-1 transition ${estadoPago === 'pagado'
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
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              <Printer className="w-4 h-4" />
              {saving
                ? 'Registrando Venta...'
                : 'Confirmar Venta e Imprimir Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Mode: POS only (used inside the unified "Ventas" module)
  if (mode === 'pos') {
    return (
      <div className="space-y-6">
        {renderSalesInterface()}

        {/* Floating mobile quick cart button */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-3 right-3 z-30 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('checkout-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl shadow-2xl shadow-orange-600/40 font-black text-sm flex items-center justify-between border border-white/20"
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

        <TicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          tipo="vianda"
          ticketVianda={selectedTicket}
          config={config}
        />
      </div>
    );
  }

  // Mode: History first with "Nueva Venta" modal button (used in /system/viandas)
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <UtensilsCrossed className="w-3.5 h-3.5" /> Módulo de Viandas
            </div>
            {config.nombreEvento && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/30 border border-white/25 text-white text-xs font-black">
                <span>Evento Activo: {config.nombreEvento}</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Viandas
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Consulta el historial de ventas de viandas, actualiza estados de pago, reimprime comprobantes o registra una nueva venta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">
              Tickets del Evento
            </div>
            <div className="text-2xl font-black">{ticketsDelEvento.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">
              Total Viandas
            </div>
            <div className="text-2xl font-black">
              {formatPrecio(
                ticketsDelEvento
                  .filter((t) => t.estadoPago === 'pagado')
                  .reduce((acc, t) => acc + t.total, 0)
              )}
            </div>
          </div>
          {/* <button
            type="button"
            onClick={() => setIsNewSaleOpen(true)}
            className="px-5 py-3.5 bg-white text-amber-700 hover:bg-amber-50 font-black rounded-2xl shadow-lg transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Venta
          </button> */}
        </div>
      </div>

      {/* Sales History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Historial de Ventas de Viandas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Consulta y reimpresión de comprobantes emitidos
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente o N° ticket..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-sm transition inline-flex items-center justify-center gap-1.5 text-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Venta
            </button>
          </div>
        </div>

        <div className="mt-4">
          <AdaptiveDataView
            items={filteredTickets}
            pageSize={15}
            itemLabel="tickets de viandas"
            emptyState={
              <div className="py-10 text-center text-xs text-slate-400 space-y-3">
                <UtensilsCrossed className="w-10 h-10 mx-auto stroke-1 text-slate-300 dark:text-slate-700" />
                <p>No hay tickets registrados que coincidan con la búsqueda.</p>
                <button
                  type="button"
                  onClick={() => setIsNewSaleOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Primera Venta
                </button>
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
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {visibleTickets.map((tk) => (
                    <tr
                      key={tk.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {tk.numeroTicket}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {tk.comprador}
                        {tk.telefono && (
                          <span className="block text-[10px] text-slate-400">
                            {tk.telefono}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {tk.items
                          .map((i) => `${i.cantidad}x ${i.nombre}`)
                          .join(', ')}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {formatPrecio(tk.total)}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[11px] text-slate-500 whitespace-nowrap">
                        {tk.modalidadPago}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${getEstadoBadgeClass(
                            tk.estadoPago
                          )}`}
                        >
                          {getEstadoLabel(tk.estadoPago)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEstado(tk)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            title="Editar estado del registro"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />{' '}
                            Estado
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicket(tk);
                              setIsTicketModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" />{' '}
                            Ticket
                          </button>
                        </div>
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
                        <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg">
                          {tk.numeroTicket}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getEstadoBadgeClass(
                            tk.estadoPago
                          )}`}
                        >
                          {getEstadoLabel(tk.estadoPago)}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">
                        {tk.comprador}
                      </h4>
                      {tk.telefono && (
                        <p className="text-[11px] text-slate-400">
                          📞 {tk.telefono}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        {tk.items
                          .map((i) => `${i.cantidad}x ${i.nombre}`)
                          .join(', ')}
                      </p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {formatPrecio(tk.total)}
                        </span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold ml-2">
                          {tk.modalidadPago}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditEstado(tk)}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Estado
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(tk);
                            setIsTicketModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-500" /> Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* Modal: Editar Estado de Vianda */}
      {editingEstadoTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Editar Estado del Registro
                </h3>
                <p className="text-xs text-slate-500">
                  Ticket {editingEstadoTicket.numeroTicket} • {editingEstadoTicket.comprador}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEstadoTicket(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setNuevoEstadoSeleccionado('pagado')}
                className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  nuevoEstadoSeleccionado === 'pagado'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Pagado</span>
              </button>

              <button
                type="button"
                onClick={() => setNuevoEstadoSeleccionado('pendiente')}
                className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  nuevoEstadoSeleccionado === 'pendiente'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Pendiente</span>
              </button>

              <button
                type="button"
                onClick={() => setNuevoEstadoSeleccionado('anulado')}
                className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  nuevoEstadoSeleccionado === 'anulado'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Ban className="w-5 h-5 text-rose-500" />
                <span>Anulado</span>
              </button>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingEstadoTicket(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEstado}
                disabled={savingEstado}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {savingEstado ? 'Guardando...' : 'Guardar Estado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva Venta de Viandas */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Nueva Venta de Viandas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecciona los productos del menú y confirma la orden
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSaleOpen(false)}
                className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderSalesInterface()}
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        tipo="vianda"
        ticketVianda={selectedTicket}
        config={config}
      />
    </div>
  );
};
