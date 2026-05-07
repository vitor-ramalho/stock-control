'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user is superadmin
    if (!hasRole(['superadmin'])) {
      router.push('/dashboard');
    }
  }, [hasRole, isAuthenticated, router]);

  if (!isAuthenticated || !hasRole(['superadmin'])) {
    return null;
  }

  return <>{children}</>;
}
