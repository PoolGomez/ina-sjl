'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { iglesiaNavItems, eventosNavItems } from '@/lib/navItems';
import { UserPermissions } from '@/lib/types';

export default function SystemIndexPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
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
    const targetHref =
      firstIglesia?.href || firstEvento?.href || '/system/membresia';

    router.replace(targetHref);
  }, [user, loading, router]);

  return null;
}
