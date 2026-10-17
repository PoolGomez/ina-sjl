'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Gift,
  Trophy,
  Users,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Layers,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import {
  TicketVianda,
  TarjetaBingoVenta,
  SorteoGanador,
} from '../lib/types';
import {
  getTicketsViandas,
  getTarjetasBingoVentas,
  getSorteos,
  saveSorteo,
} from '../lib/storage';
import { sounds } from '../lib/soundEffects';

interface ParticipantItem {
  id: string;
  identificador: string; // ej. V-1002 o Bingo #015
  comprador: string;
  telefono?: string;
  tipo: 'vianda' | 'bingo';
  estadoPago: string;
  modalidadPago: string;
}

export const Sorteos: React.FC = () => {
  const [ticketsViandas, setTicketsViandas] = useState<TicketVianda[]>([]);
  const [tarjetasBingo, setTarjetasBingo] = useState<TarjetaBingoVenta[]>([]);
  const [historialSorteos, setHistorialSorteos] = useState<SorteoGanador[]>([]);

  // Sorteo configuration
  const [filtroOrigen, setFiltroOrigen] = useState<'viandas' | 'bingo' | 'todos'>('todos');
  const [soloPagados, setSoloPagados] = useState(true);
  const [premio, setPremio] = useState('Premio Mayor del Evento');

  // Animation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempParticipant, setTempParticipant] = useState<ParticipantItem | null>(null);
  const [winner, setWinner] = useState<ParticipantItem | null>(null);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    const [tks, tbs, srt] = await Promise.all([
      getTicketsViandas(),
      getTarjetasBingoVentas(),
      getSorteos(),
    ]);
    setTicketsViandas(tks);
    setTarjetasBingo(tbs);
    setHistorialSorteos(srt);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Build eligible pool
  const getPool = (): ParticipantItem[] => {
    let pool: ParticipantItem[] = [];

    if (filtroOrigen === 'viandas' || filtroOrigen === 'todos') {
      const vItems: ParticipantItem[] = ticketsViandas
        .filter((t) => (!soloPagados || t.estadoPago === 'pagado'))
        .map((t) => ({
          id: t.id,
          identificador: `Ticket ${t.numeroTicket}`,
          comprador: t.comprador,
          telefono: t.telefono,
          tipo: 'vianda',
          estadoPago: t.estadoPago,
          modalidadPago: t.modalidadPago,
        }));
      pool = [...pool, ...vItems];
    }

    if (filtroOrigen === 'bingo' || filtroOrigen === 'todos') {
      const eligibleBingo = tarjetasBingo.filter((b) => (!soloPagados || b.estadoPago === 'pagado'));
      eligibleBingo.forEach((b) => {
        const cards = b.numerosTarjetas && b.numerosTarjetas.length > 0 ? b.numerosTarjetas : [b.numeroTarjeta];
        cards.forEach((num) => {
          pool.push({
            id: `${b.id}-${num}`,
            identificador: `Bingo #${String(num).padStart(3, '0')}`,
            comprador: b.comprador || 'Al Portador',
            telefono: b.telefono,
            tipo: 'bingo',
            estadoPago: b.estadoPago,
            modalidadPago: b.modalidadPago,
          });
        });
      });
    }

    return pool;
  };

  const pool = getPool();

  const handleStartDraw = () => {
    if (isDrawing || pool.length === 0) return;

    setIsDrawing(true);
    setWinner(null);
    sounds.playTombolaRoll(3200);

    let count = 0;
    const maxIterations = 35;
    const stepTime = 90;

    spinIntervalRef.current = setInterval(() => {
      const randIdx = Math.floor(Math.random() * pool.length);
      setTempParticipant(pool[randIdx]);
      count++;

      if (count >= maxIterations) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

        const finalIdx = Math.floor(Math.random() * pool.length);
        const elegido = pool[finalIdx];

        setTempParticipant(null);
        setWinner(elegido);
        setIsDrawing(false);

        // Sound & confetti
        sounds.playWinFanfare();
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'],
          });
        } catch {
          // ignore
        }

        // Save winner
        const now = new Date();
        const nuevoSorteo: SorteoGanador = {
          id: 'sorteo-' + Date.now(),
          fecha: now.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
          origen: filtroOrigen,
          ticketGanador: elegido.identificador,
          comprador: elegido.comprador,
          premio: premio.trim() || 'Premio Sorpresa',
          telefono: elegido.telefono,
          modalidadPago: elegido.modalidadPago,
          estadoPago: elegido.estadoPago,
        };

        saveSorteo(nuevoSorteo);
        setHistorialSorteos((prev) => [nuevoSorteo, ...prev]);
      }
    }, stepTime);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2">
            <Gift className="w-3.5 h-3.5" /> Módulo de Sorteos Oficiales
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Sorteos de Premios</h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Realiza sorteos transparentes y azarosos entre los tickets de viandas, las tarjetas de bingo o entre todos los participantes.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Participantes Aptos</div>
            <div className="text-2xl font-black">{pool.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 text-center">
            <div className="text-xs uppercase font-semibold text-white/80">Sorteos Realizados</div>
            <div className="text-2xl font-black">{historialSorteos.length}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Raffle Controls & Winner Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Raffle Setup Config (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-rose-500" />
              Configurar Sorteo
            </h2>

            <div className="mt-4 space-y-4">
              {/* Prize Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Premio a Sortear *
                </label>
                <div className="relative">
                  <Trophy className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    value={premio}
                    onChange={(e) => setPremio(e.target.value)}
                    placeholder="Ej. Canasta Familiar / TV / Jamón"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Source Filter: Viandas vs Bingo vs Todos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Participantes del Sorteo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltroOrigen('todos')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      filtroOrigen === 'todos'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-extrabold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-rose-500" />
                    <span className="text-xs">Todos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroOrigen('viandas')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      filtroOrigen === 'viandas'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-extrabold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Solo Viandas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroOrigen('bingo')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      filtroOrigen === 'bingo'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-extrabold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs">Solo Bingo</span>
                  </button>
                </div>
              </div>

              {/* Only Paid Filter checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={soloPagados}
                    onChange={(e) => setSoloPagados(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span>Sortear únicamente entre compras con estado PAGADO</span>
                </label>
              </div>

              {/* Participant count meter */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4" /> Cupones en el Bombo:
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                  {pool.length} participantes
                </span>
              </div>

              {/* Start Raffle Action */}
              <button
                type="button"
                onClick={handleStartDraw}
                disabled={isDrawing || pool.length === 0}
                className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black rounded-2xl shadow-xl shadow-rose-500/25 transition-all text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                <Sparkles className={`w-5 h-5 ${isDrawing ? 'animate-spin' : ''}`} />
                {isDrawing ? '¡MEZCLANDO CUPONES...!' : '¡INICIAR SORTEO DE LA SUERTE!'}
              </button>
            </div>
          </div>
        </div>

        {/* Winner Stage & Roulette Animation (7 cols on lg) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white min-h-[400px] flex flex-col justify-between relative overflow-hidden">
            {/* Background spotlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm uppercase tracking-wider text-slate-300">
                  Escenario de Ganadores
                </span>
              </div>
              <span className="text-xs text-amber-400 font-bold">{premio}</span>
            </div>

            {/* Animation / Display Area */}
            <div className="my-8 text-center flex flex-col items-center justify-center min-h-[220px]">
              {isDrawing && tempParticipant ? (
                <div className="space-y-4 animate-bounce">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-400/30">
                    Sorteando entre {pool.length} cupones...
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
                    {tempParticipant.comprador}
                  </div>
                  <div className="text-xl font-mono text-white/80">
                    {tempParticipant.identificador}
                  </div>
                </div>
              ) : winner ? (
                <div className="space-y-4 animate-fade-in w-full max-w-md">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" /> ¡CUPÓN GANADOR OFICIAL!
                  </div>

                  <div className="p-6 bg-gradient-to-b from-slate-800/90 to-slate-950/90 border-2 border-amber-400 rounded-3xl shadow-2xl ring-4 ring-amber-400/20">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Trophy className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      {winner.comprador}
                    </h3>

                    <div className="mt-2 inline-block px-3 py-1 bg-amber-400/20 text-amber-300 font-mono font-black text-sm rounded-lg border border-amber-400/30">
                      {winner.identificador}
                    </div>

                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      {winner.telefono && <p>Teléfono: {winner.telefono}</p>}
                      <p className="capitalize">Origen: Compra de {winner.tipo}</p>
                      <p>
                        Estado:{' '}
                        <span className="text-emerald-400 font-bold uppercase">
                          {winner.estadoPago}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-3">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto">
                    <Gift className="w-8 h-8 stroke-1 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium">El bombo del sorteo está listo</p>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Presiona el botón para sortear un ganador al azar entre los tickets registrados.
                  </p>
                </div>
              )}
            </div>

            {/* Footer with quick action */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Sorteo con algoritmo pseudoaleatorio criptográfico</span>
              <button
                onClick={loadData}
                className="text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Actualizar cupones
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History of Past Raffle Winners */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Historial de Ganadores de Sorteos
            </h3>
            <p className="text-xs text-slate-500">
              Registro inmutable de premios entregados en el evento
            </p>
          </div>
          <span className="text-xs font-bold text-rose-500">
            {historialSorteos.length} ganadores
          </span>
        </div>

        {historialSorteos.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aún no se ha realizado ningún sorteo.
          </div>
        ) : (
          <div className="overflow-x-auto mt-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Premio</th>
                  <th className="py-2.5 px-3">Ganador</th>
                  <th className="py-2.5 px-3">Cupón Sorteado</th>
                  <th className="py-2.5 px-3">Teléfono</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {historialSorteos.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{s.fecha}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">
                      {s.premio}
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                      {s.comprador}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {s.ticketGanador}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{s.telefono || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3" /> Verificado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
