export type ModalidadPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mercadopago' | 'pendiente' | string;

export interface ModalidadPagoConfig {
  id: string;           // ej. 'efectivo', 'transferencia', o id personalizado
  nombre: string;       // ej. 'Efectivo', 'Mercado Pago'
  descripcion?: string; // ej. 'Pago en efectivo al momento'
  icono: string;        // emoji o texto corto
  activo: boolean;
  orden: number;        // para ordenar en los selectores
  gradient: string;     // clases CSS de gradiente
  color: string;        // color base para badges (emerald, blue, etc.)
}

export type UserRole = 'superadmin' | 'admin' | 'cajero' | 'visor';

export interface UserPermissions {
  puedeGestionarMembresia: boolean;
  puedeGestionarSedes: boolean;
  puedeGestionarGrupos: boolean;
  puedeGestionarMinisterios: boolean;
  puedeRegistrarAsistencia: boolean;
  puedeVerMetricasIglesia: boolean;
  puedeGestionarUsuarios: boolean;
  puedeVenderViandas: boolean;
  puedeVenderBingo: boolean;
  puedeVenderTickets: boolean;
  puedeVerSorteos: boolean;
  puedeVerificacion: boolean;
  puedeAdministrar: boolean;
  puedeVerMetricas: boolean;
}

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permisos: UserPermissions;
  activo: boolean;
  fechaCreacion: string;
  creadoPor?: string;
}

export const DEFAULT_PERMISOS_BY_ROLE: Record<UserRole, UserPermissions> = {
  superadmin: {
    puedeGestionarMembresia: true,
    puedeGestionarSedes: true,
    puedeGestionarGrupos: true,
    puedeGestionarMinisterios: true,
    puedeRegistrarAsistencia: true,
    puedeVerMetricasIglesia: true,
    puedeGestionarUsuarios: true,
    puedeVenderViandas: true,
    puedeVenderBingo: true,
    puedeVenderTickets: true,
    puedeVerSorteos: true,
    puedeVerificacion: true,
    puedeAdministrar: true,
    puedeVerMetricas: true,
  },
  admin: {
    puedeGestionarMembresia: true,
    puedeGestionarSedes: true,
    puedeGestionarGrupos: true,
    puedeGestionarMinisterios: true,
    puedeRegistrarAsistencia: true,
    puedeVerMetricasIglesia: true,
    puedeGestionarUsuarios: true,
    puedeVenderViandas: true,
    puedeVenderBingo: true,
    puedeVenderTickets: true,
    puedeVerSorteos: true,
    puedeVerificacion: true,
    puedeAdministrar: true,
    puedeVerMetricas: true,
  },
  cajero: {
    puedeGestionarMembresia: false,
    puedeGestionarSedes: false,
    puedeGestionarGrupos: false,
    puedeGestionarMinisterios: false,
    puedeRegistrarAsistencia: true,
    puedeVerMetricasIglesia: false,
    puedeGestionarUsuarios: false,
    puedeVenderViandas: true,
    puedeVenderBingo: true,
    puedeVenderTickets: true,
    puedeVerSorteos: false,
    puedeVerificacion: true,
    puedeAdministrar: false,
    puedeVerMetricas: false,
  },
  visor: {
    puedeGestionarMembresia: false,
    puedeGestionarSedes: false,
    puedeGestionarGrupos: false,
    puedeGestionarMinisterios: false,
    puedeRegistrarAsistencia: false,
    puedeVerMetricasIglesia: true,
    puedeGestionarUsuarios: false,
    puedeVenderViandas: false,
    puedeVenderBingo: false,
    puedeVenderTickets: false,
    puedeVerSorteos: true,
    puedeVerificacion: true,
    puedeAdministrar: false,
    puedeVerMetricas: true,
  },
};

export const MODALIDADES_PAGO_LABELS: Record<ModalidadPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mercadopago: 'Mercado Pago',
  pendiente: 'Pendiente',
};

