import { useAuth } from '@/hooks/use-auth';

const normalizeRole = (role: string) => role.toLowerCase();

export function usePermissions() {
  const { user, hasRole } = useAuth();

  const role = user?.role ? normalizeRole(user.role) : null;

  return {
    role,
    isSuperadmin: hasRole(['superadmin']),
    canManageProducts: hasRole(['admin', 'manager']),
    canManageCategories: hasRole(['admin', 'manager']),
    canManageStock: hasRole(['admin', 'manager']),
    canAccessCash: hasRole(['admin', 'manager', 'cashier']),
    canAccessSales: hasRole(['admin', 'manager', 'cashier']),
    canAccessPOS: hasRole(['admin', 'manager', 'cashier']),
    canAccessCustomers: hasRole(['admin', 'manager', 'cashier']),
    canAccessReports: hasRole(['admin', 'manager']),
    canManageUsers: hasRole(['admin', 'manager']),
  };
}
