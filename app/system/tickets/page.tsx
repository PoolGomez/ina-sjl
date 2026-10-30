'use client';

import { TicketsSales } from '../../../components/TicketsSales';
import { useEventConfig } from '../../../lib/eventConfigContext';

export default function TicketsPage() {
  const { config } = useEventConfig();
  return <TicketsSales config={config} />;
}
