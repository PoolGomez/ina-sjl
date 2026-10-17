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
  DollarSign,
  QrCode,
  CreditCard,
  User,
  Phone,
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  ViandaProducto,
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

interface ViandasSalesProps {
  config: ConfiguracionEvento;
}

export const ViandasSales: React.FC<ViandasSalesProps> = ({ config }) => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ViandaProducto[]>([]);
  const [tickets, setTickets] = useState<TicketVianda[]>([]);
  const [cart, setCart] = useState<ItemVentaVianda[]>([]);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [modalidadPago, setModalidadPago] = useState<ModalidadPago>('efectivo');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pagado');
  const [modalidades, setModalidades] = useState<ModalidadPagoConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal ticket printing
  const [selectedTicket, setSelectedTicket] = useState<TicketVianda | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

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
    setNotas('');
  };

  const totalCart = Math.round(cart.reduce((acc, item) => acc + item.subtotal, 0) * 100) / 100;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSaving(true);
    const correlativo = (tickets.length + 1).toString().padStart(4, '0');
    const nuevoNumeroTicket = `V-${correlativo}`;
    const now = new Date();

    const nuevoTicket: TicketVianda = {
      id: 'ticket-v-' + Date.now(),
      numeroTicket: nuevoNumeroTicket,
      comprador: comprador.trim() ? comprador.trim() : 'Al Portador',
      telefono: telefono.trim(),
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

    // Open printable ticket
    setSelectedTicket(nuevoTicket);
    setIsTicketModalOpen(true);

    // Reset cart
    handleClearCart();
    setSaving(false);
  };

  const handleToggleEstadoPago = async (ticket: TicketVianda) => {
    const nuevoEstado: EstadoPago = ticket.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    const updated = await updateTicketViandaEstado(ticket.id, nuevoEstado);
    if (updated) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, estadoPago: nuevoEstado } : t))
      );
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.comprador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.numeroTicket.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <UtensilsCrossed className="w-3.5 h-3.5" /> Punto de Venta
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Venta de Viandas y Menú</h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Selecciona viandas disponibles con precios regular o socio, registra el comprador e imprime el ticket instantáneamente.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Tickets Emitidos</div>
            <div className="text-2xl font-black">{tickets.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Total Viandas</div>
            <div className="text-2xl font-black">
              {formatPrecio(
                tickets
                  .filter((t) => t.estadoPago === 'pagado')
                  .reduce((acc, t) => acc + t.total, 0)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Products Catalog & Cart / Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Products (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              Menú y Productos Disponibles ({productos.length})
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
            {productos.map((prod) => (
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
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {/* Single Price vs Double Price buttons */}
                  {prod.tieneDosPrecios && prod.precio2 !== undefined ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          handleAddToCart(prod, prod.precio1, prod.etiquetaPrecio1 || 'General')
                        }
                        className="p-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-xl text-left transition group/btn"
                      >
                        <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase truncate">
                          {prod.etiquetaPrecio1 || 'General'}
                        </div>
                        <div className="text-sm font-black text-amber-900 dark:text-amber-200 flex items-center justify-between">
                          <span>{formatPrecio(prod.precio1)}</span>
                          <Plus className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100" />
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          handleAddToCart(prod, prod.precio2!, prod.etiquetaPrecio2 || 'Socio')
                        }
                        className="p-2.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-xl text-left transition group/btn"
                      >
                        <div className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase truncate">
                          {prod.etiquetaPrecio2 || 'Socio'}
                        </div>
                        <div className="text-sm font-black text-orange-900 dark:text-orange-200 flex items-center justify-between">
                          <span>{formatPrecio(prod.precio2!)}</span>
                          <Plus className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100" />
                        </div>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleAddToCart(prod, prod.precio1, prod.etiquetaPrecio1 || 'General')
                      }
                      className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between transition group/btn"
                    >
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {prod.etiquetaPrecio1 || 'Precio General'}
                      </span>
                      <span className="text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                        {formatPrecio(prod.precio1)}
                        <Plus className="w-4 h-4 text-amber-600 group-hover/btn:scale-125 transition-transform" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
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
                <p className="text-xs text-slate-400">Selecciona productos a la izquierda para armar la orden</p>
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
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
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
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / Contacto (opcional)
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

              {/* Status Toggle if not strictly pending */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Estado del Pago:</span>
                <button
                  type="button"
                  onClick={() =>
                    setEstadoPago((prev) => (prev === 'pagado' ? 'pendiente' : 'pagado'))
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
              Historial de Ventas de Viandas
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
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay tickets registrados que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto mt-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-2.5 px-3">N° Ticket</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Detalle</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Modalidad</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredTickets.slice(0, 15).map((tk) => (
                  <tr key={tk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {tk.numeroTicket}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {tk.comprador}
                      {tk.telefono && (
                        <span className="block text-[10px] text-slate-400">{tk.telefono}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {tk.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      {formatPrecio(tk.total)}
                    </td>
                    <td className="py-2.5 px-3 uppercase text-[11px] text-slate-500">
                      {tk.modalidadPago}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleToggleEstadoPago(tk)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${tk.estadoPago === 'pagado'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                      >
                        {tk.estadoPago === 'pagado' ? 'PAGADO' : 'PENDIENTE'}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(tk);
                          setIsTicketModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-500" /> Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
