'use client';

import { useMemo, useState } from 'react';
import { withAuth } from '@/components/auth/with-auth';
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/hooks/use-customers';
import { Customer, CustomerFormData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isSubmitting: boolean;
}

function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
  isSubmitting,
}: CustomerFormDialogProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    document: customer?.document || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
    isActive: customer?.isActive ?? true,
  });

  const title = customer ? 'Editar Cliente' : 'Novo Cliente';
  const submitLabel = customer ? 'Salvar Alterações' : 'Criar Cliente';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document: formData.document || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente para cadastrar ou atualizar.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nome</Label>
            <Input
              id="customer-name"
              value={formData.name || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              maxLength={150}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                maxLength={150}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Telefone</Label>
              <Input
                id="customer-phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                maxLength={40}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-document">Documento</Label>
            <Input
              id="customer-document"
              value={formData.document || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, document: e.target.value }))}
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-address">Endereço</Label>
            <Input
              id="customer-address"
              value={formData.address || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-notes">Observações</Label>
            <Input
              id="customer-notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const { data, isLoading, error } = useCustomers({
    page,
    limit,
    q: search || undefined,
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const customers = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.totalPages || 1;

  const onCreate = async (formData: CustomerFormData) => {
    await createMutation.mutateAsync(formData);
  };

  const onUpdate = async (formData: CustomerFormData) => {
    if (!editingCustomer) return;
    await updateMutation.mutateAsync({
      id: editingCustomer.id,
      data: formData,
    });
    setEditingCustomer(null);
  };

  const onDelete = async () => {
    if (!deletingCustomer) return;
    await deleteMutation.mutateAsync(deletingCustomer.id);
    setDeletingCustomer(null);
  };

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorState message="Falha ao carregar clientes." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie cadastro, busca e status dos clientes do seu tenant.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Busca e Resumo</CardTitle>
          <CardDescription>Filtre por nome, email, telefone ou documento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{data?.total || 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Ativos</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter((customer) => customer.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Inativos</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter((customer) => !customer.isActive).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Página {data?.page || 1} de {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <EmptyState title="Nenhum cliente encontrado" description="Cadastre o primeiro cliente para começar." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.document || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? 'outline' : 'secondary'}>
                        {customer.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingCustomer(customer)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeletingCustomer(customer)}>
                        Desativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Exibindo {customers.length} de {data?.total || 0} clientes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={onCreate}
        isSubmitting={createMutation.isPending}
      />

      <CustomerFormDialog
        open={!!editingCustomer}
        onOpenChange={(open) => {
          if (!open) setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSubmit={onUpdate}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => {
          if (!open) setDeletingCustomer(null);
        }}
        onConfirm={onDelete}
        title="Desativar cliente"
        description="O cliente será marcado como inativo e deixará de aparecer no PDV."
        confirmText={deleteMutation.isPending ? 'Desativando...' : 'Desativar'}
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}

export default withAuth(CustomersPage, ['admin', 'manager', 'cashier']);
