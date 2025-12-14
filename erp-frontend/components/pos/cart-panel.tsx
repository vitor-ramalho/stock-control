'use client';

import { usePOSCartStore } from '@/store/pos-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CartItemComponent } from './cart-item';
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const {
    items,
    removeItem,
    incrementQuantity,
    decrementQuantity,
    updateQuantity,
    clearCart,
    getCartSubtotal,
    getCartTotal,
    getItemCount,
  } = usePOSCartStore();

  const subtotal = getCartSubtotal();
  const total = getCartTotal();
  const itemCount = getItemCount();
  const tax = 0; // Can be calculated based on business rules
  const isEmpty = items.length === 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({itemCount})
          </CardTitle>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Cart is empty
            </p>
            <p className="text-sm text-muted-foreground">
              Add products to start a new sale
            </p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemComponent
                    key={item.productId}
                    item={item}
                    onIncrement={() => incrementQuantity(item.productId)}
                    onDecrement={() => decrementQuantity(item.productId)}
                    onUpdateQuantity={(quantity) =>
                      updateQuantity(item.productId, quantity)
                    }
                    onRemove={() => removeItem(item.productId)}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 space-y-4">
              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={onCheckout}
                disabled={isEmpty}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Checkout
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
