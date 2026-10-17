'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings,
  RotateCcw,
  ChevronRight,
  Radio,
  Trophy,
  Zap,
  History,
  X,
  Check,
  AlertTriangle,
  Timer,
  LayoutGrid,
  Sparkles,
  Table,
} from 'lucide-react';
import { saveBingoGameState, getBingoGameState } from '../lib/storage';
import { initializeFirebase } from '../lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { BingoState } from '../lib/types';

// ─── Column definitions ────────────────────────────────────────────────────────
const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;
type BingoLetter = (typeof BINGO_LETTERS)[number];

function getLetterForNum(n: number): BingoLetter {
  if (n <= 15) return 'B';
  if (n <= 30) return 'I';
  if (n <= 45) return 'N';
  if (n <= 60) return 'G';
  return 'O';
}

const LETTER_RANGES: Record<BingoLetter, { start: number; end: number }> = {
  B: { start: 1, end: 15 },
  I: { start: 16, end: 30 },
  N: { start: 31, end: 45 },
  G: { start: 46, end: 60 },
  O: { start: 61, end: 75 },
};

const LETTER_COLORS: Record<BingoLetter, { bg: string; dark: string; text: string; glow: string }> = {
  B: { bg: '#3B82F6', dark: '#1D4ED8', text: '#BFDBFE', glow: '0 0 20px #3B82F680' },
  I: { bg: '#EF4444', dark: '#B91C1C', text: '#FEE2E2', glow: '0 0 20px #EF444480' },
  N: { bg: '#22C55E', dark: '#15803D', text: '#DCFCE7', glow: '0 0 20px #22C55E80' },
  G: { bg: '#F59E0B', dark: '#B45309', text: '#FEF3C7', glow: '0 0 20px #F59E0B80' },
  O: { bg: '#A855F7', dark: '#7E22CE', text: '#F3E8FF', glow: '0 0 20px #A855F780' },
};

// ─── Cartilla / Pattern Definitions ────────────────────────────────────────────
// Realistic sample numbers for a standard 5x5 bingo card (col 0=B, 1=I, 2=N, 3=G, 4=O)
const CARTILLA_SAMPLE = [
  [7, 22, 35, 50, 65],  // Fila 0
  [12, 18, 41, 48, 71], // Fila 1
  [3, 29, 0, 59, 62],   // Fila 2 (centro 0 = LIBRE)
  [15, 25, 38, 53, 75], // Fila 3
  [9, 16, 44, 60, 68],  // Fila 4
];

interface BingoGame2Props {
  nombreEvento?: string;
}

// ─── Modal helper ──────────────────────────────────────────────────────────────
function Modal({
  onClose,
  title,
  children,
  maxWidth = 480,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number | string;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
        border: '2px solid rgba(255,255,255,0.25)', borderRadius: 20,
        padding: '16px 18px', maxWidth, width: '100%', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 14, flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 'clamp(15px, 4vw, 18px)', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10,
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s', flexShrink: 0,
};
const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, color: '#1e3a5f',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 20px', background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
  fontWeight: 800, fontSize: 14, color: 'white', cursor: 'pointer',
};

