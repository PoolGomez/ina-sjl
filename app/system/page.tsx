'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useEventConfig } from '@/lib/eventConfigContext';
import { DashboardHome } from '@/components/DashboardHome';

export default function SystemIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { config } = useEventConfig();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return <DashboardHome config={config} />;
}
