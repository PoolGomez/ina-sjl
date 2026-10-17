'use client';

import { BingoGame2 } from '../../../components/BingoGame2';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function BingoJuego2Page() {
  const { config } = useEventConfig();
  return <BingoGame2 nombreEvento={config.nombreEvento} />;
}
