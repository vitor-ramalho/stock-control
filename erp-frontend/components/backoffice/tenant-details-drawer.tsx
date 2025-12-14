'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/ui/loading-spinner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, Users, Mail, Calendar } from 'lucide-react';
import { useBackofficeTenant, useBackofficeTenantUsers } from '@/hooks/use-backoffice';

interface TenantDetailsDrawerProps {
  tenantId: string;
  open: boolean;
  onClose: () => void;
}

export function TenantDetailsDrawer({
  tenantId,
  open,
  onClose,
}: TenantDetailsDrawerProps) {
  const { data: tenant, isLoading: isTenantLoading } = useBackofficeTenant(tenantId);
  const { data: users, isLoading: isUsersLoading } = useBackofficeTenantUsers(tenantId);

  const isLoading = isTenantLoading || isUsersLoading;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <PageLoading />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tenant?.name}
              </SheetTitle>
              <SheetDescription>
                Detalhes e usuários da empresa
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Tenant Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informações</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{tenant?.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono text-xs">{tenant?.slug}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Criado:</span>
                    <span>
                      {formatDistanceToNow(new Date(tenant?.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={tenant?.isActive ? 'default' : 'secondary'}>
                      {tenant?.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Users List */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h3 className="font-semibold">
                    Usuários ({users?.length || 0})
                  </h3>
                </div>

                <div className="space-y-3">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Criado{' '}
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {users?.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Nenhum usuário cadastrado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
