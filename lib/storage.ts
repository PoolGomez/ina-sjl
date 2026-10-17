import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
  onSnapshot,
} from 'firebase/firestore';
import { initializeFirebase } from './firebase';
import {
  ViandaProducto,
  TicketVianda,
  TarjetaBingoVenta,
  TarjetaBingoPrecioConfig,
  BingoState,
  SorteoGanador,
  ConfiguracionEvento,
  EstadoPago,
  AppUserProfile,
  UserRole,
  UserPermissions,
  ModalidadPagoConfig,
} from './types';

// Default initial viandas (seeded to Firestore when collection is empty)
const DEFAULT_VIANDAS: ViandaProducto[] = [
  {
    id: 'v-prod-1',
    nombre: 'Pollo al Espiedo con Papas y Ensalada',
    descripcion: '1/4 de pollo dorado al horno con papas fritas y ensalada clásica.',
    tieneDosPrecios: true,
    precio1: 5000,
    etiquetaPrecio1: 'General',
    precio2: 4200,
    etiquetaPrecio2: 'Socio / Preventa',
    activo: true,
    categoria: 'Platos Principales',
  },
  {
    id: 'v-prod-2',
    nombre: 'Asado Criollo con Guarnición',
    descripcion: 'Corte de carne vacuna a las brasas con ensalada rusa o mixta.',
    tieneDosPrecios: true,
    precio1: 6500,
    etiquetaPrecio1: 'General',
    precio2: 5500,
    etiquetaPrecio2: 'Socio / Preventa',
    activo: true,
    categoria: 'Platos Principales',
  },
  {
    id: 'v-prod-3',
    nombre: 'Docena de Empanadas Salteñas',
    descripcion: 'Carne cortada a cuchillo, masa casera y horneadas en el momento.',
    tieneDosPrecios: false,
    precio1: 4500,
    etiquetaPrecio1: 'Precio Único',
    activo: true,
    categoria: 'Minutas',
  },
  {
    id: 'v-prod-4',
    nombre: 'Gaseosa / Bebida Línea 1.5L',
    descripcion: 'Coca Cola, Sprite o Agua Saborizada bien fría.',
    tieneDosPrecios: false,
    precio1: 1500,
    etiquetaPrecio1: 'Precio Único',
    activo: true,
    categoria: 'Bebidas',
  },
  {
    id: 'v-prod-5',
    nombre: 'Porción de Torta Artesanal',
    descripcion: 'Selva Negra, Lemon Pie o Chocotorta para el postre.',
    tieneDosPrecios: false,
    precio1: 1800,
    etiquetaPrecio1: 'Precio Único',
    activo: true,
    categoria: 'Postres',
  },
];

const DEFAULT_BINGO_PRECIOS: TarjetaBingoPrecioConfig = {
  tieneDosPrecios: true,
  precio1: 2000,
  etiquetaPrecio1: 'General (1 Tarjeta)',
  precio2: 1500,
  etiquetaPrecio2: 'Promo Socio / Combo',
};

const DEFAULT_EVENT_CONFIG: ConfiguracionEvento = {
  nombreEvento: 'GRAN BINGO Y ALMUERZO FAMILIAR INA',
  subtitulo: 'Parroquia / Comunidad INA - Beneficio Anual',
  fechaEvento: '2026-10-18',
  lugar: 'Salón de Eventos Principal INA',
  mensajeTicket: '¡Gracias por apoyar a nuestra comunidad! Conserve este ticket para sorteos.',
  bingoPrecios: DEFAULT_BINGO_PRECIOS,
  permitirVentaSinPagar: true,
  impresion: {
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
  },
};

const DEFAULT_BINGO_STATE: BingoState = {
  numerosSalidos: [],
  ultimoNumero: null,
  enSorteo: false,
  juegoIniciado: false,
  totalNumeros: 75,
  figura: 'Línea Horizontal',
  patronFigura: ['0-2', '1-2', '2-2', '3-2', '4-2'],
};

