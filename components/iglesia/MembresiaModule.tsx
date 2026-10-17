'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building2,
  Layers,
  Check,
  X,
  Save,
  UserCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Award,
  Navigation,
} from 'lucide-react';
import { iglesiaRepository, miembroRepository } from '../../core/container';
import {
  GrupoIglesia,
  MinisterioIglesia,
  SedeIglesia,
} from '../../core/domain/entities/iglesia';
import {
  getMinisteriosDeMiembro,
  getNombreCompletoMiembro,
  Miembro,
} from '../../core/domain/entities/miembro';
import { useAuth } from '../../lib/authContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { Modal } from '../Modal';

export type IglesiaCrudSection = 'miembros' | 'sedes' | 'grupos' | 'ministerios';

interface MembresiaModuleProps {
  initialSection?: IglesiaCrudSection;
}

export const MembresiaModule: React.FC<MembresiaModuleProps> = ({
  initialSection = 'miembros',
}) => {
  const { user } = useAuth();
  const [innerTab, setInnerTab] = useState<IglesiaCrudSection>(initialSection);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [sedes, setSedes] = useState<SedeIglesia[]>([]);
  const [grupos, setGrupos] = useState<GrupoIglesia[]>([]);
  const [ministerios, setMinisterios] = useState<MinisterioIglesia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setInnerTab(initialSection);
  }, [initialSection]);

  // Permissions helper
  const canManageMiembros =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarMembresia);
  const canManageSedes =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarSedes ?? user.permisos?.puedeGestionarMembresia);
  const canManageGrupos =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarGrupos ?? user.permisos?.puedeGestionarMembresia);
  const canManageMinisterios =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarMinisterios ?? user.permisos?.puedeGestionarMembresia);

  // Search & filters
  const [searchMiembro, setSearchMiembro] = useState('');
  const [filterSedeId, setFilterSedeId] = useState<string>('todas');
  const [filterGrupoId, setFilterGrupoId] = useState<string>('todos');
  const [filterMinisterioId, setFilterMinisterioId] = useState<string>('todos');
  const [searchSede, setSearchSede] = useState('');
  const [searchGrupo, setSearchGrupo] = useState('');
  const [searchMinisterio, setSearchMinisterio] = useState('');

  // Modals visibility
  const [isMiembroModalOpen, setIsMiembroModalOpen] = useState(false);
  const [isSedeModalOpen, setIsSedeModalOpen] = useState(false);
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [isMinisterioModalOpen, setIsMinisterioModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Miembro Form State
  const [editingMiembroId, setEditingMiembroId] = useState<string | null>(null);
  const [mNombres, setMNombres] = useState('');
  const [mApellidos, setMApellidos] = useState('');
  const [mDocumento, setMDocumento] = useState('');
  const [mFechaNacimiento, setMFechaNacimiento] = useState('');
  const [mFechaBautismo, setMFechaBautismo] = useState('');
  const [mFechaSellamiento, setMFechaSellamiento] = useState('');
  const [mTelefono, setMTelefono] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mDireccion, setMDireccion] = useState('');
  const [mMinisteriosIds, setMMinisteriosIds] = useState<string[]>(['min-miembro']);
  const [mSedeId, setMSedeId] = useState('');
  const [mGruposIds, setMGruposIds] = useState<string[]>([]);
  const [mNotas, setMNotas] = useState('');
  const [mActivo, setMActivo] = useState(true);

  // Sede Form State
  const [editingSedeId, setEditingSedeId] = useState<string | null>(null);
  const [sNombre, setSNombre] = useState('');
  const [sDireccion, setSDireccion] = useState('');
  const [sCiudad, setSCiudad] = useState('');
  const [sResponsable, setSResponsable] = useState('');
  const [sTelefono, setSTelefono] = useState('');
  const [sUbicacionUrl, setSUbicacionUrl] = useState('');
  const [sReferencia, setSReferencia] = useState('');
  const [sHorariosText, setSHorariosText] = useState('');
  const [sActiva, setSActiva] = useState(true);

  // Grupo Form State
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [gNombre, setGNombre] = useState('');
  const [gDescripcion, setGDescripcion] = useState('');
  const [gIcono, setGIcono] = useState('🔥');
  const [gColor, setGColor] = useState<GrupoIglesia['color']>('indigo');
  const [gHorarioGeneral, setGHorarioGeneral] = useState('');
  const [gEdadRango, setGEdadRango] = useState('');
  const [gActivo, setGActivo] = useState(true);

  // Ministerio Form State
  const [editingMinisterioId, setEditingMinisterioId] = useState<string | null>(null);
  const [minNombre, setMinNombre] = useState('');
  const [minDescripcion, setMinDescripcion] = useState('');
  const [minCategoria, setMinCategoria] = useState<MinisterioIglesia['categoria']>('Ministerial');
  const [minIcono, setMinIcono] = useState('🕊️');
  const [minColor, setMinColor] = useState<MinisterioIglesia['color']>('indigo');
  const [minOrden, setMinOrden] = useState<number>(1);
  const [minActivo, setMinActivo] = useState(true);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadAll = async () => {
    const [mList, sList, gList, minList] = await Promise.all([
      miembroRepository.getAll(),
      iglesiaRepository.getSedes(),
      iglesiaRepository.getGrupos(),
      iglesiaRepository.getMinisterios(),
    ]);
    setMiembros(mList);
    setSedes(sList);
    setGrupos(gList);
    setMinisterios(minList);
    if (!mSedeId && sList.length > 0) {
      setMSedeId(sList[0].id);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Lookups
  const sedeMap = new Map(sedes.map((s) => [s.id, s]));
  const grupoMap = new Map(grupos.map((g) => [g.id, g]));
  const ministerioMap = new Map(ministerios.map((m) => [m.id, m]));

  // ── Miembro Handlers ─────────────────────────────────────────────
  const resetMiembroForm = () => {
    const defaultMinId = ministerios[0]?.id || 'min-miembro';
    setEditingMiembroId(null);
    setMNombres('');
    setMApellidos('');
    setMDocumento('');
    setMFechaNacimiento('');
    setMFechaBautismo('');
    setMFechaSellamiento('');
    setMTelefono('');
    setMEmail('');
    setMDireccion('');
    setMMinisteriosIds([defaultMinId]);
    setMSedeId(sedes[0]?.id || 'ayacucho');
    setMGruposIds([]);
    setMNotas('');
    setMActivo(true);
  };

  const handleOpenCreateMiembro = () => {
    resetMiembroForm();
    setIsMiembroModalOpen(true);
  };

  const handleEditMiembro = (m: Miembro) => {
    setEditingMiembroId(m.id);
    setMNombres(m.nombres);
    setMApellidos(m.apellidos);
    setMDocumento(m.documento || '');
    setMFechaNacimiento(m.fechaNacimiento || '');
    setMFechaBautismo(m.fechaBautismo || '');
    setMFechaSellamiento(m.fechaSellamiento || '');
    setMTelefono(m.telefono || '');
    setMEmail(m.email || '');
    setMDireccion(m.direccion || '');
    const resolvedMins = getMinisteriosDeMiembro(m, ministerioMap).map((x) => x.id);
    setMMinisteriosIds(
      resolvedMins.length > 0
        ? resolvedMins
        : Array.isArray(m.ministeriosIds) && m.ministeriosIds.length > 0
        ? m.ministeriosIds
        : [ministerios[0]?.id || 'min-miembro']
    );
    setMSedeId(m.sedeId);
    setMGruposIds(m.gruposIds || []);
    setMNotas(m.notas || '');
    setMActivo(m.activo);
    setIsMiembroModalOpen(true);
  };

  const toggleMinisterioInMiembro = (ministerioId: string) => {
    setMMinisteriosIds((prev) => {
      if (prev.includes(ministerioId)) {
        const next = prev.filter((id) => id !== ministerioId);
        return next;
      }
      return [...prev, ministerioId];
    });
  };

  const toggleGrupoInMiembro = (grupoId: string) => {
    setMGruposIds((prev) =>
      prev.includes(grupoId) ? prev.filter((id) => id !== grupoId) : [...prev, grupoId]
    );
  };

  const handleSaveMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mNombres.trim() || !mApellidos.trim() || !mSedeId) return;

    const finalMinisteriosIds =
      mMinisteriosIds.length > 0 ? mMinisteriosIds : [ministerios[0]?.id || 'min-miembro'];
    const ministeriosNombres = finalMinisteriosIds
      .map((id) => ministerioMap.get(id)?.nombre)
      .filter(Boolean)
      .join(', ');

    setIsSaving(true);
    try {
      const entity: Miembro = {
        id: editingMiembroId || `m-ina-${Date.now()}`,
        nombres: mNombres.trim(),
        apellidos: mApellidos.trim(),
        ...(mDocumento.trim() ? { documento: mDocumento.trim() } : {}),
        ...(mFechaNacimiento ? { fechaNacimiento: mFechaNacimiento } : {}),
        ...(mFechaBautismo ? { fechaBautismo: mFechaBautismo } : {}),
        ...(mFechaSellamiento ? { fechaSellamiento: mFechaSellamiento } : {}),
        ...(mTelefono.trim() ? { telefono: mTelefono.trim() } : {}),
        ...(mEmail.trim() ? { email: mEmail.trim() } : {}),
        ...(mDireccion.trim() ? { direccion: mDireccion.trim() } : {}),
        ministerio: ministeriosNombres || 'Miembro',
        ministeriosIds: finalMinisteriosIds,
        sedeId: mSedeId,
        gruposIds: mGruposIds,
        ...(mNotas.trim() ? { notas: mNotas.trim() } : {}),
        activo: mActivo,
        fechaRegistro: new Date().toISOString(),
      };
      await miembroRepository.save(entity);
      await loadAll();
      setIsMiembroModalOpen(false);
      resetMiembroForm();
      showNotice(
        editingMiembroId
          ? '¡Datos del miembro actualizados!'
          : '¡Miembro registrado exitosamente!'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMiembro = async (m: Miembro) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar a ${getNombreCompletoMiembro(m)} del padrón de membresía?`
      )
    ) {
      return;
    }
    await miembroRepository.delete(m.id);
    await loadAll();
    showNotice('Miembro eliminado del registro.');
  };

  // ── Sede Handlers ────────────────────────────────────────────────
  const resetSedeForm = () => {
    setEditingSedeId(null);
    setSNombre('');
    setSDireccion('');
    setSCiudad('');
    setSResponsable('');
    setSTelefono('');
    setSUbicacionUrl('');
    setSReferencia('');
    setSHorariosText(
      'Domingos 10:00 hs — Oficio Divino Dominical\nMiércoles 20:00 hs — Oficio Divino Semanal'
    );
    setSActiva(true);
  };

  const handleEditSede = (s: SedeIglesia) => {
    setEditingSedeId(s.id);
    setSNombre(s.nombre);
    setSDireccion(s.direccion);
    setSCiudad(s.ciudad);
    setSResponsable(s.responsable);
    setSTelefono(s.telefono || '');
    setSUbicacionUrl(s.ubicacionUrl || '');
    setSReferencia(s.referencia || '');
    setSHorariosText(s.horarios.join('\n'));
    setSActiva(s.activa);
    setIsSedeModalOpen(true);
  };

  const handleSaveSede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sNombre.trim()) return;
    setIsSaving(true);
    try {
      const defaultMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${sDireccion.trim()} ${sCiudad.trim()}`
      )}`;
      const entity: SedeIglesia = {
        id: editingSedeId || `sede-${Date.now()}`,
        nombre: sNombre.trim(),
        direccion: sDireccion.trim(),
        ciudad: sCiudad.trim() || 'Sede Local',
        responsable: sResponsable.trim(),
        ...(sTelefono.trim() ? { telefono: sTelefono.trim() } : {}),
        ubicacionUrl: sUbicacionUrl.trim() || defaultMapUrl,
        ...(sReferencia.trim() ? { referencia: sReferencia.trim() } : {}),
        horarios: sHorariosText
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean),
        activa: sActiva,
      };
      await iglesiaRepository.saveSede(entity);
      await loadAll();
      setIsSedeModalOpen(false);
      resetSedeForm();
      showNotice('¡Sede y su ubicación guardadas correctamente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSede = async (s: SedeIglesia) => {
    if (!window.confirm(`¿Eliminar la sede "${s.nombre}"?`)) return;
    await iglesiaRepository.deleteSede(s.id);
    await loadAll();
    showNotice('Sede eliminada.');
  };

  // ── Grupo Handlers ───────────────────────────────────────────────
  const resetGrupoForm = () => {
    setEditingGrupoId(null);
    setGNombre('');
    setGDescripcion('');
    setGIcono('🔥');
    setGColor('indigo');
    setGHorarioGeneral('');
    setGEdadRango('');
    setGActivo(true);
  };

  const handleEditGrupo = (g: GrupoIglesia) => {
    setEditingGrupoId(g.id);
    setGNombre(g.nombre);
    setGDescripcion(g.descripcion);
    setGIcono(g.icono);
    setGColor(g.color);
    setGHorarioGeneral(g.horarioGeneral || '');
    setGEdadRango(g.edadRango || '');
    setGActivo(g.activo);
    setIsGrupoModalOpen(true);
  };

  const handleSaveGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gNombre.trim()) return;
    setIsSaving(true);
    try {
      const entity: GrupoIglesia = {
        id: editingGrupoId || `grupo-${Date.now()}`,
        nombre: gNombre.trim(),
        descripcion: gDescripcion.trim(),
        icono: gIcono.trim() || '✨',
        color: gColor,
        ...(gHorarioGeneral.trim() ? { horarioGeneral: gHorarioGeneral.trim() } : {}),
        ...(gEdadRango.trim() ? { edadRango: gEdadRango.trim() } : {}),
        activo: gActivo,
      };
      await iglesiaRepository.saveGrupo(entity);
      await loadAll();
      setIsGrupoModalOpen(false);
      resetGrupoForm();
      showNotice('¡Grupo guardado correctamente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGrupo = async (g: GrupoIglesia) => {
    if (!window.confirm(`¿Eliminar el grupo "${g.nombre}"?`)) return;
    await iglesiaRepository.deleteGrupo(g.id);
    await loadAll();
    showNotice('Grupo eliminado.');
  };

  // ── Ministerio Handlers ──────────────────────────────────────────
  const resetMinisterioForm = () => {
    setEditingMinisterioId(null);
    setMinNombre('');
    setMinDescripcion('');
    setMinCategoria('Ministerial');
    setMinIcono('🕊️');
    setMinColor('indigo');
    setMinOrden(ministerios.length + 1);
    setMinActivo(true);
  };

  const handleEditMinisterio = (min: MinisterioIglesia) => {
    setEditingMinisterioId(min.id);
    setMinNombre(min.nombre);
    setMinDescripcion(min.descripcion);
    setMinCategoria(min.categoria);
    setMinIcono(min.icono);
    setMinColor(min.color);
    setMinOrden(min.orden || 1);
    setMinActivo(min.activo);
    setIsMinisterioModalOpen(true);
  };

  const handleSaveMinisterio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minNombre.trim()) return;
    setIsSaving(true);
    try {
      const entity: MinisterioIglesia = {
        id: editingMinisterioId || `min-${Date.now()}`,
        nombre: minNombre.trim(),
        descripcion: minDescripcion.trim(),
        categoria: minCategoria,
        icono: minIcono.trim() || '🕊️',
        color: minColor,
        orden: Number(minOrden) || 1,
        activo: minActivo,
      };
      await iglesiaRepository.saveMinisterio(entity);
      await loadAll();
      setIsMinisterioModalOpen(false);
      resetMinisterioForm();
      showNotice('¡Ministerio guardado correctamente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMinisterio = async (min: MinisterioIglesia) => {
    if (!window.confirm(`¿Eliminar el ministerio "${min.nombre}"?`)) return;
    await iglesiaRepository.deleteMinisterio(min.id);
    await loadAll();
    showNotice('Ministerio eliminado.');
  };

  // Filtered lists
  const qM = searchMiembro.trim().toLowerCase();
  const filteredMiembros = miembros.filter((m) => {
    if (filterSedeId !== 'todas' && m.sedeId !== filterSedeId) return false;
    if (filterGrupoId !== 'todos' && !m.gruposIds.includes(filterGrupoId)) return false;
    if (filterMinisterioId !== 'todos') {
      const minsIds = m.ministeriosIds || [];
      if (!minsIds.includes(filterMinisterioId)) return false;
    }
    if (!qM) return true;
    const full = getNombreCompletoMiembro(m).toLowerCase();
    const sName = (sedeMap.get(m.sedeId)?.nombre || '').toLowerCase();
    const minsText = getMinisteriosDeMiembro(m, ministerioMap)
      .map((x) => x.nombre.toLowerCase())
      .join(' ');
    return (
      full.includes(qM) ||
      (m.documento || '').toLowerCase().includes(qM) ||
      (m.telefono || '').toLowerCase().includes(qM) ||
      (m.ministerio || '').toLowerCase().includes(qM) ||
      minsText.includes(qM) ||
      sName.includes(qM)
    );
  });

  const qS = searchSede.trim().toLowerCase();
  const filteredSedes = qS
    ? sedes.filter(
        (s) =>
          s.nombre.toLowerCase().includes(qS) ||
          s.direccion.toLowerCase().includes(qS) ||
          s.ciudad.toLowerCase().includes(qS) ||
          s.responsable.toLowerCase().includes(qS) ||
          (s.referencia || '').toLowerCase().includes(qS)
      )
    : sedes;

  const qG = searchGrupo.trim().toLowerCase();
  const filteredGrupos = qG
    ? grupos.filter(
        (g) =>
          g.nombre.toLowerCase().includes(qG) ||
          g.descripcion.toLowerCase().includes(qG)
      )
    : grupos;

  const qMin = searchMinisterio.trim().toLowerCase();
  const filteredMinisterios = qMin
    ? ministerios.filter(
        (m) =>
          m.nombre.toLowerCase().includes(qMin) ||
          m.descripcion.toLowerCase().includes(qMin) ||
          m.categoria.toLowerCase().includes(qMin)
      )
    : ministerios;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" /> Gestión Eclesiástica INA
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Membresía, Sedes, Grupos y Ministerios
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
            Administra el padrón de miembros con selección múltiple de ministerios y grupos, las sedes con su ubicación en el mapa y los ministerios de la iglesia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-sky-300 font-black text-base block">
              {miembros.filter((m) => m.activo).length}
            </span>
            <span className="text-white/70 text-[11px]">Miembros activos</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-amber-300 font-black text-base block">
              {sedes.filter((s) => s.activa).length}
            </span>
            <span className="text-white/70 text-[11px]">Sedes activas</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-emerald-300 font-black text-base block">
              {grupos.filter((g) => g.activo).length}
            </span>
            <span className="text-white/70 text-[11px]">Grupos</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-purple-300 font-black text-base block">
              {ministerios.filter((m) => m.activo).length}
            </span>
            <span className="text-white/70 text-[11px]">Ministerios</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {canManageMiembros && (
          <button
            onClick={() => setInnerTab('miembros')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              innerTab === 'miembros'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Padrón de Miembros ({miembros.length})
          </button>
        )}

        {canManageSedes && (
          <button
            onClick={() => setInnerTab('sedes')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              innerTab === 'sedes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> Sedes y Ubicaciones ({sedes.length})
          </button>
        )}

        {canManageGrupos && (
          <button
            onClick={() => setInnerTab('grupos')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              innerTab === 'grupos'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Grupos y Pastorales ({grupos.length})
          </button>
        )}

        {canManageMinisterios && (
          <button
            onClick={() => setInnerTab('ministerios')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              innerTab === 'ministerios'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" /> Ministerios ({ministerios.length})
          </button>
        )}
      </div>

      {/* ── SUBTAB 1: MIEMBROS ──────────────────────────────────────── */}
      {innerTab === 'miembros' && (
        <div className="space-y-5">
          {/* Action & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchMiembro}
                  onChange={(e) => setSearchMiembro(e.target.value)}
                  placeholder="Buscar por nombre, DNI, teléfono, ministerio..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                {searchMiembro && (
                  <button
                    type="button"
                    onClick={() => setSearchMiembro('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by Sede */}
              <select
                value={filterSedeId}
                onChange={(e) => setFilterSedeId(e.target.value)}
                className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="todas">Todas las Sedes</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>

              {/* Filter by Ministerio */}
              <select
                value={filterMinisterioId}
                onChange={(e) => setFilterMinisterioId(e.target.value)}
                className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="todos">Todos los Ministerios</option>
                {ministerios.map((min) => (
                  <option key={min.id} value={min.id}>
                    {min.icono} {min.nombre}
                  </option>
                ))}
              </select>

              {/* Filter by Grupo */}
              <select
                value={filterGrupoId}
                onChange={(e) => setFilterGrupoId(e.target.value)}
                className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="todos">Todos los Grupos</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icono} {g.nombre}
                  </option>
                ))}
              </select>
            </div>

            {canManageMiembros && (
              <button
                type="button"
                onClick={handleOpenCreateMiembro}
                className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 text-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Nuevo Miembro
              </button>
            )}
          </div>

          {/* Members Grid */}
          {filteredMiembros.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                No se encontraron miembros con los filtros seleccionados.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Usa el botón &ldquo;Nuevo Miembro&rdquo; para agregar un registro al padrón.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMiembros.map((m) => {
                const sede = sedeMap.get(m.sedeId);
                const minsAsignados = getMinisteriosDeMiembro(m, ministerioMap);
                return (
                  <div
                    key={m.id}
                    className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm flex flex-col justify-between gap-4 transition ${
                      m.activo
                        ? 'border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
                        : 'border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md">
                            {m.nombres.charAt(0).toUpperCase()}
                            {m.apellidos.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                              {getNombreCompletoMiembro(m)}
                            </h4>
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              {minsAsignados.length > 0 ? (
                                minsAsignados.map((min) => (
                                  <span
                                    key={min.id}
                                    className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                                  >
                                    <span>{min.icono}</span>
                                    <span>{min.nombre}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                  {m.ministerio || 'Miembro'}
                                </span>
                              )}
                              {!m.activo && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                  Inactivo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {canManageMiembros && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditMiembro(m)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                              title="Editar miembro"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMiembro(m)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Eliminar miembro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sede badge */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <Building2 className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                        <span className="truncate font-bold">
                          {sede?.nombre || 'Sede no asignada'}
                        </span>
                      </div>

                      {/* Contact & Sacraments */}
                      <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {m.documento && (
                          <p>
                            DNI / Doc.:{' '}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {m.documento}
                            </strong>
                          </p>
                        )}
                        {m.telefono && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{m.telefono}</span>
                          </p>
                        )}
                        {m.email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-sky-500" />
                            <span className="truncate">{m.email}</span>
                          </p>
                        )}
                        {m.fechaNacimiento && (
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            <span>Nac.: {m.fechaNacimiento}</span>
                            {m.fechaSellamiento && <span>· Sell.: {m.fechaSellamiento}</span>}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Grupos a los que pertenece */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                        Grupos ({m.gruposIds.length})
                      </span>
                      {m.gruposIds.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Sin grupos asignados
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {m.gruposIds.map((gid) => {
                            const grp = grupoMap.get(gid);
                            if (!grp) return null;
                            return (
                              <span
                                key={gid}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                              >
                                <span>{grp.icono}</span>
                                <span>{grp.nombre}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal: Create / Edit Miembro */}
          <Modal
            isOpen={isMiembroModalOpen}
            onClose={() => {
              setIsMiembroModalOpen(false);
              resetMiembroForm();
            }}
            title={editingMiembroId ? 'Editar Ficha de Miembro' : 'Registrar Nuevo Miembro INA'}
            size="lg"
          >
            <form onSubmit={handleSaveMiembro} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={mNombres}
                    onChange={(e) => setMNombres(e.target.value)}
                    placeholder="Ej. Juan Carlos"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={mApellidos}
                    onChange={(e) => setMApellidos(e.target.value)}
                    placeholder="Ej. Pérez Gómez"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DNI / Documento
                  </label>
                  <input
                    type="text"
                    value={mDocumento}
                    onChange={(e) => setMDocumento(e.target.value)}
                    placeholder="Ej. 45891230"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sede a la que pertenece *
                  </label>
                  <select
                    required
                    value={mSedeId}
                    onChange={(e) => setMSedeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sky-600 dark:text-sky-400"
                  >
                    {sedes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección Múltiple de Ministerios */}
              <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/70 dark:border-purple-800/60">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    Ministerios / Encargos Espirituales (Multiselección) *
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300">
                    {mMinisteriosIds.length} seleccionados
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Puedes seleccionar uno o varios ministerios para el miembro (ej. Pastor + Director Musical).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {ministerios
                    .filter((min) => min.activo)
                    .map((min) => {
                      const checked = mMinisteriosIds.includes(min.id);
                      return (
                        <label
                          key={min.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                            checked
                              ? 'bg-purple-600/10 border-purple-500 text-purple-900 dark:text-purple-200 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMinisterioInMiembro(min.id)}
                            className="w-4 h-4 rounded text-purple-600"
                          />
                          <span className="text-base">{min.icono}</span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate leading-tight">{min.nombre}</span>
                            <span className="block text-[9px] text-slate-400 font-normal">
                              {min.categoria}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Fechas Importantes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={mFechaNacimiento}
                    onChange={(e) => setMFechaNacimiento(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Bautismo
                  </label>
                  <input
                    type="date"
                    value={mFechaBautismo}
                    onChange={(e) => setMFechaBautismo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Santo Sellamiento
                  </label>
                  <input
                    type="date"
                    value={mFechaSellamiento}
                    onChange={(e) => setMFechaSellamiento(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / Celular
                  </label>
                  <input
                    type="text"
                    value={mTelefono}
                    onChange={(e) => setMTelefono(e.target.value)}
                    placeholder="Ej. 987 654 321"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={mEmail}
                    onChange={(e) => setMEmail(e.target.value)}
                    placeholder="miembro@correo.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dirección de Domicilio
                  </label>
                  <input
                    type="text"
                    value={mDireccion}
                    onChange={(e) => setMDireccion(e.target.value)}
                    placeholder="Calle / Av. / Urb."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Selección múltiple de Grupos */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/60">
                <label className="block font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  Grupos a los que pertenece (puedes marcar uno o varios)
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Esto permitirá convocarlo automáticamente en reuniones del grupo por sede o generales.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grupos.map((g) => {
                    const checked = mGruposIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGrupoInMiembro(g.id)}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                        <span className="text-base">{g.icono}</span>
                        <span className="truncate">{g.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas u Observaciones Pastorales (opcional)
                </label>
                <textarea
                  rows={2}
                  value={mNotas}
                  onChange={(e) => setMNotas(e.target.value)}
                  placeholder="Información adicional relevante..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={mActivo}
                    onChange={(e) => setMActivo(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600"
                  />
                  <span>Miembro activo en la comunidad</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMiembroModalOpen(false);
                    resetMiembroForm();
                  }}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" color="text-white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingMiembroId ? 'Guardar Cambios' : 'Registrar Miembro'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ── SUBTAB 2: SEDES Y UBICACIONES ───────────────────────────── */}
      {innerTab === 'sedes' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Sedes, Comunidades y Ubicaciones ({filteredSedes.length})
              </h3>
              <p className="text-xs text-slate-500">
                Las sedes activas y su ubicación en Google Maps se muestran en la Landing Page pública.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchSede}
                  onChange={(e) => setSearchSede(e.target.value)}
                  placeholder="Buscar sede, dirección..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              {canManageSedes && (
                <button
                  type="button"
                  onClick={() => {
                    resetSedeForm();
                    setIsSedeModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Sede
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSedes.map((s) => {
              const mapLink =
                s.ubicacionUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${s.direccion} ${s.ciudad}`
                )}`;
              return (
                <div
                  key={s.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {s.ciudad}
                        </span>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base mt-1">
                          {s.nombre}
                        </h4>
                      </div>
                      {canManageSedes && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSede(s)}
                            className="p-2 text-slate-400 hover:text-amber-600 rounded-lg transition"
                            title="Editar sede"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSede(s)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Eliminar sede"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 flex items-start gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{s.direccion}</span>
                    </p>
                    {s.referencia && (
                      <p className="text-[11px] text-slate-400 mt-1 pl-5 italic">
                        Ref.: {s.referencia}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      Resp.:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {s.responsable}
                      </strong>
                    </p>

                    <div className="mt-3">
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-xs font-bold hover:bg-sky-100 transition"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Ver Ubicación en Google Maps
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                      Horarios
                    </span>
                    {s.horarios.map((h, i) => (
                      <p key={i} className="text-xs text-slate-600 dark:text-slate-400">
                        • {h}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Modal
            isOpen={isSedeModalOpen}
            onClose={() => {
              setIsSedeModalOpen(false);
              resetSedeForm();
            }}
            title={editingSedeId ? 'Editar Sede y Ubicación' : 'Registrar Nueva Sede'}
            size="md"
          >
            <form onSubmit={handleSaveSede} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Nombre de la Sede *</label>
                <input
                  type="text"
                  required
                  value={sNombre}
                  onChange={(e) => setSNombre(e.target.value)}
                  placeholder="Ej. Comunidad de Ayacucho"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Distrito / Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={sCiudad}
                    onChange={(e) => setSCiudad(e.target.value)}
                    placeholder="Ej. Ayacucho"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={sTelefono}
                    onChange={(e) => setSTelefono(e.target.value)}
                    placeholder="+51 999 888 777"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Dirección Exacta *</label>
                <input
                  type="text"
                  required
                  value={sDireccion}
                  onChange={(e) => setSDireccion(e.target.value)}
                  placeholder="Av. Flores 450, Centro"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  Referencia de Ubicación (cómo llegar)
                </label>
                <input
                  type="text"
                  value={sReferencia}
                  onChange={(e) => setSReferencia(e.target.value)}
                  placeholder="Ej. A 2 cuadras de la Plaza Principal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  Enlace de Ubicación (Google Maps / Waze URL)
                </label>
                <input
                  type="url"
                  value={sUbicacionUrl}
                  onChange={(e) => setSUbicacionUrl(e.target.value)}
                  placeholder="https://maps.google.com/... (se autogenera si lo dejas vacío)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Pastor / Responsable *</label>
                <input
                  type="text"
                  required
                  value={sResponsable}
                  onChange={(e) => setSResponsable(e.target.value)}
                  placeholder="Ej. Pastor Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Horarios (uno por línea)</label>
                <textarea
                  rows={3}
                  value={sHorariosText}
                  onChange={(e) => setSHorariosText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={sActiva}
                  onChange={(e) => setSActiva(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span>Sede activa y visible en la Landing Page</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSedeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg"
                >
                  Guardar Sede
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ── SUBTAB 3: GRUPOS ────────────────────────────────────────── */}
      {innerTab === 'grupos' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Grupos y Pastorales ({filteredGrupos.length})
              </h3>
              <p className="text-xs text-slate-500">
                Grupos en los que pueden participar los miembros tanto por sede como de forma general.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchGrupo}
                  onChange={(e) => setSearchGrupo(e.target.value)}
                  placeholder="Buscar grupo..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              {canManageGrupos && (
                <button
                  type="button"
                  onClick={() => {
                    resetGrupoForm();
                    setIsGrupoModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Grupo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrupos.map((g) => (
              <div
                key={g.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{g.icono}</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {g.nombre}
                        </h4>
                        {g.edadRango && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {g.edadRango}
                          </span>
                        )}
                      </div>
                    </div>
                    {canManageGrupos && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditGrupo(g)}
                          className="p-2 text-slate-400 hover:text-amber-600 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGrupo(g)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{g.descripcion}</p>
                </div>
                {g.horarioGeneral && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{g.horarioGeneral}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Modal
            isOpen={isGrupoModalOpen}
            onClose={() => {
              setIsGrupoModalOpen(false);
              resetGrupoForm();
            }}
            title={editingGrupoId ? 'Editar Grupo' : 'Nuevo Grupo de la Iglesia'}
            size="md"
          >
            <form onSubmit={handleSaveGrupo} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold mb-1">Nombre del Grupo *</label>
                  <input
                    type="text"
                    required
                    value={gNombre}
                    onChange={(e) => setGNombre(e.target.value)}
                    placeholder="Ej. Juventud (Jóvenes)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ícono / Emoji *</label>
                  <input
                    type="text"
                    required
                    value={gIcono}
                    onChange={(e) => setGIcono(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Descripción *</label>
                <textarea
                  rows={2}
                  required
                  value={gDescripcion}
                  onChange={(e) => setGDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Horario Habitual</label>
                  <input
                    type="text"
                    value={gHorarioGeneral}
                    onChange={(e) => setGHorarioGeneral(e.target.value)}
                    placeholder="Ej. Sábados 18:00 hs"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Rango de Edad / Público</label>
                  <input
                    type="text"
                    value={gEdadRango}
                    onChange={(e) => setGEdadRango(e.target.value)}
                    placeholder="Ej. 14 a 35 años"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrupoModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-black rounded-xl shadow-lg"
                >
                  Guardar Grupo
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ── SUBTAB 4: GESTIÓN DE MINISTERIOS ────────────────────────── */}
      {innerTab === 'ministerios' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Catálogo de Ministerios y Encargos ({filteredMinisterios.length})
              </h3>
              <p className="text-xs text-slate-500">
                Gestiona los ministerios espirituales, docentes y musicales disponibles para asignar en forma múltiple a cada miembro.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchMinisterio}
                  onChange={(e) => setSearchMinisterio(e.target.value)}
                  placeholder="Buscar ministerio, categoría..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                {searchMinisterio && (
                  <button
                    type="button"
                    onClick={() => setSearchMinisterio('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {canManageMinisterios && (
                <button
                  type="button"
                  onClick={() => {
                    resetMinisterioForm();
                    setIsMinisterioModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Ministerio
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMinisterios.map((min) => {
              const assignedCount = miembros.filter((m) =>
                (m.ministeriosIds || []).includes(min.id)
              ).length;
              return (
                <div
                  key={min.id}
                  className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm flex flex-col justify-between gap-3 ${
                    min.activo
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                          {min.icono}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {min.categoria}
                          </span>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">
                            {min.nombre}
                          </h4>
                        </div>
                      </div>
                      {canManageMinisterios && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditMinisterio(min)}
                            className="p-2 text-slate-400 hover:text-amber-600 rounded-lg transition"
                            title="Editar ministerio"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMinisterio(min)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Eliminar ministerio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                      {min.descripcion}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {assignedCount} {assignedCount === 1 ? 'miembro asignado' : 'miembros asignados'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Orden #{min.orden}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Modal
            isOpen={isMinisterioModalOpen}
            onClose={() => {
              setIsMinisterioModalOpen(false);
              resetMinisterioForm();
            }}
            title={editingMinisterioId ? 'Editar Ministerio' : 'Registrar Nuevo Ministerio'}
            size="md"
          >
            <form onSubmit={handleSaveMinisterio} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold mb-1">Nombre del Ministerio *</label>
                  <input
                    type="text"
                    required
                    value={minNombre}
                    onChange={(e) => setMinNombre(e.target.value)}
                    placeholder="Ej. Diácono, Pastor, Director de Coro..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ícono / Emoji *</label>
                  <input
                    type="text"
                    required
                    value={minIcono}
                    onChange={(e) => setMinIcono(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Categoría *</label>
                  <select
                    value={minCategoria}
                    onChange={(e) =>
                      setMinCategoria(e.target.value as MinisterioIglesia['categoria'])
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="Ministerial">Ministerial</option>
                    <option value="Enseñanza y Música">Enseñanza y Música</option>
                    <option value="Servicio y Comunidad">Servicio y Comunidad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Orden de Aparición</label>
                  <input
                    type="number"
                    min="1"
                    value={minOrden}
                    onChange={(e) => setMinOrden(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Descripción / Función *</label>
                <textarea
                  rows={2}
                  required
                  value={minDescripcion}
                  onChange={(e) => setMinDescripcion(e.target.value)}
                  placeholder="Describe brevemente el servicio espiritual o comunitario..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={minActivo}
                  onChange={(e) => setMinActivo(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <span>Ministerio activo para asignación a miembros</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMinisterioModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-black rounded-xl shadow-lg"
                >
                  Guardar Ministerio
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};
