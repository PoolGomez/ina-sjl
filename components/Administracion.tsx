'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  UtensilsCrossed,
  Ticket,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  TrendingUp,
  Download,
  Printer,
  Eye,
  Scissors,
  Receipt,
  Users,
  CreditCard,
  ShieldCheck,
  UserPlus,
  Lock,
  Unlock,
  DollarSign,
  BarChart3,
  Wallet,
  ToggleLeft,
  ToggleRight,
  X,
  Search,
} from 'lucide-react';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import {
  ViandaProducto,
  ConfiguracionEvento,
  TarjetaBingoPrecioConfig,
  ConfiguracionImpresion,
  DEFAULT_IMPRESION_CONFIG,
  TicketVianda,
  TarjetaBingoVenta,
  formatPrecio,
  AppUserProfile,
  UserRole,
  UserPermissions,
  DEFAULT_PERMISOS_BY_ROLE,
  ModalidadPagoConfig,
  ModalidadPago,
} from '../lib/types';
import {
  getViandasProductos,
  saveViandaProducto,
  deleteViandaProducto,
  saveConfiguracionEvento,
  getTicketsViandas,
  getTarjetasBingoVentas,
  getUserProfiles,
  deleteUserProfile,
  updateUserProfilePermissions,
  getModalidadesPago,
  saveModalidadPago,
  deleteModalidadPago,
  toggleModalidadPagoActiva,
} from '../lib/storage';
import { useAuth } from '../lib/authContext';

interface AdministracionProps {
  config: ConfiguracionEvento;
  onConfigUpdated: (newConfig: ConfiguracionEvento) => void;
  activeSubTab?: SubTab;
  onSubTabChange?: (sub: SubTab) => void;
}

type SubTab = 'viandas' | 'bingo' | 'evento' | 'impresion' | 'metricas' | 'pagos' | 'usuarios';

const MODALIDADES_ACTIVAS: ModalidadPago[] = ['efectivo', 'transferencia', 'tarjeta', 'mercadopago'];