export const MODALIDADES_PAGO_COLORS: Record<ModalidadPago, string> = {
  efectivo: 'emerald',
  transferencia: 'blue',
  tarjeta: 'purple',
  mercadopago: 'cyan',
  pendiente: 'amber',
};
export type EstadoPago = 'pagado' | 'pendiente';

export interface PrecioViandaItem {
  id: string;
  etiqueta: string; // ej. "General", "Socio", "Preventa", "Combo"
  monto: number;
}

export interface ViandaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  descripcionImpresion?: string; // Descripción que se mostrará en la impresión del ticket
  precios?: PrecioViandaItem[]; // Lista dinámica de 1 o múltiples precios
  tieneDosPrecios: boolean;
  precio1: number;
  etiquetaPrecio1: string; // ej. "General" o "Precio 1"
  precio2?: number;
  etiquetaPrecio2?: string; // ej. "Socio" o "Precio 2"
  activo: boolean;
  categoria?: string;
}

export function getPreciosVianda(v: ViandaProducto): PrecioViandaItem[] {
  if (Array.isArray(v.precios) && v.precios.length > 0) {
    return v.precios;
  }
  const list: PrecioViandaItem[] = [
    {
      id: 'p-1',
      etiqueta: v.etiquetaPrecio1 || 'General',
      monto: Number(v.precio1) || 0,
    },
  ];
  if (v.tieneDosPrecios && v.precio2 !== undefined) {
    list.push({
      id: 'p-2',
      etiqueta: v.etiquetaPrecio2 || 'Socio',
      monto: Number(v.precio2) || 0,
    });
  }
  return list;
}

export interface ItemVentaVianda {
  productoId: string;
  nombre: string;
  descripcionImpresion?: string;
  precioUnitario: number;
  etiquetaPrecio: string; // "General", "Socio", etc.
  cantidad: number;
  subtotal: number;
}

export interface TicketVianda {
  id: string;
  eventoId?: string;
  nombreEvento?: string;
  numeroTicket: string; // ej. "V-1001"
  comprador: string;
  telefono?: string;
  items: ItemVentaVianda[];
  total: number;
  modalidadPago: ModalidadPago;
  estadoPago: EstadoPago;
  entregado: boolean;
  fecha: string; // ISO string
  fechaFormateada: string;
  descripcionImpresion?: string; // Descripción visible en el ticket impreso
  notas?: string;
  vendedorEmail?: string;
}

// ---- MÓDULO DE VENTA DE TICKETS GENERALES / ENTRADAS / BONOS ----
export interface TicketProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  descripcionImpresion?: string; // Descripción que se verá en la impresión
  precios?: PrecioViandaItem[];
  tieneDosPrecios: boolean;
  precio1: number;
  etiquetaPrecio1: string;
  precio2?: number;
  etiquetaPrecio2?: string;
  activo: boolean;
  categoria?: string;
}

export function getPreciosTicket(t: TicketProducto): PrecioViandaItem[] {
  if (Array.isArray(t.precios) && t.precios.length > 0) {
    return t.precios;
  }
  const list: PrecioViandaItem[] = [
    {
      id: 'p-1',
      etiqueta: t.etiquetaPrecio1 || 'General',
      monto: Number(t.precio1) || 0,
    },
  ];
  if (t.tieneDosPrecios && t.precio2 !== undefined) {
    list.push({
      id: 'p-2',
      etiqueta: t.etiquetaPrecio2 || 'Promoción',
      monto: Number(t.precio2) || 0,
    });
  }
  return list;
}

export interface ItemVentaTicket {
  productoId: string;
  nombre: string;
  descripcionImpresion?: string;
  precioUnitario: number;
  etiquetaPrecio: string;
  cantidad: number;
  subtotal: number;
}

export interface TicketEventoVenta {
  id: string;
  eventoId?: string;
  nombreEvento?: string;
  numeroTicket: string; // ej. "T-0001"
  comprador: string;
  telefono?: string;
  items: ItemVentaTicket[];
  total: number;
  modalidadPago: ModalidadPago;
  estadoPago: EstadoPago;
  entregado: boolean;
  fecha: string;
  fechaFormateada: string;
  descripcionImpresion?: string; // Descripción que se verá en la impresión
  notas?: string;
  vendedorEmail?: string;
}

