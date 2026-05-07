'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLoading } from '@/components/ui/loading-spinner';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, user, hasRole } = useAuth();

    useEffect(() => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requiredRoles && user && !hasRole(requiredRoles)) {
        router.push('/dashboard');
      }
    }, [isAuthenticated, user, router, hasRole]);

    if (!isAuthenticated) {
      return <PageLoading />;
    }

    if (requiredRoles && user && !hasRole(requiredRoles)) {
      return <PageLoading />;
    }

    return <Component {...props} />;
  };
}
