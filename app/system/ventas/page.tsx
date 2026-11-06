'use client';

import { VentasModule } from '../../../components/VentasModule';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function VentasPage() {
  const { config } = useEventConfig();
  return <VentasModule config={config} />;
}
