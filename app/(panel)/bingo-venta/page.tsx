'use client';

import { BingoSales } from '../../../components/BingoSales';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function BingoVentaPage() {
  const { config } = useEventConfig();
  return <BingoSales config={config} />;
}
