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
  puedeVenderViandas: boolean;
  puedeVenderBingo: boolean;
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
    puedeVenderViandas: true,
    puedeVenderBingo: true,
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
    puedeVenderViandas: true,
    puedeVenderBingo: true,
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
    puedeVenderViandas: true,
    puedeVenderBingo: true,
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
    puedeVenderViandas: false,
    puedeVenderBingo: false,
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

export interface ViandaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  tieneDosPrecios: boolean;
  precio1: number;
  etiquetaPrecio1: string; // ej. "General" o "Precio 1"
  precio2?: number;
  etiquetaPrecio2?: string; // ej. "Socio" o "Precio 2"
  activo: boolean;
  categoria?: string;
}

export interface ItemVentaVianda {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  etiquetaPrecio: string; // "General", "Socio", etc.
  cantidad: number;
  subtotal: number;
}

export interface TicketVianda {
  id: string;
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
  notas?: string;
  vendedorEmail?: string;
}

export interface TarjetaBingoPrecioConfig {
  tieneDosPrecios: boolean;
  precio1: number;
  etiquetaPrecio1: string; // ej. "General"
  precio2: number;
  etiquetaPrecio2: string; // ej. "Socio / Promo"
}

export interface TarjetaBingoVenta {
  id: string;
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
  fecha: string;
  origen: 'viandas' | 'bingo' | 'todos';
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
  nombreEvento: string;
  subtitulo: string;
  fechaEvento: string;
  lugar: string;
  mensajeTicket: string;
  bingoPrecios: TarjetaBingoPrecioConfig;
  permitirVentaSinPagar: boolean;
  impresion?: ConfiguracionImpresion;
}

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}
