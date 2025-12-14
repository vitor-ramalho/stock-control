'use client';

import { SaleItem } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SaleItemsListProps {
  items: SaleItem[];
}

export function SaleItemsList({ items }: SaleItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items in this sale
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const quantity = Number(item.quantity);
            const unitPrice = Number(item.unitPrice);
            const subtotal = Number(item.subtotal);

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                    {item.product?.sku && (
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.product.sku}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {quantity}
                </TableCell>
                <TableCell className="text-right">
                  ${unitPrice.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${subtotal.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
