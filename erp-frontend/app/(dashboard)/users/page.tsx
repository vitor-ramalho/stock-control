'use client';

import { useEffect, useMemo, useState } from 'react';
import { withAuth } from '@/components/auth/with-auth';
import { useCreateUser, useUpdateUser, useUsers } from '@/hooks/use-users';
import { CreateUserFormData, UpdateUserFormData, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCog, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateUserFormData) => Promise<void>;
  isSubmitting: boolean;
}

interface EditUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (payload: UpdateUserFormData) => Promise<void>;
  isSubmitting: boolean;
}

function UserFormDialog({ open, onOpenChange, onSubmit, isSubmitting }: UserFormDialogProps) {
  const [formData, setFormData] = useState<CreateUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Novo Usuario</DialogTitle>
          <DialogDescription>
            Crie um novo usuario para operar neste tenant.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <select
              id="role"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  role: e.target.value as CreateUserFormData['role'],
                }))
              }
            >
              <option value="admin">Admin</option>
              <option value="manager">Gerente</option>
              <option value="cashier">Caixa</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Criar Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: EditUserFormDialogProps) {
  const [formData, setFormData] = useState<UpdateUserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: (user?.role.toLowerCase() as UpdateUserFormData['role']) || 'cashier',
    password: '',
  });

  const syncForm = (target: User | null) => {
    setFormData({
      name: target?.name || '',
      email: target?.email || '',
      role: (target?.role.toLowerCase() as UpdateUserFormData['role']) || 'cashier',
      password: '',
    });
  };

  useEffect(() => {
    if (open) {
      syncForm(user);
    }
  }, [open, user]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      password: formData.password?.trim() ? formData.password : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Atualize dados e perfil do usuario selecionado.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={formData.name || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Nova senha (opcional)</Label>
            <Input
              id="edit-password"
              type="password"
              minLength={6}
              value={formData.password || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Perfil</Label>
            <select
              id="edit-role"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  role: e.target.value as UpdateUserFormData['role'],
                }))
              }
            >
              <option value="admin">Admin</option>
              <option value="manager">Gerente</option>
              <option value="cashier">Caixa</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alteracoes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const { data, isLoading, error } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const users = useMemo(() => data || [], [data]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }, [users, search]);

  const handleCreateUser = async (payload: CreateUserFormData) => {
    await createMutation.mutateAsync(payload);
  };

  const openEditDialog = (target: User) => {
    setSelectedUser(target);
    setEditDialogOpen(true);
  };

  const handleEditUser = async (payload: UpdateUserFormData) => {
    if (!selectedUser) return;
    await updateMutation.mutateAsync({
      id: selectedUser.id,
      payload,
    });
  };

  const openToggleStatusDialog = (target: User) => {
    setToggleTarget(target);
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget) return;
    await updateMutation.mutateAsync({
      id: toggleTarget.id,
      payload: { isActive: !toggleTarget.isActive },
    });
    setToggleTarget(null);
  };

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorState message="Falha ao carregar usuarios" />;

  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          </div>
          <p className="text-muted-foreground">
            Listagem e criacao de usuarios da empresa com acesso exclusivo de admin.
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios Ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios Inativos</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl text-gray-600">{users.length - activeCount}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Visualize os usuarios cadastrados neste tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome, email ou perfil"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filteredUsers.length === 0 ? (
            <EmptyState
              title="Nenhum usuario encontrado"
              description="Crie um novo usuario para iniciar a operacao da equipe."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'outline' : 'secondary'}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant={user.isActive ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => openToggleStatusDialog(user)}
                        disabled={currentUser?.id === user.id}
                        title={currentUser?.id === user.id ? 'Voce nao pode desativar seu proprio usuario' : ''}
                      >
                        {user.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateUser}
        isSubmitting={createMutation.isPending}
      />

      <EditUserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        onSubmit={handleEditUser}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => {
          if (!open) {
            setToggleTarget(null);
          }
        }}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.isActive ? 'Desativar usuario?' : 'Ativar usuario?'}
        description={
          toggleTarget?.isActive
            ? `O usuario ${toggleTarget?.name} perdera acesso ao sistema ate ser reativado.`
            : `O usuario ${toggleTarget?.name} voltara a ter acesso ao sistema.`
        }
        confirmText={toggleTarget?.isActive ? 'Desativar' : 'Ativar'}
        cancelText="Cancelar"
        variant={toggleTarget?.isActive ? 'destructive' : 'default'}
      />
    </div>
  );
}

export default withAuth(UsersPage, ['admin']);
