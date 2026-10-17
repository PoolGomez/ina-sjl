'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { useEventConfig } from '../lib/eventConfigContext';
import { LandingPageINA } from '../components/iglesia/LandingPageINA';
import { iglesiaNavItems, eventosNavItems } from '../components/Navbar';
import { UserPermissions } from '../lib/types';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { config } = useEventConfig();

  const handleEnterDashboard = () => {
    if (!user) {
      router.push('/membresia');
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
    const targetHref = firstIglesia?.href || firstEvento?.href || '/membresia';
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
