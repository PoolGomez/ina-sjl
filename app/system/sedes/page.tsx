'use client';

import { Building2, Check, Edit2, ExternalLink, MapPin, Navigation, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SedeIglesia } from '@/core/domain/entities/iglesia';
import { useAuth } from '@/lib/authContext';
import { iglesiaRepository } from '@/core/container';
import { Modal } from '@/components/Modal';
import { AdaptiveDataView } from '@/components/AdaptiveDataView';

export default function SedesPage() {

  const { user } = useAuth();
  const [sedes, setSedes] = useState<SedeIglesia[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadAll = async () => {
    const [
      sList
    ] = await Promise.all([
      iglesiaRepository.getSedes()
    ]);
    setSedes(sList);
    if (!mSedeId && sList.length > 0) {
      setMSedeId(sList[0].id);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);


  // Permissions helper
  const canManageSedes =
    !user || user.isSuperAdmin || user.role === 'admin' || Boolean(user.permisos?.puedeGestionarSedes ?? user.permisos?.puedeGestionarMembresia);

  const [mSedeId, setMSedeId] = useState('');

  // Modals visibility
  const [isSedeModalOpen, setIsSedeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Search & filters
  const [searchSede, setSearchSede] = useState('');

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



  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" /> Gestión de las sedes
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Sedes
          </h1>
          <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-2xl">
            Administra las sedes con su ubicación en el mapa.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">

          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15">
            <span className="text-amber-300 font-black text-base block">
              {sedes.filter((s) => s.activa).length}
            </span>
            <span className="text-white/70 text-[11px]">Sedes activas</span>
          </div>


        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}




      {/* ── SUBTAB 2: SEDES Y UBICACIONES ───────────────────────────── */}

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

        <AdaptiveDataView
          items={filteredSedes}
          pageSize={20}
          itemLabel="sedes"
          emptyState={
            <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                No se encontraron sedes con el filtro actual.
              </p>
            </div>
          }
          renderTable={(visibleSedes) => (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 whitespace-nowrap">Sede / Comunidad</th>
                  {/* <th className="py-3.5 px-4 whitespace-nowrap">Ciudad</th> */}
                  {/* <th className="py-3.5 px-4 whitespace-nowrap">Dirección y Referencia</th> */}
                  <th className="py-3.5 px-4 whitespace-nowrap">Responsable</th>
                  {/* <th className="py-3.5 px-4 whitespace-nowrap">Horarios</th> */}
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Ubicación</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
                  {canManageSedes && (
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleSedes.map((s) => {
                  const mapLink =
                    s.ubicacionUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${s.direccion} ${s.ciudad}`
                    )}`;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 whitespace-nowrap font-extrabold text-slate-900 dark:text-white">
                        {s.nombre}
                      </td>
                      {/* <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {s.ciudad}
                        </span>
                      </td> */}
                      {/* <td className="py-3 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{s.direccion}</span>
                        </div>
                        {s.referencia && (
                          <div className="text-[11px] text-slate-400 italic pl-5">
                            Ref.: {s.referencia}
                          </div>
                        )}
                      </td> */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {s.responsable}
                        </div>
                        {s.telefono && (
                          <div className="text-[11px] text-slate-400">{s.telefono}</div>
                        )}
                      </td>
                      {/* <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                          {s.horarios.map((h, i) => (
                            <div key={i} className="whitespace-nowrap">• {h}</div>
                          ))}
                        </div>
                      </td> */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-[11px] font-bold hover:bg-sky-100 transition"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Maps</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {s.activa ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            Activa
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Inactiva
                          </span>
                        )}
                      </td>
                      {canManageSedes && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleEditSede(s)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg transition"
                              title="Editar sede"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSede(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Eliminar sede"
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
          renderCards={(visibleSedes) => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleSedes.map((s) => {
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
          )}
        />

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





    </div>

  )
}
