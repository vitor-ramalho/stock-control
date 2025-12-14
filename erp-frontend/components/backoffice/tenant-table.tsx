'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Power, PowerOff } from 'lucide-react';
import { ToggleTenantStatusDialog } from './toggle-tenant-status-dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

interface TenantTableProps {
  tenants: Tenant[];
  onViewDetails: (id: string) => void;
}

export function TenantTable({ tenants, onViewDetails }: TenantTableProps) {
  const [toggleTenantId, setToggleTenantId] = useState<string | null>(null);
  const [toggleAction, setToggleAction] = useState<'activate' | 'deactivate'>('activate');

  const selectedTenant = tenants.find((t) => t.id === toggleTenantId);

  const handleToggle = (tenant: Tenant) => {
    setToggleTenantId(tenant.id);
    setToggleAction(tenant.isActive ? 'deactivate' : 'activate');
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado há</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">{tenant.name}</TableCell>
              <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
              <TableCell>
                <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                  {tenant.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(tenant.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(tenant.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(tenant)}
                  >
                    {tenant.isActive ? (
                      <PowerOff className="h-4 w-4 text-red-600" />
                    ) : (
                      <Power className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTenant && (
        <ToggleTenantStatusDialog
          tenant={selectedTenant}
          action={toggleAction}
          open={!!toggleTenantId}
          onClose={() => setToggleTenantId(null)}
        />
      )}
    </>
  );
}
