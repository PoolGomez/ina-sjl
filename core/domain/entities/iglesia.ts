/**
 * Domain Entities: Iglesia Nueva Apostólica (INA) — Sedes, Grupos, Ministerios e Información Institucional
 */

export interface SedeIglesia {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  responsable: string;
  telefono?: string;
  ubicacionUrl?: string; // Enlace a Google Maps / Waze
  referencia?: string;   // Referencia de ubicación (ej. "A 2 cuadras de la Plaza Principal")
  coordenadas?: string;  // Latitud, Longitud opcional
  horarios: string[];    // ej. ["Domingos 10:00 hs - Oficio Divino", "Miércoles 20:00 hs - Oficio Divino"]
  activa: boolean;
}

export interface GrupoIglesia {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string; // emoji representativo
  color: 'amber' | 'indigo' | 'emerald' | 'rose' | 'purple' | 'cyan' | 'blue';
  horarioGeneral?: string;
  edadRango?: string;
  activo: boolean;
}

export interface MinisterioIglesia {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'Ministerial' | 'Enseñanza y Música' | 'Servicio y Comunidad';
  icono: string;
  color: 'amber' | 'indigo' | 'emerald' | 'rose' | 'purple' | 'cyan' | 'blue';
  orden: number;
  activo: boolean;
}

export interface InfoIglesiaConfig {
  nombreIglesia: string;
  sigla: string;
  lema: string;
  descripcion: string;
  mision: string;
  vision: string;
  versiculoDestacado: string;
  citaVersiculo: string;
  direccionPrincipal: string;
  telefonoContacto: string;
  emailContacto: string;
}

export const DEFAULT_INFO_IGLESIA: InfoIglesiaConfig = {
  nombreIglesia: 'Iglesia Nueva Apostólica',
  sigla: 'INA',
  lema: 'Comunidad de Fe, Amor y Esperanza en Cristo',
  descripcion:
    'La Iglesia Nueva Apostólica (INA) es una iglesia cristiana internacional cuya base es el Evangelio de Jesucristo y el ministerio vivo de los Apóstoles. En nuestras comunidades celebramos Oficios Divinos, fortalecemos la comunión fraterna y acompañamos a cada etapa de la vida espiritual.',
  mision:
    'Ir hacia todas las personas para anunciarles el Evangelio de Jesucristo, bautizarlas con agua y el Espíritu Santo y brindarles atención espiritual con amor al prójimo.',
  vision:
    'Una iglesia en la que las personas se sientan como en casa y, colmadas por el Espíritu Santo y el amor de Dios, orienten su vida según el Evangelio de Jesucristo.',
  versiculoDestacado:
    'Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.',
  citaVersiculo: 'Mateo 18:20',
  direccionPrincipal: 'Comunidad Central INA',
  telefonoContacto: '+51 999 888 777',
  emailContacto: 'contacto@inacomunidad.org',
};

export const DEFAULT_SEDES_INA: SedeIglesia[] = [
  {
    id: 'ayacucho',
    nombre: 'Comunidad de Ayacucho',
    direccion: 'Av. Flores 450, Centro',
    ciudad: 'Ayacucho',
    responsable: 'Pastor Dirigente Carlos Mendoza',
    telefono: '+51 987 654 321',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Iglesia+Nueva+Apostolica+Ayacucho',
    referencia: 'A dos cuadras del Parque Central, frente a la alameda.',
    horarios: [
      'Domingos 10:00 hs — Oficio Divino Dominical',
      'Domingos 09:00 hs — Escuela Dominical y Pre-escuela',
      'Miércoles 20:00 hs — Oficio Divino de Mitad de Semana',
      'Sábados 18:00 hs — Ensayo de Coro y Reunión de Juventud',
    ],
    activa: true,
  },
  {
    id: 'canto-grande',
    nombre: 'Congregación de Canto Grande 9',
    direccion: 'Calle Los Olivos 230, Sector Norte',
    ciudad: 'Canto Grande 9',
    responsable: 'Pastor Roberto Quispe',
    telefono: '+51 912 345 678',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Canto+Grande+9+San+Juan+de+Lurigancho',
    referencia: 'Altura del paradero 9 de Av. Canto Grande.',
    horarios: [
      'Domingos 10:00 hs — Oficio Divino Dominical',
      'Jueves 19:30 hs — Oficio Divino Semanal',
      'Sábados 17:00 hs — Actividades de Jóvenes y Niños',
    ],
    activa: true,
  },
  {
    id: 'huanta',
    nombre: 'Congregación de Huanta',
    direccion: 'Jr. Las Magnolias 890, Sector Sur',
    ciudad: 'Huanta',
    responsable: 'Evangelista Miguel Torres',
    telefono: '+51 945 612 390',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Huanta+Ayacucho+Peru',
    referencia: 'Cerca de la Plaza de Armas de Huanta.',
    horarios: [
      'Domingos 09:30 hs — Oficio Divino Dominical',
      'Miércoles 19:30 hs — Oficio Divino Semanal',
      'Sábados 16:30 hs — Ensayo de Coro y Enseñanza',
    ],
    activa: true,
  },
];

