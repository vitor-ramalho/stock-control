'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegisterMovement } from '@/hooks/use-cash-register';
import { Plus, Minus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/currency';

const registerMovementSchema = z.object({
  type: z.enum(['in', 'out']),
  value: z.number().min(0.01, 'Valor deve ser maior que 0'),
  category: z.string().optional(),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  paymentMethod: z.enum(['cash', 'card', 'pix']).optional(),
});

type RegisterMovementFormData = z.infer<typeof registerMovementSchema>;

interface RegisterMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export function RegisterMovementDialog({ open, onOpenChange, currentBalance }: RegisterMovementDialogProps) {
  const movementMutation = useRegisterMovement();

  const form = useForm<RegisterMovementFormData>({
    resolver: zodResolver(registerMovementSchema),
    defaultValues: {
      type: 'in',
      value: 0,
      category: 'other',
      description: '',
      paymentMethod: 'cash',
    },
  });

  const movementType = form.watch('type');
  const amount = form.watch('value');

  const handleSubmit = async (data: RegisterMovementFormData) => {
    // Validate negative balance for expenses
    if (data.type === 'out' && data.value > currentBalance) {
      form.setError('value', {
        message: 'Saldo insuficiente. Não é possível registrar esta despesa.',
      });
      return;
    }

    // Ensure category is set to a valid value
    const payload = {
      ...data,
      category: (data.category as 'sale' | 'purchase' | 'expense' | 'other') || 'other',
    };

    await movementMutation.mutateAsync(payload);
    form.reset();
    onOpenChange(false);
  };

  const isIncome = movementType === 'in';
  const icon = isIncome ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />;
  const title = isIncome ? 'Registrar Entrada' : 'Registrar Saída';
  const newBalance = isIncome ? currentBalance + amount : currentBalance - amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            Registre uma movimentação manual de caixa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Saldo Atual:</span>
              <span className="text-sm font-bold">{formatCurrency(currentBalance)}</span>
            </div>
            {amount > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Novo Saldo:</span>
                <span className={`text-sm font-bold ${newBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(newBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Warning for negative balance */}
          {movementType === 'out' && newBalance < 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Atenção: Esta despesa resultará em saldo negativo!
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimentação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">Entrada (+)</SelectItem>
                        <SelectItem value="out">Saída (-)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={movementMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Observação sobre esta movimentação"
                        {...field}
                        disabled={movementMutation.isPending}
                      />
                    </FormControl>
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
                  disabled={movementMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={movementMutation.isPending}
                >
                  {movementMutation.isPending ? 'Registrando...' : 'Registrar Movimentação'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
