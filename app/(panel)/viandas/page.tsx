'use client';

import { ViandasSales } from '../../../components/ViandasSales';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function ViandasPage() {
  const { config } = useEventConfig();
  return <ViandasSales config={config} />;
}
