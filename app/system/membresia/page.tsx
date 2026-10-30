'use client';

import { AdaptiveDataView } from "@/components/AdaptiveDataView";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";
import { iglesiaRepository, miembroRepository } from "@/core/container";
import { GrupoIglesia, MinisterioIglesia, SedeIglesia } from "@/core/domain/entities/iglesia";
import { getMinisteriosDeMiembro, getNombreCompletoMiembro, Miembro } from "@/core/domain/entities/miembro";
import { useAuth } from "@/lib/authContext";
import { Award, Building2, Calendar, Check, Edit2, Mail, Phone, Plus, Save, Search, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";


export default function MembresiaPage() {

  const { user } = useAuth();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [sedes, setSedes] = useState<SedeIglesia[]>([]);
  const [grupos, setGrupos] = useState<GrupoIglesia[]>([]);
  const [ministerios, setMinisterios] = useState<MinisterioIglesia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Modals visibility
  const [isSaving, setIsSaving] = useState(false);

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

  // Permissions helper
  const canManageMiembros =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarMembresia);

  // Search & filters
  const [searchMiembro, setSearchMiembro] = useState('');
  const [filterSedeId, setFilterSedeId] = useState<string>('todas');
  const [filterGrupoId, setFilterGrupoId] = useState<string>('todos');
  const [filterMinisterioId, setFilterMinisterioId] = useState<string>('todos');

  // Modals visibility
  const [isMiembroModalOpen, setIsMiembroModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" /> Gestión de la Membresía
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Padrón de Membresía
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
            Administra el padrón de miembros de la iglesia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-sky-300 font-black text-base block">
              {miembros.filter((m) => m.activo).length}
            </span>
            <span className="text-white/70 text-[11px]">Miembros activos</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}


      {/* ── SUBTAB 1: MIEMBROS ──────────────────────────────────────── */}

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

        {/* Members Adaptive Table / Cards + Lazy Loading */}
        <AdaptiveDataView
          items={filteredMiembros}
          pageSize={20}
          itemLabel="miembros"
          emptyState={
            <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                No se encontraron miembros con los filtros seleccionados.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Usa el botón &ldquo;Nuevo Miembro&rdquo; para agregar un registro al padrón.
              </p>
            </div>
          }
          renderTable={(visibleMiembros) => (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 whitespace-nowrap">Miembro</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contacto</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Sede</th>
                  {/* <th className="py-3.5 px-4 whitespace-nowrap">Ministerios</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Grupos</th> */}
                  {/* <th className="py-3.5 px-4 whitespace-nowrap">Fechas</th> */}
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
                  {canManageMiembros && (
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleMiembros.map((m) => {
                  const sede = sedeMap.get(m.sedeId);
                  const minsAsignados = getMinisteriosDeMiembro(m, ministerioMap);
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${!m.activo ? 'opacity-60' : ''
                        }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                            {m.nombres.charAt(0).toUpperCase()}
                            {m.apellidos.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {getNombreCompletoMiembro(m)}
                            </div>
                            {m.email && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-sky-500" />
                                <span>{m.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          {/* {m.documento ? (
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                              DNI: {m.documento}
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">Sin documento</div>
                          )} */}
                          {m.telefono ? (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{m.telefono}</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">-</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-sky-500" />
                          <span>{sede?.nombre || 'No asignada'}</span>
                        </span>
                      </td>
                      {/* <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 min-w-[130px]">
                          {minsAsignados.length > 0 ? (
                            minsAsignados.map((min) => (
                              <span
                                key={min.id}
                                className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 whitespace-nowrap"
                              >
                                <span>{min.icono}</span>
                                <span>{min.nombre}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                              {m.ministerio || 'Miembro'}
                            </span>
                          )}
                        </div>
                      </td> */}
                      {/* <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 min-w-[130px]">
                          {m.gruposIds.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Sin grupos</span>
                          ) : (
                            m.gruposIds.map((gid) => {
                              const grp = grupoMap.get(gid);
                              if (!grp) return null;
                              return (
                                <span
                                  key={gid}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                                >
                                  <span>{grp.icono}</span>
                                  <span>{grp.nombre}</span>
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td> */}
                      {/* <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500">
                        {m.fechaNacimiento || m.fechaSellamiento ? (
                          <div className="space-y-0.5">
                            {m.fechaNacimiento && <div>Nac.: {m.fechaNacimiento}</div>}
                            {m.fechaSellamiento && <div>Sell.: {m.fechaSellamiento}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td> */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {m.activo ? (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            Activo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Inactivo
                          </span>
                        )}
                      </td>
                      {canManageMiembros && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleEditMiembro(m)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                              title="Editar miembro"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMiembro(m)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Eliminar miembro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          renderCards={(visibleMiembros) => (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleMiembros.map((m) => {
                const sede = sedeMap.get(m.sedeId);
                const minsAsignados = getMinisteriosDeMiembro(m, ministerioMap);
                return (
                  <div
                    key={m.id}
                    className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm flex flex-col justify-between gap-4 transition ${m.activo
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
        />

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
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${checked
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
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${checked
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


    </div>
  )



}
