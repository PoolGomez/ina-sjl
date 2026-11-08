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
  Calendar,
  MapPin,
  CheckCircle2,
  FolderOpen,
  Filter,
  Bluetooth,
  AlertCircle,
} from 'lucide-react';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { AdaptiveDataView } from './AdaptiveDataView';
import {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  printTestTicketBluetooth,
  getConnectedPrinterName,
  getSavedBluetoothPrinterName,
  getPrintingConfigStatus,
  isWebBluetoothSupported,
  buildThermalTicketLines,
} from '../lib/bluetoothPrinter';
import {
  ViandaProducto,
  PrecioViandaItem,
  getPreciosVianda,
  TicketProducto,
  getPreciosTicket,
  TicketEventoVenta,
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
  getTicketsProductos,
  saveTicketProducto,
  deleteTicketProducto,
  getTicketsEventoVentas,
  saveConfiguracionEvento,
  getEventos,
  saveEvento,
  activarEvento,
  desactivarEvento,
  deleteEvento,
  DEFAULT_BINGO_PRECIOS,
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

type SubTab = 'viandas' | 'tickets' | 'bingo' | 'evento' | 'impresion' | 'metricas' | 'pagos' | 'usuarios';

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
  cajero: { label: 'Cajero', color: 'emerald', description: 'Ventas, Viandas, Tickets y Tarjetas Bingo' },
  visor: { label: 'Visor', color: 'blue', description: 'Consulta y verificación solamente' },
};

const VALID_SUBTABS: SubTab[] = ['viandas', 'tickets', 'bingo', 'evento', 'impresion', 'pagos', 'metricas', 'usuarios'];

