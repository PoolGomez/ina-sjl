'use client';

import { Modal } from "@/components/Modal";
import { AdaptiveDataView } from "@/components/AdaptiveDataView";
import { iglesiaRepository } from "@/core/container";
import { GrupoIglesia } from "@/core/domain/entities/iglesia";
import { useAuth } from "@/lib/authContext";
import { Check, Clock, Edit2, Layers, Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";


export default function GruposPage() {

  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoIglesia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);



  // Permissions helper
  const canManageGrupos =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarGrupos ?? user.permisos?.puedeGestionarMembresia);

  // Grupo Form State
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [gNombre, setGNombre] = useState('');
  const [gDescripcion, setGDescripcion] = useState('');
  const [gIcono, setGIcono] = useState('🔥');
  const [gColor, setGColor] = useState<GrupoIglesia['color']>('indigo');
  const [gHorarioGeneral, setGHorarioGeneral] = useState('');
  const [gEdadRango, setGEdadRango] = useState('');
  const [gActivo, setGActivo] = useState(true);

  // Search & filters
  const [searchGrupo, setSearchGrupo] = useState('');

  // Modals visibility
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtered lists
  const qG = searchGrupo.trim().toLowerCase();
  const filteredGrupos = qG
    ? grupos.filter(
      (g) =>
        g.nombre.toLowerCase().includes(qG) ||
        g.descripcion.toLowerCase().includes(qG)
    )
    : grupos;

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadAll = async () => {
    const [gList] = await Promise.all([
      iglesiaRepository.getGrupos()
    ]);
    setGrupos(gList);
  };

  useEffect(() => {
    loadAll();
  }, []);

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



  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" /> Gestión de Grupos
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Grupos
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
            Administra los grupos de la iglesia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">


          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-emerald-300 font-black text-base block">
              {grupos.filter((g) => g.activo).length}
            </span>
            <span className="text-white/70 text-[11px]">Grupos</span>
          </div>

        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}


      {/* ── SUBTAB 3: GRUPOS ────────────────────────────────────────── */}

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

        <AdaptiveDataView
          items={filteredGrupos}
          pageSize={20}
          itemLabel="grupos"
          emptyState={
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">No se encontraron grupos registrados.</p>
            </div>
          }
          renderTable={(visibleGrupos) => (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Grupo</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Rango de Edad</th>
                  <th className="py-3.5 px-4">Descripción</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Horario General</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                  {canManageGrupos && (
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {visibleGrupos.map((g) => (
                  <tr
                    key={g.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      !g.activo ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{g.icono}</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {g.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {g.edadRango ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {g.edadRango}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Todas las edades</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-md">
                      {g.descripcion}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {g.horarioGeneral ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {g.horarioGeneral}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          g.activo
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {g.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canManageGrupos && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
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
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderCards={(visibleGrupos) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleGrupos.map((g) => (
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
          )}
        />

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



    </div>
  )
}
