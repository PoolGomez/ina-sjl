'use client';

import { BingoGame } from '../../../components/BingoGame';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function BingoJuegoPage() {
  const { config } = useEventConfig();
  return <BingoGame nombreEvento={config.nombreEvento} />;
}
