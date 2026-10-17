'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Dices,
  History,
  ZoomIn,
  Eye,
  EyeOff,
  LayoutGrid,
  Check,
} from 'lucide-react';
import { BingoState } from '../lib/types';
import { getBingoGameState, saveBingoGameState } from '../lib/storage';
import { sounds } from '../lib/soundEffects';

interface BingoGameProps {
  nombreEvento?: string;
}

export function getBingoLetter(num: number): {
  letter: 'B' | 'I' | 'N' | 'G' | 'O';
  bgClass: string;
  borderClass: string;
} {
  if (num <= 15) return { letter: 'B', bgClass: 'from-blue-500 to-cyan-500', borderClass: 'border-blue-400' };
  if (num <= 30) return { letter: 'I', bgClass: 'from-rose-500 to-pink-500', borderClass: 'border-rose-400' };
  if (num <= 45) return { letter: 'N', bgClass: 'from-purple-500 to-indigo-500', borderClass: 'border-purple-400' };
  if (num <= 60) return { letter: 'G', bgClass: 'from-emerald-500 to-teal-500', borderClass: 'border-emerald-400' };
  return { letter: 'O', bgClass: 'from-amber-500 to-orange-500', borderClass: 'border-amber-400' };
}

// Each column: letter, start number, Tailwind BG color, text color for header
const COLUMNS = [
  { letter: 'B' as const, start: 1, bg: 'bg-red-600', headerText: 'text-white' },
  { letter: 'I' as const, start: 16, bg: 'bg-yellow-500', headerText: 'text-white' },
  { letter: 'N' as const, start: 31, bg: 'bg-green-700', headerText: 'text-white' },
  { letter: 'G' as const, start: 46, bg: 'bg-sky-500', headerText: 'text-white' },
  { letter: 'O' as const, start: 61, bg: 'bg-purple-600', headerText: 'text-white' },
];

// Ball gradient colors matching column colors for tombola display
const BALL_GRADIENTS: Record<string, string> = {
  B: 'from-red-500 to-red-700',
  I: 'from-yellow-400 to-yellow-600',
  N: 'from-green-600 to-green-800',
  G: 'from-sky-400 to-sky-600',
  O: 'from-purple-500 to-purple-700',
};
const BALL_BORDERS: Record<string, string> = {
  B: 'border-red-400',
  I: 'border-yellow-300',
  N: 'border-green-400',
  G: 'border-sky-300',
  O: 'border-purple-400',
};

// Size scale: 1 = Normal, 2 = Grande, 3 = XL
const SIZE_LEVELS = 3;

