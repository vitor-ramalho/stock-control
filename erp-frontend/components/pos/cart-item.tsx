'use client';

import { POSCartItem } from '@/store/pos-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemComponentProps {
  item: POSCartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemComponent({
  item,
  onIncrement,
  onDecrement,
  onUpdateQuantity,
  onRemove,
}: CartItemComponentProps) {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    if (value > 0 && value <= item.stock) {
      onUpdateQuantity(value);
    }
  };

  const canIncrement = item.quantity < item.stock;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
        <p className="text-xs text-muted-foreground">{item.sku}</p>
        <p className="text-sm font-semibold text-green-600 mt-1">
          ${item.price.toFixed(2)} × {item.quantity}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={onDecrement}
          disabled={item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Input
          type="number"
          min="1"
          max={item.stock}
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-14 h-8 text-center px-1"
        />
        
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={onIncrement}
          disabled={!canIncrement}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Subtotal & Remove */}
      <div className="flex flex-col items-end gap-1">
        <span className="font-bold text-sm">
          ${item.subtotal.toFixed(2)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