export const DEFAULT_MODALIDADES_PAGO: ModalidadPagoConfig[] = [
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    descripcion: 'Pago en efectivo al momento',
    icono: '💵',
    activo: true,
    orden: 1,
    gradient: 'from-emerald-500 to-teal-600',
    color: 'emerald',
  },
  {
    id: 'transferencia',
    nombre: 'Transferencia',
    descripcion: 'Transferencia bancaria / CBU / CVU',
    icono: '🏦',
    activo: true,
    orden: 2,
    gradient: 'from-blue-500 to-indigo-600',
    color: 'blue',
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta',
    descripcion: 'Débito o crédito con terminal POS',
    icono: '💳',
    activo: true,
    orden: 3,
    gradient: 'from-purple-500 to-violet-600',
    color: 'purple',
  },
  {
    id: 'mercadopago',
    nombre: 'Mercado Pago',
    descripcion: 'QR de Mercado Pago o link de pago',
    icono: '📲',
    activo: true,
    orden: 4,
    gradient: 'from-cyan-500 to-blue-600',
    color: 'cyan',
  },
  {
    id: 'pendiente',
    nombre: 'Pendiente',
    descripcion: 'Pago a confirmar posteriormente',
    icono: '⏳',
    activo: true,
    orden: 5,
    gradient: 'from-amber-500 to-orange-600',
    color: 'amber',
  },
];

// ----------------- VIANDAS PRODUCTOS -----------------
export async function getViandasProductos(): Promise<ViandaProducto[]> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'viandas_productos'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ViandaProducto));
      } else {
        for (const item of DEFAULT_VIANDAS) {
          await setDoc(doc(db, 'viandas_productos', item.id), item);
        }
        return DEFAULT_VIANDAS;
      }
    } catch (e) {
      console.error('Firestore getViandas error:', e);
    }
  }
  return [];
}

export async function saveViandaProducto(item: ViandaProducto): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(item).filter(([, v]) => v !== undefined)
      ) as ViandaProducto;
      await setDoc(doc(db, 'viandas_productos', item.id), cleanData);
    } catch (e) {
      console.error('Firestore saveVianda error:', e);
    }
  }
}

export async function deleteViandaProducto(id: string): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'viandas_productos', id));
    } catch (e) {
      console.error('Firestore deleteVianda error:', e);
    }
  }
}

// ----------------- TICKETS DE VIANDAS -----------------
export async function getTicketsViandas(): Promise<TicketVianda[]> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'viandas_tickets'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TicketVianda));
        return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      }
    } catch (e) {
      console.error('Firestore getTickets error:', e);
    }
  }
  return [];
}

export async function saveTicketVianda(ticket: TicketVianda): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(ticket).filter(([, v]) => v !== undefined)
      ) as TicketVianda;
      await setDoc(doc(db, 'viandas_tickets', ticket.id), cleanData);
    } catch (e) {
      console.error('Firestore saveTicket error:', e);
    }
  }
}

export async function updateTicketViandaEstado(
  ticketId: string,
  nuevoEstado: EstadoPago,
  entregado?: boolean
): Promise<TicketVianda | null> {
  const current = await getTicketsViandas();
  const index = current.findIndex(
    (t) => t.id === ticketId || t.numeroTicket.toUpperCase() === ticketId.toUpperCase()
  );
  if (index === -1) return null;

  const item = { ...current[index], estadoPago: nuevoEstado };
  if (entregado !== undefined) {
    item.entregado = entregado;
  }

  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await updateDoc(doc(db, 'viandas_tickets', item.id), {
        estadoPago: nuevoEstado,
        ...(entregado !== undefined ? { entregado } : {}),
      });
    } catch (e) {
      console.error('Firestore updateTicket error:', e);
    }
  }
  return item;
}

// ----------------- TARJETAS DE BINGO -----------------
export async function getTarjetasBingoVentas(): Promise<TarjetaBingoVenta[]> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'bingo_tarjetas'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TarjetaBingoVenta));
        return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      }
    } catch (e) {
      console.error('Firestore getTarjetasBingo error:', e);
    }
  }
  return [];
}

export async function saveTarjetaBingoVenta(tarjeta: TarjetaBingoVenta): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(tarjeta).filter(([, v]) => v !== undefined)
      ) as TarjetaBingoVenta;
      await setDoc(doc(db, 'bingo_tarjetas', tarjeta.id), cleanData);
    } catch (e) {
      console.error('Firestore saveTarjetaBingo error:', e);
    }
  }
}