const MODALIDAD_CONFIG: Record<ModalidadPago, { label: string; icon: string; gradient: string; textClass: string; bgClass: string; borderClass: string }> = {
  efectivo: {
    label: 'Efectivo',
    icon: '💵',
    gradient: 'from-emerald-500 to-teal-600',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  transferencia: {
    label: 'Transferencia',
    icon: '🏦',
    gradient: 'from-blue-500 to-indigo-600',
    textClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  tarjeta: {
    label: 'Tarjeta',
    icon: '💳',
    gradient: 'from-purple-500 to-violet-600',
    textClass: 'text-purple-700 dark:text-purple-300',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-800',
  },
  mercadopago: {
    label: 'Mercado Pago',
    icon: '📲',
    gradient: 'from-cyan-500 to-blue-600',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderClass: 'border-cyan-200 dark:border-cyan-800',
  },
  pendiente: {
    label: 'Pendiente',
    icon: '⏳',
    gradient: 'from-amber-500 to-orange-600',
    textClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; description: string }> = {
  superadmin: { label: 'Super Admin', color: 'rose', description: 'Acceso total + gestión de usuarios' },
  admin: { label: 'Administrador', color: 'amber', description: 'Configuración y métricas completas' },
  cajero: { label: 'Cajero', color: 'emerald', description: 'Venta de viandas y bingo' },
  visor: { label: 'Visor', color: 'blue', description: 'Consulta y verificación solamente' },
};

const VALID_SUBTABS: SubTab[] = ['viandas', 'bingo', 'evento', 'impresion', 'pagos', 'metricas', 'usuarios'];

export const Administracion: React.FC<AdministracionProps> = ({
  config,
  onConfigUpdated,
  activeSubTab,
  onSubTabChange,
}) => {
  const { user, signUp } = useAuth();
  const isSuperAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.role === 'admin' ||
      user?.permisos?.puedeAdministrar
  );

  const [subTab, setSubTab] = useState<SubTab>(activeSubTab || 'viandas');

  useEffect(() => {
    if (activeSubTab && VALID_SUBTABS.includes(activeSubTab)) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Search states for Administration modules
  const [searchVianda, setSearchVianda] = useState('');
  const [searchModalidad, setSearchModalidad] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');

  // Modal visibility states
  const [isViandaModalOpen, setIsViandaModalOpen] = useState(false);
  const [isModalidadModalOpen, setIsModalidadModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { },
  });

  // Confirmation modal component
  const ConfirmationModal = () => (
    <Modal
      isOpen={confirmationModal.isOpen}
      onClose={() => setConfirmationModal({ isOpen: false, message: '', onConfirm: () => { } })}
      title="Confirmar Acción"
      size="sm"
    >
      <div className="text-center space-y-4">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          {confirmationModal.message}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setConfirmationModal({ isOpen: false, message: '', onConfirm: () => { } })}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              confirmationModal.onConfirm();
              setConfirmationModal({ isOpen: false, message: '', onConfirm: () => { } });
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/20"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );

  // Loading states to prevent duplicates
  const [isSavingVianda, setIsSavingVianda] = useState(false);
  const [isSavingModalidad, setIsSavingModalidad] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Viandas CRUD state
  const [viandas, setViandas] = useState<ViandaProducto[]>([]);
  const [editingViandaId, setEditingViandaId] = useState<string | null>(null);
  const [vNombre, setVNombre] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vCategoria, setVCategoria] = useState('Platos Principales');
  const [vTieneDosPrecios, setVTieneDosPrecios] = useState(false);
  const [vPrecio1, setVPrecio1] = useState<number | string>(3000.0);
  const [vEtiqueta1, setVEtiqueta1] = useState('General');
  const [vPrecio2, setVPrecio2] = useState<number | string>(2500.0);
  const [vEtiqueta2, setVEtiqueta2] = useState('Socio');
  const [vActivo, setVActivo] = useState(true);

  // Bingo Price Config state
  const [bingoPrecios, setBingoPrecios] = useState<TarjetaBingoPrecioConfig>(config.bingoPrecios);
  const [bPrecio1Input, setBPrecio1Input] = useState<string>(String(config.bingoPrecios.precio1));
  const [bPrecio2Input, setBPrecio2Input] = useState<string>(String(config.bingoPrecios.precio2));

  // Event Config state
  const [eventConfig, setEventConfig] = useState<ConfiguracionEvento>(config);
  const [impresionConfig, setImpresionConfig] = useState<ConfiguracionImpresion>(
    config.impresion || DEFAULT_IMPRESION_CONFIG
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Metrics state
  const [ticketsViandas, setTicketsViandas] = useState<TicketVianda[]>([]);
  const [tarjetasBingo, setTarjetasBingo] = useState<TarjetaBingoVenta[]>([]);

  // Users state
  const [userProfiles, setUserProfiles] = useState<AppUserProfile[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cajero');
  const [newUserPermisos, setNewUserPermisos] = useState<UserPermissions>(DEFAULT_PERMISOS_BY_ROLE['cajero']);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState<UserRole>('cajero');
  const [editUserPermisos, setEditUserPermisos] = useState<UserPermissions>(DEFAULT_PERMISOS_BY_ROLE['cajero']);
  const [userLoading, setUserLoading] = useState(false);

  // Payment methods state
  const [modalidades, setModalidades] = useState<ModalidadPagoConfig[]>([]);
  const [editingModalidadId, setEditingModalidadId] = useState<string | null>(null);
  const [mpNombre, setMpNombre] = useState('');
  const [mpDescripcion, setMpDescripcion] = useState('');
  const [mpIcono, setMpIcono] = useState('💳');
  const [mpColor, setMpColor] = useState('slate');
  const [mpGradient, setMpGradient] = useState('from-slate-500 to-slate-600');
  const [mpOrden, setMpOrden] = useState<number | string>(10);
  const [mpActivo, setMpActivo] = useState(true);

  const loadData = async () => {
    const [vList, tks, tbs, profiles, mods] = await Promise.all([
      getViandasProductos(),
      getTicketsViandas(),
      getTarjetasBingoVentas(),
      getUserProfiles(),
      getModalidadesPago(),
    ]);
    setViandas(vList);
    setTicketsViandas(tks);
    setTarjetasBingo(tbs);
    setUserProfiles(profiles);
    setModalidades(mods);
  };

  // Payment methods form helpers
  const COLOR_OPTIONS = [
    { color: 'emerald', gradient: 'from-emerald-500 to-teal-600', label: 'Verde', preview: '#10b981' },
    { color: 'blue', gradient: 'from-blue-500 to-indigo-600', label: 'Azul', preview: '#3b82f6' },
    { color: 'purple', gradient: 'from-purple-500 to-violet-600', label: 'Violeta', preview: '#8b5cf6' },
    { color: 'cyan', gradient: 'from-cyan-500 to-blue-600', label: 'Cian', preview: '#06b6d4' },
    { color: 'amber', gradient: 'from-amber-500 to-orange-600', label: 'Ámbar', preview: '#f59e0b' },
    { color: 'rose', gradient: 'from-rose-500 to-pink-600', label: 'Rosa', preview: '#f43f5e' },
    { color: 'slate', gradient: 'from-slate-500 to-slate-600', label: 'Gris', preview: '#64748b' },
    { color: 'indigo', gradient: 'from-indigo-500 to-purple-600', label: 'Índigo', preview: '#6366f1' },
  ];

  const resetModalidadForm = () => {
    setEditingModalidadId(null);
    setMpNombre('');
    setMpDescripcion('');
    setMpIcono('💳');
    setMpColor('slate');
    setMpGradient('from-slate-500 to-slate-600');
    setMpOrden(modalidades.length + 1);
    setMpActivo(true);
  };

  const handleEditModalidad = (m: ModalidadPagoConfig) => {
    setEditingModalidadId(m.id);
    setMpNombre(m.nombre);
    setMpDescripcion(m.descripcion || '');
    setMpIcono(m.icono);
    setMpColor(m.color);
    setMpGradient(m.gradient);
    setMpOrden(m.orden);
    setMpActivo(m.activo);
    setIsModalidadModalOpen(true);
  };

  const handleSaveModalidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpNombre.trim()) return;

    setIsSavingModalidad(true);
    try {
      // const id = editingModalidadId || mpNombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
      const id = editingModalidadId || mpNombre.toLowerCase();
      const modalidad: ModalidadPagoConfig = {
        id,
        nombre: mpNombre.trim(),
        ...(mpDescripcion.trim() ? { descripcion: mpDescripcion.trim() } : {}),
        icono: mpIcono.trim() || '💳',
        activo: mpActivo,
        orden: parseInt(String(mpOrden)) || modalidades.length + 1,
        gradient: mpGradient,
        color: mpColor,
      };
      await saveModalidadPago(modalidad);
      await loadData();
      resetModalidadForm();
      setIsModalidadModalOpen(false);
      showNotice('¡Modalidad de pago guardada exitosamente!');
    } finally {
      setIsSavingModalidad(false);
    }
  };

  const handleDeleteModalidad = async (id: string, nombre: string) => {
    setConfirmationModal({
      isOpen: true,
      message: `¿Seguro que deseas eliminar la modalidad "${nombre}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        await deleteModalidadPago(id);
        await loadData();
        showNotice(`Modalidad "${nombre}" eliminada.`);
        setConfirmationModal({ isOpen: false, message: '', onConfirm: () => { } });
      },
    });
  };

  const handleToggleModalidad = async (id: string, activo: boolean) => {
    await toggleModalidadPagoActiva(id, activo);
    await loadData();
    showNotice(activo ? '✅ Modalidad activada' : '⛔ Modalidad desactivada');
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setBingoPrecios(config.bingoPrecios);
    setBPrecio1Input(String(config.bingoPrecios.precio1));
    setBPrecio2Input(String(config.bingoPrecios.precio2));
    setEventConfig(config);
    setImpresionConfig(config.impresion || DEFAULT_IMPRESION_CONFIG);
  }, [config]);

  // Auto-sync permissions when role changes
  const handleNewRoleChange = (role: UserRole) => {
    setNewUserRole(role);
    setNewUserPermisos(DEFAULT_PERMISOS_BY_ROLE[role]);
  };

  const handleEditRoleChange = (role: UserRole) => {
    setEditUserRole(role);
    setEditUserPermisos(DEFAULT_PERMISOS_BY_ROLE[role]);
  };

  const resetViandaForm = () => {
    setEditingViandaId(null);
    setVNombre('');
    setVDesc('');
    setVCategoria('Platos Principales');
    setVTieneDosPrecios(false);
    setVPrecio1(3000.0);
    setVEtiqueta1('General');
    setVPrecio2(2500.0);
    setVEtiqueta2('Socio');
    setVActivo(true);
  };

  const handleEditVianda = (item: ViandaProducto) => {
    setEditingViandaId(item.id);
    setVNombre(item.nombre);
    setVDesc(item.descripcion || '');
    setVCategoria(item.categoria || 'Platos Principales');
    setVTieneDosPrecios(item.tieneDosPrecios);
    setVPrecio1(item.precio1);
    setVEtiqueta1(item.etiquetaPrecio1 || 'General');
    setVPrecio2(item.precio2 !== undefined ? item.precio2 : 2500.0);
    setVEtiqueta2(item.etiquetaPrecio2 || 'Socio');
    setVActivo(item.activo);
    setIsViandaModalOpen(true);
  };

  const handleSaveVianda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNombre.trim()) return;

    setIsSavingVianda(true);
    try {
      const item: ViandaProducto = {
        id: editingViandaId || 'v-prod-' + Date.now(),
        nombre: vNombre.trim(),
        descripcion: vDesc.trim(),
        categoria: vCategoria,
        tieneDosPrecios: vTieneDosPrecios,
        precio1: parseFloat(String(vPrecio1)) || 0,
        etiquetaPrecio1: vEtiqueta1.trim() || 'General',
        ...(vTieneDosPrecios
          ? {
            precio2: parseFloat(String(vPrecio2)) || 0,
            etiquetaPrecio2: vEtiqueta2.trim() || 'Socio',
          }
          : {}),
        activo: vActivo,
      };

      await saveViandaProducto(item);
      await loadData();
      resetViandaForm();
      setIsViandaModalOpen(false);
      showNotice('¡Vianda guardada con éxito!');
    } finally {
      setIsSavingVianda(false);
    }
  };

  const handleDeleteVianda = async (id: string) => {
    const vianda = viandas.find(v => v.id === id);
    setConfirmationModal({
      isOpen: true,
      message: `¿Seguro que deseas eliminar la vianda "${vianda?.nombre || ''}" del menú?`,
      onConfirm: async () => {
        await deleteViandaProducto(id);
        await loadData();
        showNotice('Vianda eliminada del catálogo.');
        setConfirmationModal({ isOpen: false, message: '', onConfirm: () => { } });
      },
    });
  };

  const handleSaveBingoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConfiguracionEvento = {
      ...eventConfig,
      bingoPrecios: {
        ...bingoPrecios,
        precio1: parseFloat(bPrecio1Input) || 0,
        precio2: parseFloat(bPrecio2Input) || 0,
      },
      impresion: impresionConfig,
    };
    setEventConfig(updated);
    await saveConfiguracionEvento(updated);
    onConfigUpdated(updated);
    showNotice('¡Precios de tarjetas de bingo actualizados con éxito!');
  };

  const handleSaveEventConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConfiguracionEvento = {
      ...eventConfig,
      impresion: impresionConfig,
    };
    await saveConfiguracionEvento(updated);
    onConfigUpdated(updated);
    showNotice('¡Configuración general del evento actualizada!');
  };

  const handleSaveImpresionConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConfiguracionEvento = {
      ...eventConfig,
      impresion: impresionConfig,
    };
    setEventConfig(updated);
    await saveConfiguracionEvento(updated);
    onConfigUpdated(updated);
    showNotice('¡Opciones de impresión y ahorro de papel guardadas!');
  };

  const aplicarPresetAhorro = () => {
    setImpresionConfig({
      mostrarLogo: false,
      mostrarEncabezado: false,
      mostrarSubtitulo: false,
      mostrarLugar: false,
      mostrarFechaHora: true,
      mostrarTelefono: false,
      mostrarModalidadPago: true,
      mostrarEstadoPago: true,
      mostrarCodigoBarras: false,
      mostrarMensajePie: false,
      modoAhorroPapel: true,
    });
  };

  const aplicarPresetCompleto = () => {
    setImpresionConfig({
      mostrarLogo: true,
      mostrarEncabezado: true,
      mostrarSubtitulo: true,
      mostrarLugar: true,
      mostrarFechaHora: true,
      mostrarTelefono: true,
      mostrarModalidadPago: true,
      mostrarEstadoPago: true,
      mostrarCodigoBarras: true,
      mostrarMensajePie: true,
      modoAhorroPapel: false,
    });
  };

  const showNotice = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // ---- User management ----
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setIsSavingUser(true);
    try {
      const result = await signUp(newUserEmail, newUserPassword, newUserName || newUserEmail.split('@')[0], newUserRole);
      if (result.success) {
        await loadData();
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserName('');
        setNewUserRole('cajero');
        setNewUserPermisos(DEFAULT_PERMISOS_BY_ROLE['cajero']);
        setIsUserModalOpen(false);
        showNotice('¡Usuario registrado y perfil creado exitosamente!');
      } else {
        showNotice('Error: ' + (result.error || 'No se pudo registrar el usuario'));
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleStartEditUser = (profile: AppUserProfile) => {
    setEditingUserId(profile.uid);
    setEditUserRole(profile.role);
    setEditUserPermisos({
      ...DEFAULT_PERMISOS_BY_ROLE[profile.role],
      ...(profile.permisos || {}),
    });
    setIsUserEditModalOpen(true);
  };

  const handleSaveUserPermisos = async (uid: string) => {
    setIsSavingUser(true);
    try {
      await updateUserProfilePermissions(uid, editUserRole, editUserPermisos);
      await loadData();
      setEditingUserId(null);
      setIsUserEditModalOpen(false);
      showNotice('¡Permisos del usuario actualizados!');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!isSuperAdmin) return;
    setConfirmationModal({
      isOpen: true,
      message: `¿Seguro que deseas eliminar el perfil de ${email}? Esta acción no elimina la cuenta de Firebase Auth.`,
      onConfirm: async () => {
        await deleteUserProfile(uid);
        await loadData();
        showNotice('Perfil de usuario eliminado.');
      },
    });
  };

  // ---- Financial calculations by payment method ----
  const totalViandasPagadas = ticketsViandas
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.total, 0);

  const totalBingoPagado = tarjetasBingo
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const totalViandasPendiente = ticketsViandas
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.total, 0);

  const totalBingoPendiente = tarjetasBingo
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const totalRecaudadoGlobal = totalViandasPagadas + totalBingoPagado;

  // Breakdown by modalidad de pago (uses dynamic list)
  const metricasPorModalidad = (modalidades.length > 0 ? modalidades : MODALIDADES_ACTIVAS.map(id => ({ id, nombre: MODALIDAD_CONFIG[id]?.label || id, icono: MODALIDAD_CONFIG[id]?.icon || '💳', gradient: MODALIDAD_CONFIG[id]?.gradient || 'from-slate-500 to-slate-600', color: 'slate', activo: true, orden: 0 }))).map((mod) => {
    const modId = typeof mod === 'string' ? mod : mod.id;
    const modLabel = typeof mod === 'string' ? (MODALIDAD_CONFIG[mod]?.label || mod) : mod.nombre;
    const modIcon = typeof mod === 'string' ? (MODALIDAD_CONFIG[mod]?.icon || '💳') : mod.icono;
    const modGradient = typeof mod === 'string' ? (MODALIDAD_CONFIG[mod]?.gradient || 'from-slate-500 to-slate-600') : mod.gradient;
    const viandasMod = ticketsViandas
      .filter((t) => t.modalidadPago === modId)
      .reduce((acc, t) => acc + t.total, 0);
    const bingoMod = tarjetasBingo
      .filter((t) => t.modalidadPago === modId)
      .reduce((acc, t) => acc + t.precioCobrado, 0);
    const ticketCount = ticketsViandas.filter((t) => t.modalidadPago === modId).length;
    const bingoCount = tarjetasBingo.filter((t) => t.modalidadPago === modId).length;
    return {
      modalidad: modId,
      label: modLabel,
      icon: modIcon,
      gradient: modGradient,
      viandas: viandasMod,
      bingo: bingoMod,
      total: viandasMod + bingoMod,
      ticketCount,
      bingoCount,
    };
  });

  const grandTotalPorModalidad = metricasPorModalidad.reduce((s, m) => s + m.total, 0);

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      config: eventConfig,
      viandasProductos: viandas,
      ticketsViandas,
      tarjetasBingo,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-eventos-ina-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const permKey: (keyof UserPermissions)[] = [
    'puedeGestionarMembresia',
    'puedeGestionarSedes',
    'puedeGestionarGrupos',
    'puedeGestionarMinisterios',
    'puedeRegistrarAsistencia',
    'puedeVerMetricasIglesia',
    'puedeVenderViandas',
    'puedeVenderBingo',
    'puedeVerSorteos',
    'puedeVerificacion',
    'puedeAdministrar',
    'puedeVerMetricas',
  ];
  const permLabels: Record<keyof UserPermissions, string> = {
    puedeGestionarMembresia: 'Gestionar Membresía (Miembros)',
    puedeGestionarSedes: 'Gestionar Sedes y Ubicaciones',
    puedeGestionarGrupos: 'Gestionar Grupos de la Iglesia',
    puedeGestionarMinisterios: 'Gestionar Ministerios',
    puedeRegistrarAsistencia: 'Registrar Asistencia',
    puedeVerMetricasIglesia: 'Ver Métricas de Asistencia',
    puedeVenderViandas: 'Vender Viandas',
    puedeVenderBingo: 'Vender Bingo',
    puedeVerSorteos: 'Ver Sorteos',
    puedeVerificacion: 'Verificación',
    puedeAdministrar: 'Administrar Eventos',
    puedeVerMetricas: 'Ver Métricas de Eventos',
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
            {subTab === 'usuarios' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Gestión de Iglesia INA
              </>
            ) : (
              <>
                <Settings className="w-3.5 h-3.5" /> Administración de Eventos
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {subTab === 'usuarios'
              ? 'Usuarios y Permisos'
              : 'Administración y Configuración'}
          </h1>
          <p className="text-white/70 text-sm mt-1 max-w-xl">
            {subTab === 'usuarios'
              ? 'Gestiona las cuentas de acceso, roles y permisos para los módulos de Iglesia INA y Eventos.'
              : 'Gestiona viandas, precios de bingo, configuración del evento, impresión, modalidades de pago y métricas financieras.'}
          </p>
          {user?.isSuperAdmin && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Administrador
            </div>
          )}
        </div>

        {subTab !== 'usuarios' && (
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-amber-400" /> Respaldar Datos JSON
            </button>
          </div>
        )}
      </div>

      {/* Notice Message */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-bold animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: VIANDAS Y PRECIOS CON DECIMALES */}
      {subTab === 'viandas' && (() => {
        const q = searchVianda.trim().toLowerCase();
        const filteredViandas = q
          ? viandas.filter(
            (v) =>
              v.nombre.toLowerCase().includes(q) ||
              (v.descripcion || '').toLowerCase().includes(q) ||
              (v.categoria || '').toLowerCase().includes(q) ||
              (v.etiquetaPrecio1 || '').toLowerCase().includes(q) ||
              (v.etiquetaPrecio2 || '').toLowerCase().includes(q)
          )
          : viandas;

        return (
          <div className="space-y-5">
            {/* Header Bar: Title + Search Input + Add Button */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Catálogo de Viandas ({filteredViandas.length}{q ? ` de ${viandas.length}` : ''})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gestiona los platos, bebidas y combos disponibles para la venta
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:w-auto w-full">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchVianda}
                    onChange={(e) => setSearchVianda(e.target.value)}
                    placeholder="Buscar vianda, categoría..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  {searchVianda && (
                    <button
                      type="button"
                      onClick={() => setSearchVianda('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Open Modal Button */}
                <button
                  type="button"
                  onClick={() => {
                    resetViandaForm();
                    setIsViandaModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Vianda
                </button>
              </div>
            </div>

            {/* List of Viandas */}
            {filteredViandas.length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                  {q ? `No se encontraron viandas para "${searchVianda}"` : 'No hay viandas registradas aún.'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nueva Vianda" para registrar el primer plato.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredViandas.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 hover:border-amber-500/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {v.nombre}
                          </h4>
                          {v.categoria && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                              {v.categoria}
                            </span>
                          )}
                          {v.tieneDosPrecios ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                              2 Precios
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              1 Precio
                            </span>
                          )}
                          {!v.activo && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Inactivo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditVianda(v)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVianda(v.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {v.descripcion && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{v.descripcion}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 text-xs">
                      <div className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                        {v.etiquetaPrecio1}: {formatPrecio(v.precio1)}
                      </div>
                      {v.tieneDosPrecios && v.precio2 !== undefined && (
                        <div className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-900 text-orange-900 dark:text-orange-200 font-bold">
                          {v.etiquetaPrecio2}: {formatPrecio(v.precio2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal: Create / Edit Vianda */}
            <Modal
              isOpen={isViandaModalOpen}
              onClose={() => {
                setIsViandaModalOpen(false);
                resetViandaForm();
              }}
              title={editingViandaId ? 'Editar Vianda' : 'Registrar Nueva Vianda'}
              size="md"
            >
              <form onSubmit={handleSaveVianda} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Plato / Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={vNombre}
                    onChange={(e) => setVNombre(e.target.value)}
                    placeholder="Ej. Pollo con Papas / Asado Criollo"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción / Guarnición (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={vDesc}
                    onChange={(e) => setVDesc(e.target.value)}
                    placeholder="Ej. Incluye ensalada rusa y pan casero"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={vCategoria}
                    onChange={(e) => setVCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Platos Principales">Platos Principales</option>
                    <option value="Minutas">Minutas</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Postres">Postres</option>
                    <option value="Combos">Combos</option>
                  </select>
                </div>

                {/* Precios */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Esquema de Precios
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="precios_scheme"
                          checked={!vTieneDosPrecios}
                          onChange={() => setVTieneDosPrecios(false)}
                        />
                        <span>1 Precio</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer ml-2">
                        <input
                          type="radio"
                          name="precios_scheme"
                          checked={vTieneDosPrecios}
                          onChange={() => setVTieneDosPrecios(true)}
                        />
                        <span className="font-bold text-amber-600">2 Precios</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Etiqueta Precio 1
                      </label>
                      <input
                        type="text"
                        value={vEtiqueta1}
                        onChange={(e) => setVEtiqueta1(e.target.value)}
                        placeholder="General"
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Monto Precio 1 ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={vPrecio1}
                        onChange={(e) => setVPrecio1(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-amber-600"
                      />
                    </div>
                  </div>

                  {vTieneDosPrecios && (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-orange-50/60 dark:bg-orange-950/30 rounded-xl border border-orange-200/60 dark:border-orange-800/60">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-orange-700 dark:text-orange-400 mb-1">
                          Etiqueta Precio 2
                        </label>
                        <input
                          type="text"
                          value={vEtiqueta2}
                          onChange={(e) => setVEtiqueta2(e.target.value)}
                          placeholder="Socio / Preventa"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-700 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-orange-700 dark:text-orange-400 mb-1">
                          Monto Precio 2 ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={vPrecio2}
                          onChange={(e) => setVPrecio2(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-700 rounded-lg font-black text-orange-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vActivo}
                      onChange={(e) => setVActivo(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span className="font-bold">Producto disponible para venta</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViandaModalOpen(false);
                      resetViandaForm();
                    }}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingVianda}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSavingVianda ? (
                      <LoadingSpinner size="sm" color="text-slate-950" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingViandaId ? 'Guardar Cambios' : 'Registrar Vianda'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        );
      })()}

      {/* TAB 2: PRECIOS DE BINGO */}
      {subTab === 'bingo' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Configuración de Tarifas de Bingo
              </h3>
              <p className="text-xs text-slate-500">
                Define tarifas con dos decimales para ventas de tarjetas regulares o promocionales.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBingoConfig} className="mt-6 space-y-5 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
              <div>
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm block">
                  Habilitar Dos Precios para el Bingo
                </span>
                <span className="text-slate-500 text-[11px]">
                  Permite vender con precio General o con precio Socio / Promoción.
                </span>
              </div>
              <input
                type="checkbox"
                checked={bingoPrecios.tieneDosPrecios}
                onChange={(e) =>
                  setBingoPrecios((prev) => ({ ...prev, tieneDosPrecios: e.target.checked }))
                }
                className="w-5 h-5 rounded text-indigo-600"
              />
            </div>

            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block text-[11px]">
                Tarifa Principal / General
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Etiqueta</label>
                  <input
                    type="text"
                    required
                    value={bingoPrecios.etiquetaPrecio1}
                    onChange={(e) =>
                      setBingoPrecios((prev) => ({ ...prev, etiquetaPrecio1: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={bPrecio1Input}
                    onChange={(e) => setBPrecio1Input(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl font-black text-indigo-600 text-base"
                  />
                </div>
              </div>
            </div>

            {bingoPrecios.tieneDosPrecios && (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-3">
                <span className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block text-[11px]">
                  Segunda Tarifa (Socio / Promo)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Etiqueta</label>
                    <input
                      type="text"
                      required
                      value={bingoPrecios.etiquetaPrecio2}
                      onChange={(e) =>
                        setBingoPrecios((prev) => ({ ...prev, etiquetaPrecio2: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Monto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={bPrecio2Input}
                      onChange={(e) => setBPrecio2Input(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl font-black text-purple-600 text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/25 transition text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Guardar Precios de Bingo
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: DATOS DEL EVENTO */}
      {subTab === 'evento' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" />
            Datos Generales del Evento
          </h3>

          <form onSubmit={handleSaveEventConfig} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Oficial del Evento *
              </label>
              <input
                type="text"
                required
                value={eventConfig.nombreEvento}
                onChange={(e) =>
                  setEventConfig((prev) => ({ ...prev, nombreEvento: e.target.value }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subtítulo / Entidad Organizadora
              </label>
              <input
                type="text"
                value={eventConfig.subtitulo}
                onChange={(e) =>
                  setEventConfig((prev) => ({ ...prev, subtitulo: e.target.value }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  value={eventConfig.fechaEvento}
                  onChange={(e) =>
                    setEventConfig((prev) => ({ ...prev, fechaEvento: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lugar / Salón
                </label>
                <input
                  type="text"
                  value={eventConfig.lugar}
                  onChange={(e) =>
                    setEventConfig((prev) => ({ ...prev, lugar: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mensaje al Pie del Ticket Térmico
              </label>
              <textarea
                rows={2}
                value={eventConfig.mensajeTicket}
                onChange={(e) =>
                  setEventConfig((prev) => ({ ...prev, mensajeTicket: e.target.value }))
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Guardar Datos del Evento
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: CONFIGURACIÓN DE IMPRESIÓN */}
      {subTab === 'impresion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Configuración de Impresión de Tickets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marca o desmarca partes del ticket para ahorrar papel térmico en el evento.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveImpresionConfig} className="mt-5 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Accesos Rápidos / Ajustes Predefinidos
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={aplicarPresetAhorro}
                      className="py-2 px-3 rounded-xl bg-teal-100 hover:bg-teal-200 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-teal-300 dark:border-teal-700"
                    >
                      <Scissors className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span>Solo Importantes (Ahorro Máximo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={aplicarPresetCompleto}
                      className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 dark:border-slate-600"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Ticket Detallado Completo</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-teal-50/70 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-teal-950 dark:text-teal-200 text-sm flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-teal-600" />
                      Modo Ahorro Máximo de Papel
                    </span>
                    <p className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5">
                      Reduce márgenes, achica interlineado y elimina espacios vacíos (ideal para rollos 58mm/80mm).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={impresionConfig.modoAhorroPapel}
                    onChange={(e) =>
                      setImpresionConfig((prev) => ({ ...prev, modoAhorroPapel: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                    Partes del Encabezado
                  </span>
                  {[
                    { key: 'mostrarEncabezado' as keyof ConfiguracionImpresion, label: 'Mostrar Título del Evento', sub: eventConfig.nombreEvento },
                    { key: 'mostrarLogo' as keyof ConfiguracionImpresion, label: 'Mostrar Logo / Iniciales "INA"', sub: 'Insignia superior del comprobante' },
                    { key: 'mostrarSubtitulo' as keyof ConfiguracionImpresion, label: 'Mostrar Subtítulo / Organización', sub: eventConfig.subtitulo },
                    { key: 'mostrarLugar' as keyof ConfiguracionImpresion, label: 'Mostrar Lugar / Salón', sub: eventConfig.lugar },
                  ].map(({ key, label, sub }) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 transition">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{label}</span>
                        <span className="text-[11px] text-slate-500">{sub}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={impresionConfig[key] as boolean}
                        onChange={(e) =>
                          setImpresionConfig((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-teal-600"
                      />
                    </label>
                  ))}
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                    Datos Secundarios y Pie de Ticket
                  </span>
                  {[
                    { key: 'mostrarFechaHora' as keyof ConfiguracionImpresion, label: 'Mostrar Fecha y Hora', sub: 'Momento de emisión' },
                    { key: 'mostrarTelefono' as keyof ConfiguracionImpresion, label: 'Mostrar Teléfono del Cliente', sub: 'Si fue ingresado en la venta' },
                    { key: 'mostrarModalidadPago' as keyof ConfiguracionImpresion, label: 'Mostrar Modalidad de Pago', sub: 'Efectivo, QR, Tarjeta, etc.' },
                    { key: 'mostrarEstadoPago' as keyof ConfiguracionImpresion, label: 'Mostrar Sello de Estado de Pago', sub: 'Recuadro PAGADO / PENDIENTE' },
                    { key: 'mostrarCodigoBarras' as keyof ConfiguracionImpresion, label: 'Mostrar Código de Barras / QR Simulado', sub: 'Gráfico inferior para lector' },
                    { key: 'mostrarMensajePie' as keyof ConfiguracionImpresion, label: 'Mostrar Mensaje de Agradecimiento al Pie', sub: eventConfig.mensajeTicket },
                  ].map(({ key, label, sub }) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 transition">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{label}</span>
                        <span className="text-[11px] text-slate-500">{sub}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={impresionConfig[key] as boolean}
                        onChange={(e) =>
                          setImpresionConfig((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-teal-600"
                      />
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-4 h-4" /> Guardar Opciones de Impresión
                </button>
              </form>
            </div>
          </div>

          {/* Ticket Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl lg:sticky lg:top-20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-teal-500" />
                  Vista Previa en Vivo del Ticket
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {impresionConfig.modoAhorroPapel ? 'Modo Compacto' : 'Modo Normal'}
                </span>
              </div>

              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl font-mono text-slate-800 dark:text-slate-200 shadow-inner">
                <div className={`text-center border-b border-dashed border-slate-300 dark:border-slate-800 ${impresionConfig.modoAhorroPapel ? 'pb-2' : 'pb-3'}`}>
                  {impresionConfig.mostrarLogo && (
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-xs mb-1">
                      INA
                    </div>
                  )}
                  {impresionConfig.mostrarEncabezado && (
                    <h4 className="font-black text-xs tracking-wider uppercase text-slate-900 dark:text-white">
                      {eventConfig.nombreEvento || 'EVENTOS INA'}
                    </h4>
                  )}
                  {impresionConfig.mostrarSubtitulo && eventConfig.subtitulo && (
                    <p className="text-[10px] text-slate-500">{eventConfig.subtitulo}</p>
                  )}
                  {impresionConfig.mostrarLugar && eventConfig.lugar && (
                    <p className="text-[10px] text-slate-400">{eventConfig.lugar}</p>
                  )}
                  <div className="mt-1 inline-block px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[11px] font-bold">
                    TICKET N° V-0001
                  </div>
                </div>

                <div className={`text-[11px] space-y-1 text-slate-600 dark:text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-800 ${impresionConfig.modoAhorroPapel ? 'py-1.5' : 'py-2.5'}`}>
                  {impresionConfig.mostrarFechaHora && (
                    <div className="flex justify-between">
                      <span>Fecha / Hora:</span>
                      <span className="font-bold">12/10/26 16:30</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Titular:</span>
                    <strong className="text-slate-900 dark:text-white">Juan Pérez</strong>
                  </div>
                  {impresionConfig.mostrarTelefono && (
                    <div className="flex justify-between">
                      <span>Teléfono:</span>
                      <span>11 2345-6789</span>
                    </div>
                  )}
                  {impresionConfig.mostrarModalidadPago && (
                    <div className="flex justify-between">
                      <span>Pago:</span>
                      <span className="uppercase font-bold">EFECTIVO</span>
                    </div>
                  )}
                </div>

                <div className={`border-b border-dashed border-slate-300 dark:border-slate-800 text-[11px] space-y-1 ${impresionConfig.modoAhorroPapel ? 'py-1.5' : 'py-2.5'}`}>
                  <div className="flex justify-between">
                    <span>1x Pollo con Papas (General)</span>
                    <span className="font-bold">$ 5.000,00</span>
                  </div>
                  <div className="pt-1 flex justify-between font-black text-xs text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
                    <span>TOTAL:</span>
                    <span className="text-emerald-600">$ 5.000,00</span>
                  </div>
                </div>

                {impresionConfig.mostrarEstadoPago && (
                  <div className="text-center pt-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      ESTADO: PAGADO
                    </span>
                  </div>
                )}
                {impresionConfig.mostrarCodigoBarras && (
                  <div className="text-center pt-2">
                    <div className="inline-flex items-end gap-0.5 h-5 px-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-800">
                      <div className="w-0.5 h-4 bg-slate-900 dark:bg-white" />
                      <div className="w-1 h-5 bg-slate-900 dark:bg-white" />
                      <div className="w-0.5 h-3 bg-slate-900 dark:bg-white" />
                      <div className="w-1.5 h-5 bg-slate-900 dark:bg-white" />
                      <div className="w-0.5 h-4 bg-slate-900 dark:bg-white" />
                    </div>
                  </div>
                )}
                {impresionConfig.mostrarMensajePie && eventConfig.mensajeTicket && (
                  <p className="text-[10px] text-center italic text-slate-500 pt-2">
                    {eventConfig.mensajeTicket}
                  </p>
                )}
              </div>

              <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 text-center">
                El comprobante se adaptará en tiempo real según las opciones guardadas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MODALIDADES DE PAGO - GESTIÓN COMPLETA */}
      {subTab === 'pagos' && (() => {
        const q = searchModalidad.trim().toLowerCase();
        const filteredModalidades = q
          ? modalidades.filter(
            (m) =>
              m.nombre.toLowerCase().includes(q) ||
              (m.descripcion || '').toLowerCase().includes(q) ||
              m.id.toLowerCase().includes(q)
          )
          : modalidades;

        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl sm:text-2xl">Gestión de Modalidades de Pago</h3>
                    <p className="text-white/70 text-sm mt-0.5">
                      Agrega, edita, activa o desactiva los métodos de cobro disponibles en el sistema.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="px-3 py-1.5 rounded-full bg-white/15 font-bold">
                    {modalidades.filter(m => m.activo).length} activas
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 font-bold">
                    {modalidades.filter(m => !m.activo).length} inactivas
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar: Title + Search Input + Add Modalidad Button */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-500" />
                  Modalidades Configuradas ({filteredModalidades.length}{q ? ` de ${modalidades.length}` : ''})
                </h3>
                <p className="text-xs text-slate-500">Ordenadas por prioridad de aparición</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:w-auto w-full">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchModalidad}
                    onChange={(e) => setSearchModalidad(e.target.value)}
                    placeholder="Buscar modalidad de pago..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                  {searchModalidad && (
                    <button
                      type="button"
                      onClick={() => setSearchModalidad('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Open Modal Button */}
                <button
                  type="button"
                  onClick={() => {
                    resetModalidadForm();
                    setIsModalidadModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Modalidad
                </button>
              </div>
            </div>

            {/* List of payment methods */}
            {filteredModalidades.length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                  {q ? `No se encontraron modalidades para "${searchModalidad}"` : 'No hay modalidades configuradas.'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nueva Modalidad" para agregar la primera.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModalidades.map((m) => {
                  const vTotal = ticketsViandas.filter((t) => t.modalidadPago === m.id).reduce((a, t) => a + t.total, 0);
                  const bTotal = tarjetasBingo.filter((t) => t.modalidadPago === m.id).reduce((a, t) => a + t.precioCobrado, 0);
                  const totalMod = vTotal + bTotal;
                  const ops = ticketsViandas.filter((t) => t.modalidadPago === m.id).length + tarjetasBingo.filter((t) => t.modalidadPago === m.id).length;

                  return (
                    <div
                      key={m.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition ${m.activo
                        ? 'border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
                        : 'border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                    >
                      <div className="flex items-start gap-4 p-4">
                        {/* Color strip */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                          {m.icono}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 dark:text-white">{m.nombre}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                              #{m.orden}
                            </span>
                            {m.activo ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                ✓ Activa
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                                Inactiva
                              </span>
                            )}
                          </div>
                          {m.descripcion && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{m.descripcion}</p>
                          )}
                          <div className="mt-2 flex gap-3 text-[11px] text-slate-500">
                            <span><strong className="text-slate-700 dark:text-slate-300">{ops}</strong> operaciones</span>
                            <span>·</span>
                            <span>Total: <strong className="text-slate-700 dark:text-slate-300">{formatPrecio(totalMod)}</strong></span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleModalidad(m.id, !m.activo)}
                            className={`p-2 rounded-lg transition ${m.activo
                              ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            title={m.activo ? 'Desactivar' : 'Activar'}
                          >
                            {m.activo
                              ? <ToggleRight className="w-5 h-5" />
                              : <ToggleLeft className="w-5 h-5" />
                            }
                          </button>
                          <button
                            onClick={() => handleEditModalidad(m)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteModalidad(m.id, m.nombre)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info card */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-rose-800 dark:text-rose-300 mb-1">¿Cómo funcionan las modalidades?</p>
                  <ul className="text-rose-700 dark:text-rose-400 space-y-0.5 list-disc list-inside">
                    <li>Las modalidades <strong>activas</strong> aparecen en los formularios de venta de viandas y bingo.</li>
                    <li>Las modalidades <strong>inactivas</strong> no se pueden seleccionar pero conservan su historial.</li>
                    <li>Puedes agregar métodos personalizados como <em>MODO</em>, <em>Billetera Virtual</em>, etc.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal: Create / Edit Modalidad */}
            <Modal
              isOpen={isModalidadModalOpen}
              onClose={() => {
                setIsModalidadModalOpen(false);
                resetModalidadForm();
              }}
              title={editingModalidadId ? 'Editar Modalidad de Pago' : 'Nueva Modalidad de Pago'}
              size="md"
            >
              <form onSubmit={handleSaveModalidad} className="space-y-4 text-xs">
                {/* Nombre */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Modalidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={mpNombre}
                    onChange={(e) => setMpNombre(e.target.value)}
                    placeholder="Ej. Mercado Pago, Efectivo, MODO..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción / Instrucciones (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={mpDescripcion}
                    onChange={(e) => setMpDescripcion(e.target.value)}
                    placeholder="Ej. Pago mediante transferencia CBU 123456..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none"
                  />
                </div>

                {/* Icono y orden en la misma fila */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ícono / Emoji *
                    </label>
                    <input
                      type="text"
                      required
                      value={mpIcono}
                      onChange={(e) => setMpIcono(e.target.value)}
                      placeholder="💳"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Orden de Aparición
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={mpOrden}
                      onChange={(e) => setMpOrden(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
                    />
                  </div>
                </div>

                {/* Color selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Color / Tema Visual
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.color}
                        type="button"
                        onClick={() => { setMpColor(opt.color); setMpGradient(opt.gradient); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${mpColor === opt.color
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shadow"
                          style={{ background: opt.preview }}
                        />
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">Vista previa</span>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${mpGradient} text-white shadow-lg`}>
                    <span className="text-lg">{mpIcono || '💳'}</span>
                    <span className="font-black text-sm">{mpNombre || 'Modalidad'}</span>
                  </div>
                </div>

                {/* Estado activo */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">Disponible para usar</span>
                    <span className="text-[10px] text-slate-500">Los vendedores podrán seleccionar esta modalidad</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMpActivo(!mpActivo)}
                    className="flex-shrink-0"
                  >
                    {mpActivo
                      ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                      : <ToggleLeft className="w-8 h-8 text-slate-400" />
                    }
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalidadModalOpen(false);
                      resetModalidadForm();
                    }}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingModalidad}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm hover:from-rose-500 hover:to-pink-500 disabled:opacity-50"
                  >
                    {isSavingModalidad ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingModalidadId ? 'Guardar Cambios' : 'Agregar Modalidad'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        );
      })()}

      {/* TAB 6: METRICAS FINANCIERAS */}
      {subTab === 'metricas' && (
        <div className="space-y-6">
          {/* Top summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
              <span className="text-xs uppercase font-bold text-white/80">Recaudación Cobrada</span>
              <div className="text-3xl font-black mt-2">
                {formatPrecio(totalRecaudadoGlobal)}
              </div>
              <span className="text-xs text-white/80 mt-1 block">Total dinero en mano/cuenta</span>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl">
              <span className="text-xs uppercase font-bold text-white/80">Total Viandas Pagadas</span>
              <div className="text-3xl font-black mt-2">
                {formatPrecio(totalViandasPagadas)}
              </div>
              <span className="text-xs text-white/80 mt-1 block">
                {ticketsViandas.filter((t) => t.estadoPago === 'pagado').length} tickets cobrados
              </span>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
              <span className="text-xs uppercase font-bold text-white/80">Total Bingo Pagado</span>
              <div className="text-3xl font-black mt-2">
                {formatPrecio(totalBingoPagado)}
              </div>
              <span className="text-xs text-white/80 mt-1 block">
                {tarjetasBingo
                  .filter((t) => t.estadoPago === 'pagado')
                  .reduce((acc, t) => acc + (t.cantidad || (t.numerosTarjetas ? t.numerosTarjetas.length : 1)), 0)}{' '}
                tarjetas cobradas
              </span>
            </div>
          </div>

          {/* Payment method breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white">Desglose por Modalidad de Pago</h4>
                <p className="text-xs text-slate-500">Distribución del total recaudado según método de pago</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {metricasPorModalidad.map((row) => {
                const pct = grandTotalPorModalidad > 0 ? (row.total / grandTotalPorModalidad) * 100 : 0;
                return (
                  <div key={row.modalidad} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.icon}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{row.label}</span>
                        <span className="text-xs text-slate-500">
                          ({row.ticketCount + row.bingoCount} operaciones)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 dark:text-white">{formatPrecio(row.total)}</span>
                        <span className="text-xs text-slate-500 ml-2">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${row.gradient} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500">
                      <span>Viandas: <strong>{formatPrecio(row.viandas)}</strong></span>
                      <span>Bingo: <strong>{formatPrecio(row.bingo)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending + Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                Pendientes de Cobro
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <span>Viandas por cobrar:</span>
                  <strong className="text-amber-700 dark:text-amber-300 font-black">
                    {formatPrecio(totalViandasPendiente)}
                  </strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <span>Tarjetas de bingo por cobrar:</span>
                  <strong className="text-amber-700 dark:text-amber-300 font-black">
                    {formatPrecio(totalBingoPendiente)}
                  </strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="font-bold text-rose-700 dark:text-rose-300">Total Pendiente:</span>
                  <strong className="text-rose-700 dark:text-rose-300 font-black text-sm">
                    {formatPrecio(totalViandasPendiente + totalBingoPendiente)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Totales de Operaciones
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span>Tickets de Vianda Emitidos:</span>
                  <strong className="font-black">{ticketsViandas.length}</strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span>Total Tarjetas de Bingo Vendidas:</span>
                  <strong className="font-black">
                    {tarjetasBingo.reduce(
                      (acc, t) => acc + (t.cantidad || (t.numerosTarjetas ? t.numerosTarjetas.length : 1)),
                      0
                    )}{' '}
                    tarjetas
                  </strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">Total Recaudado:</span>
                  <strong className="text-emerald-700 dark:text-emerald-300 font-black text-sm">
                    {formatPrecio(totalRecaudadoGlobal)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: USUARIOS & PERMISOS (solo super admin) */}
      {subTab === 'usuarios' && (
        <div className="space-y-6">
          {!isSuperAdmin ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">Acceso Restringido</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                Solo el Super Administrador puede gestionar usuarios y asignar permisos.
              </p>
            </div>
          ) : (() => {
            const q = searchUsuario.trim().toLowerCase();
            const filteredUsers = q
              ? userProfiles.filter((profile) => {
                const rc = ROLE_CONFIG[profile.role] || ROLE_CONFIG.cajero;
                return (
                  (profile.displayName || '').toLowerCase().includes(q) ||
                  (profile.email || '').toLowerCase().includes(q) ||
                  profile.role.toLowerCase().includes(q) ||
                  rc.label.toLowerCase().includes(q)
                );
              })
              : userProfiles;

            const editingProfile = userProfiles.find((p) => p.uid === editingUserId);

            return (
              <div className="space-y-5">
                {/* Action Bar: Title + Search Input + Add User Button */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        Usuarios Registrados ({filteredUsers.length}{q ? ` de ${userProfiles.length}` : ''})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Gestiona cuentas de acceso, roles y permisos individuales
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:w-auto w-full">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchUsuario}
                        onChange={(e) => setSearchUsuario(e.target.value)}
                        placeholder="Buscar usuario, correo o rol..."
                        className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      />
                      {searchUsuario && (
                        <button
                          type="button"
                          onClick={() => setSearchUsuario('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label="Limpiar búsqueda"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Open Modal Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewUserEmail('');
                        setNewUserPassword('');
                        setNewUserName('');
                        setNewUserRole('cajero');
                        setNewUserPermisos(DEFAULT_PERMISOS_BY_ROLE['cajero']);
                        setIsUserModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" />
                      Nuevo Usuario
                    </button>
                  </div>
                </div>

                {/* User list */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                      {q ? `No se encontraron usuarios para "${searchUsuario}"` : 'No hay usuarios registrados aún.'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nuevo Usuario" para crear el primero.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUsers.map((profile) => {
                      const rc = ROLE_CONFIG[profile.role] || ROLE_CONFIG.cajero;
                      return (
                        <div
                          key={profile.uid}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:border-rose-500/40 transition flex flex-col justify-between"
                        >
                          <div className="p-4 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl bg-${rc.color}-100 dark:bg-${rc.color}-950/50 flex items-center justify-center flex-shrink-0`}>
                                <ShieldCheck className={`w-5 h-5 text-${rc.color}-600`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                    {profile.displayName}
                                  </span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-${rc.color}-100 dark:bg-${rc.color}-950 text-${rc.color}-700 dark:text-${rc.color}-300`}>
                                    {rc.label}
                                  </span>
                                  {!profile.activo && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                                {profile.creadoPor && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Creado por: {profile.creadoPor}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleStartEditUser(profile)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                                title="Editar rol y permisos"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {profile.role !== 'superadmin' && (
                                <button
                                  onClick={() => handleDeleteUser(profile.uid, profile.email)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                  title="Eliminar perfil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Permission badges */}
                          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                            {permKey.map((k) => (
                              <span
                                key={k}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${profile.permisos[k]
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                                  }`}
                              >
                                {permLabels[k]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Role legend */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <h5 className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Descripción de Roles
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][]).map(([r, rc]) => (
                      <div key={r} className="flex items-center gap-2.5 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <span className={`font-black px-2 py-0.5 rounded-full bg-${rc.color}-100 dark:bg-${rc.color}-950/40 text-${rc.color}-700 dark:text-${rc.color}-300 whitespace-nowrap`}>
                          {rc.label}
                        </span>
                        <span className="text-slate-500 text-[11px] leading-snug">{rc.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal: Register New User */}
                <Modal
                  isOpen={isUserModalOpen}
                  onClose={() => setIsUserModalOpen(false)}
                  title="Registrar Nuevo Usuario"
                  size="md"
                >
                  <form onSubmit={handleRegisterUser} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Ej. María García"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="usuario@eventosina.com"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contraseña temporal *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Rol del Usuario
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => handleNewRoleChange(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      >
                        {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][])
                          .filter(([r]) => r !== 'superadmin')
                          .map(([r, rc]) => (
                            <option key={r} value={r}>{rc.label} — {rc.description}</option>
                          ))}
                      </select>
                    </div>

                    {/* Permission checkboxes */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">
                        Permisos individuales
                      </span>
                      {permKey.map((k) => (
                        <label key={k} className="flex items-center justify-between py-1.5 cursor-pointer">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{permLabels[k]}</span>
                          <input
                            type="checkbox"
                            checked={newUserPermisos[k]}
                            onChange={(e) =>
                              setNewUserPermisos((prev) => ({ ...prev, [k]: e.target.checked }))
                            }
                            className="w-4 h-4 rounded text-rose-600"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsUserModalOpen(false)}
                        className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingUser}
                        className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSavingUser ? (
                          <LoadingSpinner size="sm" color="text-white" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" /> Registrar Usuario
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </Modal>

                {/* Modal: Edit User Role & Permissions */}
                <Modal
                  isOpen={isUserEditModalOpen && !!editingUserId}
                  onClose={() => {
                    setIsUserEditModalOpen(false);
                    setEditingUserId(null);
                  }}
                  title="Editar Rol y Permisos de Usuario"
                  size="md"
                >
                  {editingProfile && (
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                          {(editingProfile.displayName || editingProfile.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                            {editingProfile.displayName}
                          </p>
                          <p className="text-slate-500 truncate">{editingProfile.email}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1.5">
                          Rol del Usuario
                        </label>
                        <select
                          value={editUserRole}
                          onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        >
                          {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG[UserRole]][])
                            .filter(([r]) => r !== 'superadmin' || editingProfile.role === 'superadmin')
                            .map(([r, rc]) => (
                              <option key={r} value={r}>{rc.label} — {rc.description}</option>
                            ))}
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">
                          Permisos individuales
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {permKey.map((k) => (
                            <label key={k} className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={editUserPermisos[k]}
                                onChange={(e) =>
                                  setEditUserPermisos((prev) => ({ ...prev, [k]: e.target.checked }))
                                }
                                className="rounded text-rose-600 w-4 h-4"
                              />
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {permLabels[k]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserEditModalOpen(false);
                            setEditingUserId(null);
                          }}
                          className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition hover:bg-slate-200"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveUserPermisos(editingProfile.uid)}
                          disabled={isSavingUser}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                          {isSavingUser ? (
                            <LoadingSpinner size="sm" color="text-white" />
                          ) : (
                            <>
                              <Save className="w-4 h-4" /> Guardar Permisos
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </Modal>
              </div>
            );
          })()}
        </div>
      )}

      <ConfirmationModal />
    </div>
  );
};
