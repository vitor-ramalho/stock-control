'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, Mail, UserPlus, Users } from 'lucide-react';
import {
  useBackofficeTenant,
  useBackofficeTenantUsers,
  useCreateTenantUser,
  useToggleTenantUserStatus,
} from '@/hooks/use-backoffice';

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
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier' | 'user',
  });

  const { data: tenant, isLoading: isTenantLoading } = useBackofficeTenant(tenantId);
  const { data: users, isLoading: isUsersLoading } = useBackofficeTenantUsers(tenantId);
  const createTenantUser = useCreateTenantUser();
  const toggleTenantUserStatus = useToggleTenantUserStatus();

  const isLoading = isTenantLoading || isUsersLoading;

  const handleCreateUser = async () => {
    await createTenantUser.mutateAsync({
      tenantId,
      data: newUserData,
    });

    setNewUserData({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
    });
    setIsCreateUserOpen(false);
  };

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
                    <span className="text-muted-foreground">Criado:</span>
                    <span>
                      {tenant?.createdAt
                        ? formatDistanceToNow(new Date(tenant.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : '-'}
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-semibold">
                      Usuários ({users?.length || 0})
                    </h3>
                  </div>

                  <Button size="sm" onClick={() => setIsCreateUserOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </Button>
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Criado{' '}
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleTenantUserStatus.isPending}
                          onClick={() =>
                            toggleTenantUserStatus.mutate({
                              tenantId,
                              userId: user.id,
                              isActive: !user.isActive,
                            })
                          }
                        >
                          {user.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
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

            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie um usuário para a empresa {tenant?.name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newUserData.name}
                      onChange={(e) =>
                        setNewUserData((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Papel</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value: 'admin' | 'manager' | 'cashier' | 'user') =>
                        setNewUserData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateUserOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={
                      createTenantUser.isPending ||
                      !newUserData.name ||
                      !newUserData.email ||
                      !newUserData.password
                    }
                  >
                    {createTenantUser.isPending ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
