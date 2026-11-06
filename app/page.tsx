'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import { useEventConfig } from '../lib/eventConfigContext';
import { LandingPageINA } from '../components/iglesia/LandingPageINA';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { config } = useEventConfig();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-color-scheme', 'light');
  }, []);

  const handleEnterDashboard = () => {
    router.push('/system');
  };

  return (
    <LandingPageINA
      configEvento={config}
      isAuthenticated={!!user}
      onEnterDashboard={handleEnterDashboard}
    />
  );
}
