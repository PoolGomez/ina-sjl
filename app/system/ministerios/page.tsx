'use client';

import { useAuth } from '@/lib/authContext';
import { Check, Edit2, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { AdaptiveDataView } from '@/components/AdaptiveDataView';
import { MinisterioIglesia } from '@/core/domain/entities/iglesia';
import { useEffect, useState } from 'react';
import { iglesiaRepository } from '@/core/container';

export default function MinisteriosPage() {

  const { user } = useAuth();
  const [ministerios, setMinisterios] = useState<MinisterioIglesia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);


  // Permissions helper
  const canManageMinisterios =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarMinisterios ?? user.permisos?.puedeGestionarMembresia);

  // Search & filters
  const [searchMinisterio, setSearchMinisterio] = useState('');

  // Modals visibility
  const [isMinisterioModalOpen, setIsMinisterioModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


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
    const [minList] = await Promise.all([
      iglesiaRepository.getMinisterios(),
    ]);
    setMinisterios(minList);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Lookups
  // const ministerioMap = new Map(ministerios.map((m) => [m.id, m]));



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
            <Users className="w-3.5 h-3.5" /> Gestión de Ministerios y Encargos
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ministerios
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
            Administra los ministerios de la iglesia.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">

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


      {/* ── SUBTAB 4: GESTIÓN DE MINISTERIOS ────────────────────────── */}

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

        <AdaptiveDataView
          items={filteredMinisterios}
          pageSize={20}
          itemLabel="ministerios"
          emptyState={
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">No se encontraron ministerios registrados.</p>
            </div>
          }
          renderTable={(visibleMinisterios) => (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Orden</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Ministerio / Encargo</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Categoría</th>
                  {/* <th className="py-3.5 px-4">Descripción</th> */}
                  <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                  {canManageMinisterios && (
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {visibleMinisterios.map((min) => (
                  <tr
                    key={min.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${!min.activo ? 'opacity-60' : ''
                      }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400 whitespace-nowrap">
                      #{min.orden}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg flex-shrink-0">
                          {min.icono}
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {min.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {min.categoria}
                      </span>
                    </td>
                    {/* <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-md">
                      {min.descripcion}
                    </td> */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${min.activo
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                      >
                        {min.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {canManageMinisterios && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
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
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderCards={(visibleMinisterios) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleMinisterios.map((min) => (
                <div
                  key={min.id}
                  className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm flex flex-col justify-between gap-3 ${min.activo
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
                    <span className="text-[10px] font-bold text-slate-400">
                      Orden #{min.orden}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        />

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

    </div>

  )
}
