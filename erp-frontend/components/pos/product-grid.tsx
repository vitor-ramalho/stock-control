'use client';

import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { usePOSCartStore } from '@/store/pos-cart';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  const addItem = usePOSCartStore((state) => state.addItem);
  const hasItem = usePOSCartStore((state) => state.hasItem);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground mb-2">No products found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or add new products to inventory
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const price = Number(product.price);
        const stock = Number(product.quantity);
        const isLowStock = stock <= 10 && stock > 0;
        const isOutOfStock = stock <= 0;
        const inCart = hasItem(product.id);

        return (
          <Card
            key={product.id}
            className={`group cursor-pointer transition-all hover:shadow-md ${
              isOutOfStock ? 'opacity-50' : ''
            } ${inCart ? 'ring-2 ring-primary' : ''}`}
            onClick={() => !isOutOfStock && addItem(product)}
          >
            <CardContent className="p-4">
              {/* Product Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <Package className="h-12 w-12 text-neutral-400" />
                
                {/* Stock Badge */}
                <div className="absolute top-2 right-2">
                  {isOutOfStock ? (
                    <Badge variant="destructive" className="text-xs">
                      Out
                    </Badge>
                  ) : isLowStock ? (
                    <Badge variant="secondary" className="text-xs bg-yellow-500 text-white">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {stock}
                    </Badge>
                  )}
                </div>

                {/* Add Button Overlay */}
                {!isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-lg font-bold text-green-600">
                    ${price.toFixed(2)}
                  </span>
                  {inCart && (
                    <Badge variant="default" className="text-xs">
                      In Cart
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
