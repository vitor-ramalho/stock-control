'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCheckout, CheckoutPayload, CheckoutResponse } from '@/hooks/use-pos';
import { usePOSCartStore } from '@/store/pos-cart';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const checkoutSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'pix']),
  customerName: z.string().optional(),
  amountReceived: z.number().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: CheckoutResponse) => void;
}

export function CheckoutDialog({ open, onOpenChange, onSuccess }: CheckoutDialogProps) {
  const { items, getCartSubtotal, getCartTotal } = usePOSCartStore();
  const checkoutMutation = useCheckout();
  const [change, setChange] = useState(0);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'cash',
      customerName: '',
      amountReceived: undefined,
    },
  });

  const paymentMethod = form.watch('paymentMethod');
  const amountReceived = form.watch('amountReceived');
  const total = getCartTotal();

  // Calculate change for cash payments
  useEffect(() => {
    if (paymentMethod === 'cash' && amountReceived) {
      const calculatedChange = amountReceived - total;
      setChange(calculatedChange > 0 ? calculatedChange : 0);
    } else {
      setChange(0);
    }
  }, [paymentMethod, amountReceived, total]);

  const handleSubmit = async (data: CheckoutFormData) => {
    // Validate amount received for cash payments
    if (data.paymentMethod === 'cash' && (!data.amountReceived || data.amountReceived < total)) {
      form.setError('amountReceived', {
        message: 'Amount received must be at least the total amount',
      });
      return;
    }

    const payload: CheckoutPayload = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      paymentMethod: data.paymentMethod,
      customerName: data.customerName || undefined,
      subtotal: getCartSubtotal(),
      total: getCartTotal(),
      amountReceived: data.paymentMethod === 'cash' ? data.amountReceived : undefined,
      change: data.paymentMethod === 'cash' ? change : undefined,
    };

    try {
      const result = await checkoutMutation.mutateAsync(payload);
      onSuccess(result);
      form.reset();
      onOpenChange(false);
    } catch {
      // Error is handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Checkout</DialogTitle>
          <DialogDescription>
            Select payment method and complete the sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${getCartSubtotal().toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl text-green-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        <div>
                          <RadioGroupItem
                            value="cash"
                            id="cash"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="cash"
                            className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Banknote className="h-6 w-6" />
                            <span className="text-sm font-medium">Cash</span>
                          </Label>
                        </div>

                        <div>
                          <RadioGroupItem
                            value="card"
                            id="card"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="card"
                            className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <CreditCard className="h-6 w-6" />
                            <span className="text-sm font-medium">Card</span>
                          </Label>
                        </div>

                        <div>
                          <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                          <Label
                            htmlFor="pix"
                            className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Smartphone className="h-6 w-6" />
                            <span className="text-sm font-medium">PIX</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Received (Cash only) */}
              {paymentMethod === 'cash' && (
                <FormField
                  control={form.control}
                  name="amountReceived"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Received</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min={total}
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter the amount of cash received from customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Change Display */}
              {paymentMethod === 'cash' && amountReceived && amountReceived >= total && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-900">
                      Change to Return:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Walk-in customer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={checkoutMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Processing...' : 'Complete Sale'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
