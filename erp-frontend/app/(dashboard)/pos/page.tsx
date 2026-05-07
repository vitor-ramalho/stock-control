'use client';

import { useState } from 'react';
import { useSearchProducts } from '@/hooks/use-products';
import { usePOSCartStore } from '@/store/pos-cart';
import { useCurrentCashRegister } from '@/hooks/use-cash-register';
import { CheckoutResponse } from '@/hooks/use-pos';
import { ProductSearchBar } from '@/components/pos/product-search-bar';
import { ProductGrid } from '@/components/pos/product-grid';
import { CartPanel } from '@/components/pos/cart-panel';
import { CheckoutDialog } from '@/components/pos/checkout-dialog';
import { ReceiptDialog } from '@/components/pos/receipt-dialog';
import { Store, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { withAuth } from '@/components/auth/with-auth';

function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: products = [], isLoading } = useSearchProducts(searchQuery);
  const { data: cashRegister } = useCurrentCashRegister();
  const { items, clearCart } = usePOSCartStore();

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (data: CheckoutResponse) => {
    // Prepare receipt data
    const receipt = {
      saleId: data.saleId,
      receiptNumber: data.receiptNumber,
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      total: data.total,
      change: data.change,
      createdAt: data.createdAt,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      paymentMethod: data.paymentMethod || 'cash',
      customerName: data.customerName,
    };

    setReceiptData(receipt);
    clearCart();
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
  };

  const handleNewSale = () => {
    setReceiptData(null);
    setSearchQuery('');
  };

  // Check if cash register is open
  if (!cashRegister) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Ponto de Venda (PDV)</h1>
          </div>
        </div>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Caixa Fechado</AlertTitle>
          <AlertDescription className="text-orange-700">
            Você precisa abrir o caixa antes de realizar vendas.
          </AlertDescription>
        </Alert>

        <Link href="/cash">
          <Button>
            Ir para Caixa
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-none pb-4">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Ponto de Venda (PDV)</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Sistema de checkout rápido e fácil • Caixa #{cashRegister.id.substring(0, 8)}
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 min-h-0">
        {/* Left Column - Products */}
        <div className="flex flex-col min-h-0">
          {/* Search Bar */}
          <div className="flex-none mb-4">
            <ProductSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar produtos por nome, SKU ou escanear código de barras..."
            />
          </div>

          {/* Product Grid - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <ProductGrid products={products} isLoading={isLoading} />
          </div>
        </div>

        {/* Right Column - Cart */}
        <div className="flex flex-col min-h-0">
          <CartPanel onCheckout={handleCheckout} />
        </div>
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        onSuccess={handleCheckoutSuccess}
      />

      <ReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
        onNewSale={handleNewSale}
      />
    </div>
  );
}

export default withAuth(POSPage, ['admin', 'manager', 'cashier']);
