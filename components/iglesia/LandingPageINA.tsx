'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  MapPin,
  Clock,
  Users,
  Sparkles,
  LogIn,
  Tv2,
  Heart,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Radio,
  ShieldCheck,
  Building2,
  Navigation,
  ExternalLink,
  Award,
} from 'lucide-react';
import { iglesiaRepository } from '../../core/container';
import {
  DEFAULT_GRUPOS_INA,
  DEFAULT_INFO_IGLESIA,
  DEFAULT_MINISTERIOS_INA,
  DEFAULT_SEDES_INA,
  GrupoIglesia,
  InfoIglesiaConfig,
  MinisterioIglesia,
  SedeIglesia,
} from '../../core/domain/entities/iglesia';
import { initializeFirebase } from '../../lib/firebase';
import { getBingoGameState } from '../../lib/storage';
import { BingoState, ConfiguracionEvento } from '../../lib/types';
import { LoginModal } from '../LoginModal';
import { Modal } from '../Modal';

interface LandingPageINAProps {
  configEvento?: ConfiguracionEvento;
  isAuthenticated?: boolean;
  onEnterDashboard?: () => void;
}

// High-resolution serene church / light spiritual architectural cover image
const HERO_COVER_IMAGE =
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=2000&q=85';

export const LandingPageINA: React.FC<LandingPageINAProps> = ({
  configEvento,
  isAuthenticated = false,
  onEnterDashboard,
}) => {
  const router = useRouter();
  const [info, setInfo] = useState<InfoIglesiaConfig>(DEFAULT_INFO_IGLESIA);
  const [sedes, setSedes] = useState<SedeIglesia[]>(DEFAULT_SEDES_INA);
  const [grupos, setGrupos] = useState<GrupoIglesia[]>(DEFAULT_GRUPOS_INA);
  const [ministerios, setMinisterios] = useState<MinisterioIglesia[]>(DEFAULT_MINISTERIOS_INA);
  const [bingoActivo, setBingoActivo] = useState(false);
  const [bingoState, setBingoState] = useState<BingoState | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleGoToPanel = () => {
    if (onEnterDashboard) {
      onEnterDashboard();
    } else {
      router.push('/membresia');
    }
  };

  // Load church info, sedes, grupos, and ministerios via Hexagonal Repository
  useEffect(() => {
    const loadChurchData = async () => {
      const [infoRes, sedesRes, gruposRes, minRes] = await Promise.all([
        iglesiaRepository.getInfoIglesia(),
        iglesiaRepository.getSedes(),
        iglesiaRepository.getGrupos(),
        iglesiaRepository.getMinisterios(),
      ]);
      setInfo(infoRes);
      setSedes(sedesRes.filter((s) => s.activa));
      setGrupos(gruposRes.filter((g) => g.activo));
      setMinisterios(minRes.filter((m) => m.activo));
    };
    loadChurchData();
  }, []);

  // Real-time check for active Bingo game (Firestore onSnapshot + LocalStorage fallback)
  useEffect(() => {
    const evaluateBingoActive = (state: BingoState | null) => {
      if (!state) {
        setBingoActivo(false);
        return;
      }
      const active =
        Boolean(state.juegoIniciado) ||
        Boolean(state.enSorteo) ||
        (Array.isArray(state.numerosSalidos) && state.numerosSalidos.length > 0);
      setBingoState(state);
      setBingoActivo(active);
    };

    getBingoGameState().then(evaluateBingoActive);

    const { db, isConfigured } = initializeFirebase();
    let unsubFirestore: (() => void) | null = null;

    if (isConfigured && db) {
      try {
        const ref = doc(db, 'bingo_estado', 'partida_actual');
        unsubFirestore = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            evaluateBingoActive(snap.data() as BingoState);
          }
        });
      } catch {
        // Fallback to local polling
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'eventos_ina_bingo_state' && e.newValue) {
        try {
          evaluateBingoActive(JSON.parse(e.newValue) as BingoState);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (unsubFirestore) unsubFirestore();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const grupoBadgeColors: Record<string, string> = {
    indigo: 'text-indigo-700 border-indigo-200 bg-indigo-50',
    emerald: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    amber: 'text-amber-700 border-amber-200 bg-amber-50',
    rose: 'text-rose-700 border-rose-200 bg-rose-50',
    purple: 'text-purple-700 border-purple-200 bg-purple-50',
    cyan: 'text-cyan-700 border-cyan-200 bg-cyan-50',
    blue: 'text-blue-700 border-blue-200 bg-blue-50',
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-amber-200 selection:text-slate-900">
      {/* ── Top Minimalist Navigation Bar (White Spiritual Style) ──────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-sky-700 via-indigo-700 to-amber-600 flex items-center justify-center text-white shadow-md shadow-sky-900/10 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-lg tracking-tight text-slate-900">
                  {info.nombreIglesia}
                </span>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                  {info.sigla}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-normal">
                {info.lema}
              </p>
            </div>
          </div>

          {/* Minimalist Anchor Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-600 tracking-wide">
            <a href="#nosotros" className="hover:text-sky-700 transition">
              Nuestra Fe
            </a>
            <a href="#sedes" className="hover:text-sky-700 transition">
              Sedes y Ubicaciones
            </a>
            <a href="#grupos" className="hover:text-sky-700 transition">
              Comunidad y Grupos
            </a>
            <a href="#ministerios" className="hover:text-sky-700 transition">
              Ministerios
            </a>
            <a href="#horarios" className="hover:text-sky-700 transition">
              Horarios
            </a>
          </nav>

          {/* Actions: Live Bingo Broadcast + Login / Dashboard */}
          <div className="flex items-center gap-2 sm:gap-3">
            {bingoActivo && (
              <a
                href="/transmision"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-105"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden xs:inline">Bingo en Vivo</span>
                <span className="xs:hidden">En Vivo</span>
              </a>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleGoToPanel}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Panel de Gestión</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Live Bingo Alert Banner (Only when a Bingo game is active) ─── */}
      {bingoActivo && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                <strong className="font-bold text-rose-700 mr-1.5">
                  Transmisión en Vivo:
                </strong>
                {configEvento?.nombreEvento || 'Evento Fraternal INA'} —{' '}
                {bingoState?.numerosSalidos?.length || 0} bolillas cantadas
                {bingoState?.figura ? ` · Figura: ${bingoState.figura}` : ''}
              </p>
            </div>
            <a
              href="/transmision"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1 rounded-full bg-rose-600 text-white font-semibold text-xs hover:bg-rose-500 transition flex items-center gap-1 shadow-xs flex-shrink-0"
            >
              <Tv2 className="w-3.5 h-3.5" />
              Ver Transmisión del Bingo
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* ── Initial Hero Cover with Spiritual Background Image ────────── */}
      <section className="relative overflow-hidden min-h-[540px] sm:min-h-[620px] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('${HERO_COVER_IMAGE}')` }}
          aria-hidden="true"
        />
        {/* Spiritual Soft Overlay for Crisp Readability */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-900/55 to-slate-950/75"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center py-16 sm:py-24 space-y-6 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-amber-200 text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Bienvenidos a la {info.nombreIglesia}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white max-w-3xl mx-auto leading-[1.15] drop-shadow-sm">
            {info.lema}
          </h1>

          <p className="text-sm sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
            {info.descripcion}
          </p>

          {/* Bible Verse Highlight */}
          <div className="max-w-xl mx-auto px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <p className="text-xs sm:text-sm italic text-white/95 font-serif leading-relaxed">
              &ldquo;{info.versiculoDestacado}&rdquo;
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300 mt-1.5">
              — {info.citaVersiculo}
            </p>
          </div>

          {/* Primary CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="#sedes"
              className="px-6 py-3.5 rounded-full bg-white text-slate-900 hover:bg-amber-50 font-semibold text-xs sm:text-sm shadow-lg transition flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-sky-700" />
              Sedes, Horarios y Ubicaciones
            </a>

            {bingoActivo && (
              <a
                href="/transmision"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-lg transition flex items-center gap-2"
              >
                <Tv2 className="w-4 h-4" />
                Visualizar Bingo en Vivo
              </a>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleGoToPanel}
                className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 font-semibold text-xs sm:text-sm transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                Entrar al Sistema INA
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 font-semibold text-xs sm:text-sm transition flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                Acceso Miembros y Siervos
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision Section (#nosotros) — Clean White Minimalist ── */}
      <section id="nosotros" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
            Espiritualidad y Comunión
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 mt-2">
            Nuestra Misión y Visión en Cristo
          </h2>
          <div className="w-12 h-0.5 bg-amber-500/60 mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-7 sm:p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:bg-white transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-700 mb-5">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 mb-2.5">
                Nuestra Misión
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {info.mision}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/70 text-[11px] font-semibold text-sky-800">
              Evangelio, Sacramentos y Atención Espiritual
            </div>
          </div>

          <div className="p-7 sm:p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:bg-white transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 mb-5">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 mb-2.5">
                Nuestra Visión
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {info.vision}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/70 text-[11px] font-semibold text-amber-800">
              Amor a Dios y al Prójimo en Comunidad
            </div>
          </div>

          <div className="p-7 sm:p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between hover:shadow-md hover:bg-white transition-all">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-700 mb-5">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 mb-2.5">
                Fraternidad y Servicio
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Acompañamos con amor pastoral a niños, jóvenes, familias y adultos mayores mediante Oficios Divinos, coros, enseñanza bíblica y encuentros fraternales.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200/70 text-[11px] font-semibold text-indigo-800">
              Una Iglesia de Puertas Abiertas
            </div>
          </div>
        </div>
      </section>

      {/* ── Sedes y Ubicaciones Section (#sedes) ──────────────────────── */}
      <section id="sedes" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
                Nuestras Congregaciones
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 mt-1">
                Sedes, Horarios y Ubicaciones
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                Encuentra la comunidad más cercana, consulta sus horarios y abre su ubicación exacta en el mapa.
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 self-start sm:self-auto shadow-2xs">
              {sedes.length} {sedes.length === 1 ? 'Comunidad Activa' : 'Comunidades Activas'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sedes.map((sede) => {
              const mapUrl =
                sede.ubicacionUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${sede.direccion} ${sede.ciudad}`
                )}`;
              return (
                <div
                  key={sede.id}
                  className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between hover:border-sky-300 hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-700 flex-shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                        {sede.ciudad}
                      </span>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-slate-900">
                      {sede.nombre}
                    </h3>

                    <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-800 block">
                            {sede.direccion}
                          </span>
                          {sede.referencia && (
                            <span className="text-[11px] text-slate-500 italic block mt-0.5">
                              {sede.referencia}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span>
                          Responsable: <strong className="text-slate-900">{sede.responsable}</strong>
                        </span>
                      </div>
                      {sede.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{sede.telefono}</span>
                        </div>
                      )}
                    </div>

                    {/* Horarios de la sede */}
                    {sede.horarios && sede.horarios.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Horarios de Oficios y Reuniones
                        </p>
                        <ul className="space-y-1.5">
                          {sede.horarios.map((h, i) => (
                            <li
                              key={i}
                              className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"
                            >
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Direct Map Location CTA */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-sky-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ver Ubicación en Google Maps</span>
                      <ExternalLink className="w-3 h-3 opacity-75" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Grupos Section (#grupos) ──────────────────────────────────── */}
      <section id="grupos" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">
            Vida Comunitaria
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 mt-1">
            Grupos y Pastorales de la Iglesia
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Espacios de comunión y crecimiento espiritual para cada etapa de la vida, por sede y a nivel general.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupos.map((grupo) => {
            const badgeStyle = grupoBadgeColors[grupo.color] || grupoBadgeColors.indigo;
            return (
              <div
                key={grupo.id}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${badgeStyle}`}
                    >
                      {grupo.icono}
                    </div>
                    {grupo.edadRango && (
                      <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                        {grupo.edadRango}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-serif font-bold text-slate-900">
                    {grupo.nombre}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {grupo.descripcion}
                  </p>
                </div>

                {grupo.horarioGeneral && (
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>{grupo.horarioGeneral}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Ministerios Section (#ministerios) ────────────────────────── */}
      <section
        id="ministerios"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-100"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-700">
              Atención Espiritual y Servicio
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Ministerios y Encargos en la Comunidad
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Siervos, maestros y colaboradores dedicados con amor al cuidado espiritual de cada alma.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ministerios.map((min) => (
              <div
                key={min.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-2xl">{min.icono}</span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                      {min.categoria}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">
                    {min.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {min.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Horarios Generales Section (#horarios) ────────────────────── */}
      <section id="horarios" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Agenda Semanal
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-1">
                  Horarios Generales de Oficios Divinos
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  La paz de Cristo te espera junto a tu familia en todas nuestras comunidades.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-4 py-2.5 rounded-full self-start md:self-auto">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Entrada libre y fraternal</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Domingos
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  Oficio Divino Dominical
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  09:30 hs / 10:00 hs en todas las sedes
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Domingos
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  Escuela Dominical
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  09:00 hs — Niños y Pre-escuela
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Miércoles / Jueves
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  Oficio de Semana
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  19:30 hs / 20:00 hs según comunidad
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Sábados
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  Juventud y Coros
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  17:00 hs a 19:30 hs por sede y general
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Minimalist Footer ─────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                {info.nombreIglesia} ({info.sigla})
              </p>
              <p className="text-[11px] text-slate-500">{info.direccionPrincipal}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[11px] text-slate-600">
            {info.telefonoContacto && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                {info.telefonoContacto}
              </span>
            )}
            {info.emailContacto && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-600" />
                {info.emailContacto}
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* ── Login Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        title="Iniciar Sesión — Plataforma INA"
        size="md"
      >
        <LoginModal
          embeddedInModal
          onSuccess={() => {
            setIsLoginOpen(false);
            handleGoToPanel();
          }}
        />
      </Modal>
    </div>
  );
};
