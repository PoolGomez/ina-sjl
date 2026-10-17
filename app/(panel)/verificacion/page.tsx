'use client';

import { Verificacion } from '../../../components/Verificacion';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function VerificacionPage() {
  const { config } = useEventConfig();
  return <Verificacion config={config} />;
}
