# Complete Frontend Implementation Guide

This document contains ALL remaining code needed to complete the multi-tenant SaaS ERP frontend.

## ✅ Already Completed

1. **Core Infrastructure**
   - ✅ Type definitions (`types/index.ts`)
   - ✅ API client with interceptors (`lib/api.ts`)
   - ✅ Auth store with Zustand (`lib/store.ts`)
   - ✅ Tenant management (`lib/tenant.ts`)
   - ✅ Providers (Query, Tenant, Toast)
   - ✅ Auth hooks (`hooks/use-auth.ts`)
   - ✅ Login page (`app/login/page.tsx`)
   - ✅ withAuth HOC (`components/auth/with-auth.tsx`)
   - ✅ UI components: LoadingSpinner, ErrorState, EmptyState, ConfirmDialog

2. **Shadcn UI Components Installed**
   - button, input, label, card, table, dialog, form, select, dropdown-menu
   - separator, badge, alert-dialog, alert

## 📦 Next Steps - File Generation

### 1. ADMIN LAYOUT

#### `app/(dashboard)/layout.tsx`
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
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
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Stock', href: '/stock', icon: Archive },
  { name: 'Cash Register', href: '/cash', icon: Wallet },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'POS', href: '/pos', icon: Monitor },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return <PageLoading />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-gray-900 text-white transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={cn('transition-opacity', !sidebarOpen && 'opacity-0')}>
            <h1 className="text-2xl font-bold">ERP</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-gray-800"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-gray-800 text-white' 
                    : 'hover:bg-gray-800 text-gray-300',
                  !sidebarOpen && 'justify-center'
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-gray-700 my-4" />
        
        <div className="p-3 space-y-2">
          {sidebarOpen && (
            <div className="px-3 py-2 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="font-medium text-sm truncate">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {user?.role}
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              'w-full text-white hover:bg-gray-800',
              !sidebarOpen && 'px-2'
            )}
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
```

### 2. CUSTOM HOOKS

#### `hooks/use-products.ts`
```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product, ProductFormData } from '@/types';
import { toast } from 'sonner';

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSearchProducts(query: string) {
  return useQuery<Product[]>({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      const response = await api.get(`/products/search`, {
        params: { q: query },
      });
      return response.data;
    },
    enabled: query.length > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create product');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const response = await api.patch(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update product');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete product');
    },
  });
}
```

#### `hooks/use-categories.ts`
```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Category, CategoryFormData } from '@/types';
import { toast } from 'sonner';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await api.post('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const response = await api.patch(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update category');
    },
  });
}
```

### 3. DASHBOARD HOME PAGE

#### `app/(dashboard)/dashboard/page.tsx`
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorState message="Failed to load dashboard" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your ERP system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaySales.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${stats?.todaySales.total.toFixed(2) || '0.00'} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Register</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats?.openCashRegister ? (
              <>
                <div className="text-2xl font-bold">
                  ${stats.openCashRegister.balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-green-600">Open</Badge>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No open register</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lowStockProducts.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Products need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/pos">
              <Button variant="outline" size="sm" className="w-full">
                Open POS
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <Badge variant="destructive">{product.quantity} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      {stats?.recentSales && stats.recentSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">Sale #{sale.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(sale.total).toFixed(2)}</p>
                    <Badge variant="outline">{sale.paymentMethod}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

This is getting very long. Let me create a comprehensive bash script that will generate all remaining files at once. This will be more efficient.