export const BingoGame: React.FC<BingoGameProps> = ({ nombreEvento }) => {
  const [gameState, setGameState] = useState<BingoState>({
    numerosSalidos: [], ultimoNumero: null, enSorteo: false, juegoIniciado: false, totalNumeros: 75,
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [tempSpinNumber, setTempSpinNumber] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [justDrawnNumber, setJustDrawnNumber] = useState<number | null>(null);
  const [sizeLevel, setSizeLevel] = useState(1);
  const [showAllNumbers, setShowAllNumbers] = useState(false);
  const [showCartillaModal, setShowCartillaModal] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { getBingoGameState().then(setGameState); }, []);

  const updateState = (s: BingoState) => { setGameState(s); saveBingoGameState(s); };
  const salidosSet = new Set(gameState.numerosSalidos);
  const numerosRestantes = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !salidosSet.has(n));
  const ultimas3 = gameState.numerosSalidos.slice(-3).reverse();

  const handleSacarBolilla = () => {
    if (isSpinning || numerosRestantes.length === 0) return;
    setIsSpinning(true);
    setJustDrawnNumber(null);
    if (soundEnabled) sounds.playTombolaRoll(2200);
    let spinCount = 0;
    spinIntervalRef.current = setInterval(() => {
      setTempSpinNumber(numerosRestantes[Math.floor(Math.random() * numerosRestantes.length)]);
      spinCount++;
      if (spinCount >= 25) {
        clearInterval(spinIntervalRef.current!);
        const chosen = numerosRestantes[Math.floor(Math.random() * numerosRestantes.length)];
        setTempSpinNumber(null);
        setIsSpinning(false);
        setJustDrawnNumber(chosen);
        const nuevosSalidos = [...gameState.numerosSalidos, chosen];
        updateState({ numerosSalidos: nuevosSalidos, ultimoNumero: chosen, enSorteo: false, juegoIniciado: true, totalNumeros: 75 });
        if (soundEnabled) sounds.playBallPop();
        if (voiceEnabled) sounds.announceNumber(getBingoLetter(chosen).letter, chosen);
        try { confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 }, colors: ['#ef4444', '#eab308', '#22c55e', '#0ea5e9', '#a855f7'] }); } catch { /**/ }
      }
    }, 80);
  };

  const handleResetGame = () => {
    updateState({ numerosSalidos: [], ultimoNumero: null, enSorteo: false, juegoIniciado: false, totalNumeros: 75 });
    setJustDrawnNumber(null);
    setShowResetConfirm(false);
    setShowAllNumbers(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  const cycleSize = () => setSizeLevel(prev => prev >= SIZE_LEVELS ? 1 : prev + 1);

  const pct = Math.round((gameState.numerosSalidos.length / 75) * 100);

  // ── Size-derived CSS classes ──
  const sphereSizeClass = sizeLevel === 1 ? 'w-32 h-32 sm:w-36 sm:h-36' : sizeLevel === 2 ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-56 h-56 sm:w-64 sm:h-64';
  const spinBallClass = sizeLevel === 1 ? 'w-20 h-20' : sizeLevel === 2 ? 'w-28 h-28' : 'w-36 h-36';
  const spinLetterClass = sizeLevel === 1 ? 'text-[9px]' : sizeLevel === 2 ? 'text-xs' : 'text-sm';
  const spinNumClass = sizeLevel === 1 ? 'text-2xl' : sizeLevel === 2 ? 'text-3xl' : 'text-4xl';
  const winnerBallClass = sizeLevel === 1 ? 'w-24 h-24' : sizeLevel === 2 ? 'w-32 h-32' : 'w-40 h-40';
  const winnerNumClass = sizeLevel === 1 ? 'text-3xl' : sizeLevel === 2 ? 'text-4xl' : 'text-5xl';
  const recentBallClass = sizeLevel === 1 ? 'w-12 h-12' : sizeLevel === 2 ? 'w-16 h-16' : 'w-20 h-20';
  const recentLetterClass = sizeLevel === 1 ? 'text-[9px]' : sizeLevel === 2 ? 'text-xs' : 'text-sm';
  const recentNumClass = sizeLevel === 1 ? 'text-base' : sizeLevel === 2 ? 'text-xl' : 'text-2xl';
  const boardNumClass = sizeLevel === 1 ? 'text-xs sm:text-base md:text-xl lg:text-2xl xl:text-3xl' : sizeLevel === 2 ? 'text-sm sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl' : 'text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
  const sizeLabelMap: Record<number, string> = { 1: 'Normal', 2: 'Grande', 3: 'XL' };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-2 select-none text-white ${isFullscreen ? 'p-3 bg-slate-950 h-screen overflow-y-auto' : ''}`}
    >
      {/* ── TOP BAR ── */}
      <div className="bg-slate-900 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Dices className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-base sm:text-lg leading-tight flex items-center gap-2">
              BINGO OFICIAL 75
              <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/30">EN VIVO</span>
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-400 truncate">{nombreEvento || 'Simulador de Bingo INA'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 text-center hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Extraídas</span>
            <span className="text-sm font-black text-amber-400 leading-tight">{gameState.numerosSalidos.length}/75</span>
          </div>
          {/* Show-all numbers button — always available */}
          <button
            onClick={() => setShowAllNumbers(v => !v)}
            title={showAllNumbers ? 'Ocultar todos los números' : 'Mostrar todos los números'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition
              ${showAllNumbers
                ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
          >
            {showAllNumbers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showAllNumbers ? 'Ocultar' : 'Ver todos'}</span>
          </button>
          {/* Cartilla de ejemplo */}
          <button
            onClick={() => setShowCartillaModal(true)}
            title="Mostrar cartilla de ejemplo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-violet-600/60 bg-violet-950/60 text-violet-300 hover:bg-violet-900/80 transition text-xs font-bold"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cartilla</span>
          </button>
          {/* Size toggle button */}
          <button
            onClick={cycleSize}
            title={`Tamaño: ${sizeLabelMap[sizeLevel]}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-600/60 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/80 transition text-xs font-bold"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sizeLabelMap[sizeLevel]}</span>
          </button>
          <button onClick={() => setSoundEnabled(v => !v)} title="Sonido"
            className={`w-8 h-8 flex items-center justify-center rounded-xl border transition ${soundEnabled ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-800 text-slate-500'}`}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setVoiceEnabled(v => !v)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${voiceEnabled ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300' : 'bg-slate-800/50 border-slate-800 text-slate-500'}`}>
            <Sparkles className="w-3.5 h-3.5" /><span className="hidden sm:inline">Voz:</span>{voiceEnabled ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setShowHistoryModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition">
            <History className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowResetConfirm(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 hover:bg-rose-900/80 transition">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT: board on top, tombola+recent at bottom ── */}
      <div className="flex flex-col gap-2">

        {/* ══ BOARD ══ */}
        <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950">

          {/* Letter header row */}
          <div className="grid grid-cols-5">
            {COLUMNS.map(col => (
              <div key={col.letter} className={`${col.bg} py-2 sm:py-3 flex items-center justify-center border-r border-black/20 last:border-r-0`}>
                <span className="font-black text-2xl sm:text-3xl lg:text-4xl text-white drop-shadow-md">{col.letter}</span>
              </div>
            ))}
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-5 flex-1">
            {COLUMNS.map(col => {
              const nums = Array.from({ length: 15 }, (_, i) => col.start + i);
              return (
                <div key={col.letter}>
                  {[0, 1, 2, 3, 4].map(row => (
                    <div key={row} className={`gap-1 sm:gap-2 p-1 sm:p-2 grid grid-cols-3 ${col.bg}`}>
                      {nums.slice(row * 3, row * 3 + 3).map(num => {
                        const isDrawn = salidosSet.has(num);
                        const isLatest = gameState.ultimoNumero === num;
                        return (
                          <div
                            key={num}
                            className={`
                              relative flex items-center justify-center
                              aspect-square border border-black/15
                              transition-all duration-300 bg-white
                              ${isLatest ? 'ring-2 ring-inset ring-amber-400 z-10 scale-105 shadow-lg' : ''}
                            `}
                          >
                            {/* Only render the number text if drawn OR showAllNumbers */}
                            {(isDrawn || showAllNumbers) && (
                              <span className={`
                                font-black leading-none select-none transition-all duration-300
                                ${boardNumClass}
                                text-slate-900
                              `}>
                                {num}
                              </span>
                            )}
                            {isLatest && (
                              <span className="absolute inset-1 rounded ring-2 ring-amber-400 animate-ping opacity-60 pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="bg-slate-900 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-sky-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">
                {gameState.numerosSalidos.length}/75 · {pct}%
              </span>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: TOMBOLA + ÚLTIMAS BOLILLAS ── */}
        <div className="flex flex-col sm:flex-row gap-2">

          {/* TOMBOLA */}
          <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-3 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
            <div className=" w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Info + sphere column */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 self-start">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping block" />
                <h3 className="font-extrabold text-white text-sm">Tómbola en Vivo</h3>
                <span className="text-[11px] font-bold text-slate-400">{numerosRestantes.length} bolillas</span>
              </div>

              {/* Sphere */}
              <div className={`
                relative ${sphereSizeClass} rounded-full border-4 flex items-center justify-center shadow-inner overflow-hidden transition-all duration-300
                bg-radial from-indigo-900/40 via-slate-900 to-slate-950
                ${isSpinning ? 'border-amber-400 shadow-amber-500/30 animate-spin-fast' : 'border-indigo-500/30'}
              `}>
                <div className="absolute inset-0 rounded-full border border-dashed border-indigo-400/20" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-indigo-500/20" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-indigo-500/20" />

                {/* Resting balls */}
                {!isSpinning && !justDrawnNumber && (
                  <div className="absolute inset-0 p-3 flex flex-wrap items-center justify-center gap-1 opacity-70 overflow-hidden">
                    {numerosRestantes.slice(0, 14).map((num, idx) => {
                      const meta = getBingoLetter(num);
                      return (
                        <div key={idx}
                          // style={{ transform: `translate(${Math.sin(idx * 1.3) * 7}px, ${Math.cos(idx * 1.3) * 7}px)` }}
                          className={`w-5 h-5 rounded-full bg-gradient-to-tr ${BALL_GRADIENTS[meta.letter]} text-white font-black text-[8px] flex items-center justify-center shadow-sm border ${BALL_BORDERS[meta.letter]}`}>
                          {num}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Spinning */}
                {isSpinning && (
                  <div className="z-10 flex items-center justify-center">
                    <div className={`${spinBallClass} rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex flex-col items-center justify-center shadow-2xl animate-bounce`}>
                      <span className={`${spinLetterClass} font-black text-slate-900 uppercase tracking-widest`}>
                        {tempSpinNumber ? getBingoLetter(tempSpinNumber).letter : '?'}
                      </span>
                      <span className={`${spinNumClass} font-black text-slate-900 leading-none`}>{tempSpinNumber || '?'}</span>
                    </div>
                  </div>
                )}

                {/* Winner */}
                {!isSpinning && justDrawnNumber && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/80 backdrop-blur-sm animate-fade-in rounded-full">
                    <div className={`${winnerBallClass} rounded-full bg-gradient-to-tr ${BALL_GRADIENTS[getBingoLetter(justDrawnNumber).letter]} flex flex-col items-center justify-center shadow-2xl ring-4 ${BALL_BORDERS[getBingoLetter(justDrawnNumber).letter]}`}>
                      <span className="text-[25px] font-black text-white/90 tracking-widest uppercase">{getBingoLetter(justDrawnNumber).letter}</span>
                      <span className={`${winnerNumClass} font-black text-white leading-none`}>{justDrawnNumber}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-20 h-1.5 bg-gradient-to-r from-slate-700 via-indigo-500 to-slate-700 rounded-full shadow-md" />
            </div>

            {/* Draw button */}
            <button
              onClick={handleSacarBolilla}
              disabled={isSpinning || numerosRestantes.length === 0}
              className={`flex-1 flex py-6 px-4 rounded-xl font-black text-lg flex-col items-center justify-center gap-2 transition-all duration-300 shadow-xl
                ${numerosRestantes.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isSpinning
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 animate-pulse cursor-wait'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white hover:scale-[1.01]'
                }`}
            >
              <Dices className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? '¡SORTEANDO...!' : numerosRestantes.length === 0 ? '¡COMPLETADO!' : 'SACAR BOLILLA'}
            </button>
          </div>

          {/* ÚLTIMAS 4 BOLILLAS */}
          {(() => {
            const ultimas4 = gameState.numerosSalidos.slice(-4).reverse();
            return (
              <div className="flex-1 bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800">
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Últimas Bolillas
                  </h3>
                  <span className="text-[11px] text-slate-500">{gameState.numerosSalidos.length > 0 ? `${gameState.numerosSalidos.length} extraídas` : 'ninguna'}</span>
                </div>

                {/* Balls row */}
                <div className="flex-1 flex items-center justify-center gap-4">
                  {ultimas4.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-lg">?</div>
                      <span>Sin bolillas aún</span>
                    </div>
                  ) : (
                    ultimas4.map((num, idx) => {
                      const meta = getBingoLetter(num);
                      const isLatest = idx === 0;
                      return (
                        <div
                          key={`${num}-${idx}`}
                          className={`${recentBallClass} rounded-full bg-gradient-to-tr ${BALL_GRADIENTS[meta.letter]} flex flex-col items-center justify-center shadow-lg border-2 ${BALL_BORDERS[meta.letter]} flex-shrink-0 transition-all duration-300
                            ${isLatest ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60'}`}
                        >
                          <span className={`${recentLetterClass} font-black text-white/90 uppercase leading-none`}>{meta.letter}</span>
                          <span className={`${recentNumClass} font-black text-white leading-none`}>{num}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── HISTORY MODAL ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-black text-lg">Historial de Salida</h3>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {gameState.numerosSalidos.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">Sin números sorteados aún</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gameState.numerosSalidos.map((num, i) => {
                    const meta = getBingoLetter(num);
                    return (
                      <div key={i} className={`px-2 py-1 rounded-lg bg-gradient-to-r ${BALL_GRADIENTS[meta.letter]} font-black text-xs flex items-center gap-1`}>
                        <span className="opacity-60 text-[9px]">#{i + 1}</span>{meta.letter}{num}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-slate-800 text-right mt-3">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET CONFIRM ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg">¿Reiniciar la Partida?</h3>
            <p className="text-xs text-slate-400">Se limpiará el tablero y la tómbola volverá a tener las 75 bolillas.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleResetGame} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white">Sí, Reiniciar</button>
            </div>
          </div>
        </div>
      )}
      {/* ── CARTILLA DE EJEMPLO MODAL ── */}
      {showCartillaModal && (() => {
        // Generate a fixed sample card (same numbers each time for consistency)
        const SAMPLE_CARD: number[][] = [
          [3, 8, 12, 1, 6],      // B col (row values)
          [17, 22, 28, 19, 25],  // I col
          [31, 38, 0, 41, 45],   // N col (0 = FREE)
          [47, 53, 58, 50, 55],  // G col
          [63, 69, 75, 62, 70],  // O col
        ];
        // Patterns: array of [colIdx, rowIdx] pairs that should be marked
        const PATTERNS: { name: string; cells: [number, number][]; color: string }[] = [
          {
            name: 'Línea Horizontal',
            cells: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
            color: 'bg-sky-500',
          },
          {
            name: 'Línea Vertical',
            cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
            color: 'bg-emerald-500',
          },
          {
            name: 'Diagonal ↘',
            cells: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
            color: 'bg-amber-500',
          },
          {
            name: 'Diagonal ↗',
            cells: [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]],
            color: 'bg-rose-500',
          },
          {
            name: 'X (Doble Diagonal)',
            cells: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 4], [1, 3], [3, 1], [4, 0]],
            color: 'bg-purple-500',
          },
          {
            name: 'Cruz',
            cells: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [0, 2], [1, 2], [3, 2], [4, 2]],
            color: 'bg-orange-500',
          },
          {
            name: 'Forma de L',
            cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4]],
            color: 'bg-pink-500',
          },
          {
            name: 'Cartilla Llena',
            cells: Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => [c, r] as [number, number])).flat(),
            color: 'bg-indigo-500',
          },
        ];
        const pattern = PATTERNS[selectedPattern];
        const markedSet = new Set(pattern.cells.map(([c, r]) => `${c}-${r}`));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xl w-full shadow-2xl flex flex-col gap-4">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-violet-400" />
                  <h3 className="font-black text-lg">Cartilla de Ejemplo</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-400/30">FIGURA</span>
                </div>
                <button onClick={() => setShowCartillaModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
              </div>

              {/* Pattern selector */}
              <div className="flex flex-wrap gap-1.5">
                {PATTERNS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPattern(i)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition
                      ${selectedPattern === i
                        ? `${p.color} text-white border-transparent shadow-lg`
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Sample card */}
              <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                {/* Header row */}
                <div className="grid grid-cols-5">
                  {COLUMNS.map(col => (
                    <div key={col.letter} className={`${col.bg} py-2 flex items-center justify-center border-r border-black/20 last:border-r-0`}>
                      <span className="font-black text-xl text-white drop-shadow-md">{col.letter}</span>
                    </div>
                  ))}
                </div>
                {/* Number grid */}
                <div className="grid grid-cols-5">
                  {SAMPLE_CARD.map((colNums, colIdx) => (
                    <div key={colIdx} className={`border-r-2 border-black/25 last:border-r-0 ${COLUMNS[colIdx].bg}`}>
                      {colNums.map((num, rowIdx) => {
                        const isFree = num === 0;
                        const isMarked = markedSet.has(`${colIdx}-${rowIdx}`);
                        return (
                          <div
                            key={rowIdx}
                            className={`relative flex items-center justify-center aspect-square border border-black/15 transition-all duration-200
                              ${isMarked ? `${pattern.color} shadow-inner` : 'bg-white'}`}
                          >
                            {isFree ? (
                              <span className="text-[10px] font-black text-white/90 uppercase tracking-tight">FREE</span>
                            ) : (
                              <>
                                <span className={`font-black text-lg leading-none select-none
                                  ${isMarked ? 'text-white' : 'text-slate-900'}`}>
                                  {num}
                                </span>
                                {isMarked && (
                                  <span className="absolute top-0.5 right-0.5">
                                    <Check className="w-3 h-3 text-white/80" />
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`inline-block w-4 h-4 rounded ${pattern.color}`} />
                <span>Celdas que deben completarse para ganar con <strong className="text-white">{pattern.name}</strong></span>
              </div>

              <div className="text-right">
                <button onClick={() => setShowCartillaModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold">Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