export const DEFAULT_GRUPOS_INA: GrupoIglesia[] = [
  {
    id: 'grupo-jovenes',
    nombre: 'Juventud (Jóvenes)',
    descripcion: 'Comunión, reuniones juveniles por sede y regionales, servicio al prójimo y talleres espirituales.',
    icono: '🔥',
    color: 'indigo',
    horarioGeneral: 'Sábados 18:00 hs / 1er Domingo de mes Oficio de Juventud',
    edadRango: '14 a 35 años',
    activo: true,
  },
  {
    id: 'grupo-ninos',
    nombre: 'Escuela Dominical y Religión (Niños)',
    descripcion: 'Pre-escuela, Escuela Dominical, Clases de Religión y preparación para la Confirmación.',
    icono: '🌱',
    color: 'emerald',
    horarioGeneral: 'Domingos 09:00 hs y Sábados 16:00 hs',
    edadRango: '3 a 14 años',
    activo: true,
  },
  {
    id: 'grupo-coro',
    nombre: 'Coro y Música Instrumental',
    descripcion: 'Alabanza coral y musical para el embellecimiento de los Oficios Divinos y conciertos.',
    icono: '🎵',
    color: 'amber',
    horarioGeneral: 'Sábados 18:30 hs — Ensayo General',
    edadRango: 'Todas las edades',
    activo: true,
  },
  {
    id: 'grupo-adultos-mayores',
    nombre: 'Adultos Mayores (Tercera Edad)',
    descripcion: 'Encuentros fraternales, visitas de asistencia espiritual y actividades recreativas.',
    icono: '🤍',
    color: 'rose',
    horarioGeneral: '2do Sábado de cada mes — 15:30 hs',
    edadRango: '60+ años',
    activo: true,
  },
  {
    id: 'grupo-portadores',
    nombre: 'Cuerpo Ministerial y Ayudantes',
    descripcion: 'Siervos, diáconos, maestros y colaboradores en la atención espiritual de las comunidades.',
    icono: '🕊️',
    color: 'purple',
    horarioGeneral: 'Reuniones mensuales de coordinación',
    edadRango: 'Portadores de ministerio y maestros',
    activo: true,
  },
];

export const DEFAULT_MINISTERIOS_INA: MinisterioIglesia[] = [
  {
    id: 'min-miembro',
    nombre: 'Miembro',
    descripcion: 'Hermano o hermana en comunión activa dentro de la congregación.',
    categoria: 'Servicio y Comunidad',
    icono: '🙏',
    color: 'blue',
    orden: 1,
    activo: true,
  },
  {
    id: 'min-diacono',
    nombre: 'Diácono',
    descripcion: 'Ministerio diaconal de servicio, apoyo en la comunidad y atención fraternal.',
    categoria: 'Ministerial',
    icono: '🕊️',
    color: 'indigo',
    orden: 2,
    activo: true,
  },
  {
    id: 'min-pastor',
    nombre: 'Pastor',
    descripcion: 'Ministerio sacerdotal encargado de los Oficios Divinos, sacramentos y atención espiritual.',
    categoria: 'Ministerial',
    icono: '✝️',
    color: 'purple',
    orden: 3,
    activo: true,
  },
  {
    id: 'min-evangelista',
    nombre: 'Evangelista',
    descripcion: 'Ministerio sacerdotal de apoyo distrital y fortalecimiento de las comunidades.',
    categoria: 'Ministerial',
    icono: '📖',
    color: 'amber',
    orden: 4,
    activo: true,
  },
  {
    id: 'min-anciano',
    nombre: 'Anciano de Distrito',
    descripcion: 'Ministerio de conducción espiritual y pastoral de las comunidades del distrito.',
    categoria: 'Ministerial',
    icono: '👑',
    color: 'rose',
    orden: 5,
    activo: true,
  },
  {
    id: 'min-maestro',
    nombre: 'Maestro/a de Enseñanza',
    descripcion: 'Encargado de Pre-escuela, Escuela Dominical, Religión y preparación de Confirmación.',
    categoria: 'Enseñanza y Música',
    icono: '🌱',
    color: 'emerald',
    orden: 6,
    activo: true,
  },
  {
    id: 'min-lider-juventud',
    nombre: 'Líder de Juventud',
    descripcion: 'Acompañamiento, coordinación y servicio en las actividades de los jóvenes.',
    categoria: 'Servicio y Comunidad',
    icono: '🔥',
    color: 'cyan',
    orden: 7,
    activo: true,
  },
  {
    id: 'min-coro-musica',
    nombre: 'Integrante de Coro / Director Musical',
    descripcion: 'Servicio musical en el coro de la comunidad o conjunto instrumental.',
    categoria: 'Enseñanza y Música',
    icono: '🎵',
    color: 'amber',
    orden: 8,
    activo: true,
  },
];
