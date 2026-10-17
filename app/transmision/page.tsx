'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Radio, Wifi, WifiOff, Eye, Sparkles, X } from 'lucide-react';
import { initializeFirebase } from '../../lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { getBingoGameState, subscribeAndRegisterBingoViewer } from '../../lib/storage';
import { BingoState } from '../../lib/types';

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

const CARTILLA_SAMPLE = [
  [7, 22, 35, 50, 65],
  [12, 18, 41, 48, 71],
  [3, 29, 0, 59, 62],
  [15, 25, 38, 53, 75],
  [9, 16, 44, 60, 68],
];

export default function TransmisionPage() {
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [highlightNew, setHighlightNew] = useState<number | null>(null);
  const [figuraName, setFiguraName] = useState<string>('Línea Horizontal');
  const [figuraPattern, setFiguraPattern] = useState<Set<string>>(
    () => new Set(['0-2', '1-2', '2-2', '3-2', '4-2'])
  );
  const [showFiguraModal, setShowFiguraModal] = useState<boolean>(false);
  const prevCountRef = useRef(0);

  const drawnSet = new Set(drawnNumbers);
  const pct = Math.round((drawnNumbers.length / 75) * 100);

  // Real-time functional viewer count from Firestore presence document
  useEffect(() => {
    const unsubPresence = subscribeAndRegisterBingoViewer((count) => {
      setViewerCount(count);
    });
    return () => unsubPresence();
  }, []);

  // Initial load from Firestore database
  useEffect(() => {
    getBingoGameState().then((state: BingoState) => {
      if (state.juegoIniciado) {
        setDrawnNumbers(state.numerosSalidos);
        setCurrentNumber(state.ultimoNumero);
      } else {
        setDrawnNumbers([]);
        setCurrentNumber(null);
      }
      if (state.figura) setFiguraName(state.figura);
      if (state.patronFigura && Array.isArray(state.patronFigura) && state.patronFigura.length > 0) {
        setFiguraPattern(new Set(state.patronFigura));
      }
    });
  }, []);

  // Real-time Firestore listener for bingo game state
  useEffect(() => {
    const { db, isConfigured } = initializeFirebase();
    if (!isConfigured || !db) return;

    const unsub = onSnapshot(
      doc(db, 'bingo_estado', 'partida_actual'),
      (snap) => {
        setIsConnected(true);
        if (snap.exists()) {
          const data = snap.data() as BingoState;
          const prev = prevCountRef.current;
          if (data.numerosSalidos.length > prev) {
            setHighlightNew(data.ultimoNumero);
            setTimeout(() => setHighlightNew(null), 3000);
          }
          prevCountRef.current = data.numerosSalidos.length;
          setDrawnNumbers(data.numerosSalidos);
          setCurrentNumber(data.ultimoNumero);
          if (data.figura) setFiguraName(data.figura);
          if (data.patronFigura && Array.isArray(data.patronFigura)) {
            setFiguraPattern(new Set(data.patronFigura));
          }
        }
      },
      () => setIsConnected(false)
    );
    setIsConnected(true);
    return () => unsub();
  }, []);

  const currentLetter = currentNumber ? getLetterForNum(currentNumber) : null;
  const lastFiveNumbers = drawnNumbers.slice(-5).reverse();
  const last3Slots = Array.from({ length: 3 }, (_, i) => lastFiveNumbers[i + 1] ?? null);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 30%, #0369a1 60%, #075985 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px',
      boxSizing: 'border-box', position: 'relative', overflowX: 'hidden', overflowY: 'auto',
    }}>
      {/* Decorative SVG background */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.12 }} viewBox="0 0 1000 600" preserveAspectRatio="none">
        <path d="M0,200 Q250,100 500,200 T1000,200" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <path d="M0,400 Q250,300 500,400 T1000,400" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <circle cx="950" cy="60" r="40" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <circle cx="50" cy="500" r="50" stroke="#fbbf24" strokeWidth="4" fill="none" />
        <path d="M820,0 Q880,120 850,300" stroke="#fbbf24" strokeWidth="4" fill="none" />
      </svg>

      {/* ── TOP BAR (SAME HERO & CONTROLS LAYOUT AS BINGO EN VIVO 2) ────────── */}
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
          background: currentLetter
            ? `radial-gradient(circle at 35% 30%, ${LETTER_COLORS[currentLetter].text}, ${LETTER_COLORS[currentLetter].bg} 50%, ${LETTER_COLORS[currentLetter].dark})`
            : 'radial-gradient(circle at 35% 30%, #e2e8f0, #94a3b8 50%, #475569)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '4px solid #fbbf24',
          boxShadow: currentLetter ? `${LETTER_COLORS[currentLetter].glow}, 0 6px 20px rgba(0,0,0,0.4)` : '0 6px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.1s ease', flexShrink: 0,
          animation: highlightNew && highlightNew === currentNumber ? 'tx-pop 0.5s ease' : 'none',
        }}>
          {currentLetter && (
            <span style={{ fontSize: 'clamp(18px, 1.4vw, 28px)', fontWeight: 900, color: 'black', lineHeight: 1, letterSpacing: 2, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
              {currentLetter}
            </span>
          )}
          <span style={{ fontSize: currentNumber ? 'clamp(34px, 3.6vw, 48px)' : 'clamp(24px, 2.6vw, 32px)', fontWeight: 900, color: 'black', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {currentNumber ?? '?'}
          </span>
        </div>

        {/* Last numbers section */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24', letterSpacing: 1.2, textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            ÚLTIMOS NÚMEROS
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {last3Slots.map((num, i) => {
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
                <div
                  key={i}
                  className="py-[2px] px-[9px] md:py-[10px] md:px-[20px]"
                  style={{
                    borderRadius: 40,
                    background: `radial-gradient(circle at 35% 30%, ${colors.text}, ${colors.bg} 50%, ${colors.dark})`,
                    border: '2px solid rgba(255,255,255,0.4)',
                    minWidth: 32, textAlign: 'center',
                    boxShadow: i === 0 ? `0 0 14px ${colors.bg}` : 'none',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'black', letterSpacing: 1 }}>{letter}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'black', lineHeight: 1 }}>{num}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live badge + Figura button + Viewers + Connection + Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: 20, boxShadow: '0 0 16px rgba(239,68,68,0.6)',
          }}>
            <Radio size={14} style={{ color: 'white' }} />
            <span style={{ fontSize: 12, fontWeight: 900, color: 'white', letterSpacing: 1 }}>EN VIVO</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', animation: 'tx-blink 1s ease infinite' }} />
          </div>

          {/* FIGURA A FORMAR BUTTON */}
          <button
            type="button"
            onClick={() => setShowFiguraModal(true)}
            title="Ver figura a formar en la cartilla"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid #fbbf24',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(251,191,36,0.3)',
            }}
          >
            <div
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 1.5, width: 24, height: 24, padding: 1.5,
                background: 'rgba(15, 23, 42, 0.75)', borderRadius: 4,
                border: '1px solid rgba(251,191,36,0.5)',
              }}
            >
              {Array.from({ length: 25 }, (_, idx) => {
                const col = idx % 5;
                const row = Math.floor(idx / 5);
                const isMarked = figuraPattern.has(`${col}-${row}`);
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
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                FIGURA
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'white', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {figuraName}
              </div>
            </div>
          </button>

          <div
            title="Espectadores conectados en tiempo real"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: 12, color: 'white', fontWeight: 800,
            }}
          >
            <Eye size={14} style={{ color: '#38bdf8' }} />
            <span>{viewerCount}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: isConnected ? '#86efac' : '#fca5a5' }}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden sm:inline">{isConnected ? 'Conectado' : 'Sin conexión'}</span>
          </div>

          <Link
            href="/bingo-juego2"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            ← Volver
          </Link>
        </div>

        {/* Counter */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '6px 14px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>SALIDOS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{drawnNumbers.length}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>de 75</div>
        </div>
      </div>

      {/* ── DESKTOP BOARD (EXACT BINGO EN VIVO 2 BALL & LETTER SIZES) ── */}
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

              {/* 15 Balls for this letter row */}
              <div className="bingo-balls-grid flex-1">
                {Array.from({ length: end - start + 1 }, (_, i) => {
                  const num = start + i;
                  const drawn = drawnSet.has(num);
                  const isLatest = num === currentNumber;
                  const isNew = num === highlightNew;

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
                          : 'radial-gradient(circle at 35% 30%, #f8fafc, #e2e8f0 50%, #cbd5e1)',
                        color: drawn ? 'black' : '#bebfc1ff',
                        boxShadow: isLatest
                          ? `0 0 0 3px white, 0 0 0 5px ${colors.bg}, ${colors.glow}`
                          : drawn
                            ? `0 2px 8px ${colors.bg}80`
                            : '0 2px 6px rgba(0,0,0,0.12)',
                        transform: isLatest ? 'scale(1.1)' : isNew ? 'scale(1.06)' : 'scale(1)',
                        zIndex: isLatest ? 2 : 1,
                        border: isLatest
                          ? '2px solid white'
                          : drawn
                            ? '2px solid rgba(255,255,255,0.3)'
                            : '2px solid rgba(200,210,220,0.6)',
                        animation: isNew ? 'tx-pop 0.5s ease' : 'none',
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
                            animation: 'tx-ripple 1s ease infinite',
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

      {/* ── MOBILE BOARD (EXACT BINGO EN VIVO 2 VERTICAL COLUMNS FOR SCREENS < md) ── */}
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
                  const isLatest = num === currentNumber;
                  const isNew = num === highlightNew;

                  return (
                    <div
                      key={num}
                      style={{
                        aspectRatio: '1',
                        background: drawn
                          ? `radial-gradient(circle at 35% 30%, ${colors.text}, ${colors.bg} 50%, ${colors.dark})`
                          : 'radial-gradient(circle at 35% 30%, #f8fafc, #e2e8f0 50%, #cbd5e1)',
                        color: drawn ? 'black' : '#d4d5d5ff',
                        boxShadow: isLatest
                          ? `0 0 0 3px white, 0 0 0 5px ${colors.bg}, ${colors.glow}`
                          : drawn
                            ? `0 2px 8px ${colors.bg}80`
                            : '0 2px 5px rgba(0,0,0,0.15)',
                        transform: isLatest ? 'scale(1.08)' : isNew ? 'scale(1.05)' : 'scale(1)',
                        animation: isNew ? 'tx-pop 0.5s ease' : 'none',
                      }}
                      className={`w-full max-w-[45px] mx-auto rounded-full flex items-center justify-center font-black text-base sm:text-xl select-none relative transition-all duration-150 border ${
                        isLatest ? 'border-white ring-2 ring-amber-300' : drawn ? 'border-white/30' : 'border-slate-300/60'
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
                            animation: 'tx-ripple 1s ease infinite',
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

      {/* ── PROGRESS BAR ─────────────────────────────────────────────── */}
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
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, position: 'relative', zIndex: 10 }}>
        Transmisión en tiempo real — EVENTOS INA · Los números se actualizan automáticamente
      </div>

      {/* ── SPECTATOR FIGURA MODAL ────────────────────────────────────── */}
      {showFiguraModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFiguraModal(false);
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
            border: '2px solid rgba(255,255,255,0.25)', borderRadius: 20,
            padding: '16px 18px', maxWidth: 440, width: '100%', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            boxSizing: 'border-box',
            overflowX: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={18} style={{ color: '#fbbf24', flexShrink: 0 }} /> Figura a Formar
                </h3>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', marginTop: 2, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {figuraName}
                </div>
              </div>
              <button
                onClick={() => setShowFiguraModal(false)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 5x5 Card Viewer */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              padding: 10,
              borderRadius: 16,
              border: '3px solid #fbbf24',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 5 }}>
                {BINGO_LETTERS.map((letter) => (
                  <div
                    key={letter}
                    style={{
                      background: `linear-gradient(135deg, ${LETTER_COLORS[letter].bg}, ${LETTER_COLORS[letter].dark})`,
                      color: 'white', fontWeight: 900, fontSize: 16, textAlign: 'center',
                      padding: '4px 0', borderRadius: 6,
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                {Array.from({ length: 25 }, (_, idx) => {
                  const col = idx % 5;
                  const row = Math.floor(idx / 5);
                  const isCenter = col === 2 && row === 2;
                  const isMarked = figuraPattern.has(`${col}-${row}`);
                  const sampleNum = CARTILLA_SAMPLE[row][col];
                  const letter = BINGO_LETTERS[col];

                  return (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isMarked ? '2px solid #fef08a' : '1px solid rgba(255,255,255,0.15)',
                        background: isMarked
                          ? 'linear-gradient(135deg, #fef08a, #fbbf24 50%, #d97706)'
                          : 'rgba(255,255,255,0.06)',
                        color: isMarked ? '#1e3a5f' : 'white',
                        fontWeight: 900,
                        boxShadow: isMarked ? '0 0 12px rgba(251,191,36,0.6)' : 'none',
                        position: 'relative',
                        padding: 2,
                      }}
                    >
                      {isCenter ? (
                        <span style={{ fontSize: 10, fontWeight: 900, textAlign: 'center', lineHeight: 1 }}>
                          ★<br />LIBRE
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: 8, opacity: isMarked ? 0.8 : 0.4, fontWeight: 800 }}>
                            {letter}
                          </span>
                          <span style={{ fontSize: 14, lineHeight: 1 }}>{sampleNum}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Completa las casillas doradas en tu cartón para cantar ¡BINGO!
            </div>

            <button
              onClick={() => setShowFiguraModal(false)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none', borderRadius: 10,
                color: '#1e3a5f', fontWeight: 900, fontSize: 14,
                cursor: 'pointer', width: '100%',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes tx-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes tx-ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes tx-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
