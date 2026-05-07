'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Archive, 
  Wallet, 
  ShoppingCart, 
  Monitor,
  LogOut,
  FileText,
  Users,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';

const navigation = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard, visible: () => true },
  { name: 'Produtos', href: '/products', icon: Package, visible: (p: ReturnType<typeof usePermissions>) => p.canManageProducts },
  { name: 'Categorias', href: '/categories', icon: FolderTree, visible: (p: ReturnType<typeof usePermissions>) => p.canManageCategories },
  { name: 'Estoque', href: '/stock', icon: Archive, visible: (p: ReturnType<typeof usePermissions>) => p.canManageStock },
  { name: 'Caixa', href: '/cash', icon: Wallet, visible: (p: ReturnType<typeof usePermissions>) => p.canAccessCash },
  { name: 'Vendas', href: '/sales', icon: ShoppingCart, visible: (p: ReturnType<typeof usePermissions>) => p.canAccessSales },
  { name: 'PDV', href: '/pos', icon: Monitor, visible: (p: ReturnType<typeof usePermissions>) => p.canAccessPOS },
  { name: 'Clientes', href: '/customers', icon: Users, visible: (p: ReturnType<typeof usePermissions>) => p.canAccessCustomers },
  { name: 'Relatórios', href: '/reports', icon: FileText, visible: (p: ReturnType<typeof usePermissions>) => p.canAccessReports },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const permissions = usePermissions();
  const logout = useLogout();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Sistema ERP</h1>
        <p className="text-sm text-gray-400">Painel Administrativo</p>
      </div>
      
      <nav className="flex-1 space-y-1 px-3">
        {navigation.filter((item) => item.visible(permissions)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm',
                isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'hover:bg-gray-800 text-gray-300'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Backoffice (superadmin only) */}
        {permissions.isSuperadmin && (
          <>
            <Separator className="bg-gray-700 my-2" />
            <Link
              href="/backoffice"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm',
                pathname === '/backoffice'
                  ? 'bg-orange-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              )}
            >
              <Shield className="h-5 w-5 shrink-0" />
              <span>Backoffice</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Admin
              </Badge>
            </Link>
          </>
        )}
      </nav>

      <Separator className="bg-gray-700 my-4" />
      
      <div className="p-3 space-y-2">
        <div className="px-4 py-2 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">Conectado como</p>
          <p className="font-medium text-sm truncate">{user?.email}</p>
          <Badge variant="outline" className="mt-1 text-xs capitalize">
            {user?.role}
          </Badge>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-gray-800"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
