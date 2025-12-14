'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { TenantTable } from '@/components/backoffice/tenant-table';
import { TenantDetailsDrawer } from '@/components/backoffice/tenant-details-drawer';
import { Building2 } from 'lucide-react';
import { useBackofficeTenants } from '@/hooks/use-backoffice';

export default function BackofficePage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const { data: tenants, isLoading, error } = useBackofficeTenants();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorState message="Falha ao carregar empresas" />;

  const stats = {
    total: tenants?.length || 0,
    active: tenants?.filter((t) => t.isActive).length || 0,
    inactive: tenants?.filter((t) => !t.isActive).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Backoffice</span>
        <span>/</span>
        <span className="font-medium text-foreground">Empresas</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Empresas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as empresas cadastradas no sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empresas Inativas</CardTitle>
            <Building2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantTable
            tenants={tenants || []}
            onViewDetails={(id) => setSelectedTenantId(id)}
          />
        </CardContent>
      </Card>

      {/* Details Drawer */}
      {selectedTenantId && (
        <TenantDetailsDrawer
          tenantId={selectedTenantId}
          open={!!selectedTenantId}
          onClose={() => setSelectedTenantId(null)}
        />
      )}
    </div>
  );
}
