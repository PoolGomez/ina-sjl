'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Printer,
  Clock,
  CheckCircle,
  User,
  Hash,
  Phone,
  Search,
  AlertTriangle,
  Plus,
  X,
  Edit2,
  Ban,
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
import { AdaptiveDataView } from './AdaptiveDataView';

interface BingoSalesProps {
  config: ConfiguracionEvento;
  mode?: 'history' | 'pos';
}

export const BingoSales: React.FC<BingoSalesProps> = ({
  config,
  mode = 'history',
}) => {
  const { user } = useAuth();
  const [tarjetas, setTarjetas] = useState<TarjetaBingoVenta[]>([]);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcionImpresion, setDescripcionImpresion] = useState(
    config.bingoPrecios?.descripcionImpresion || ''
  );
  const [numeroTarjetaInput, setNumeroTarjetaInput] = useState<string>('');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [mantenerComprador, setMantenerComprador] = useState(false);
  const [selectedPrecioKey, setSelectedPrecioKey] = useState<
    'precio1' | 'precio2'
  >('precio1');
  const [modalidadPago, setModalidadPago] = useState<ModalidadPago>('efectivo');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pagado');
  const [modalidades, setModalidades] = useState<ModalidadPagoConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // New Sale Modal (used in 'history' mode)
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);

  // Modal ticket print
  const [selectedTarjetaPrint, setSelectedTarjetaPrint] =
    useState<TarjetaBingoVenta | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Modal edit estado
  const [editingEstadoTarjeta, setEditingEstadoTarjeta] =
    useState<TarjetaBingoVenta | null>(null);
  const [nuevoEstadoSeleccionado, setNuevoEstadoSeleccionado] =
    useState<EstadoPago>('pagado');
  const [savingEstado, setSavingEstado] = useState(false);

  // Filter bingo sales belonging to the active event
  const filterByActiveEvent = (
    list: TarjetaBingoVenta[]
  ): TarjetaBingoVenta[] => {
    return list.filter((t) => {
      if (!config.id) return true;
      if (t.eventoId) return t.eventoId === config.id;
      return config.id === 'evento-principal';
    });
  };

  const tarjetasDelEvento = filterByActiveEvent(tarjetas);

  // Set of all already-sold card numbers in the active event (excluding 'anulado')
  const getAllSoldNumbers = (list: TarjetaBingoVenta[]): Set<number> => {
    const set = new Set<number>();
    list.forEach((t) => {
      if (t.estadoPago === 'anulado') return;
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

    const mods = await getModalidadesPago();
    setModalidades(mods.filter((m) => m.activo));
  };

  useEffect(() => {
    loadData();
  }, [config.id]);

  useEffect(() => {
    setDescripcionImpresion(config.bingoPrecios?.descripcionImpresion || '');
  }, [config.bingoPrecios?.descripcionImpresion]);

  // Add a specific card number to the current order (without autocompleting next card)
  const handleAddCardNumber = (numToAdd?: number) => {
    setValidationError(null);
    const num =
      numToAdd !== undefined ? numToAdd : parseInt(numeroTarjetaInput, 10);
    if (isNaN(num) || num <= 0) {
      setValidationError(
        'Por favor ingresa un número de tarjeta válido mayor a 0.'
      );
      return;
    }

    if (selectedCards.includes(num)) {
      setValidationError(
        `La tarjeta #${num} ya está agregada en la orden actual.`
      );
      return;
    }

    const sold = getAllSoldNumbers(tarjetasDelEvento);
    if (sold.has(num)) {
      const duenio = tarjetasDelEvento.find(
        (t) =>
          t.estadoPago !== 'anulado' &&
          (t.numeroTarjeta === num ||
            (t.numerosTarjetas && t.numerosTarjetas.includes(num)))
      );
      setValidationError(
        `¡La tarjeta #${num} ya fue vendida a "${duenio?.comprador || 'otro cliente'}" en este evento!`
      );
      return;
    }

    const updatedSelected = [...selectedCards, num].sort((a, b) => a - b);
    setSelectedCards(updatedSelected);
    setNumeroTarjetaInput('');
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
    const pendingInputNum = parseInt(numeroTarjetaInput, 10);
    if (cardsToSell.length === 0 && !isNaN(pendingInputNum) && pendingInputNum > 0) {
      cardsToSell = [pendingInputNum];
    }

    if (cardsToSell.length === 0) {
      setValidationError(
        'Debes ingresar o agregar al menos un número de tarjeta de bingo para vender.'
      );
      return;
    }

    // Double check that none of the cards are already sold in this event
    const sold = getAllSoldNumbers(tarjetasDelEvento);
    const alreadySold = cardsToSell.filter((c) => sold.has(c));
    if (alreadySold.length > 0) {
      setValidationError(
        `Las siguientes tarjetas ya están vendidas en este evento: ${alreadySold
          .map((c) => `#${c}`)
          .join(', ')}.`
      );
      return;
    }

    setSaving(true);
    const correlativo = (tarjetasDelEvento.length + 1)
      .toString()
      .padStart(4, '0');
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
    const nombreFinal = comprador.trim() ? comprador.trim() : 'Al Portador';

    const nuevaVenta: TarjetaBingoVenta = {
      id: 'tarjeta-b-' + Date.now(),
      numeroTicket: ticketId,
      eventoId: config.id || '',
      nombreEvento: config.nombreEvento || '',
      numeroTarjeta: cardsToSell[0],
      numerosTarjetas: cardsToSell,
      cantidad: cardsToSell.length,
      precioUnitario,
      comprador: nombreFinal,
      telefono: telefono.trim(),
      descripcionImpresion:
        descripcionImpresion.trim() || bingoConfig.descripcionImpresion || '',
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

    // Close New Sale modal (if open) and open ticket modal immediately
    setIsNewSaleOpen(false);
    setSelectedTarjetaPrint(nuevaVenta);
    setIsTicketModalOpen(true);

    // Reset card list & input without autocompleting
    setSelectedCards([]);
    setNumeroTarjetaInput('');

    // Check if seller wants to keep buyer name for the next sale
    if (!mantenerComprador) {
      setComprador('');
      setTelefono('');
      setDescripcionImpresion(bingoConfig.descripcionImpresion || '');
    }

    setSaving(false);
  };

  const handleOpenEditEstado = (tarjeta: TarjetaBingoVenta) => {
    setEditingEstadoTarjeta(tarjeta);
    setNuevoEstadoSeleccionado(tarjeta.estadoPago);
  };

  const handleSaveEstado = async () => {
    if (!editingEstadoTarjeta) return;
    setSavingEstado(true);
    const updated = await updateTarjetaBingoEstado(
      editingEstadoTarjeta.id,
      nuevoEstadoSeleccionado
    );
    if (updated) {
      setTarjetas((prev) =>
        prev.map((t) =>
          t.id === editingEstadoTarjeta.id
            ? { ...t, estadoPago: nuevoEstadoSeleccionado }
            : t
        )
      );
    }
    setSavingEstado(false);
    setEditingEstadoTarjeta(null);
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

  const filteredTarjetas = tarjetasDelEvento.filter((t) => {
    const query = searchTerm.toLowerCase();
    const matchComprador = t.comprador.toLowerCase().includes(query);
    const matchTicket = t.numeroTicket.toLowerCase().includes(query);
    const matchSingleNum = String(t.numeroTarjeta).includes(query);
    const matchMultipleNum =
      t.numerosTarjetas &&
      t.numerosTarjetas.some((num) => String(num).includes(query));
    return matchComprador || matchTicket || matchSingleNum || matchMultipleNum;
  });

  const bingoConfig = config.bingoPrecios;
  const precioActual =
    selectedPrecioKey === 'precio2' && bingoConfig.tieneDosPrecios
      ? bingoConfig.precio2
      : bingoConfig.precio1;

  const typedCardValid =
    selectedCards.length === 0 &&
    !isNaN(parseInt(numeroTarjetaInput, 10)) &&
    parseInt(numeroTarjetaInput, 10) > 0;
  const effectiveCardCount =
    selectedCards.length > 0 ? selectedCards.length : typedCardValid ? 1 : 0;

  const totalOrden =
    Math.round(precioActual * effectiveCardCount * 100) / 100;

  const totalTarjetasVendidas = tarjetasDelEvento
    .filter((t) => t.estadoPago !== 'anulado')
    .reduce(
      (acc, t) =>
        acc + (t.cantidad || (t.numerosTarjetas ? t.numerosTarjetas.length : 1)),
      0
    );

  const totalRecaudado = tarjetasDelEvento
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const totalPendiente = tarjetasDelEvento
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const renderSalesForm = () => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
      <h2 className="font-extrabold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-indigo-500" />
          Venta de Tarjetas de Bingo
        </span>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
          {effectiveCardCount}{' '}
          {effectiveCardCount === 1 ? 'tarjeta' : 'tarjetas'}
        </span>
      </h2>

      {validationError && (
        <div className="my-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" autoComplete="off">
        {/* Tarjetas Selector: 1 o Múltiples Tarjetas */}
        <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-indigo-500" /> Número de Tarjeta
            </label>
            <span className="text-[11px] text-slate-500">
              Ingresa el N° manualmente
            </span>
          </div>

          {/* Input and Add Button */}
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              name="bingo_card_number_no_autofill"
              autoComplete="off"
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
              placeholder="N°"
              className="w-32 text-center text-xl font-black py-1.5 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl focus:border-indigo-500 focus:outline-none text-indigo-900 dark:text-indigo-100"
            />
            <button
              type="button"
              onClick={() => handleAddCardNumber()}
              className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Tarjeta
            </button>
          </div>

          {/* Selected Cards Chips */}
          <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Tarjetas en esta venta ({selectedCards.length}):
            </span>
            {selectedCards.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {typedCardValid
                  ? `Se venderá la tarjeta #${String(
                    parseInt(numeroTarjetaInput, 10)
                  ).padStart(3, '0')} (o presiona "Agregar Tarjeta" para sumar más).`
                  : 'Ninguna tarjeta seleccionada aún.'}
              </p>
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
                className={`p-2.5 rounded-2xl border text-left transition ${selectedPrecioKey === 'precio1'
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
                className={`p-2.5 rounded-2xl border text-left transition ${selectedPrecioKey === 'precio2'
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
            TOTAL A COBRAR ({effectiveCardCount}{' '}
            {effectiveCardCount === 1 ? 'tarjeta' : 'tarjetas'}):
          </span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {formatPrecio(totalOrden)}
          </span>
        </div>

        {/* Customer Name - OPTIONAL */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nombre del Comprador{' '}
              <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <span className="text-[10px] text-slate-400">
              Si se omite, se asigna &quot;Al Portador&quot;
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
            Teléfono de Contacto{' '}
            <span className="text-slate-400 font-normal">(Opcional)</span>
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

        {/* Submit & Print */}
        <button
          type="submit"
          disabled={saving || effectiveCardCount === 0}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          {saving
            ? 'Registrando...'
            : effectiveCardCount > 1
              ? `Confirmar e Imprimir (${effectiveCardCount} Tarjetas)`
              : 'Confirmar e Imprimir Comprobante'}
        </button>
      </form>
    </div>
  );

  // Mode: POS only (used inside the unified "Ventas" module)
  if (mode === 'pos') {
    return (
      <div className="max-w-2xl mx-auto">
        {renderSalesForm()}

        <TicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          tipo="bingo"
          tarjetaBingo={selectedTarjetaPrint}
          config={config}
        />
      </div>
    );
  }

  // Mode: History first with "Nueva Venta" modal button (used in /system/bingo-venta)
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <Ticket className="w-3.5 h-3.5" /> Módulo Oficial de Tarjetas de Bingo
            </div>
            {config.nombreEvento && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/30 border border-white/25 text-white text-xs font-black">
                <span>Evento Activo: {config.nombreEvento}</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Tarjetas Bingo
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Consulta el historial de tarjetas de bingo vendidas, actualiza estados de pago, reimprime comprobantes o registra una nueva venta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">
              Tarjetas del Evento
            </div>
            <div className="text-2xl font-black">{totalTarjetasVendidas}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">
              Recaudado Bingo
            </div>
            <div className="text-2xl font-black">
              {formatPrecio(totalRecaudado)}
            </div>
          </div>
          {/* <button
            type="button"
            onClick={() => setIsNewSaleOpen(true)}
            className="px-5 py-3.5 bg-white text-indigo-700 hover:bg-indigo-50 font-black rounded-2xl shadow-lg transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Venta
          </button> */}
        </div>
      </div>

      {/* Sold Cards History & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Historial de Tarjetas Bingo ({tarjetasDelEvento.length} tickets •{' '}
              {totalTarjetasVendidas} tarjetas)
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar N° tarjeta, cliente..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-sm transition inline-flex items-center justify-center gap-1.5 text-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Venta
            </button>
          </div>
        </div>

        <div className="mt-4">
          <AdaptiveDataView
            items={filteredTarjetas}
            pageSize={15}
            itemLabel="ventas de bingo"
            emptyState={
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Ticket className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-medium">No hay ventas registradas</p>
                <button
                  type="button"
                  onClick={() => setIsNewSaleOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Primera Venta
                </button>
              </div>
            }
            renderTable={(visibleTarjetas) => (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3 whitespace-nowrap">
                      Tarjetas Asignadas
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Cliente</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">
                      Total Cobrado
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Modalidad</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Estado</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">
                      Comprobante
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {visibleTarjetas.map((tb) => {
                    const cardList =
                      tb.numerosTarjetas && tb.numerosTarjetas.length > 0
                        ? tb.numerosTarjetas
                        : [tb.numeroTarjeta];

                    return (
                      <tr
                        key={tb.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
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
                            {cardList.length}{' '}
                            {cardList.length === 1 ? 'tarjeta' : 'tarjetas'} •
                            Ticket {tb.numeroTicket}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {tb.comprador || 'Al Portador'}
                          </span>
                          {tb.telefono && (
                            <span className="block text-[10px] text-slate-400">
                              {tb.telefono}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {formatPrecio(tb.precioCobrado)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {tb.etiquetaPrecio}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500 whitespace-nowrap">
                          {tb.modalidadPago}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${getEstadoBadgeClass(
                              tb.estadoPago
                            )}`}
                          >
                            {getEstadoLabel(tb.estadoPago)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditEstado(tb)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                              title="Editar estado del registro"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />{' '}
                              Estado
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTarjetaPrint(tb);
                                setIsTicketModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-500" />{' '}
                              Imprimir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            renderCards={(visibleTarjetas) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleTarjetas.map((tb) => {
                  const cardList =
                    tb.numerosTarjetas && tb.numerosTarjetas.length > 0
                      ? tb.numerosTarjetas
                      : [tb.numeroTarjeta];

                  return (
                    <div
                      key={tb.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {cardList.map((num) => (
                              <span
                                key={num}
                                className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-black text-xs"
                              >
                                #{String(num).padStart(3, '0')}
                              </span>
                            ))}
                          </div>
                          <span
                            className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getEstadoBadgeClass(
                              tb.estadoPago
                            )}`}
                          >
                            {getEstadoLabel(tb.estadoPago)}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">
                          {tb.comprador || 'Al Portador'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Ticket {tb.numeroTicket}
                          {tb.telefono ? ` • 📞 ${tb.telefono}` : ''}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {formatPrecio(tb.precioCobrado)}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400 font-bold ml-2">
                            {tb.modalidadPago}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEstado(tb)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />{' '}
                            Estado
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTarjetaPrint(tb);
                              setIsTicketModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-500" />{' '}
                            Imprimir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          />
        </div>
      </div>

      {/* Modal: Editar Estado de Tarjeta Bingo */}
      {editingEstadoTarjeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Editar Estado del Registro
                </h3>
                <p className="text-xs text-slate-500">
                  Ticket {editingEstadoTarjeta.numeroTicket} •{' '}
                  {editingEstadoTarjeta.comprador || 'Al Portador'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEstadoTarjeta(null)}
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
                onClick={() => setEditingEstadoTarjeta(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEstado}
                disabled={savingEstado}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {savingEstado ? 'Guardando...' : 'Guardar Estado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva Venta de Tarjetas Bingo */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Nueva Venta de Tarjetas Bingo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ingresa el número de tarjeta y registra la venta
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

            {renderSalesForm()}
          </div>
        </div>
      )}

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
