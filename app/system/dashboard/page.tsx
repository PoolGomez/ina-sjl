'use client';

import { useEventConfig } from '@/lib/eventConfigContext';
import { DashboardHome } from '@/components/DashboardHome';

export default function DashboardRoutePage() {
  const { config } = useEventConfig();
  return <DashboardHome config={config} />;
}
