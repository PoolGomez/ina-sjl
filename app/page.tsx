'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { useEventConfig } from '../lib/eventConfigContext';
import { LandingPageINA } from '../components/iglesia/LandingPageINA';
import { iglesiaNavItems, eventosNavItems } from '../lib/navItems';
import { UserPermissions } from '../lib/types';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { config } = useEventConfig();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-color-scheme', 'light');
  }, []);

  const handleEnterDashboard = () => {
    if (!user) {
      router.push('/system/membresia');
      return;
    }
    const hasPermission = (perm?: keyof UserPermissions) => {
      if (!perm) return true;
      if (user.isSuperAdmin || user.role === 'admin') return true;
      return Boolean(user.permisos?.[perm]);
    };
    const firstIglesia = iglesiaNavItems.find((item) =>
      hasPermission(item.requiredPerm)
    );
    const firstEvento = eventosNavItems.find((item) =>
      hasPermission(item.requiredPerm)
    );
    const targetHref = firstIglesia?.href || firstEvento?.href || '/system/membresia';
    router.push(targetHref);
  };

  return (
    <LandingPageINA
      configEvento={config}
      isAuthenticated={!!user}
      onEnterDashboard={handleEnterDashboard}
    />
  );
}
