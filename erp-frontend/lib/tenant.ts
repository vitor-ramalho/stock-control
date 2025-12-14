// ============================================
// Tenant Management
// ============================================

const TENANT_STORAGE_KEY = 'tenant_id';

export const getTenantId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Get from localStorage (stored after login)
  const stored = localStorage.getItem(TENANT_STORAGE_KEY);
  if (stored) return stored;
  
  // No tenant available - user needs to login first
  return null;
};

export const setTenantId = (tenantId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
};

export const clearTenantId = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TENANT_STORAGE_KEY);
};
