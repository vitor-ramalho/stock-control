'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useStockIn, useStockOut } from '@/hooks/use-stock';
import { Product } from '@/types';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const stockMovementSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  origin: z.string().optional(),
  reason: z.string().max(500, 'Reason too long').optional(),
});

type StockMovementFormData = z.infer<typeof stockMovementSchema>;

interface StockMovementDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'in' | 'out';
}

export function StockMovementDialog({ product, open, onOpenChange, type }: StockMovementDialogProps) {
  const stockInMutation = useStockIn();
  const stockOutMutation = useStockOut();
  const mutation = type === 'in' ? stockInMutation : stockOutMutation;

  const form = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      quantity: 1,
      origin: '',
      reason: '',
    },
  });

  const handleSubmit = async (data: StockMovementFormData) => {
    if (!product) return;

    // Validate stock out doesn't exceed current stock
    if (type === 'out' && data.quantity > product.quantity) {
      form.setError('quantity', {
        message: `Cannot remove more than ${product.quantity} units`,
      });
      return;
    }

    const payload = {
      productId: product.id,
      quantity: data.quantity,
      origin: data.origin || 'Manual Entry',
      reason: data.reason,
    };

    await mutation.mutateAsync(payload);
    form.reset();
    onOpenChange(false);
  };

  if (!product) return null;

  const isStockIn = type === 'in';
  const icon = isStockIn ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />;
  const title = isStockIn ? 'Add Stock' : 'Remove Stock';
  const description = isStockIn
    ? 'Increase inventory for this product'
    : 'Decrease inventory for this product';
  const submitLabel = isStockIn ? 'Add Stock' : 'Remove Stock';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {icon}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Product:</span>
              <span className="text-sm">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">SKU:</span>
              <span className="text-sm font-mono">{product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Current Stock:</span>
              <span className="text-sm font-bold">{product.quantity} units</span>
            </div>
          </div>

          {/* Warning for stock out */}
          {type === 'out' && product.quantity === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This product is currently out of stock. You cannot remove stock.
              </AlertDescription>
            </Alert>
          )}

          {type === 'out' && product.quantity > 0 && product.quantity <= 10 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: This product has low stock ({product.quantity} units remaining).
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={type === 'out' ? product.quantity : undefined}
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      {type === 'out' && `Maximum: ${product.quantity} units`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={type === 'in' ? 'e.g., Supplier, Warehouse' : 'e.g., Sale, Damage'}
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Additional notes about this movement"
                        {...field}
                        disabled={mutation.isPending}
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
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={mutation.isPending || (type === 'out' && product.quantity === 0)}
                >
                  {mutation.isPending ? 'Processing...' : submitLabel}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
