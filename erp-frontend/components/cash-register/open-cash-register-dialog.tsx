'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useOpenCashRegister } from '@/hooks/use-cash-register';
import { Wallet } from 'lucide-react';

const openCashRegisterSchema = z.object({
  initialBalance: z.number().min(0, 'Saldo inicial deve ser positivo'),
});

type OpenCashRegisterFormData = z.infer<typeof openCashRegisterSchema>;

export function OpenCashRegisterDialog() {
  const [open, setOpen] = useState(false);
  const openMutation = useOpenCashRegister();

  const form = useForm<OpenCashRegisterFormData>({
    resolver: zodResolver(openCashRegisterSchema),
    defaultValues: {
      initialBalance: 0,
    },
  });

  const handleSubmit = async (data: OpenCashRegisterFormData) => {
    await openMutation.mutateAsync(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full md:w-auto">
          <Wallet className="mr-2 h-5 w-5" />
          Abrir Caixa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={openMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o valor inicial em dinheiro no caixa
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
                onClick={() => setOpen(false)}
                disabled={openMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={openMutation.isPending}
              >
                {openMutation.isPending ? 'Abrindo...' : 'Abrir Caixa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
