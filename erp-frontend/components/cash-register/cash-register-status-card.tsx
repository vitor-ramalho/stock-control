'use client';

import { CashRegister } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

interface CashRegisterStatusCardProps {
  cashRegister: CashRegister;
  currentBalance: number;
}

export function CashRegisterStatusCard({ cashRegister, currentBalance }: CashRegisterStatusCardProps) {
  const initialBalance = Number(cashRegister.initialBalance) || 0;
  const safeCurrentBalance = Number(currentBalance) || 0;
  const difference = safeCurrentBalance - initialBalance;
  const isPositive = difference >= 0;

  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Status do Caixa
          </CardTitle>
          <Badge variant="default" className="bg-green-600">
            ABERTO
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Opening Balance */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Saldo Inicial
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(initialBalance)}
            </div>
          </div>

          {/* Current Balance */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Saldo Atual
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(safeCurrentBalance)}
            </div>
          </div>

          {/* Difference */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Diferença
            </div>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(Math.abs(difference))}
            </div>
          </div>

          {/* Opened At */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Aberto Em
            </div>
            <div className="text-lg font-semibold">
              {format(new Date(cashRegister.openedAt), 'dd MMM, HH:mm')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(cashRegister.openedAt), 'yyyy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
