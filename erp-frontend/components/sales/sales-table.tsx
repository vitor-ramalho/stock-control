'use client';

import { Sale } from '@/types';
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
import { Eye, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

export function SalesTable({ sales, onViewDetails }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No sales found</p>
        <p className="text-sm text-muted-foreground">
          Sales will appear here once transactions are completed
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const total = Number(sale.total);
            const itemCount = sale.items?.length || 0;

            return (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-sm">
                  #{sale.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {sale.customerName || (
                    <span className="text-muted-foreground italic">Walk-in</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-green-600">
                    ${total.toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {sale.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={sale.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(sale)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