export interface TarjetaBingoPrecioConfig {
  tieneDosPrecios: boolean;
  precio1: number;
  etiquetaPrecio1: string; // ej. "General"
  precio2: number;
  etiquetaPrecio2: string; // ej. "Socio / Promo"
  descripcionImpresion?: string; // Descripción que se verá en la impresión del ticket de bingo
}

export interface TarjetaBingoVenta {
  id: string;
  eventoId?: string;
  nombreEvento?: string;
  numeroTicket: string; // ej. "B-1001"
  numeroTarjeta: number; // ej. primera tarjeta o única
  numerosTarjetas?: number[]; // lista de todas las tarjetas compradas en este ticket, ej. [15, 16, 17]
  cantidad?: number; // cantidad de tarjetas
  precioUnitario?: number;
  comprador: string; // opcional, "Al Portador" si se omite
  telefono?: string;
  precioCobrado: number;
  etiquetaPrecio: string;
  modalidadPago: ModalidadPago;
  estadoPago: EstadoPago;
  fecha: string;
  fechaFormateada: string;
  descripcionImpresion?: string; // Descripción que se verá en la impresión
  notas?: string;
  vendedorEmail?: string;
}

export interface BingoState {
  numerosSalidos: number[]; // Lista de números en orden de salida
  ultimoNumero: number | null;
  enSorteo: boolean;
  juegoIniciado: boolean;
  totalNumeros: number; // 75
  figura?: string; // Nombre de la figura activa (ej. 'Línea Horizontal', 'Letra X')
  patronFigura?: string[]; // Array de casillas activas formato ['col-row', ...]
}

export interface SorteoGanador {
  id: string;
  eventoId?: string;
  nombreEvento?: string;
  fecha: string;
  origen: 'viandas' | 'bingo' | 'tickets' | 'todos';
  ticketGanador: string;
  comprador: string;
  premio: string;
  telefono?: string;
  modalidadPago: string;
  estadoPago: string;
}

export interface ConfiguracionImpresion {
  mostrarLogo: boolean;
  mostrarEncabezado: boolean; // Título del evento
  mostrarSubtitulo: boolean;
  mostrarLugar: boolean;
  mostrarFechaHora: boolean;
  mostrarTelefono: boolean;
  mostrarModalidadPago: boolean;
  mostrarEstadoPago: boolean;
  mostrarCodigoBarras: boolean;
  mostrarMensajePie: boolean;
  modoAhorroPapel: boolean; // Espaciado ultra compacto sin líneas vacías
  metodoImpresion?: 'bluetooth' | 'sistema'; // Modo de impresión configurado
  anchoPapel?: '58mm' | '80mm'; // Ancho del rollo térmico para impresión Bluetooth / estándar
  impresoraBluetoothNombre?: string; // Nombre de la impresora Bluetooth vinculada
  impresoraConfigurada?: boolean; // Indica si la configuración de impresora ya fue establecida
}

export const DEFAULT_IMPRESION_CONFIG: ConfiguracionImpresion = {
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
  metodoImpresion: 'bluetooth',
  anchoPapel: '58mm',
  impresoraBluetoothNombre: '',
  impresoraConfigurada: false,
};

export function formatPrecio(monto: number): string {
  return Number(monto || 0).toLocaleString('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface ConfiguracionEvento {
  id?: string;
  nombreEvento: string;
  subtitulo: string;
  fechaEvento: string;
  lugar: string;
  mensajeTicket: string;
  activo?: boolean;
  estado?: 'abierto' | 'finalizado';
  bingoPrecios: TarjetaBingoPrecioConfig;
  permitirVentaSinPagar: boolean;
  impresion?: ConfiguracionImpresion;
  fechaCreacion?: string;
}

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}