// ─── Main BingoGame2 Component ─────────────────────────────────────────────────
export const BingoGame2: React.FC<BingoGame2Props> = () => {
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flashNum, setFlashNum] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBingoConfirm, setShowBingoConfirm] = useState(false);
  const [drawSpeed, setDrawSpeed] = useState(80);
  const [totalFlashes, setTotalFlashes] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastFiveNumbers, setLastFiveNumbers] = useState<number[]>([]);
  const [showCartillaModal, setShowCartillaModal] = useState(false);
  const [cartillaPattern, setCartillaPattern] = useState<Set<string>>(
    () => new Set(['0-2', '1-2', '2-2', '3-2', '4-2'])
  );
  const [patternName, setPatternName] = useState('Línea Horizontal');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawnSet = new Set(drawnNumbers);
  const remaining = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !drawnSet.has(n));

  // Load state and cartilla pattern from database on mount
  useEffect(() => {
    getBingoGameState().then((state: BingoState) => {
      if (state.juegoIniciado) {
        setDrawnNumbers(state.numerosSalidos);
        setCurrentNumber(state.ultimoNumero);
        setGameStarted(true);
        setLastFiveNumbers(state.numerosSalidos.slice(-5).reverse());
      }
      const activeFigura = state.figura || 'Línea Horizontal';
      const activePatron =
        state.patronFigura && Array.isArray(state.patronFigura) && state.patronFigura.length > 0
          ? state.patronFigura
          : ['0-2', '1-2', '2-2', '3-2', '4-2'];

      setPatternName(activeFigura);
      setCartillaPattern(new Set(activePatron));

      saveBingoGameState({
        numerosSalidos: state.juegoIniciado ? state.numerosSalidos : [],
        ultimoNumero: state.juegoIniciado ? state.ultimoNumero : null,
        enSorteo: false,
        juegoIniciado: state.juegoIniciado,
        totalNumeros: 75,
        figura: activeFigura,
        patronFigura: activePatron,
      });
    });
  }, []);

  const toggleCell = (col: number, row: number) => {
    const key = `${col}-${row}`;
    setCartillaPattern((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearPattern = () => {
    const next = new Set<string>(['2-2']);
    setCartillaPattern(next);
    setPatternName('Personalizada');
    saveBingoGameState({
      numerosSalidos: drawnNumbers,
      ultimoNumero: currentNumber,
      enSorteo: isDrawing,
      juegoIniciado: gameStarted,
      totalNumeros: 75,
      figura: 'Personalizada',
      patronFigura: ['2-2'],
    });
  };

  const handleSaveFigura = () => {
    const finalName = patternName.trim() || 'Personalizada';
    const patternArray = Array.from(cartillaPattern);
    setPatternName(finalName);
    saveBingoGameState({
      numerosSalidos: drawnNumbers,
      ultimoNumero: currentNumber,
      enSorteo: isDrawing,
      juegoIniciado: gameStarted,
      totalNumeros: 75,
      figura: finalName,
      patronFigura: patternArray,
    });
    setShowCartillaModal(false);
  };

  // Real-time Firestore listener
  useEffect(() => {
    const { db, isConfigured } = initializeFirebase();
    if (!isConfigured || !db) return;
    const unsub = onSnapshot(doc(db, 'bingo_estado', 'partida_actual'), (snap) => {
      if (snap.exists() && !isDrawing) {
        const data = snap.data() as BingoState;
        setDrawnNumbers(data.numerosSalidos);
        setCurrentNumber(data.ultimoNumero);
        setGameStarted(data.juegoIniciado);
        setLastFiveNumbers(data.numerosSalidos.slice(-5).reverse());
        if (!showCartillaModal) {
          if (data.figura) setPatternName(data.figura);
          if (data.patronFigura && Array.isArray(data.patronFigura)) {
            setCartillaPattern(new Set(data.patronFigura));
          }
        }
      }
    });
    return () => unsub();
  }, [isDrawing, showCartillaModal]);

  const persistState = useCallback((nums: number[], last: number | null) => {
    saveBingoGameState({
      numerosSalidos: nums,
      ultimoNumero: last,
      enSorteo: false,
      juegoIniciado: true,
      totalNumeros: 75,
      figura: patternName,
      patronFigura: Array.from(cartillaPattern),
    });
  }, [patternName, cartillaPattern]);

  // Draw with lottery effect
  const handleNext = () => {
    if (isDrawing || remaining.length === 0) return;
    setIsDrawing(true);
    setGameStarted(true);

    // When starting the game or drawing, immediately persist the game state and figure to the database
    saveBingoGameState({
      numerosSalidos: drawnNumbers,
      ultimoNumero: currentNumber,
      enSorteo: true,
      juegoIniciado: true,
      totalNumeros: 75,
      figura: patternName,
      patronFigura: Array.from(cartillaPattern),
    });

    let count = 0;
    const capturedRemaining = [...remaining];

    intervalRef.current = setInterval(() => {
      const randNum = capturedRemaining[Math.floor(Math.random() * capturedRemaining.length)];
      setFlashNum(randNum);
      count++;

      if (count >= totalFlashes) {
        clearInterval(intervalRef.current!);
        const winner = capturedRemaining[Math.floor(Math.random() * capturedRemaining.length)];
        setFlashNum(null);
        setCurrentNumber(winner);
        const newDrawn = [...drawnNumbers, winner];
        setDrawnNumbers(newDrawn);
        setLastFiveNumbers(newDrawn.slice(-5).reverse());
        persistState(newDrawn, winner);
        setIsDrawing(false);
      }
    }, drawSpeed);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDrawnNumbers([]);
    setCurrentNumber(null);
    setIsDrawing(false);
    setFlashNum(null);
    setGameStarted(false);
    setLastFiveNumbers([]);
    setShowResetConfirm(false);
    saveBingoGameState({
      numerosSalidos: [],
      ultimoNumero: null,
      enSorteo: false,
      juegoIniciado: false,
      totalNumeros: 75,
      figura: patternName,
      patronFigura: Array.from(cartillaPattern),
    });
  };

  const displayNum = flashNum ?? currentNumber;
  const displayLetter = displayNum ? getLetterForNum(displayNum) : null;
  const pct = Math.round((drawnNumbers.length / 75) * 100);
  const last5Slots = Array.from({ length: 3 }, (_, i) => lastFiveNumbers[i + 1] ?? null);

  return (
    <div style={{
      height: '100%',
      minHeight: '100%',
      flex: 1,
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 30%, #0369a1 60%, #075985 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px',
      boxSizing: 'border-box', position: 'relative', overflowX: 'hidden', overflowY: 'auto',
    }}>
      {/* Decorative wave SVG */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.12 }} viewBox="0 0 1000 600" preserveAspectRatio="none">
        <path d="M0,200 Q250,100 500,200 T1000,200" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <path d="M0,400 Q250,300 500,400 T1000,400" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <circle cx="950" cy="60" r="40" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <circle cx="50" cy="500" r="50" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <path d="M820,0 Q880,120 850,300" stroke="#fbbf24" strokeWidth="4" fill="none" />
      </svg>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 12px',
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.25)',
        flexWrap: 'wrap', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        {/* Big hero ball */}
        <div style={{
          width: 'clamp(84px, 7.5vw, 110px)', height: 'clamp(84px, 7.5vw, 110px)',
          minWidth: 80, minHeight: 80, borderRadius: '50%',
          background: displayLetter
            ? `radial-gradient(circle at 35% 30%, ${LETTER_COLORS[displayLetter].text}, ${LETTER_COLORS[displayLetter].bg} 50%, ${LETTER_COLORS[displayLetter].dark})`
            : 'radial-gradient(circle at 35% 30%, #e2e8f0, #94a3b8 50%, #475569)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '4px solid #fbbf24',
          boxShadow: displayLetter ? `${LETTER_COLORS[displayLetter].glow}, 0 6px 20px rgba(0,0,0,0.4)` : '0 6px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.1s ease', flexShrink: 0,
        }}>
          {displayLetter && (
            <span style={{ fontSize: 'clamp(18px, 1.4vw, 28px)', fontWeight: 900, color: 'black', lineHeight: 1, letterSpacing: 2, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
              {displayLetter}
            </span>
          )}
          <span style={{ fontSize: displayNum ? 'clamp(34px, 3.6vw, 48px)' : 'clamp(24px, 2.6vw, 32px)', fontWeight: 900, color: 'black', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {displayNum ?? '?'}
          </span>
        </div>

        {/* Controls: Siguiente + BINGO + FIGURA + last 5 */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', letterSpacing: 1.2, textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            ÚLTIMOS NÚMEROS
          </div>

          {/* Last 5 numbers */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

            {last5Slots.map((num, i) => {
              if (!num) {
                return (
                  <div key={i} style={{
                    padding: '5px 12px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
                    minWidth: 46, textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                  }}>—</div>
                );
              }
              const letter = getLetterForNum(num);
              const colors = LETTER_COLORS[letter];
              return (
                <div key={i}
                  className="py-[2px] px-[9px] md:py-[10px] md:px-[20px]"
                  style={{
                    // padding: '10px 20px',
                    borderRadius: 40,
                    background: `radial-gradient(circle at 35% 30%, ${colors.text}, ${colors.bg} 50%, ${colors.dark})`,
                    border: '2px solid rgba(255,255,255,0.4)',
                    minWidth: 32, textAlign: 'center',
                    boxShadow: i === 0 ? `0 0 14px ${colors.bg}` : 'none',
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'black', letterSpacing: 1 }}>{letter}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'black', lineHeight: 1 }}>{num}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* SIGUIENTE */}
          <button
            id="btn-siguiente"
            onClick={handleNext}
            disabled={isDrawing || remaining.length === 0}
            style={{
              // padding: '12px 28px',
              padding: '8px 14px',
              background: isDrawing || remaining.length === 0 ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #fef08a, #fbbf24, #f59e0b)',
              border: '3px solid rgba(255,255,255,0.4)', borderRadius: 12,
              fontWeight: 900, fontSize: 18, fontStyle: 'italic', letterSpacing: 0.5,
              color: isDrawing || remaining.length === 0 ? 'rgba(255,255,255,0.5)' : '#1e3a5f',
              cursor: isDrawing || remaining.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease',
              boxShadow: isDrawing ? 'none' : '0 4px 15px rgba(251,191,36,0.5)',
            }}
          >
            {isDrawing ? (
              <><Zap size={18} /><span>Sortear</span></>
            ) : remaining.length === 0 ? '¡Completo!' : (
              <><Zap size={20} /><span>Sortear</span></>
            )}
          </button>

          {/* BINGO */}
          <button
            id="btn-bingo"
            onClick={() => setShowBingoConfirm(true)}
            disabled={drawnNumbers.length === 0}
            style={{
              padding: '8px 24px',
              background: drawnNumbers.length === 0 ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              border: '3px solid rgba(255,255,255,0.4)', borderRadius: 12,
              fontWeight: 900, fontSize: 18, fontStyle: 'italic', letterSpacing: 1,
              color: drawnNumbers.length === 0 ? 'rgba(255,255,255,0.5)' : '#1e3a5f',
              cursor: drawnNumbers.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: drawnNumbers.length === 0 ? 'none' : '0 4px 15px rgba(251,191,36,0.4)',
            }}
          >
            <Trophy size={18} /> BINGO
          </button>




        </div>

        {/* Right action buttons */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>




          <button id="btn-settings" onClick={() => setShowSettings(true)} title="Configuración" style={iconBtnStyle}><Settings size={18} /></button>
          <button onClick={() => setShowCartillaModal(true)} style={iconBtnStyle}>
            {/* <Table size={18} /> */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 1.5,
                width: 26,
                height: 26,
                padding: 2,
                background: 'rgba(15, 23, 42, 0.75)',
                borderRadius: 4,
                border: '1px solid rgba(251,191,36,0.5)',
                flexShrink: 0,
              }}
            >
              {Array.from({ length: 25 }, (_, idx) => {
                const col = idx % 5;
                const row = Math.floor(idx / 5);
                const isMarked = cartillaPattern.has(`${col}-${row}`);
                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 1,
                      background: isMarked ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                );
              })}
            </div>

          </button>
          <button id="btn-history" onClick={() => setShowHistory(true)} title="Historial" style={iconBtnStyle}><History size={18} /></button>
          <a href="/transmision" target="_blank" rel="noopener noreferrer" title="Módulo de Transmisión en Vivo"
            style={{ ...iconBtnStyle, background: 'linear-gradient(135deg, #ef4444, #dc2626)', textDecoration: 'none' }}>
            <Radio size={18} />
          </a>
          <button id="btn-reset" onClick={() => setShowResetConfirm(true)} title="Reiniciar"
            style={{ ...iconBtnStyle, background: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}>
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Counter */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px 14px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>SALIDOS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{drawnNumbers.length}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>de 75</div>
        </div>
      </div>

      {/* ── DESKTOP BOARD (HORIZONTAL ROWS >= md, ADAPTIVE 1-3 LINES PER LETTER) ── */}
      <div
        className="hidden md:flex flex-col justify-between"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
          borderRadius: 20,
          border: '2px solid rgba(255,255,255,0.25)',
          padding: '10px 14px',
          gap: 'clamp(6px, 1vh, 10px)',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {BINGO_LETTERS.map((letter) => {
          const { start, end } = LETTER_RANGES[letter];
          const colors = LETTER_COLORS[letter];

          return (
            <div
              key={letter}
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1vw, 14px)',
              }}
            >
              {/* Row Letter Badge */}
              <div
                style={{
                  width: 'clamp(54px, 5vw, 76px)',
                  alignSelf: 'stretch',
                  minHeight: 48,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${colors.bg}, ${colors.dark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 'clamp(24px, 3vw, 40px)',
                  fontStyle: 'italic',
                  color: 'white',
                  textShadow: `2px 2px 6px rgba(0,0,0,0.6), 0 0 16px ${colors.bg}`,
                  letterSpacing: 1,
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: `0 4px 14px ${colors.glow}`,
                  flexShrink: 0,
                }}
              >
                {letter}
              </div>

              {/* 15 Balls for this letter row (adapts to 1, 2, or 3 lines based on screen width without overflowing) */}
              <div className="bingo-balls-grid flex-1">
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const num = start + i;
                  const drawn = drawnSet.has(num);
                  const isLatest = num === currentNumber && !isDrawing;
                  const isFlashing = num === flashNum;

                  return (
                    <div
                      key={num}
                      style={{
                        width: '100%',
                        maxWidth: 100,
                        aspectRatio: '1',
                        margin: '0 auto',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 'clamp(15px, 1.8vw, 32px)',
                        lineHeight: 1,
                        position: 'relative',
                        transition: 'all 0.12s ease',
                        userSelect: 'none',
                        background: drawn
                          ? `radial-gradient(circle at 35% 30%, ${colors.text}, ${colors.bg} 50%, ${colors.dark})`
                          : isFlashing
                            ? 'radial-gradient(circle at 35% 30%, #fef9c3, #fbbf24, #f59e0b)'
                            : 'radial-gradient(circle at 35% 30%, #f8fafc, #e2e8f0 50%, #cbd5e1)',
                        color: drawn ? 'black' : isFlashing ? '#1e3a5f' : '#bebfc1ff',
                        boxShadow: isLatest
                          ? `0 0 0 3px white, 0 0 0 5px ${colors.bg}, ${colors.glow}`
                          : isFlashing
                            ? '0 0 0 3px white, 0 0 0 5px #fbbf24, 0 0 20px #fbbf2480'
                            : drawn
                              ? `0 2px 8px ${colors.bg}80`
                              : '0 2px 6px rgba(0,0,0,0.12)',
                        transform: isLatest ? 'scale(1.1)' : isFlashing ? 'scale(1.06)' : 'scale(1)',
                        zIndex: isLatest || isFlashing ? 2 : 1,
                        border: isLatest || isFlashing
                          ? '2px solid white'
                          : drawn
                            ? '2px solid rgba(255,255,255,0.3)'
                            : '2px solid rgba(200,210,220,0.6)',
                      }}
                    >
                      {num}
                      {isLatest && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: -4,
                            borderRadius: '50%',
                            border: `3px solid ${colors.bg}`,
                            animation: 'bingo2-ripple 1s ease infinite',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MOBILE BOARD (VERTICAL ALIGNMENT FOR SCREENS < md) ──────────────── */}
      <div className="flex md:hidden flex-col gap-2 p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 relative z-10">
        {/* Sticky Column Headers B-I-N-G-O */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 sticky top-0 z-20 bg-sky-950/90 backdrop-blur-md py-1.5 rounded-xl px-1">
          {BINGO_LETTERS.map((letter) => (
            <div
              key={letter}
              style={{
                background: `linear-gradient(135deg, ${LETTER_COLORS[letter].bg}, ${LETTER_COLORS[letter].dark})`,
                boxShadow: `0 2px 10px ${LETTER_COLORS[letter].glow}`,
              }}
              className="text-center py-2 rounded-xl text-white font-black text-xl sm:text-2xl tracking-wider border border-white/30"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* 5 Vertical Columns with balls flowing downwards */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 px-1">
          {BINGO_LETTERS.map((letter) => {
            const { start, end } = LETTER_RANGES[letter];
            const colors = LETTER_COLORS[letter];
            return (
              <div key={letter} className="flex flex-col gap-1.5 sm:gap-2">
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const num = start + i;
                  const drawn = drawnSet.has(num);
                  const isLatest = num === currentNumber && !isDrawing;
                  const isFlashing = num === flashNum;

                  return (
                    <div
                      key={num}
                      style={{
                        aspectRatio: '1',
                        background: drawn
                          ? `radial-gradient(circle at 35% 30%, ${colors.text}, ${colors.bg} 50%, ${colors.dark})`
                          : isFlashing
                            ? 'radial-gradient(circle at 35% 30%, #fef9c3, #fbbf24, #f59e0b)'
                            : 'radial-gradient(circle at 35% 30%, #f8fafc, #e2e8f0 50%, #cbd5e1)',
                        color: drawn ? 'black' : isFlashing ? '#1e3a5f' : '#d4d5d5ff',
                        boxShadow: isLatest
                          ? `0 0 0 3px white, 0 0 0 5px ${colors.bg}, ${colors.glow}`
                          : isFlashing
                            ? '0 0 0 3px white, 0 0 0 5px #fbbf24, 0 0 15px #fbbf2480'
                            : drawn
                              ? `0 2px 8px ${colors.bg}80`
                              : '0 2px 5px rgba(0,0,0,0.15)',
                        transform: isLatest ? 'scale(1.08)' : isFlashing ? 'scale(1.05)' : 'scale(1)',
                      }}
                      className={`w-full max-w-[45px] mx-auto rounded-full flex items-center justify-center font-black text-base sm:text-xl select-none relative transition-all duration-150 border ${isLatest || isFlashing ? 'border-white ring-2 ring-amber-300' : drawn ? 'border-white/30' : 'border-slate-300/60'
                        }`}
                    >
                      {num}
                      {isLatest && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: -3,
                            borderRadius: '50%',
                            border: `3px solid ${colors.bg}`,
                            animation: 'bingo2-ripple 1s ease infinite',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PROGRESS BAR ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, #22c55e, #fbbf24, #ef4444)',
            borderRadius: 4, transition: 'width 0.5s ease',
            boxShadow: '0 0 8px rgba(251,191,36,0.6)',
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>
          {drawnNumbers.length}/75 · {pct}%
        </span>
        {!gameStarted && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>
            Presiona &quot;Siguiente&quot; para iniciar
          </span>
        )}
      </div>

      {/* ── CSS ANIMATIONS ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes bingo2-ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes bingo2-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        #btn-siguiente:not(:disabled):hover { opacity: 0.9; transform: scale(1.02); }
        #btn-bingo:not(:disabled):hover { opacity: 0.9; transform: scale(1.02); }
        #btn-settings:hover, #btn-history:hover, #btn-reset:hover { opacity: 0.85; transform: scale(1.08); }
      `}</style>

      {/* ── SETTINGS MODAL ─────────────────────────────────────────────────── */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)} title="⚙️ Configuración del Sorteo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Timer size={14} /> Velocidad por destello
                </label>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{drawSpeed}ms</span>
              </div>
              <input type="range" min={30} max={200} step={10} value={drawSpeed}
                onChange={(e) => setDrawSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                <span>⚡ Rápido (30ms)</span>
                <span>🐢 Lento (200ms)</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Cantidad de destellos</label>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{totalFlashes}</span>
              </div>
              <input type="range" min={10} max={80} step={5} value={totalFlashes}
                onChange={(e) => setTotalFlashes(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                <span>💨 Corto (10)</span>
                <span>🎲 Largo (80)</span>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Tiempo estimado del sorteo</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>~{((drawSpeed * totalFlashes) / 1000).toFixed(1)}s</div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── HISTORY MODAL ─────────────────────────────────────────────────── */}
      {showHistory && (
        <Modal onClose={() => setShowHistory(false)} title="📋 Historial de Números">
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {drawnNumbers.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, width: '100%', textAlign: 'center', padding: '20px 0' }}>
                Sin números sorteados aún
              </p>
            ) : drawnNumbers.map((num, i) => {
              const letter = getLetterForNum(num);
              const colors = LETTER_COLORS[letter];
              return (
                <div key={i} style={{
                  padding: '4px 10px', borderRadius: 20, minWidth: 40, textAlign: 'center',
                  background: `linear-gradient(135deg, ${colors.bg}, ${colors.dark})`,
                  boxShadow: `0 2px 8px ${colors.bg}60`,
                }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>#{i + 1}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 900 }}>{letter}</div>
                  <div style={{ fontSize: 14, color: 'white', fontWeight: 900, lineHeight: 1 }}>{num}</div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* ── RESET CONFIRM ─────────────────────────────────────────────────── */}
      {showResetConfirm && (
        <Modal onClose={() => setShowResetConfirm(false)} title="⚠️ Reiniciar partida">
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 20 }}>
              Se borrarán todos los números sorteados.<br />
              <strong style={{ color: 'white' }}>Esta acción no se puede deshacer.</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowResetConfirm(false)} style={secondaryBtnStyle}>Cancelar</button>
              <button onClick={handleReset} style={{ ...primaryBtnStyle, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                <RotateCcw size={16} /> Reiniciar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── BINGO CONFIRM ─────────────────────────────────────────────────── */}
      {showBingoConfirm && (
        <Modal onClose={() => setShowBingoConfirm(false)} title="🏆 ¡BINGO!">
          <div style={{ textAlign: 'center' }}>
            <Trophy size={50} style={{ color: '#fbbf24', marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 }}>¿Se declaró un ganador de BINGO?</p>
            <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>Números sorteados: {drawnNumbers.length} de 75</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowBingoConfirm(false)} style={secondaryBtnStyle}>Cancelar</button>
              <button onClick={() => { setShowBingoConfirm(false); setShowResetConfirm(true); }} style={primaryBtnStyle}>
                <Check size={16} /> Confirmar y reiniciar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CARTILLA / FIGURA A FORMAR MODAL ──────────────────────────────── */}
      {showCartillaModal && (
        <Modal
          onClose={() => setShowCartillaModal(false)}
          title="🎯 Figura a Formar (Cartilla de Bingo)"
          maxWidth={560}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pattern Name field */}
            <div
              className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5"
              style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', whiteSpace: 'nowrap' }}>
                Nombre de la Figura:
              </span>
              <input
                type="text"
                value={patternName}
                onChange={(e) => {
                  setPatternName(e.target.value);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('eventos_ina_bingo2_pattern_name', e.target.value);
                  }
                }}
                placeholder="Ej: Línea Horizontal, Letra X, 4 Esquinas..."
                style={{
                  flex: 1,
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            {/* Interactive 5x5 Bingo Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              padding: 12,
              borderRadius: 16,
              border: '3px solid #fbbf24',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}>
              {/* Column Letter Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
                {BINGO_LETTERS.map((letter) => (
                  <div
                    key={letter}
                    style={{
                      background: `linear-gradient(135deg, ${LETTER_COLORS[letter].bg}, ${LETTER_COLORS[letter].dark})`,
                      color: 'white',
                      fontWeight: 900,
                      fontSize: 18,
                      textAlign: 'center',
                      padding: '6px 0',
                      borderRadius: 8,
                      boxShadow: `0 2px 8px ${LETTER_COLORS[letter].glow}`,
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              {/* 5x5 Matrix of Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {Array.from({ length: 25 }, (_, idx) => {
                  const col = idx % 5;
                  const row = Math.floor(idx / 5);
                  const isCenter = col === 2 && row === 2;
                  const key = `${col}-${row}`;
                  const isMarked = cartillaPattern.has(key);
                  const sampleNum = CARTILLA_SAMPLE[row][col];
                  const letter = BINGO_LETTERS[col];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCell(col, row)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: isMarked
                          ? '2px solid #fef08a'
                          : '1px solid rgba(255,255,255,0.15)',
                        background: isMarked
                          ? 'linear-gradient(135deg, #fef08a 0%, #fbbf24 50%, #d97706 100%)'
                          : 'rgba(255,255,255,0.06)',
                        color: isMarked ? '#1e3a5f' : 'white',
                        fontWeight: 900,
                        boxShadow: isMarked
                          ? '0 0 16px rgba(251, 191, 36, 0.7), inset 0 1px 3px rgba(255,255,255,0.8)'
                          : 'none',
                        transform: isMarked ? 'scale(1.03)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        padding: 2,
                      }}
                    >
                      {isCenter ? (
                        <span style={{ fontSize: 11, fontWeight: 900, textAlign: 'center', lineHeight: 1.1 }}>
                          ★<br />LIBRE
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: 9, opacity: isMarked ? 0.8 : 0.4, fontWeight: 800 }}>
                            {letter}
                          </span>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>{sampleNum}</span>
                        </>
                      )}
                      {isMarked && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 3,
                            right: 3,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#1e3a5f',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instruction and active cells counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', flexWrap: 'wrap', gap: 4 }}>
              <span>👆 Toca cualquier casilla para marcarla/desmarcarla libremente.</span>
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>
                {cartillaPattern.size} casillas marcadas
              </span>
            </div>

            {/* Action Buttons: Limpiar Todo + Guardar Figura (always side by side) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4, width: '100%' }}>
              <button
                type="button"
                onClick={clearPattern}
                style={{
                  padding: '10px 10px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                🧹 Limpiar Todo
              </button>

              <button
                type="button"
                onClick={handleSaveFigura}
                style={{
                  ...primaryBtnStyle,
                  padding: '10px 10px',
                  fontSize: 13,
                  fontWeight: 900,
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                <Check size={16} /> Guardar Figura
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BingoGame2;
