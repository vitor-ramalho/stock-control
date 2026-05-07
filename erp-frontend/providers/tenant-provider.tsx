'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import { getTenantId, setTenantId } from '@/lib/tenant';

interface TenantContextType {
  tenantId: string | null;
  setTenant: (id: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantState] = useState<string | null>(() => getTenantId());

  const setTenant = (id: string) => {
    setTenantId(id);
    setTenantState(id);
  };

  return (
    <TenantContext.Provider value={{ tenantId, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
