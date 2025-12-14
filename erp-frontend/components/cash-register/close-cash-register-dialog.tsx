'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useCloseCashRegister } from '@/hooks/use-cash-register';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

const closeCashRegisterSchema = z.object({
  finalBalance: z.number().min(0, 'Saldo de fechamento deve ser positivo'),
});

type CloseCashRegisterFormData = z.infer<typeof closeCashRegisterSchema>;

interface CloseCashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export function CloseCashRegisterDialog({ open, onOpenChange, currentBalance }: CloseCashRegisterDialogProps) {
  const closeMutation = useCloseCashRegister();

  const form = useForm<CloseCashRegisterFormData>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: {
      finalBalance: currentBalance,
    },
  });

  const finalBalance = form.watch('finalBalance');
  const difference = finalBalance - currentBalance;
  const hasDifference = Math.abs(difference) > 0.01;

  const handleSubmit = async (data: CloseCashRegisterFormData) => {
    await closeMutation.mutateAsync(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Fechar Caixa</AlertDialogTitle>
          <AlertDialogDescription>
            Conte o dinheiro físico e informe o saldo de fechamento. Isso encerrará a sessão atual.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Balance Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Saldo Esperado:</span>
              <span className="text-sm font-bold">{formatCurrency(currentBalance)}</span>
            </div>
            {finalBalance > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Saldo Real:</span>
                  <span className="text-sm font-bold">{formatCurrency(finalBalance)}</span>
                </div>
                {hasDifference && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Diferença:</span>
                    <span className={`text-sm font-bold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {difference > 0 ? '+' : ''}{formatCurrency(Math.abs(difference))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warning for discrepancy */}
          {hasDifference && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {difference > 0
                  ? 'Há dinheiro excedente. Por favor, verifique a contagem.'
                  : 'Há falta de dinheiro. Por favor, verifique a contagem.'}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="finalBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo de Fechamento</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={closeMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Informe o valor real em dinheiro contado no caixa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={closeMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="flex-1"
                  disabled={closeMutation.isPending}
                >
                  {closeMutation.isPending ? 'Fechando...' : 'Fechar Caixa'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
