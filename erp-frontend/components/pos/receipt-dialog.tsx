'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptData {
  saleId: string;
  receiptNumber: string;
  total: number;
  change?: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  paymentMethod: string;
  customerName?: string;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
  onNewSale: () => void;
}

export function ReceiptDialog({ open, onOpenChange, data, onNewSale }: ReceiptDialogProps) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    onOpenChange(false);
    onNewSale();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Sale Completed!</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Receipt #{data.receiptNumber}
            </p>
          </div>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="space-y-4">
          {/* Transaction Details */}
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {format(new Date(data.createdAt), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="font-medium capitalize">{data.paymentMethod}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{data.customerName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Items</h4>
            <div className="space-y-2">
              {data.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2">
                      × {item.quantity}
                    </span>
                  </div>
                  <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-2xl text-green-600">
                ${data.total.toFixed(2)}
              </span>
            </div>

            {data.change !== undefined && data.change > 0 && (
              <div className="flex justify-between text-sm bg-green-50 rounded-lg p-3">
                <span className="font-medium text-green-900">Change:</span>
                <span className="font-bold text-green-600">
                  ${data.change.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button
              className="flex-1"
              onClick={handleNewSale}
            >
              New Sale
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Thank you for your purchase!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
