'use client';

import { Product } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface StockTableProps {
  products: Product[];
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
}

export function StockTable({ products, onStockIn, onStockOut }: StockTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">No products found</p>
        <p className="text-sm text-muted-foreground">
          Add products first to manage stock levels
        </p>
      </div>
    );
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 10) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-center">Current Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const status = getStockStatus(product.quantity);
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.category && (
                      <div className="text-sm text-muted-foreground">
                        {product.category.name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold">{product.quantity}</span>
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(product.updatedAt), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStockIn(product)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Stock In
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStockOut(product)}
                      disabled={product.quantity === 0}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Stock Out
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