export async function updateTarjetaBingoEstado(
  idOrNumero: string,
  nuevoEstado: EstadoPago
): Promise<TarjetaBingoVenta | null> {
  const current = await getTarjetasBingoVentas();
  const index = current.findIndex(
    (t) =>
      t.id === idOrNumero ||
      t.numeroTicket.toUpperCase() === idOrNumero.toUpperCase() ||
      String(t.numeroTarjeta) === idOrNumero ||
      `#${t.numeroTarjeta}` === idOrNumero ||
      (t.numerosTarjetas &&
        t.numerosTarjetas.some((n) => String(n) === idOrNumero || `#${n}` === idOrNumero))
  );
  if (index === -1) return null;

  const item = { ...current[index], estadoPago: nuevoEstado };

  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await updateDoc(doc(db, 'bingo_tarjetas', item.id), { estadoPago: nuevoEstado });
    } catch (e) {
      console.error('Firestore updateTarjetaBingo error:', e);
    }
  }
  return item;
}

// ----------------- CONFIGURACIÓN DE EVENTO -----------------
export async function getConfiguracionEvento(): Promise<ConfiguracionEvento> {
  let config: ConfiguracionEvento = DEFAULT_EVENT_CONFIG;
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const mainSnap = await getDoc(doc(db, 'configuracion', 'evento_main'));
      if (mainSnap.exists()) {
        config = mainSnap.data() as ConfiguracionEvento;
      } else {
        const snap = await getDocs(collection(db, 'configuracion'));
        if (!snap.empty) {
          config = snap.docs[0].data() as ConfiguracionEvento;
        } else {
          await setDoc(doc(db, 'configuracion', 'evento_main'), DEFAULT_EVENT_CONFIG);
        }
      }
    } catch (e) {
      console.error('Firestore getConfig error:', e);
    }
  }

  if (!config.impresion) {
    config.impresion = { ...DEFAULT_EVENT_CONFIG.impresion! };
  }
  return config;
}

export async function saveConfiguracionEvento(config: ConfiguracionEvento): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'configuracion', 'evento_main'), config);
    } catch (e) {
      console.error('Firestore saveConfig error:', e);
    }
  }
}

// ----------------- BINGO GAME STATE -----------------
export async function getBingoGameState(): Promise<BingoState> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'bingo_estado', 'partida_actual'));
      if (snap.exists()) {
        return snap.data() as BingoState;
      } else {
        await setDoc(doc(db, 'bingo_estado', 'partida_actual'), DEFAULT_BINGO_STATE);
        return DEFAULT_BINGO_STATE;
      }
    } catch (e) {
      console.error('Firestore getBingoGameState error:', e);
    }
  }
  return DEFAULT_BINGO_STATE;
}

export async function saveBingoGameState(state: BingoState): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const firestoreData = Object.fromEntries(
        Object.entries(state).filter(([, v]) => v !== undefined)
      ) as BingoState;
      await setDoc(doc(db, 'bingo_estado', 'partida_actual'), firestoreData);
    } catch (e) {
      console.error('Firestore saveBingoGameState error:', e);
    }
  }
}

// ----------------- LIVE VIEWERS PRESENCE (SINGLE-DOC OPTIMIZED) -----------------
const VIEWER_TTL_MS = 180_000; // 3 minutes TTL
const VIEWER_HEARTBEAT_MS = 120_000; // 2 minutes heartbeat

