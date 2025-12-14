'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToggleTenantStatus } from '@/hooks/use-backoffice';

interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
}

interface ToggleTenantStatusDialogProps {
  tenant: Tenant;
  action: 'activate' | 'deactivate';
  open: boolean;
  onClose: () => void;
}

export function ToggleTenantStatusDialog({
  tenant,
  action,
  open,
  onClose,
}: ToggleTenantStatusDialogProps) {
  const mutation = useToggleTenantStatus();

  const handleConfirm = () => {
    mutation.mutate(
      { id: tenant.id, isActive: action === 'activate' },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'activate' ? 'Ativar' : 'Desativar'} Empresa
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja{' '}
            {action === 'activate' ? 'ativar' : 'desativar'} a empresa{' '}
            <span className="font-semibold">{tenant.name}</span>?
            {action === 'deactivate' && (
              <span className="block mt-2 text-destructive">
                Os usuários desta empresa não poderão acessar o sistema enquanto estiver inativa.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant={action === 'deactivate' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processando...
              </>
            ) : action === 'activate' ? (
              'Ativar'
            ) : (
              'Desativar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
