'use client';

import { Administracion } from '../../../../components/Administracion';
import { useEventConfig } from '../../../../lib/eventConfigContext';

export default function AdminMetricasPage() {
  const { config, setConfig } = useEventConfig();
  return (
    <Administracion
      config={config}
      onConfigUpdated={(newCfg) => setConfig(newCfg)}
      activeSubTab="metricas"
    />
  );
}
