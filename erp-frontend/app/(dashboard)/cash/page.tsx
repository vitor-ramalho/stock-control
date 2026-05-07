'use client';

import { useState } from 'react';
import { useCurrentCashRegister, useCashRegisterMovements } from '@/hooks/use-cash-register';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { CashRegisterStatusCard } from '@/components/cash-register/cash-register-status-card';
import { OpenCashRegisterDialog } from '@/components/cash-register/open-cash-register-dialog';
import { RegisterMovementDialog } from '@/components/cash-register/register-movement-dialog';
import { CloseCashRegisterDialog } from '@/components/cash-register/close-cash-register-dialog';
import { MovementsList } from '@/components/cash-register/movements-list';
import { Wallet, Plus, Lock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { withAuth } from '@/components/auth/with-auth';

function CashRegisterPage() {
  const { data: cashRegister, isLoading, error, refetch } = useCurrentCashRegister();
  const { data: movements = [] } = useCashRegisterMovements(cashRegister?.id);
  
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorState message="Falha ao carregar caixa. Por favor, tente novamente." />;
  }

  // Calculate current balance from movements
  const currentBalance = cashRegister
    ? Number(cashRegister.initialBalance) +
      movements.reduce((sum, m) => {
        const value = Number(m.value);
        return sum + (m.type === 'in' ? value : -value);
      }, 0)
    : 0;

  // No active session - show open button
  if (!cashRegister) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie operações diárias de caixa e acompanhe movimentações
          </p>
        </div>

        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertTitle>Nenhuma Sessão Ativa</AlertTitle>
          <AlertDescription>
            Não há sessão de caixa aberta. Abra uma para começar a aceitar pagamentos e rastrear movimentações.
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Caixa Fechado</CardTitle>
            <CardDescription>
              Inicie uma nova sessão para começar a rastrear movimentações de caixa
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <OpenCashRegisterDialog />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active session exists
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          </div>
          <p className="text-muted-foreground">
            Sessão ativa - Gerenciando operações de caixa
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status Card */}
      <CashRegisterStatusCard 
        cashRegister={cashRegister} 
        currentBalance={currentBalance}
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setIsMovementDialogOpen(true)}
          className="flex-1 md:flex-initial"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar Movimentação
        </Button>
        <Button
          variant="destructive"
          onClick={() => setIsCloseDialogOpen(true)}
          className="flex-1 md:flex-initial"
        >
          <Lock className="mr-2 h-4 w-4" />
          Fechar Caixa
        </Button>
      </div>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações de Caixa</CardTitle>
          <CardDescription>
            Todas as transações de entrada e saída desta sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MovementsList movements={movements} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RegisterMovementDialog
        open={isMovementDialogOpen}
        onOpenChange={setIsMovementDialogOpen}
        currentBalance={currentBalance}
      />
      <CloseCashRegisterDialog
        open={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
        currentBalance={currentBalance}
      />
    </div>
  );
}

export default withAuth(CashRegisterPage, ['admin', 'manager', 'cashier']);
