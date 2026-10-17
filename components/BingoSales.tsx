'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Printer,
  DollarSign,
  QrCode,
  CreditCard,
  Clock,
  CheckCircle,
  User,
  Hash,
  Phone,
  Search,
  Sparkles,
  AlertTriangle,
  Plus,
  X,
  Layers,
} from 'lucide-react';
import {
  TarjetaBingoVenta,
  ModalidadPago,
  ModalidadPagoConfig,
  EstadoPago,
  ConfiguracionEvento,
  formatPrecio,
} from '../lib/types';
import {
  getTarjetasBingoVentas,
  saveTarjetaBingoVenta,
  updateTarjetaBingoEstado,
  getModalidadesPago,
} from '../lib/storage';
import { useAuth } from '../lib/authContext';
import { TicketModal } from './TicketModal';

interface BingoSalesProps {
  config: ConfiguracionEvento;
}

export const BingoSales: React.FC<BingoSalesProps> = ({ config }) => {
  const { user } = useAuth();
  const [tarjetas, setTarjetas] = useState<TarjetaBingoVenta[]>([]);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroTarjetaInput, setNumeroTarjetaInput] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [mantenerComprador, setMantenerComprador] = useState(false);
  const [selectedPrecioKey, setSelectedPrecioKey] = useState<'precio1' | 'precio2'>('precio1');
  const [modalidadPago, setModalidadPago] = useState<ModalidadPago>('efectivo');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pagado');
  const [modalidades, setModalidades] = useState<ModalidadPagoConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modal ticket print
  const [selectedTarjetaPrint, setSelectedTarjetaPrint] = useState<TarjetaBingoVenta | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Set of all already-sold card numbers
  const getAllSoldNumbers = (list: TarjetaBingoVenta[]): Set<number> => {
    const set = new Set<number>();
    list.forEach((t) => {
      if (t.numerosTarjetas && t.numerosTarjetas.length > 0) {
        t.numerosTarjetas.forEach((n) => set.add(n));
      } else if (t.numeroTarjeta) {
        set.add(t.numeroTarjeta);
      }
    });
    return set;
  };

  const loadData = async () => {
    const list = await getTarjetasBingoVentas();
    setTarjetas(list);

    // Initial suggestion of next free card
    const sold = getAllSoldNumbers(list);
    let next = 1;
    while (sold.has(next)) {
      next++;
    }
    setNumeroTarjetaInput(String(next));
    if (selectedCards.length === 0) {
      setSelectedCards([next]);
    }

    const mods = await getModalidadesPago();
    setModalidades(mods.filter((m) => m.activo));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getNextFreeNumber = (existingSold: Set<number>, alreadySelected: number[]): number => {
    const blocked = new Set([...existingSold, ...alreadySelected]);
    let next = 1;
    while (blocked.has(next)) {
      next++;
    }
    return next;
  };

  // Add a specific card number to the current order
  const handleAddCardNumber = (numToAdd?: number) => {
    setValidationError(null);
    const num = numToAdd !== undefined ? numToAdd : parseInt(numeroTarjetaInput, 10);
    if (isNaN(num) || num <= 0) {
      setValidationError('Por favor ingresa un número de tarjeta válido mayor a 0.');
      return;
    }

    if (selectedCards.includes(num)) {
      setValidationError(`La tarjeta #${num} ya está agregada en la orden actual.`);
      return;
    }

    const sold = getAllSoldNumbers(tarjetas);
    if (sold.has(num)) {
      const duenio = tarjetas.find(
        (t) =>
          t.numeroTarjeta === num ||
          (t.numerosTarjetas && t.numerosTarjetas.includes(num))
      );
      setValidationError(
        `¡La tarjeta #${num} ya fue vendida a "${duenio?.comprador || 'otro cliente'}"!`
      );
      return;
    }

    const updatedSelected = [...selectedCards, num].sort((a, b) => a - b);
    setSelectedCards(updatedSelected);

    // Prepare next suggestion
    const nextFree = getNextFreeNumber(sold, updatedSelected);
    setNumeroTarjetaInput(String(nextFree));
  };

  // Quick batch add: add N consecutive available cards
  const handleAddMultipleNextCards = (count: number) => {
    setValidationError(null);
    const sold = getAllSoldNumbers(tarjetas);
    let currentSelected = [...selectedCards];

    for (let i = 0; i < count; i++) {
      const nextFree = getNextFreeNumber(sold, currentSelected);
      currentSelected.push(nextFree);
    }

    currentSelected.sort((a, b) => a - b);
    setSelectedCards(currentSelected);

    const nextFree = getNextFreeNumber(sold, currentSelected);
    setNumeroTarjetaInput(String(nextFree));
  };

  const handleRemoveCard = (cardToRemove: number) => {
    const updated = selectedCards.filter((c) => c !== cardToRemove);
    setSelectedCards(updated);
  };

  const handleModalidadChange = (modalidad: ModalidadPago) => {
    setModalidadPago(modalidad);
    if (modalidad === 'pendiente') {
      setEstadoPago('pendiente');
    } else {
      setEstadoPago('pagado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If no cards were added into selectedCards, try using the input field
    let cardsToSell = [...selectedCards];
    if (cardsToSell.length === 0) {
      const inputNum = parseInt(numeroTarjetaInput, 10);
      if (!isNaN(inputNum) && inputNum > 0) {
        cardsToSell = [inputNum];
      }
    }

    if (cardsToSell.length === 0) {
      setValidationError('Debes seleccionar al menos una tarjeta de bingo para vender.');
      return;
    }

    // Double check that none of the cards are already sold
    const sold = getAllSoldNumbers(tarjetas);
    const alreadySold = cardsToSell.filter((c) => sold.has(c));
    if (alreadySold.length > 0) {
      setValidationError(
        `Las siguientes tarjetas ya están vendidas: ${alreadySold.map((c) => `#${c}`).join(', ')}.`
      );
      return;
    }

    setSaving(true);
    const correlativo = (tarjetas.length + 1).toString().padStart(4, '0');
    const ticketId = `B-${correlativo}`;
    const now = new Date();

    const bingoConfig = config.bingoPrecios;
    const precioUnitario =
      selectedPrecioKey === 'precio2' && bingoConfig.tieneDosPrecios
        ? bingoConfig.precio2
        : bingoConfig.precio1;
    const etiqueta =
      selectedPrecioKey === 'precio2' && bingoConfig.tieneDosPrecios
        ? bingoConfig.etiquetaPrecio2
        : bingoConfig.etiquetaPrecio1;

    const totalCobrado = precioUnitario * cardsToSell.length;
    // Buyer name is optional!
    const nombreFinal = comprador.trim() ? comprador.trim() : 'Al Portador';

    const nuevaVenta: TarjetaBingoVenta = {
      id: 'tarjeta-b-' + Date.now(),
      numeroTicket: ticketId,
      numeroTarjeta: cardsToSell[0],
      numerosTarjetas: cardsToSell,
      cantidad: cardsToSell.length,
      precioUnitario,
      comprador: nombreFinal,
      telefono: telefono.trim(),
      precioCobrado: totalCobrado,
      etiquetaPrecio: etiqueta,
      modalidadPago,
      estadoPago,
      fecha: now.toISOString(),
      fechaFormateada: now.toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      vendedorEmail: user?.email || 'cajero@eventosina.com',
    };

    await saveTarjetaBingoVenta(nuevaVenta);
    const updatedList = [nuevaVenta, ...tarjetas];
    setTarjetas(updatedList);

    // Open ticket modal immediately
    setSelectedTarjetaPrint(nuevaVenta);
    setIsTicketModalOpen(true);

    // Reset card list
    setSelectedCards([]);

    // Check if seller wants to keep buyer name for the next sale
    if (!mantenerComprador) {
      setComprador('');
      setTelefono('');
    }

    // Suggest next available free card for the next purchase
    const newSoldSet = getAllSoldNumbers(updatedList);
    const nextFree = getNextFreeNumber(newSoldSet, []);
    setNumeroTarjetaInput(String(nextFree));
    setSelectedCards([nextFree]);

    setSaving(false);
  };

  const handleToggleEstado = async (tarjeta: TarjetaBingoVenta) => {
    const nuevoEstado: EstadoPago = tarjeta.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    const updated = await updateTarjetaBingoEstado(tarjeta.id, nuevoEstado);
    if (updated) {
      setTarjetas((prev) =>
        prev.map((t) => (t.id === tarjeta.id ? { ...t, estadoPago: nuevoEstado } : t))
      );
    }
  };

  const filteredTarjetas = tarjetas.filter((t) => {
    const query = searchTerm.toLowerCase();
    const matchComprador = t.comprador.toLowerCase().includes(query);
    const matchTicket = t.numeroTicket.toLowerCase().includes(query);
    const matchSingleNum = String(t.numeroTarjeta).includes(query);
    const matchMultipleNum =
      t.numerosTarjetas && t.numerosTarjetas.some((num) => String(num).includes(query));
    return matchComprador || matchTicket || matchSingleNum || matchMultipleNum;
  });

  const bingoConfig = config.bingoPrecios;
  const precioActual =
    selectedPrecioKey === 'precio2' && bingoConfig.tieneDosPrecios
      ? bingoConfig.precio2
      : bingoConfig.precio1;
  const totalOrden = Math.round(precioActual * selectedCards.length * 100) / 100;

  const totalTarjetasVendidas = tarjetas.reduce(
    (acc, t) => acc + (t.cantidad || (t.numerosTarjetas ? t.numerosTarjetas.length : 1)),
    0
  );

  const totalRecaudado = tarjetas
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const totalPendiente = tarjetas
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <Ticket className="w-3.5 h-3.5" /> Módulo Oficial de Tarjetas de Bingo
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Venta de Tarjetas de Bingo
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Vende una o varias tarjetas al mismo comprador en una sola orden. El nombre del cliente es opcional y puedes mantenerlo guardado para ventas continuas.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Tarjetas Vendidas</div>
            <div className="text-2xl font-black">{totalTarjetasVendidas}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Recaudado Bingo</div>
            <div className="text-2xl font-black">{formatPrecio(totalRecaudado)}</div>
          </div>
        </div>
      </div>

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Form (5 cols on lg) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl lg:sticky lg:top-20">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-500" />
                Venta de Tarjetas
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {selectedCards.length} {selectedCards.length === 1 ? 'tarjeta' : 'tarjetas'}
              </span>
            </h2>

            {validationError && (
              <div className="my-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Tarjetas Selector: 1 o Múltiples Tarjetas */}
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" /> Número de Tarjeta
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Agrega una o varias a la orden
                  </span>
                </div>

                {/* Input and Add Button */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={numeroTarjetaInput}
                    onChange={(e) => {
                      setNumeroTarjetaInput(e.target.value);
                      setValidationError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCardNumber();
                      }
                    }}
                    placeholder="Ej. 15"
                    className="w-28 text-center text-xl font-black py-1.5 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl focus:border-indigo-500 focus:outline-none text-indigo-900 dark:text-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCardNumber()}
                    className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Tarjeta
                  </button>
                </div>

                {/* Quick Multi-Card Batch Buttons */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-400 font-medium">Agregar más:</span>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleNextCards(1)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg font-bold text-indigo-600 dark:text-indigo-300 transition"
                  >
                    +1 Sig.
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleNextCards(2)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg font-bold text-indigo-600 dark:text-indigo-300 transition"
                  >
                    +2 Tarjetas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleNextCards(3)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg font-bold text-indigo-600 dark:text-indigo-300 transition"
                  >
                    +3 Tarjetas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleNextCards(5)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg font-bold text-indigo-600 dark:text-indigo-300 transition"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddMultipleNextCards(10)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-lg font-bold text-indigo-600 dark:text-indigo-300 transition"
                  >
                    +10
                  </button>
                </div>

                {/* Selected Cards Chips */}
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Tarjetas en esta venta ({selectedCards.length}):
                  </span>
                  {selectedCards.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Ninguna tarjeta seleccionada aún.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                      {selectedCards.map((num) => (
                        <span
                          key={num}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-sm font-mono"
                        >
                          #{String(num).padStart(3, '0')}
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(num)}
                            className="p-0.5 hover:bg-indigo-700 rounded transition"
                            title="Quitar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tarifa / Precio por Tarjeta
                </label>
                {bingoConfig.tieneDosPrecios ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPrecioKey('precio1')}
                      className={`p-2.5 rounded-2xl border text-left transition ${
                        selectedPrecioKey === 'precio1'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                        {bingoConfig.etiquetaPrecio1}
                      </div>
                      <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {formatPrecio(bingoConfig.precio1)}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPrecioKey('precio2')}
                      className={`p-2.5 rounded-2xl border text-left transition ${
                        selectedPrecioKey === 'precio2'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                        {bingoConfig.etiquetaPrecio2}
                      </div>
                      <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {formatPrecio(bingoConfig.precio2)}
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      {bingoConfig.etiquetaPrecio1}
                    </span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      {formatPrecio(bingoConfig.precio1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Summary Ribbon */}
              <div className="py-2.5 px-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  TOTAL A COBRAR ({selectedCards.length} {selectedCards.length === 1 ? 'tarjeta' : 'tarjetas'}):
                </span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatPrecio(totalOrden)}
                </span>
              </div>

              {/* Customer Name - OPTIONAL */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre del Comprador <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Si se omite, se asigna "Al Portador"
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={comprador}
                    onChange={(e) => setComprador(e.target.value)}
                    placeholder="Ej. María Gómez o en blanco (Al Portador)"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox: Mantener comprador para la siguiente venta */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={mantenerComprador}
                    onChange={(e) => setMantenerComprador(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Mantener este comprador para la siguiente venta</span>
                </label>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 11 9876-5432"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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

              {/* Submit & Print */}
              <button
                type="submit"
                disabled={saving || selectedCards.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
              >
                <Printer className="w-4 h-4" />
                {saving
                  ? 'Registrando...'
                  : selectedCards.length > 1
                  ? `Confirmar e Imprimir (${selectedCards.length} Tarjetas)`
                  : 'Confirmar e Imprimir Comprobante'}
              </button>
            </form>
          </div>
        </div>

        {/* Sold Cards Catalog & Search (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Ventas de Tarjetas de Bingo ({tarjetas.length} tickets • {totalTarjetasVendidas} tarjetas)
                </h3>
                <p className="text-xs text-slate-500">
                  {totalPendiente > 0 && (
                    <span className="text-amber-500 font-bold mr-2">
                      {formatPrecio(totalPendiente)} por cobrar
                    </span>
                  )}
                  Búsqueda por N° tarjeta, cliente o ticket
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar N° tarjeta, cliente..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {filteredTarjetas.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Ticket className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium">No hay ventas registradas</p>
                <p className="text-xs text-slate-400">Registra una nueva tarjeta con el formulario</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] bg-slate-50/60 dark:bg-slate-800/40">
                      <th className="py-2.5 px-3">Tarjetas Asignadas</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Total Cobrado</th>
                      <th className="py-2.5 px-3">Modalidad</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredTarjetas.map((tb) => {
                      const cardList =
                        tb.numerosTarjetas && tb.numerosTarjetas.length > 0
                          ? tb.numerosTarjetas
                          : [tb.numeroTarjeta];

                      return (
                        <tr
                          key={tb.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {cardList.slice(0, 4).map((num) => (
                                <span
                                  key={num}
                                  className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-black text-xs"
                                >
                                  #{String(num).padStart(3, '0')}
                                </span>
                              ))}
                              {cardList.length > 4 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-slate-400 font-bold">
                                  +{cardList.length - 4} más
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {cardList.length} {cardList.length === 1 ? 'tarjeta' : 'tarjetas'} • Ticket {tb.numeroTicket}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {tb.comprador || 'Al Portador'}
                            </span>
                            {tb.telefono && (
                              <span className="block text-[10px] text-slate-400">{tb.telefono}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                            {formatPrecio(tb.precioCobrado)}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {tb.etiquetaPrecio}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">
                            {tb.modalidadPago}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleEstado(tb)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                                tb.estadoPago === 'pagado'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {tb.estadoPago === 'pagado' ? 'PAGADO' : 'PENDIENTE'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedTarjetaPrint(tb);
                                setIsTicketModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-500" /> Imprimir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        tipo="bingo"
        tarjetaBingo={selectedTarjetaPrint}
        config={config}
      />
    </div>
  );
};
