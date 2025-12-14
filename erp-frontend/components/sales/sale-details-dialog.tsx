'use client';

import { useSaleById } from '@/hooks/use-sales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SaleItemsList } from './sale-items-list';
import { User, Wallet, CreditCard, Receipt, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SaleDetailsDialogProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsDialog({ saleId, open, onOpenChange }: SaleDetailsDialogProps) {
  const { data: sale, isLoading } = useSaleById(saleId);

  if (isLoading || !sale) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const subtotal = Number(sale.subtotal || sale.total);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const total = Number(sale.total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sale Details
              </DialogTitle>
              <DialogDescription className="mt-1">
                Transaction ID: #{sale.id.slice(0, 12)}
              </DialogDescription>
            </div>
            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
              {sale.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sale Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Customer
              </div>
              <div className="font-medium">
                {sale.customerName || (
                  <span className="text-muted-foreground italic">Walk-in Customer</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </div>
              <Badge variant="secondary" className="capitalize">
                {sale.paymentMethod}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date & Time
              </div>
              <div className="font-medium">
                {format(new Date(sale.createdAt), 'MMM dd, yyyy - HH:mm:ss')}
              </div>
            </div>

            {sale.cashRegister && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Cash Register
                </div>
                <div className="font-medium text-sm">
                  #{sale.cashRegister.id.slice(0, 8)}
                </div>
              </div>
            )}

            {sale.user && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  POS Operator
                </div>
                <div className="font-medium">
                  {sale.user.name || sale.user.email}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Items</h3>
            <SaleItemsList items={sale.items || []} />
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-red-600">-${discount.toFixed(2)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-2xl text-green-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {sale.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Notes</h4>
                <p className="text-sm text-muted-foreground">{sale.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
