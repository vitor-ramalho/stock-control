'use client';

import { FinancialEntry } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

interface MovementsListProps {
  movements: FinancialEntry[];
}

export function MovementsList({ movements }: MovementsListProps) {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Nenhuma movimentação ainda</p>
        <p className="text-sm text-muted-foreground">
          Registre sua primeira entrada ou saída
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const isIncome = movement.type === 'in';
            const amount = Number(movement.value) || 0;

            return (
              <TableRow key={movement.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isIncome ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={isIncome ? 'default' : 'secondary'}>
                      {isIncome ? 'Entrada' : 'Saída'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{movement.category}</TableCell>
                <TableCell>
                  <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(amount)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {movement.description || '—'}
                </TableCell>
                <TableCell>
                  {movement.paymentMethod ? (
                    <Badge variant="outline" className="capitalize">
                      {movement.paymentMethod}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(movement.createdAt), 'dd MMM, HH:mm')}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