export const Administracion: React.FC<AdministracionProps> = ({
  config,
  onConfigUpdated,
  activeSubTab,
  onSubTabChange,
}) => {
  const { user, signUp, refreshUserProfile } = useAuth();
  const canManageUsers = Boolean(
    user?.isSuperAdmin || user?.permisos?.puedeGestionarUsuarios
  );

  const [subTab, setSubTab] = useState<SubTab>(activeSubTab || 'viandas');

  useEffect(() => {
    if (activeSubTab && VALID_SUBTABS.includes(activeSubTab)) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Search states for Administration modules
  const [searchVianda, setSearchVianda] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [searchModalidad, setSearchModalidad] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');
  const [searchEvento, setSearchEvento] = useState('');

  // Modal visibility states
  const [isViandaModalOpen, setIsViandaModalOpen] = useState(false);
  const [isTicketProdModalOpen, setIsTicketProdModalOpen] = useState(false);
  const [isModalidadModalOpen, setIsModalidadModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
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
  const [isSavingTicketProd, setIsSavingTicketProd] = useState(false);
  const [isSavingBingoPrecios, setIsSavingBingoPrecios] = useState(false);
  const [isSavingModalidad, setIsSavingModalidad] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingEvento, setIsSavingEvento] = useState(false);

  // Viandas CRUD state
  const [viandas, setViandas] = useState<ViandaProducto[]>([]);
  const [editingViandaId, setEditingViandaId] = useState<string | null>(null);
  const [vNombre, setVNombre] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vDescImpresion, setVDescImpresion] = useState('');
  const [vCategoria, setVCategoria] = useState('Platos Principales');
  const [vPrecios, setVPrecios] = useState<{ id: string; etiqueta: string; monto: string }[]>([
    { id: 'p-1', etiqueta: 'General', monto: '3000' },
  ]);
  const [vActivo, setVActivo] = useState(true);

  // Tickets Productos CRUD state
  const [ticketsProductos, setTicketsProductos] = useState<TicketProducto[]>([]);
  const [editingTicketProdId, setEditingTicketProdId] = useState<string | null>(null);
  const [tNombre, setTNombre] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tDescImpresion, setTDescImpresion] = useState('');
  const [tCategoria, setTCategoria] = useState('Entradas');
  const [tPrecios, setTPrecios] = useState<{ id: string; etiqueta: string; monto: string }[]>([
    { id: 'tp-1', etiqueta: 'General', monto: '2000' },
  ]);
  const [tActivo, setTActivo] = useState(true);

  // Bingo Price Config state
  const [bingoPrecios, setBingoPrecios] = useState<TarjetaBingoPrecioConfig>(config.bingoPrecios);
  const [bPrecio1Input, setBPrecio1Input] = useState<string>(String(config.bingoPrecios.precio1));
  const [bPrecio2Input, setBPrecio2Input] = useState<string>(String(config.bingoPrecios.precio2));

  // Event Config & Multi-Event CRUD state
  const [eventosList, setEventosList] = useState<ConfiguracionEvento[]>([]);
  const [editingEventoId, setEditingEventoId] = useState<string | null>(null);
  const [evForm, setEvForm] = useState<{
    nombreEvento: string;
    subtitulo: string;
    fechaEvento: string;
    lugar: string;
    mensajeTicket: string;
    activo: boolean;
  }>({
    nombreEvento: '',
    subtitulo: '',
    fechaEvento: '',
    lugar: '',
    mensajeTicket: '¡Gracias por colaborar con nuestra comunidad! Conserve este comprobante.',
    activo: true,
  });
  const [eventConfig, setEventConfig] = useState<ConfiguracionEvento>(config);
  const [impresionConfig, setImpresionConfig] = useState<ConfiguracionImpresion>(
    config.impresion || DEFAULT_IMPRESION_CONFIG
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Metrics state & event filter
  const [ticketsViandas, setTicketsViandas] = useState<TicketVianda[]>([]);
  const [ticketsEventoVentas, setTicketsEventoVentas] = useState<TicketEventoVenta[]>([]);
  const [tarjetasBingo, setTarjetasBingo] = useState<TarjetaBingoVenta[]>([]);
  const [filtroEventoMetricas, setFiltroEventoMetricas] = useState<string>(config.id || 'todos');

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
    const [vList, tProdList, tks, tksEv, tbs, profiles, mods, evs] = await Promise.all([
      getViandasProductos(),
      getTicketsProductos(),
      getTicketsViandas(),
      getTicketsEventoVentas(),
      getTarjetasBingoVentas(),
      getUserProfiles(),
      getModalidadesPago(),
      getEventos(),
    ]);
    setViandas(vList);
    setTicketsProductos(tProdList);
    setTicketsViandas(tks);
    setTicketsEventoVentas(tksEv);
    setTarjetasBingo(tbs);
    setUserProfiles(profiles);
    setModalidades(mods);
    setEventosList(evs);
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
    if (config.id) {
      setFiltroEventoMetricas((prev) => (prev === '' || prev === 'todos' ? config.id! : prev));
    }
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
    setVDescImpresion('');
    setVCategoria('Platos Principales');
    setVPrecios([{ id: 'p-1', etiqueta: 'General', monto: '3000' }]);
    setVActivo(true);
  };

  const handleEditVianda = (item: ViandaProducto) => {
    setEditingViandaId(item.id);
    setVNombre(item.nombre);
    setVDesc(item.descripcion || '');
    setVDescImpresion(item.descripcionImpresion || '');
    setVCategoria(item.categoria || 'Platos Principales');
    const preciosActuales = getPreciosVianda(item);
    setVPrecios(
      preciosActuales.map((p, idx) => ({
        id: p.id || `p-${idx + 1}`,
        etiqueta: p.etiqueta || `Precio ${idx + 1}`,
        monto: String(p.monto),
      }))
    );
    setVActivo(item.activo);
    setIsViandaModalOpen(true);
  };

  const handleAddPrecioVianda = () => {
    setVPrecios((prev) => {
      const nextIndex = prev.length + 1;
      const defaultLabels = ['General', 'Socio / Preventa', 'Promo / Combo', 'Media Porción'];
      const defaultEtiqueta = defaultLabels[nextIndex - 1] || `Precio ${nextIndex}`;
      return [
        ...prev,
        {
          id: `p-${Date.now()}-${nextIndex}`,
          etiqueta: defaultEtiqueta,
          monto: '',
        },
      ];
    });
  };

  const handleRemovePrecioVianda = (id: string) => {
    setVPrecios((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const handleChangePrecioVianda = (
    id: string,
    field: 'etiqueta' | 'monto',
    value: string
  ) => {
    setVPrecios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveVianda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNombre.trim()) return;

    setIsSavingVianda(true);
    try {
      const preciosNormalizados: PrecioViandaItem[] = vPrecios.map((p, idx) => ({
        id: p.id || `p-${idx + 1}`,
        etiqueta: p.etiqueta.trim() || (idx === 0 ? 'General' : `Precio ${idx + 1}`),
        monto: parseFloat(String(p.monto)) || 0,
      }));

      const first = preciosNormalizados[0] || { id: 'p-1', etiqueta: 'General', monto: 0 };
      const second = preciosNormalizados[1];

      const item: ViandaProducto = {
        id: editingViandaId || 'v-prod-' + Date.now(),
        nombre: vNombre.trim(),
        descripcion: vDesc.trim(),
        descripcionImpresion: vDescImpresion.trim(),
        categoria: vCategoria,
        precios: preciosNormalizados,
        tieneDosPrecios: preciosNormalizados.length > 1,
        precio1: first.monto,
        etiquetaPrecio1: first.etiqueta,
        ...(second
          ? {
              precio2: second.monto,
              etiquetaPrecio2: second.etiqueta,
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

  // ---- Tickets Productos CRUD Handlers ----
  const resetTicketProdForm = () => {
    setEditingTicketProdId(null);
    setTNombre('');
    setTDesc('');
    setTDescImpresion('');
    setTCategoria('Entradas');
    setTPrecios([{ id: 'tp-1', etiqueta: 'General', monto: '2000' }]);
    setTActivo(true);
  };

  const handleEditTicketProd = (item: TicketProducto) => {
    setEditingTicketProdId(item.id);
    setTNombre(item.nombre);
    setTDesc(item.descripcion || '');
    setTDescImpresion(item.descripcionImpresion || '');
    setTCategoria(item.categoria || 'Entradas');
    const preciosActuales = getPreciosTicket(item);
    setTPrecios(
      preciosActuales.map((p, idx) => ({
        id: p.id || `tp-${idx + 1}`,
        etiqueta: p.etiqueta || `Precio ${idx + 1}`,
        monto: String(p.monto),
      }))
    );
    setTActivo(item.activo);
    setIsTicketProdModalOpen(true);
  };

  const handleAddPrecioTicket = () => {
    setTPrecios((prev) => {
      const nextIndex = prev.length + 1;
      const defaultLabels = ['General', 'Socio / Preventa', 'Promo / Familiar', 'Menor'];
      const defaultEtiqueta = defaultLabels[nextIndex - 1] || `Precio ${nextIndex}`;
      return [
        ...prev,
        {
          id: `tp-${Date.now()}-${nextIndex}`,
          etiqueta: defaultEtiqueta,
          monto: '',
        },
      ];
    });
  };

  const handleRemovePrecioTicket = (id: string) => {
    setTPrecios((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const handleChangePrecioTicket = (
    id: string,
    field: 'etiqueta' | 'monto',
    value: string
  ) => {
    setTPrecios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveTicketProd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tNombre.trim()) return;

    setIsSavingTicketProd(true);
    try {
      const preciosNormalizados: PrecioViandaItem[] = tPrecios.map((p, idx) => ({
        id: p.id || `tp-${idx + 1}`,
        etiqueta: p.etiqueta.trim() || (idx === 0 ? 'General' : `Precio ${idx + 1}`),
        monto: parseFloat(String(p.monto)) || 0,
      }));

      const first = preciosNormalizados[0] || { id: 'tp-1', etiqueta: 'General', monto: 0 };
      const second = preciosNormalizados[1];

      const item: TicketProducto = {
        id: editingTicketProdId || 't-prod-' + Date.now(),
        nombre: tNombre.trim(),
        descripcion: tDesc.trim(),
        descripcionImpresion: tDescImpresion.trim(),
        categoria: tCategoria,
        precios: preciosNormalizados,
        tieneDosPrecios: preciosNormalizados.length > 1,
        precio1: first.monto,
        etiquetaPrecio1: first.etiqueta,
        ...(second
          ? {
              precio2: second.monto,
              etiquetaPrecio2: second.etiqueta,
            }
          : {}),
        activo: tActivo,
      };

      await saveTicketProducto(item);
      await loadData();
      resetTicketProdForm();
      setIsTicketProdModalOpen(false);
      showNotice('¡Ticket / Entrada guardado con éxito!');
    } finally {
      setIsSavingTicketProd(false);
    }
  };

  const handleDeleteTicketProd = async (id: string) => {
    const tk = ticketsProductos.find((t) => t.id === id);
    setConfirmationModal({
      isOpen: true,
      message: `¿Seguro que deseas eliminar el ticket "${tk?.nombre || ''}" del catálogo?`,
      onConfirm: async () => {
        await deleteTicketProducto(id);
        await loadData();
        showNotice('Ticket eliminado del catálogo.');
        setConfirmationModal({ isOpen: false, message: '', onConfirm: () => {} });
      },
    });
  };

  const handleSaveBingoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingBingoPrecios) return;
    setIsSavingBingoPrecios(true);
    try {
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
      await loadData();
      onConfigUpdated(updated);
      showNotice('¡Precios de tarjetas de bingo actualizados con éxito!');
    } finally {
      setIsSavingBingoPrecios(false);
    }
  };

  // ---- Multi-Event CRUD Handlers ----
  const resetEventoForm = () => {
    setEditingEventoId(null);
    setEvForm({
      nombreEvento: '',
      subtitulo: '',
      fechaEvento: '',
      lugar: '',
      mensajeTicket: '¡Gracias por colaborar con nuestra comunidad! Conserve este comprobante.',
      activo: eventosList.length === 0,
    });
  };

  const handleOpenCreateEvento = () => {
    resetEventoForm();
    setIsEventoModalOpen(true);
  };

  const handleEditEvento = (ev: ConfiguracionEvento) => {
    setEditingEventoId(ev.id || null);
    setEvForm({
      nombreEvento: ev.nombreEvento || '',
      subtitulo: ev.subtitulo || '',
      fechaEvento: ev.fechaEvento || '',
      lugar: ev.lugar || '',
      mensajeTicket: ev.mensajeTicket || '',
      activo: Boolean(ev.activo),
    });
    setIsEventoModalOpen(true);
  };

  const handleSaveEventoModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evForm.nombreEvento.trim()) return;

    setIsSavingEvento(true);
    try {
      const existing = editingEventoId
        ? eventosList.find((item) => item.id === editingEventoId)
        : undefined;

      const payload: ConfiguracionEvento = {
        id: editingEventoId || `evento-${Date.now()}`,
        nombreEvento: evForm.nombreEvento.trim(),
        subtitulo: evForm.subtitulo.trim(),
        fechaEvento: evForm.fechaEvento,
        lugar: evForm.lugar.trim(),
        mensajeTicket: evForm.mensajeTicket.trim(),
        activo: evForm.activo,
        estado: evForm.activo ? 'abierto' : existing?.estado || 'abierto',
        fechaCreacion: existing?.fechaCreacion || new Date().toISOString(),
        bingoPrecios: existing?.bingoPrecios || config.bingoPrecios || DEFAULT_BINGO_PRECIOS,
        permitirVentaSinPagar: existing?.permitirVentaSinPagar ?? true,
        impresion: existing?.impresion || impresionConfig || DEFAULT_IMPRESION_CONFIG,
      };

      const saved = await saveEvento(payload);
      await loadData();
      if (saved.activo) {
        setEventConfig(saved);
        onConfigUpdated(saved);
      }
      setIsEventoModalOpen(false);
      resetEventoForm();
      showNotice(
        editingEventoId
          ? '¡Datos del evento actualizados en la base de datos!'
          : '¡Nuevo evento creado exitosamente en la base de datos!'
      );
    } finally {
      setIsSavingEvento(false);
    }
  };

  const handleSelectActiveEvento = async (ev: ConfiguracionEvento) => {
    if (!ev.id) return;
    const activated = await activarEvento(ev.id);
    await loadData();
    if (activated) {
      setEventConfig(activated);
      onConfigUpdated(activated);
      setFiltroEventoMetricas(activated.id || 'todos');
      showNotice(`¡Evento "${activated.nombreEvento}" seleccionado como ACTIVO / ABIERTO!`);
    }
  };

  const handleCloseEvento = async (ev: ConfiguracionEvento) => {
    if (!ev.id) return;
    await desactivarEvento(ev.id);
    await loadData();
    showNotice(`Evento "${ev.nombreEvento}" marcado como finalizado/inactivo.`);
  };

  const handleDeleteEvento = (ev: ConfiguracionEvento) => {
    if (!ev.id) return;
    setConfirmationModal({
      isOpen: true,
      message: `¿Seguro que deseas eliminar el evento "${ev.nombreEvento}"? Las ventas registradas conservarán su historial.`,
      onConfirm: async () => {
        await deleteEvento(ev.id!);
        await loadData();
        showNotice(`Evento "${ev.nombreEvento}" eliminado.`);
      },
    });
  };

  const [btConfigError, setBtConfigError] = useState<string | null>(null);
  const [isBusyBt, setIsBusyBt] = useState(false);

  const handleSaveImpresionConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtConfigError(null);
    const metodo = impresionConfig.metodoImpresion || 'bluetooth';
    const activeBtName =
      getConnectedPrinterName() ||
      impresionConfig.impresoraBluetoothNombre ||
      getSavedBluetoothPrinterName() ||
      '';

    if (metodo === 'bluetooth' && !activeBtName) {
      setBtConfigError(
        'Para usar el modo Bluetooth, primero debes vincular una impresora térmica Bluetooth pulsando "Vincular Impresora Bluetooth".'
      );
      return;
    }

    const updatedImpresion: ConfiguracionImpresion = {
      ...impresionConfig,
      metodoImpresion: metodo,
      impresoraBluetoothNombre: metodo === 'bluetooth' ? activeBtName : impresionConfig.impresoraBluetoothNombre || '',
      impresoraConfigurada: metodo === 'sistema' ? true : Boolean(activeBtName),
    };

    const updated: ConfiguracionEvento = {
      ...eventConfig,
      impresion: updatedImpresion,
    };
    setImpresionConfig(updatedImpresion);
    setEventConfig(updated);
    await saveConfiguracionEvento(updated);
    await loadData();
    onConfigUpdated(updated);
    showNotice('¡Configuración de impresora y opciones de impresión guardadas!');
  };

  const handleConnectBluetoothPrinter = async () => {
    setIsBusyBt(true);
    setBtConfigError(null);
    try {
      const printerName = await connectBluetoothPrinter(true);
      const updatedImpresion: ConfiguracionImpresion = {
        ...impresionConfig,
        metodoImpresion: 'bluetooth',
        impresoraBluetoothNombre: printerName,
        impresoraConfigurada: true,
      };
      const updated: ConfiguracionEvento = {
        ...eventConfig,
        impresion: updatedImpresion,
      };
      setImpresionConfig(updatedImpresion);
      setEventConfig(updated);
      await saveConfiguracionEvento(updated);
      onConfigUpdated(updated);
      showNotice(`¡Impresora Bluetooth "${printerName}" vinculada y configurada!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel')) {
        setBtConfigError(msg || 'No se pudo vincular la impresora Bluetooth.');
      }
    } finally {
      setIsBusyBt(false);
    }
  };

  const handleDisconnectBluetoothPrinter = async () => {
    disconnectBluetoothPrinter();
    setBtConfigError(null);
    const updatedImpresion: ConfiguracionImpresion = {
      ...impresionConfig,
      impresoraBluetoothNombre: '',
      impresoraConfigurada: impresionConfig.metodoImpresion === 'sistema',
    };
    const updated: ConfiguracionEvento = {
      ...eventConfig,
      impresion: updatedImpresion,
    };
    setImpresionConfig(updatedImpresion);
    setEventConfig(updated);
    await saveConfiguracionEvento(updated);
    onConfigUpdated(updated);
    showNotice('Impresora Bluetooth desvinculada.');
  };

  const aplicarPresetAhorro = () => {
    setImpresionConfig((prev) => ({
      ...prev,
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
      anchoPapel: prev.anchoPapel || '58mm',
    }));
  };

  const aplicarPresetCompleto = () => {
    setImpresionConfig((prev) => ({
      ...prev,
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
      anchoPapel: prev.anchoPapel || '58mm',
    }));
  };

  const handleTestBluetoothPrinter = async () => {
    setIsBusyBt(true);
    setBtConfigError(null);
    try {
      const { printerName } = await printTestTicketBluetooth(
        { ...eventConfig, impresion: impresionConfig },
        impresionConfig.anchoPapel || '58mm'
      );
      const updatedImpresion: ConfiguracionImpresion = {
        ...impresionConfig,
        metodoImpresion: 'bluetooth',
        impresoraBluetoothNombre: printerName,
        impresoraConfigurada: true,
      };
      const updated: ConfiguracionEvento = {
        ...eventConfig,
        impresion: updatedImpresion,
      };
      setImpresionConfig(updatedImpresion);
      setEventConfig(updated);
      await saveConfiguracionEvento(updated);
      onConfigUpdated(updated);
      showNotice(`¡Ticket de prueba enviado a la impresora Bluetooth "${printerName}"!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel')) {
        setBtConfigError(msg || 'Error al imprimir ticket de prueba.');
      }
    } finally {
      setIsBusyBt(false);
    }
  };

  const showNotice = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // ---- User management ----
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    setIsSavingUser(true);
    try {
      const result = await signUp(
        newUserEmail,
        newUserPassword,
        newUserName || newUserEmail.split('@')[0],
        newUserRole,
        newUserPermisos,
        user?.email || undefined
      );
      if (result.success) {
        await loadData();
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserName('');
        setNewUserRole('cajero');
        setNewUserPermisos(DEFAULT_PERMISOS_BY_ROLE['cajero']);
        setIsUserModalOpen(false);
        showNotice('¡Usuario registrado y permisos asignados exitosamente!');
      } else {
        showNotice('Error: ' + (result.error || 'No se pudo registrar el usuario'));
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleStartEditUser = (profile: AppUserProfile) => {
    if (!canManageUsers) return;
    setEditingUserId(profile.uid);
    setEditUserRole(profile.role);
    setEditUserPermisos({
      ...DEFAULT_PERMISOS_BY_ROLE[profile.role],
      ...(profile.permisos || {}),
    });
    setIsUserEditModalOpen(true);
  };

  const handleSaveUserPermisos = async (uid: string) => {
    if (!canManageUsers) return;
    setIsSavingUser(true);
    try {
      await updateUserProfilePermissions(uid, editUserRole, editUserPermisos);
      if (uid === user?.uid) {
        await refreshUserProfile();
      }
      await loadData();
      setEditingUserId(null);
      setIsUserEditModalOpen(false);
      showNotice('¡Permisos del usuario actualizados!');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!canManageUsers) return;
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

  // ---- Helper: check if a sale record belongs to a given event ID ----
  const defaultLegacyEventId =
    eventosList.find((e) => e.id === 'evento-principal')?.id ||
    eventosList[eventosList.length - 1]?.id ||
    config.id ||
    '';

  const belongsToEvent = (item: { eventoId?: string }, targetEventId: string): boolean => {
    if (targetEventId === 'todos') return true;
    if (item.eventoId) return item.eventoId === targetEventId;
    return targetEventId === defaultLegacyEventId;
  };

  // Filtered sales for the selected event in Financial Metrics
  const ticketsMetricas = ticketsViandas.filter((t) =>
    belongsToEvent(t, filtroEventoMetricas)
  );
  const ticketsEventoMetricas = ticketsEventoVentas.filter((t) =>
    belongsToEvent(t, filtroEventoMetricas)
  );
  const bingoMetricas = tarjetasBingo.filter((b) =>
    belongsToEvent(b, filtroEventoMetricas)
  );

  // ---- Financial calculations by payment method (for selected event filter) ----
  const totalViandasPagadas = ticketsMetricas
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.total, 0);

  const totalTicketsEventoPagados = ticketsEventoMetricas
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.total, 0);

  const totalBingoPagado = bingoMetricas
    .filter((t) => t.estadoPago === 'pagado')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const totalViandasPendiente = ticketsMetricas
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.total, 0);

  const totalTicketsEventoPendiente = ticketsEventoMetricas
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.total, 0);

  const totalBingoPendiente = bingoMetricas
    .filter((t) => t.estadoPago === 'pendiente')
    .reduce((acc, t) => acc + t.precioCobrado, 0);

  const totalRecaudadoGlobal = totalViandasPagadas + totalTicketsEventoPagados + totalBingoPagado;

  // Breakdown by modalidad de pago (uses dynamic list, scoped to selected event)
  const metricasPorModalidad = (modalidades.length > 0 ? modalidades : MODALIDADES_ACTIVAS.map(id => ({ id, nombre: MODALIDAD_CONFIG[id]?.label || id, icono: MODALIDAD_CONFIG[id]?.icon || '💳', gradient: MODALIDAD_CONFIG[id]?.gradient || 'from-slate-500 to-slate-600', color: 'slate', activo: true, orden: 0 }))).map((mod) => {
    const modId = typeof mod === 'string' ? mod : mod.id;
    const modLabel = typeof mod === 'string' ? (MODALIDAD_CONFIG[mod]?.label || mod) : mod.nombre;
    const modIcon = typeof mod === 'string' ? (MODALIDAD_CONFIG[mod]?.icon || '💳') : mod.icono;
    const modGradient = typeof mod === 'string' ? (MODALIDAD_CONFIG[mod]?.gradient || 'from-slate-500 to-slate-600') : mod.gradient;
    const viandasMod = ticketsMetricas
      .filter((t) => t.modalidadPago === modId)
      .reduce((acc, t) => acc + t.total, 0);
    const ticketsEvMod = ticketsEventoMetricas
      .filter((t) => t.modalidadPago === modId)
      .reduce((acc, t) => acc + t.total, 0);
    const bingoMod = bingoMetricas
      .filter((t) => t.modalidadPago === modId)
      .reduce((acc, t) => acc + t.precioCobrado, 0);
    const ticketCount =
      ticketsMetricas.filter((t) => t.modalidadPago === modId).length +
      ticketsEventoMetricas.filter((t) => t.modalidadPago === modId).length;
    const bingoCount = bingoMetricas.filter((t) => t.modalidadPago === modId).length;
    return {
      modalidad: modId,
      label: modLabel,
      icon: modIcon,
      gradient: modGradient,
      viandas: viandasMod + ticketsEvMod,
      bingo: bingoMod,
      total: viandasMod + ticketsEvMod + bingoMod,
      ticketCount,
      bingoCount,
    };
  });

  const grandTotalPorModalidad = metricasPorModalidad.reduce((s, m) => s + m.total, 0);

  // Breakdown grouped by Event
  const resumenPorEvento = eventosList.map((ev) => {
    const evId = ev.id || '';
    const evTickets = ticketsViandas.filter((t) => belongsToEvent(t, evId));
    const evTicketsEvento = ticketsEventoVentas.filter((t) => belongsToEvent(t, evId));
    const evBingo = tarjetasBingo.filter((b) => belongsToEvent(b, evId));
    const viandasCobrado =
      evTickets
        .filter((t) => t.estadoPago === 'pagado')
        .reduce((acc, t) => acc + t.total, 0) +
      evTicketsEvento
        .filter((t) => t.estadoPago === 'pagado')
        .reduce((acc, t) => acc + t.total, 0);
    const bingoCobrado = evBingo
      .filter((b) => b.estadoPago === 'pagado')
      .reduce((acc, b) => acc + b.precioCobrado, 0);
    const pendiente =
      evTickets.filter((t) => t.estadoPago === 'pendiente').reduce((acc, t) => acc + t.total, 0) +
      evTicketsEvento.filter((t) => t.estadoPago === 'pendiente').reduce((acc, t) => acc + t.total, 0) +
      evBingo.filter((b) => b.estadoPago === 'pendiente').reduce((acc, b) => acc + b.precioCobrado, 0);
    const totalTarjetas = evBingo.reduce(
      (acc, b) => acc + (b.cantidad || (b.numerosTarjetas ? b.numerosTarjetas.length : 1)),
      0
    );
    return {
      evento: ev,
      ticketsCount: evTickets.length + evTicketsEvento.length,
      tarjetasCount: totalTarjetas,
      viandasCobrado,
      bingoCobrado,
      pendiente,
      totalCobrado: viandasCobrado + bingoCobrado,
    };
  });

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      config: eventConfig,
      viandasProductos: viandas,
      ticketsProductos,
      ticketsViandas,
      ticketsEventoVentas,
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

  const iglesiaPermKeys: (keyof UserPermissions)[] = [
    'puedeGestionarMembresia',
    'puedeGestionarSedes',
    'puedeGestionarGrupos',
    'puedeGestionarMinisterios',
    'puedeRegistrarAsistencia',
    'puedeVerMetricasIglesia',
    'puedeGestionarUsuarios',
  ];
  const eventosPermKeys: (keyof UserPermissions)[] = [
    'puedeAccederVentas',
    'puedeVenderViandas',
    'puedeVenderTickets',
    'puedeVenderBingo',
    'puedeVerSorteos',
    'puedeVerificacion',
    'puedeAdministrar',
    'puedeVerMetricas',
  ];
  const permKey: (keyof UserPermissions)[] = [...iglesiaPermKeys, ...eventosPermKeys];
  const permLabels: Record<keyof UserPermissions, string> = {
    puedeGestionarMembresia: 'Padrón de Membresía',
    puedeGestionarSedes: 'Sedes y Ubicaciones',
    puedeGestionarGrupos: 'Grupos y Pastorales',
    puedeGestionarMinisterios: 'Gestión de Ministerios',
    puedeRegistrarAsistencia: 'Asistencia por Reuniones',
    puedeVerMetricasIglesia: 'Métricas de Asistencia',
    puedeGestionarUsuarios: 'Usuarios y Permisos',
    puedeAccederVentas: 'Ventas',
    puedeVenderViandas: 'Viandas',
    puedeVenderTickets: 'Tickets',
    puedeVenderBingo: 'Tarjetas Bingo',
    puedeVerSorteos: 'Sorteos',
    puedeVerificacion: 'Verificación',
    puedeAdministrar: 'Administración',
    puedeVerMetricas: 'Métricas Financieras',
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
          ? viandas.filter((v) => {
            const preciosV = getPreciosVianda(v);
            return (
              v.nombre.toLowerCase().includes(q) ||
              (v.descripcion || '').toLowerCase().includes(q) ||
              (v.categoria || '').toLowerCase().includes(q) ||
              preciosV.some((p) => (p.etiqueta || '').toLowerCase().includes(q))
            );
          })
          : viandas;

        const badgeColorStyles = [
          'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
          'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900 text-orange-900 dark:text-orange-200',
          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
          'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200',
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200',
          'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200',
        ];

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
                    Gestiona los platos, bebidas y combos con uno o múltiples precios de venta
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
                    placeholder="Buscar vianda, categoría, tarifa..."
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
            <AdaptiveDataView
              items={filteredViandas}
              pageSize={15}
              itemLabel="viandas"
              emptyState={
                <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                    {q ? `No se encontraron viandas para "${searchVianda}"` : 'No hay viandas registradas aún.'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nueva Vianda" para registrar el primer plato.'}
                  </p>
                </div>
              }
              renderTable={(visibleViandas) => (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3.5 px-4 whitespace-nowrap">Plato / Producto</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Categoría</th>
                      <th className="py-3.5 px-4">Descripción</th>
                      <th className="py-3.5 px-4">Tarifas y Precios</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {visibleViandas.map((v) => {
                      const preciosVianda = getPreciosVianda(v);
                      return (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                            !v.activo ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {v.nombre}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {v.categoria ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                {v.categoria}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            <div>{v.descripcion || '—'}</div>
                            {v.descripcionImpresion && (
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 truncate">
                                🖨️ Impresión: {v.descripcionImpresion}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {preciosVianda.map((p, idx) => (
                                <span
                                  key={p.id || idx}
                                  className={`px-2 py-0.5 rounded-lg border font-bold text-[11px] whitespace-nowrap ${
                                    badgeColorStyles[idx % badgeColorStyles.length]
                                  }`}
                                >
                                  {p.etiqueta}: {formatPrecio(p.monto)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                v.activo
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {v.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              renderCards={(visibleViandas) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleViandas.map((v) => {
                    const preciosVianda = getPreciosVianda(v);
                    return (
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
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  preciosVianda.length > 1
                                    ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {preciosVianda.length === 1
                                  ? '1 Precio'
                                  : `${preciosVianda.length} Precios`}
                              </span>
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
                          {v.descripcionImpresion && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                              🖨️ Impresión: {v.descripcionImpresion}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 text-xs">
                          {preciosVianda.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className={`px-2.5 py-1 rounded-lg border font-bold ${
                                badgeColorStyles[idx % badgeColorStyles.length]
                              }`}
                            >
                              {p.etiqueta}: {formatPrecio(p.monto)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            />

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
                    Descripción para la Impresión <span className="text-slate-400 font-normal">(reemplaza el nombre del producto en el ticket)</span>
                  </label>
                  <input
                    type="text"
                    value={vDescImpresion}
                    onChange={(e) => setVDescImpresion(e.target.value)}
                    placeholder="Ej. 1 POLLO C/PAPAS (si se deja vacío, usa el nombre del plato)"
                    className="w-full px-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl"
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

                {/* Lista Dinámica de Precios */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Tarifas y Precios ({vPrecios.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Agrega todos los precios necesarios (ej. General, Socio, Preventa, Media Porción)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrecioVianda}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-black text-xs flex items-center gap-1.5 transition flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar Precio
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {vPrecios.map((precioItem, idx) => (
                      <div
                        key={precioItem.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex items-end gap-2"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Etiqueta Precio #{idx + 1} *
                          </label>
                          <input
                            type="text"
                            required
                            value={precioItem.etiqueta}
                            onChange={(e) =>
                              handleChangePrecioVianda(precioItem.id, 'etiqueta', e.target.value)
                            }
                            placeholder={idx === 0 ? 'General' : idx === 1 ? 'Socio / Preventa' : `Tarifa ${idx + 1}`}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                          />
                        </div>

                        <div className="w-32 sm:w-36">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Monto #{idx + 1} *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={precioItem.monto}
                            onChange={(e) =>
                              handleChangePrecioVianda(precioItem.id, 'monto', e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-amber-600 dark:text-amber-400"
                          />
                        </div>

                        {vPrecios.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrecioVianda(precioItem.id)}
                            title="Quitar este precio"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition mb-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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

      {/* TAB 1B: CATÁLOGO DE TICKETS Y PRECIOS */}
      {subTab === 'tickets' && (() => {
        const q = searchTicket.trim().toLowerCase();
        const filteredTicketsProds = q
          ? ticketsProductos.filter((t) => {
              const preciosT = getPreciosTicket(t);
              return (
                t.nombre.toLowerCase().includes(q) ||
                (t.descripcion || '').toLowerCase().includes(q) ||
                (t.descripcionImpresion || '').toLowerCase().includes(q) ||
                (t.categoria || '').toLowerCase().includes(q) ||
                preciosT.some((p) => (p.etiqueta || '').toLowerCase().includes(q))
              );
            })
          : ticketsProductos;

        const badgeColorStyles = [
          'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900 text-cyan-900 dark:text-cyan-200',
          'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200',
          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
          'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200',
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200',
          'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200',
        ];

        return (
          <div className="space-y-5">
            {/* Header Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Catálogo de Tickets y Precios ({filteredTicketsProds.length}{q ? ` de ${ticketsProductos.length}` : ''})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gestiona entradas, bonos, rifas y tickets especiales con uno o varios precios y descripción de impresión
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:w-auto w-full">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTicket}
                    onChange={(e) => setSearchTicket(e.target.value)}
                    placeholder="Buscar ticket, categoría, tarifa..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                  {searchTicket && (
                    <button
                      type="button"
                      onClick={() => setSearchTicket('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetTicketProdForm();
                    setIsTicketProdModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black rounded-xl shadow-md shadow-cyan-500/20 transition flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Ticket
                </button>
              </div>
            </div>

            {/* List of Tickets Productos */}
            <AdaptiveDataView
              items={filteredTicketsProds}
              pageSize={15}
              itemLabel="tickets"
              emptyState={
                <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                    {q ? `No se encontraron tickets para "${searchTicket}"` : 'No hay tickets registrados aún.'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nuevo Ticket" para registrar el primero.'}
                  </p>
                </div>
              }
              renderTable={(visibleTickets) => (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3.5 px-4 whitespace-nowrap">Ticket / Bono</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Categoría</th>
                      <th className="py-3.5 px-4">Descripción / Impresión</th>
                      <th className="py-3.5 px-4">Tarifas y Precios</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {visibleTickets.map((t) => {
                      const preciosTicket = getPreciosTicket(t);
                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                            !t.activo ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {t.nombre}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {t.categoria ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                                {t.categoria}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            <div>{t.descripcion || '—'}</div>
                            {t.descripcionImpresion && (
                              <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5 truncate">
                                🖨️ Impresión: {t.descripcionImpresion}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {preciosTicket.map((p, idx) => (
                                <span
                                  key={p.id || idx}
                                  className={`px-2 py-0.5 rounded-lg border font-bold text-[11px] whitespace-nowrap ${
                                    badgeColorStyles[idx % badgeColorStyles.length]
                                  }`}
                                >
                                  {p.etiqueta}: {formatPrecio(p.monto)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                t.activo
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {t.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditTicketProd(t)}
                                className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-lg transition"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTicketProd(t.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              renderCards={(visibleTickets) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleTickets.map((t) => {
                    const preciosTicket = getPreciosTicket(t);
                    return (
                      <div
                        key={t.id}
                        className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 hover:border-cyan-500/40 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                {t.nombre}
                              </h4>
                              {t.categoria && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                                  {t.categoria}
                                </span>
                              )}
                              {!t.activo && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                  Inactivo
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditTicketProd(t)}
                                className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-lg transition"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTicketProd(t.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {t.descripcion && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{t.descripcion}</p>
                          )}
                          {t.descripcionImpresion && (
                            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-1">
                              🖨️ Impresión: {t.descripcionImpresion}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 text-xs">
                          {preciosTicket.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className={`px-2.5 py-1 rounded-lg border font-bold ${
                                badgeColorStyles[idx % badgeColorStyles.length]
                              }`}
                            >
                              {p.etiqueta}: {formatPrecio(p.monto)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            />

            {/* Modal: Create / Edit Ticket Producto */}
            <Modal
              isOpen={isTicketProdModalOpen}
              onClose={() => {
                setIsTicketProdModalOpen(false);
                resetTicketProdForm();
              }}
              title={editingTicketProdId ? 'Editar Ticket / Bono' : 'Registrar Nuevo Ticket / Bono'}
              size="md"
            >
              <form onSubmit={handleSaveTicketProd} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Ticket / Entrada / Bono *
                  </label>
                  <input
                    type="text"
                    required
                    value={tNombre}
                    onChange={(e) => setTNombre(e.target.value)}
                    placeholder="Ej. Entrada General / Bono Contribución"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción Interna (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    placeholder="Ej. Acceso general al evento y participación en sorteo"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción para la Impresión <span className="text-slate-400 font-normal">(reemplaza el nombre del ticket en la impresión)</span>
                  </label>
                  <input
                    type="text"
                    value={tDescImpresion}
                    onChange={(e) => setTDescImpresion(e.target.value)}
                    placeholder="Ej. VALE 1 INGRESO GENERAL (si se deja vacío, usa el nombre del ticket)"
                    className="w-full px-3 py-2 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={tCategoria}
                    onChange={(e) => setTCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Entradas">Entradas</option>
                    <option value="Bonos">Bonos Contribución</option>
                    <option value="Sorteos">Rifas / Sorteos</option>
                    <option value="Consumiciones">Vale Consumición</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Lista Dinámica de Precios */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Tarifas y Precios ({tPrecios.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Agrega todos los precios necesarios (ej. General, Socio, Preventa, Familiar)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrecioTicket}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-black text-xs flex items-center gap-1.5 transition flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar Precio
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {tPrecios.map((precioItem, idx) => (
                      <div
                        key={precioItem.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex items-end gap-2"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Etiqueta Precio #{idx + 1} *
                          </label>
                          <input
                            type="text"
                            required
                            value={precioItem.etiqueta}
                            onChange={(e) =>
                              handleChangePrecioTicket(precioItem.id, 'etiqueta', e.target.value)
                            }
                            placeholder={idx === 0 ? 'General' : idx === 1 ? 'Socio / Preventa' : `Tarifa ${idx + 1}`}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                          />
                        </div>

                        <div className="w-32 sm:w-36">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Monto #{idx + 1} *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={precioItem.monto}
                            onChange={(e) =>
                              handleChangePrecioTicket(precioItem.id, 'monto', e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-cyan-600 dark:text-cyan-400"
                          />
                        </div>

                        {tPrecios.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrecioTicket(precioItem.id)}
                            title="Quitar este precio"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition mb-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tActivo}
                      onChange={(e) => setTActivo(e.target.checked)}
                      className="rounded text-cyan-500"
                    />
                    <span className="font-bold">Ticket disponible para venta</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTicketProdModalOpen(false);
                      resetTicketProdForm();
                    }}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTicketProd}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSavingTicketProd ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingTicketProdId ? 'Guardar Cambios' : 'Registrar Ticket'}
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
                Define tarifas con dos decimales y la descripción que se imprimirá en las tarjetas de bingo.
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

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Descripción para la Impresión <span className="text-slate-400 font-normal">(reemplaza "Tarjeta de Bingo" en el ticket impreso)</span>
              </label>
              <input
                type="text"
                value={bingoPrecios.descripcionImpresion || ''}
                onChange={(e) =>
                  setBingoPrecios((prev) => ({ ...prev, descripcionImpresion: e.target.value }))
                }
                placeholder="Ej. CARTÓN DE BINGO OFICIAL (si se deja vacío, usa el título por defecto)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingBingoPrecios}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/25 transition text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingBingoPrecios ? (
                <>
                  <LoadingSpinner size="sm" color="text-white" />
                  <span>Guardando Precios de Bingo...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Precios de Bingo</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE EVENTOS (CREAR, EDITAR, SELECCIONAR EVENTO ACTIVO/ABIERTO) */}
      {subTab === 'evento' && (() => {
        const q = searchEvento.trim().toLowerCase();
        const filteredEventos = q
          ? eventosList.filter(
            (ev) =>
              (ev.nombreEvento || '').toLowerCase().includes(q) ||
              (ev.subtitulo || '').toLowerCase().includes(q) ||
              (ev.lugar || '').toLowerCase().includes(q) ||
              (ev.fechaEvento || '').toLowerCase().includes(q)
          )
          : eventosList;

        const eventoActivoActual = eventosList.find((ev) => ev.activo);

        return (
          <div className="space-y-5">
            {/* Active Event Status Banner */}
            <div
              className={`rounded-3xl p-5 sm:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                eventoActivoActual
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800/70'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    eventoActivoActual
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {eventoActivoActual
                        ? 'Evento Activo / Abierto Actualmente'
                        : 'Ningún Evento Activo Seleccionado'}
                    </span>
                    {eventoActivoActual && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                        VISIBLE EN LANDING Y VENTAS
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base sm:text-lg mt-0.5">
                    {eventoActivoActual
                      ? eventoActivoActual.nombreEvento
                      : 'Crea un evento o selecciona uno existente como Activo / Abierto'}
                  </h4>
                  {eventoActivoActual && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {eventoActivoActual.subtitulo ? `${eventoActivoActual.subtitulo} · ` : ''}
                      {eventoActivoActual.lugar ? `${eventoActivoActual.lugar} · ` : ''}
                      Fecha: <strong className="font-mono">{eventoActivoActual.fechaEvento || 'Sin fecha'}</strong>
                    </p>
                  )}
                </div>
              </div>

              {eventoActivoActual && (
                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => handleEditEvento(eventoActivoActual)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                    Editar Activo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCloseEvento(eventoActivoActual)}
                    className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition"
                  >
                    Cerrar Evento
                  </button>
                </div>
              )}
            </div>

            {/* Header Bar: Title + Search + Create Button */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Eventos Registrados ({filteredEventos.length}
                    {q ? ` de ${eventosList.length}` : ''})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea y gestiona eventos en la base de datos y selecciona cuál está activo/abierto
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:w-auto w-full">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchEvento}
                    onChange={(e) => setSearchEvento(e.target.value)}
                    placeholder="Buscar evento por nombre, lugar o fecha..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  {searchEvento && (
                    <button
                      type="button"
                      onClick={() => setSearchEvento('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateEvento}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 text-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Evento
                </button>
              </div>
            </div>

            {/* Events Adaptive View */}
            <AdaptiveDataView
              items={filteredEventos}
              pageSize={15}
              itemLabel="eventos"
              emptyState={
                <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                    {q
                      ? `No se encontraron eventos para "${searchEvento}"`
                      : 'No hay eventos registrados en la base de datos.'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Haz clic en &ldquo;Nuevo Evento&rdquo; para crear y activar el primer evento.
                  </p>
                </div>
              }
              renderTable={(visibleEventos) => (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3.5 px-4 whitespace-nowrap">Evento</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Fecha / Lugar</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-center">Ventas</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-right">Cobrado</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {visibleEventos.map((ev) => {
                      const evId = ev.id || '';
                      const evTickets = ticketsViandas.filter((t) => belongsToEvent(t, evId));
                      const evBingo = tarjetasBingo.filter((b) => belongsToEvent(b, evId));
                      const totalTarjetas = evBingo.reduce(
                        (acc, b) => acc + (b.cantidad || (b.numerosTarjetas ? b.numerosTarjetas.length : 1)),
                        0
                      );
                      const totalCobrado =
                        evTickets
                          .filter((t) => t.estadoPago === 'pagado')
                          .reduce((acc, t) => acc + t.total, 0) +
                        evBingo
                          .filter((b) => b.estadoPago === 'pagado')
                          .reduce((acc, b) => acc + b.precioCobrado, 0);

                      return (
                        <tr
                          key={evId}
                          className={`transition ${
                            ev.activo
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {ev.nombreEvento}
                            </span>
                            {ev.subtitulo && (
                              <span className="text-[11px] text-slate-500 block">{ev.subtitulo}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-600 dark:text-purple-400 block">
                                <Calendar className="w-3 h-3" /> {ev.fechaEvento || 'Sin fecha'}
                              </span>
                              {ev.lugar && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 block">
                                  <MapPin className="w-3 h-3 text-purple-500" /> {ev.lugar}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                                {evTickets.length} viandas
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                                {totalTarjetas} bingo
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-black text-emerald-600 dark:text-emerald-400">
                            {formatPrecio(totalCobrado)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {ev.activo ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> Activo / Abierto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Cerrado / Inactivo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {!ev.activo ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelectActiveEvento(ev)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-sm transition inline-flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> Activar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCloseEvento(ev)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-700 dark:text-slate-300 text-[11px] font-bold transition"
                                >
                                  Cerrar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEditEvento(ev)}
                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition"
                                title="Editar evento"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvento(ev)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Eliminar evento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              renderCards={(visibleEventos) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleEventos.map((ev) => {
                    const evId = ev.id || '';
                    const evTickets = ticketsViandas.filter((t) => belongsToEvent(t, evId));
                    const evBingo = tarjetasBingo.filter((b) => belongsToEvent(b, evId));
                    const totalTarjetas = evBingo.reduce(
                      (acc, b) => acc + (b.cantidad || (b.numerosTarjetas ? b.numerosTarjetas.length : 1)),
                      0
                    );
                    const totalCobrado =
                      evTickets
                        .filter((t) => t.estadoPago === 'pagado')
                        .reduce((acc, t) => acc + t.total, 0) +
                      evBingo
                        .filter((b) => b.estadoPago === 'pagado')
                        .reduce((acc, b) => acc + b.precioCobrado, 0);

                    return (
                      <div
                        key={evId}
                        className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 shadow-sm flex flex-col justify-between gap-4 transition ${
                          ev.activo
                            ? 'border-emerald-500 dark:border-emerald-500/80 ring-4 ring-emerald-500/10'
                            : 'border-slate-200 dark:border-slate-800 hover:border-purple-400/50'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ev.activo ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  <CheckCircle2 className="w-3 h-3" /> Activo / Abierto
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Cerrado / Inactivo
                                </span>
                              )}
                              {ev.fechaEvento && (
                                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
                                  <Calendar className="w-3 h-3" /> {ev.fechaEvento}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditEvento(ev)}
                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition"
                                title="Editar evento"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvento(ev)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Eliminar evento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-base">
                              {ev.nombreEvento}
                            </h4>
                            {ev.subtitulo && (
                              <p className="text-xs text-slate-500 font-medium">{ev.subtitulo}</p>
                            )}
                          </div>

                          {ev.lugar && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                              <span>{ev.lugar}</span>
                            </div>
                          )}

                          {/* Per-Event Sales Summary Badges */}
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-center">
                              <span className="block text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                                Viandas
                              </span>
                              <span className="font-black text-xs text-slate-900 dark:text-white">
                                {evTickets.length} tickets
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 text-center">
                              <span className="block text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">
                                Bingo
                              </span>
                              <span className="font-black text-xs text-slate-900 dark:text-white">
                                {totalTarjetas} tarj.
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 text-center">
                              <span className="block text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                Cobrado
                              </span>
                              <span className="font-black text-xs text-emerald-700 dark:text-emerald-300">
                                {formatPrecio(totalCobrado)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          {!ev.activo ? (
                            <button
                              type="button"
                              onClick={() => handleSelectActiveEvento(ev)}
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Seleccionar como Evento Activo / Abierto
                            </button>
                          ) : (
                            <div className="w-full flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Evento en curso (Seleccionado)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCloseEvento(ev)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-700 dark:text-slate-300 text-xs font-bold transition"
                              >
                                Cerrar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            />

            {/* Modal: Create / Edit Evento */}
            <Modal
              isOpen={isEventoModalOpen}
              onClose={() => {
                setIsEventoModalOpen(false);
                resetEventoForm();
              }}
              title={editingEventoId ? 'Editar Evento' : 'Crear Nuevo Evento'}
              size="md"
            >
              <form onSubmit={handleSaveEventoModal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Oficial del Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={evForm.nombreEvento}
                    onChange={(e) =>
                      setEvForm((prev) => ({ ...prev, nombreEvento: e.target.value }))
                    }
                    placeholder="Ej. GRAN BINGO Y ALMUERZO FAMILIAR INA"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtítulo / Entidad Organizadora
                  </label>
                  <input
                    type="text"
                    value={evForm.subtitulo}
                    onChange={(e) =>
                      setEvForm((prev) => ({ ...prev, subtitulo: e.target.value }))
                    }
                    placeholder="Ej. Comunidad INA - Beneficio Anual"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha del Evento *
                    </label>
                    <input
                      type="date"
                      required
                      value={evForm.fechaEvento}
                      onChange={(e) =>
                        setEvForm((prev) => ({ ...prev, fechaEvento: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lugar / Salón *
                    </label>
                    <input
                      type="text"
                      required
                      value={evForm.lugar}
                      onChange={(e) =>
                        setEvForm((prev) => ({ ...prev, lugar: e.target.value }))
                      }
                      placeholder="Ej. Salón Principal INA"
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
                    value={evForm.mensajeTicket}
                    onChange={(e) =>
                      setEvForm((prev) => ({ ...prev, mensajeTicket: e.target.value }))
                    }
                    placeholder="¡Gracias por apoyar a nuestra comunidad!"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <label className="flex items-center justify-between p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl cursor-pointer">
                  <div>
                    <span className="font-black text-emerald-900 dark:text-emerald-200 block text-xs">
                      Establecer como Evento Activo / Abierto
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Se mostrará en el Landing Page y agrupará las nuevas ventas de viandas y bingo.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={evForm.activo}
                    onChange={(e) =>
                      setEvForm((prev) => ({ ...prev, activo: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-emerald-600"
                  />
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEventoModalOpen(false);
                      resetEventoForm();
                    }}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEvento}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSavingEvento ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingEventoId ? 'Guardar Cambios' : 'Crear Evento'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        );
      })()}

      {/* TAB 4: CONFIGURACIÓN DE IMPRESIÓN */}
      {subTab === 'impresion' && (() => {
        const metodoActual = impresionConfig.metodoImpresion || 'bluetooth';
        const linkedBtName =
          getConnectedPrinterName() ||
          impresionConfig.impresoraBluetoothNombre ||
          getSavedBluetoothPrinterName();
        const isCurrentConfigured =
          metodoActual === 'sistema'
            ? Boolean(impresionConfig.impresoraConfigurada)
            : Boolean(linkedBtName);

        return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Opciones y Configuración de Impresión
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configura tu impresora térmica Bluetooth o del sistema y personaliza el ticket.
                    </p>
                  </div>
                </div>
                {isCurrentConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Impresora Configurada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-extrabold self-start sm:self-auto">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Impresora No Configurada
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveImpresionConfig} className="mt-5 space-y-4 text-xs">
                {/* 1. Configuración de Dispositivo y Modo de Impresión */}
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800/80 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-950 dark:text-blue-200 text-sm flex items-center gap-1.5">
                      <Bluetooth className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      1. Dispositivo y Método de Impresión
                    </span>
                  </div>

                  {/* Selector de Método: Bluetooth vs Sistema */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBtConfigError(null);
                        setImpresionConfig((prev) => ({
                          ...prev,
                          metodoImpresion: 'bluetooth',
                          impresoraConfigurada: Boolean(linkedBtName),
                        }));
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                        metodoActual === 'bluetooth'
                          ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 hover:border-blue-300'
                      }`}
                    >
                      <Bluetooth className={`w-4 h-4 mt-0.5 flex-shrink-0 ${metodoActual === 'bluetooth' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-xs">
                          Impresora Térmica Bluetooth
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Impresión directa desde celular o PC sin apps externas (ESC/POS)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBtConfigError(null);
                        setImpresionConfig((prev) => ({
                          ...prev,
                          metodoImpresion: 'sistema',
                          impresoraConfigurada: true,
                        }));
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition flex items-start gap-2.5 ${
                        metodoActual === 'sistema'
                          ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 hover:border-blue-300'
                      }`}
                    >
                      <Printer className={`w-4 h-4 mt-0.5 flex-shrink-0 ${metodoActual === 'sistema' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-black text-slate-900 dark:text-white text-xs">
                          Impresora del Sistema / Navegador
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Abre el diálogo de impresión del sistema (USB, Wi-Fi o PDF)
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Panel de Vinculación Bluetooth cuando el método es Bluetooth */}
                  {metodoActual === 'bluetooth' && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800/70 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                            Impresora Bluetooth Vinculada
                          </span>
                          {linkedBtName ? (
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {linkedBtName}
                            </span>
                          ) : (
                            <span className="font-bold text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5 mt-0.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Sin impresora vinculada (Requerido para imprimir)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusyBt}
                            onClick={handleConnectBluetoothPrinter}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <Bluetooth className="w-3.5 h-3.5" />
                            {linkedBtName ? 'Cambiar Impresora' : 'Vincular Impresora Bluetooth'}
                          </button>

                          {linkedBtName && (
                            <>
                              <button
                                type="button"
                                disabled={isBusyBt}
                                onClick={handleTestBluetoothPrinter}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Probar
                              </button>
                              <button
                                type="button"
                                disabled={isBusyBt}
                                onClick={handleDisconnectBluetoothPrinter}
                                className="px-2.5 py-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 text-slate-600 hover:text-red-600 font-bold rounded-xl text-xs transition cursor-pointer"
                              >
                                Desvincular
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {btConfigError && (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2 text-red-700 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>{btConfigError}</span>
                    </div>
                  )}

                  {/* Ancho de Rollo Térmico */}
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Ancho del Rollo Térmico:
                    </span>
                    <div className="inline-flex items-center rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 p-1 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setImpresionConfig((prev) => ({ ...prev, anchoPapel: '58mm' }))
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                          (impresionConfig.anchoPapel || '58mm') === '58mm'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        58mm (Portátil)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setImpresionConfig((prev) => ({ ...prev, anchoPapel: '80mm' }))
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-black transition ${
                          impresionConfig.anchoPapel === '80mm'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        80mm (Mostrador)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Accesos Rápidos / Ajustes Predefinidos */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Accesos Rápidos / Formato de Contenido
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
                  Vista Previa Exacta ({impresionConfig.anchoPapel || '58mm'})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {impresionConfig.modoAhorroPapel ? 'Modo Compacto' : 'Modo Normal'}
                </span>
              </div>

              {(() => {
                const samplePaper = impresionConfig.anchoPapel || '58mm';
                const sampleLayout = buildThermalTicketLines({
                  tipo: 'vianda',
                  ticketVianda: {
                    id: 'sample-1',
                    numeroTicket: 'V-0001',
                    comprador: 'Juan Carlos Perez',
                    telefono: '11 2345-6789',
                    items: [
                      {
                        productoId: 'v-1',
                        nombre: 'Pollo al Espiedo con Papas',
                        precioUnitario: 5000,
                        etiquetaPrecio: 'General',
                        cantidad: 1,
                        subtotal: 5000,
                      },
                    ],
                    total: 5000,
                    modalidadPago: 'efectivo',
                    estadoPago: 'pagado',
                    entregado: false,
                    fecha: new Date().toISOString(),
                    fechaFormateada: '12/10/26 16:30',
                  },
                  config: {
                    ...eventConfig,
                    impresion: impresionConfig,
                  },
                  anchoPapel: samplePaper,
                });

                return (
                  <div className="mt-4 p-4 bg-slate-200/70 dark:bg-slate-950 rounded-2xl flex justify-center overflow-x-auto">
                    <div
                      className="bg-white text-black shadow-md border border-slate-300 px-3 pt-4 pb-2 font-mono"
                      style={{
                        width: samplePaper === '58mm' ? '33ch' : '49ch',
                        maxWidth: '100%',
                        fontSize: samplePaper === '58mm' ? '11.5px' : '10.5px',
                        lineHeight: sampleLayout.compact ? '1.2' : '1.35',
                      }}
                    >
                      {sampleLayout.lines.map((line, idx) => {
                        const alignClass =
                          line.align === 'center' ? 'text-center' : 'text-left';
                        const boldClass = line.bold ? 'font-bold' : '';
                        const sizeClass =
                          line.size === 'double'
                            ? 'font-black text-base py-0.5 tracking-wide'
                            : line.size === 'double-height'
                            ? 'font-black text-[12.5px] py-0.5'
                            : '';
                        return (
                          <div
                            key={idx}
                            className={`whitespace-pre ${alignClass} ${boldClass} ${sizeClass}`}
                          >
                            {line.text || ' '}
                          </div>
                        );
                      })}
                      <div>
                        {Array.from({ length: sampleLayout.tearFeedLines }).map((_, idx) => (
                          <div key={`tear-${idx}`} className="whitespace-pre">
                            {' '}
                          </div>
                        ))}
                        <div className="border-t border-dashed border-slate-300 pt-1 text-center text-[10px] text-slate-400 select-none">
                          ✂ Espacio libre de corte ({sampleLayout.tearFeedLines} líneas)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 text-center">
                Previsualización idéntica carácter por carácter a la impresión térmica real.
              </div>
            </div>
          </div>
        </div>
        );
      })()}

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
            <AdaptiveDataView
              items={filteredModalidades}
              pageSize={15}
              itemLabel="modalidades"
              emptyState={
                <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                    {q ? `No se encontraron modalidades para "${searchModalidad}"` : 'No hay modalidades configuradas.'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nueva Modalidad" para agregar la primera.'}
                  </p>
                </div>
              }
              renderTable={(visibleItems) => (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase text-[10px] font-black border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3.5 px-4 whitespace-nowrap">Orden</th>
                      <th className="py-3.5 px-4">Modalidad</th>
                      <th className="py-3.5 px-4">Descripción</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Estado</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Operaciones</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Recaudado</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleItems.map((m) => {
                      const vTotal = ticketsViandas.filter((t) => t.modalidadPago === m.id).reduce((a, t) => a + t.total, 0);
                      const bTotal = tarjetasBingo.filter((t) => t.modalidadPago === m.id).reduce((a, t) => a + t.precioCobrado, 0);
                      const totalMod = vTotal + bTotal;
                      const ops = ticketsViandas.filter((t) => t.modalidadPago === m.id).length + tarjetasBingo.filter((t) => t.modalidadPago === m.id).length;

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${!m.activo ? 'opacity-60' : ''}`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-500 whitespace-nowrap">#{m.orden}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                                {m.icono}
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{m.nombre}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{m.descripcion || '—'}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {m.activo ? (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                ✓ Activa
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                                Inactiva
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {ops} ops
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatPrecio(totalMod)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleToggleModalidad(m.id, !m.activo)}
                                className={`p-2 rounded-lg transition ${m.activo
                                  ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                title={m.activo ? 'Desactivar' : 'Activar'}
                              >
                                {m.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              renderCards={(visibleItems) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleItems.map((m) => {
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
            />

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

      {/* TAB 6: METRICAS FINANCIERAS AGRUPADAS POR EVENTO */}
      {subTab === 'metricas' && (() => {
        const eventoFiltradoObj = eventosList.find((e) => e.id === filtroEventoMetricas);

        return (
          <div className="space-y-6">
            {/* Event Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Métricas Financieras por Evento
                  </h3>
                  <p className="text-xs text-slate-500">
                    {filtroEventoMetricas === 'todos'
                      ? 'Mostrando recaudación acumulada de todos los eventos'
                      : `Mostrando métricas del evento: ${eventoFiltradoObj?.nombreEvento || 'Evento seleccionado'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filtroEventoMetricas}
                  onChange={(e) => setFiltroEventoMetricas(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2.5 text-xs font-black bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="todos">📊 Todos los Eventos (Acumulado Global)</option>
                  {eventosList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.activo ? '🟢 [ACTIVO] ' : '⚪ '}
                      {ev.nombreEvento} {ev.fechaEvento ? `(${ev.fechaEvento})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Top summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
                <span className="text-xs uppercase font-bold text-white/80">Recaudación Cobrada</span>
                <div className="text-3xl font-black mt-2">
                  {formatPrecio(totalRecaudadoGlobal)}
                </div>
                <span className="text-xs text-white/80 mt-1 block">
                  {filtroEventoMetricas === 'todos'
                    ? 'Total acumulado en todos los eventos'
                    : `Cobrado en ${eventoFiltradoObj?.nombreEvento || 'este evento'}`}
                </span>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl">
                <span className="text-xs uppercase font-bold text-white/80">Total Viandas Pagadas</span>
                <div className="text-3xl font-black mt-2">
                  {formatPrecio(totalViandasPagadas)}
                </div>
                <span className="text-xs text-white/80 mt-1 block">
                  {ticketsMetricas.filter((t) => t.estadoPago === 'pagado').length} tickets cobrados
                </span>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
                <span className="text-xs uppercase font-bold text-white/80">Total Bingo Pagado</span>
                <div className="text-3xl font-black mt-2">
                  {formatPrecio(totalBingoPagado)}
                </div>
                <span className="text-xs text-white/80 mt-1 block">
                  {bingoMetricas
                    .filter((t) => t.estadoPago === 'pagado')
                    .reduce((acc, t) => acc + (t.cantidad || (t.numerosTarjetas ? t.numerosTarjetas.length : 1)), 0)}{' '}
                  tarjetas cobradas
                </span>
              </div>
            </div>

            {/* Breakdown Grouped by Event (Comparative Table) */}
            {resumenPorEvento.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white">
                        Resumen Financiero Agrupado por Evento
                      </h4>
                      <p className="text-xs text-slate-500">
                        Comparativa de ventas de viandas, tarjetas de bingo y recaudación por cada evento
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <AdaptiveDataView
                    items={resumenPorEvento}
                    pageSize={15}
                    itemLabel="eventos"
                    renderTable={(visibleItems) => (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-black border-b border-slate-100 dark:border-slate-800">
                            <th className="py-3 px-4 whitespace-nowrap">Evento</th>
                            <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                            <th className="py-3 px-4 text-right whitespace-nowrap">Viandas (Pagado)</th>
                            <th className="py-3 px-4 text-right whitespace-nowrap">Bingo (Pagado)</th>
                            <th className="py-3 px-4 text-right whitespace-nowrap">Pendiente</th>
                            <th className="py-3 px-4 text-right whitespace-nowrap">Total Cobrado</th>
                            <th className="py-3 px-4 text-center whitespace-nowrap">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {visibleItems.map((row) => {
                            const isSelected = filtroEventoMetricas === row.evento.id;
                            return (
                              <tr
                                key={row.evento.id}
                                className={`transition ${
                                  isSelected
                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="font-extrabold text-slate-900 dark:text-white">
                                    {row.evento.nombreEvento}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {row.evento.fechaEvento || 'Sin fecha'} · {row.evento.lugar || 'Sin lugar'}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {row.evento.activo ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                      Activo / Abierto
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                      Cerrado
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="font-bold text-amber-600 dark:text-amber-400">
                                    {formatPrecio(row.viandasCobrado)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{row.ticketsCount} tickets</div>
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {formatPrecio(row.bingoCobrado)}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{row.tarjetasCount} tarjetas</div>
                                </td>
                                <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                  {formatPrecio(row.pendiente)}
                                </td>
                                <td className="py-3.5 px-4 text-right font-black text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                  {formatPrecio(row.totalCobrado)}
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFiltroEventoMetricas(
                                        isSelected ? 'todos' : row.evento.id || 'todos'
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {isSelected ? 'Viendo Detalle' : 'Ver Detalle'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                    renderCards={(visibleItems) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {visibleItems.map((row) => {
                          const isSelected = filtroEventoMetricas === row.evento.id;
                          return (
                            <div
                              key={row.evento.id}
                              className={`p-4 rounded-2xl border transition ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                                    {row.evento.nombreEvento}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {row.evento.fechaEvento || 'Sin fecha'} · {row.evento.lugar || 'Sin lugar'}
                                  </div>
                                </div>
                                {row.evento.activo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    Activo / Abierto
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Cerrado
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Viandas ({row.ticketsCount})</span>
                                  <strong className="text-amber-600 dark:text-amber-400">{formatPrecio(row.viandasCobrado)}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Bingo ({row.tarjetasCount})</span>
                                  <strong className="text-indigo-600 dark:text-indigo-400">{formatPrecio(row.bingoCobrado)}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Pendiente</span>
                                  <strong className="text-rose-600 dark:text-rose-400">{formatPrecio(row.pendiente)}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Total Cobrado</span>
                                  <strong className="text-emerald-600 dark:text-emerald-400">{formatPrecio(row.totalCobrado)}</strong>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setFiltroEventoMetricas(
                                    isSelected ? 'todos' : row.evento.id || 'todos'
                                  )
                                }
                                className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100'
                                }`}
                              >
                                {isSelected ? 'Viendo Detalle' : 'Ver Detalle'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

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
                    <strong className="font-black">{ticketsMetricas.length}</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span>Total Tarjetas de Bingo Vendidas:</span>
                    <strong className="font-black">
                      {bingoMetricas.reduce(
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
        );
      })()}

      {/* TAB 7: USUARIOS & PERMISOS */}
      {subTab === 'usuarios' && (
        <div className="space-y-6">
          {!canManageUsers ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">Acceso Restringido</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                Necesitas el permiso <strong>Gestionar Usuarios y Permisos</strong> para acceder a este módulo.
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

            const setAllPermissions = (
              setter: React.Dispatch<React.SetStateAction<UserPermissions>>,
              value: boolean
            ) => {
              const updated = {} as UserPermissions;
              for (const k of permKey) {
                updated[k] = value;
              }
              setter(updated);
            };

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
                <AdaptiveDataView
                  items={filteredUsers}
                  pageSize={15}
                  itemLabel="usuarios"
                  emptyState={
                    <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                        {q ? `No se encontraron usuarios para "${searchUsuario}"` : 'No hay usuarios registrados aún.'}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {q ? 'Intenta con otro término de búsqueda.' : 'Haz clic en "Nuevo Usuario" para crear el primero.'}
                      </p>
                    </div>
                  }
                  renderTable={(visibleItems) => (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase text-[10px] font-black border-b border-slate-100 dark:border-slate-800">
                          <th className="py-3.5 px-4 whitespace-nowrap">Usuario</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Correo</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Rol / Estado</th>
                          <th className="py-3.5 px-4">Permisos Habilitados</th>
                          <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleItems.map((profile) => {
                          const rc = ROLE_CONFIG[profile.role] || ROLE_CONFIG.cajero;
                          const effectivePerms: UserPermissions = {
                            ...DEFAULT_PERMISOS_BY_ROLE[profile.role],
                            ...(profile.permisos || {}),
                          };
                          return (
                            <tr
                              key={profile.uid}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl bg-${rc.color}-100 dark:bg-${rc.color}-950/50 flex items-center justify-center flex-shrink-0`}>
                                    <ShieldCheck className={`w-4 h-4 text-${rc.color}-600`} />
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                                      {profile.displayName}
                                    </span>
                                    {profile.creadoPor && (
                                      <span className="text-[10px] text-slate-400">
                                        Por: {profile.creadoPor}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                {profile.email}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-${rc.color}-100 dark:bg-${rc.color}-950 text-${rc.color}-700 dark:text-${rc.color}-300`}>
                                    {rc.label}
                                  </span>
                                  {!profile.activo && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      Inactivo
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {permKey.map((k) => (
                                    <span
                                      key={k}
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${effectivePerms[k]
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 line-through'
                                        }`}
                                    >
                                      {permLabels[k]}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
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
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  renderCards={(visibleItems) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleItems.map((profile) => {
                        const rc = ROLE_CONFIG[profile.role] || ROLE_CONFIG.cajero;
                        const effectivePerms: UserPermissions = {
                          ...DEFAULT_PERMISOS_BY_ROLE[profile.role],
                          ...(profile.permisos || {}),
                        };
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
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${effectivePerms[k]
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
                />

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
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                          Permisos individuales
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAllPermissions(setNewUserPermisos, true)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-200 transition"
                          >
                            Todos
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllPermissions(setNewUserPermisos, false)}
                            className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] hover:bg-slate-300 transition"
                          >
                            Ninguno
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewUserPermisos(DEFAULT_PERMISOS_BY_ROLE[newUserRole])}
                            className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] hover:bg-indigo-200 transition"
                          >
                            Según Rol
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Módulos de Gestión de Iglesia INA
                        </span>
                        {iglesiaPermKeys.map((k) => (
                          <label key={k} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-900/60 cursor-pointer">
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

                      <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                          Módulos de Eventos
                        </span>
                        {eventosPermKeys.map((k) => (
                          <label key={k} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-900/60 cursor-pointer">
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

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                            Permisos individuales
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAllPermissions(setEditUserPermisos, true)}
                              className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] hover:bg-emerald-200 transition"
                            >
                              Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setAllPermissions(setEditUserPermisos, false)}
                              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] hover:bg-slate-300 transition"
                            >
                              Ninguno
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditUserPermisos(DEFAULT_PERMISOS_BY_ROLE[editUserRole])}
                              className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] hover:bg-indigo-200 transition"
                            >
                              Según Rol
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                            Módulos de Gestión de Iglesia INA
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {iglesiaPermKeys.map((k) => (
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

                        <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            Módulos de Eventos
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {eventosPermKeys.map((k) => (
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