export function subscribeAndRegisterBingoViewer(
  onCountChange: (count: number) => void
): () => void {
  const { db, isConfigured } = initializeFirebase();
  if (!isConfigured || !db || typeof window === 'undefined') {
    onCountChange(1);
    return () => {};
  }

  const sessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const presenceRef = doc(db, 'bingo_estado', 'espectadores');

  const sendHeartbeat = async () => {
    try {
      await setDoc(
        presenceRef,
        { sessions: { [sessionId]: Date.now() } },
        { merge: true }
      );
    } catch {
      // ignore transient network errors
    }
  };

  const removeSession = () => {
    updateDoc(presenceRef, {
      [`sessions.${sessionId}`]: deleteField(),
    }).catch(() => {});
  };

  sendHeartbeat();

  const heartbeatInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  }, VIEWER_HEARTBEAT_MS);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  };

  window.addEventListener('pagehide', removeSession);
  window.addEventListener('beforeunload', removeSession);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  const unsub = onSnapshot(
    presenceRef,
    (snap) => {
      const now = Date.now();
      if (!snap.exists()) {
        onCountChange(1);
        return;
      }
      const data = snap.data() as { sessions?: Record<string, number> };
      const sessions = data?.sessions || {};
      const activeCount = Object.values(sessions).filter(
        (ts) => typeof ts === 'number' && now - ts < VIEWER_TTL_MS
      ).length;
      onCountChange(Math.max(1, activeCount));
    },
    () => {
      onCountChange(1);
    }
  );

  return () => {
    clearInterval(heartbeatInterval);
    window.removeEventListener('pagehide', removeSession);
    window.removeEventListener('beforeunload', removeSession);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    unsub();
    removeSession();
  };
}

// ----------------- SORTEOS HISTORIAL -----------------
export async function getSorteos(): Promise<SorteoGanador[]> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'sorteos'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SorteoGanador));
        return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      }
    } catch (e) {
      console.error('Firestore getSorteos error:', e);
    }
  }
  return [];
}

export async function saveSorteo(ganador: SorteoGanador): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(ganador).filter(([, v]) => v !== undefined)
      ) as SorteoGanador;
      await setDoc(doc(db, 'sorteos', ganador.id), cleanData);
    } catch (e) {
      console.error('Firestore saveSorteo error:', e);
    }
  }
}

// ----------------- USER PROFILES -----------------
export async function getUserProfiles(): Promise<AppUserProfile[]> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'user_profiles'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUserProfile));
      }
    } catch (e) {
      console.error('Firestore getUserProfiles error:', e);
    }
  }
  return [];
}

export async function saveUserProfile(profile: AppUserProfile): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'user_profiles', profile.uid), profile);
    } catch (e) {
      console.error('Firestore saveUserProfile error:', e);
    }
  }
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'user_profiles', uid));
    } catch (e) {
      console.error('Firestore deleteUserProfile error:', e);
    }
  }
}

export async function updateUserProfilePermissions(
  uid: string,
  role: UserRole,
  permisos: UserPermissions
): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await updateDoc(doc(db, 'user_profiles', uid), { role, permisos });
    } catch (e) {
      console.error('Firestore updateUserProfile error:', e);
    }
  }
}

// ----------------- MODALIDADES DE PAGO -----------------
export async function getModalidadesPago(): Promise<ModalidadPagoConfig[]> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'modalidades_pago'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModalidadPagoConfig));
        return list.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
      } else {
        for (const mod of DEFAULT_MODALIDADES_PAGO) {
          await setDoc(doc(db, 'modalidades_pago', mod.id), mod);
        }
        return DEFAULT_MODALIDADES_PAGO;
      }
    } catch (e) {
      console.error('Firestore getModalidadesPago error:', e);
    }
  }
  return DEFAULT_MODALIDADES_PAGO;
}

export async function saveModalidadPago(modalidad: ModalidadPagoConfig): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      const firestoreData = Object.fromEntries(
        Object.entries(modalidad).filter(([, v]) => v !== undefined)
      ) as ModalidadPagoConfig;
      await setDoc(doc(db, 'modalidades_pago', modalidad.id), firestoreData);
    } catch (e) {
      console.error('Firestore saveModalidadPago error:', e);
    }
  }
}

export async function deleteModalidadPago(id: string): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'modalidades_pago', id));
    } catch (e) {
      console.error('Firestore deleteModalidadPago error:', e);
    }
  }
}

export async function toggleModalidadPagoActiva(id: string, activo: boolean): Promise<void> {
  const { db, isConfigured } = initializeFirebase();
  if (isConfigured && db) {
    try {
      await updateDoc(doc(db, 'modalidades_pago', id), { activo });
    } catch (e) {
      console.error('Firestore toggleModalidadPago error:', e);
    }
  }
}