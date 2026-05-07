'use client';

import { useState } from 'react';
import { useProductsWithStock } from '@/hooks/use-stock';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { StockTable } from '@/components/stock/stock-table';
import { StockMovementDialog } from '@/components/stock/stock-movement-dialog';
import { Product } from '@/types';
import { Archive, TrendingDown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { withAuth } from '@/components/auth/with-auth';

function StockPage() {
  const { data: products, isLoading, error } = useProductsWithStock();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogType, setDialogType] = useState<'in' | 'out'>('in');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStockIn = (product: Product) => {
    setSelectedProduct(product);
    setDialogType('in');
  };

  const handleStockOut = (product: Product) => {
    setSelectedProduct(product);
    setDialogType('out');
  };

  const handleCloseDialog = () => {
    setSelectedProduct(null);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorState message="Falha ao carregar informações de estoque. Por favor, tente novamente." />;
  }

  // Filter products by search query
  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate stats
  const totalProducts = products?.length || 0;
  const lowStockProducts = products?.filter((p) => p.quantity <= 10 && p.quantity > 0).length || 0;
  const outOfStockProducts = products?.filter((p) => p.quantity === 0).length || 0;
  const totalStockValue = products?.reduce(
    (sum, p) => sum + p.quantity * Number(p.cost || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Archive className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Estoque</h1>
        </div>
        <p className="text-muted-foreground">
          Monitore e gerencie níveis de inventário de todos os produtos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Produtos</CardDescription>
            <CardTitle className="text-3xl">{totalProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Estoque Baixo
            </CardDescription>
            <CardTitle className="text-3xl text-orange-600">{lowStockProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Sem Estoque
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{outOfStockProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valor Total em Estoque</CardDescription>
            <CardTitle className="text-3xl">R$ {totalStockValue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Níveis de Estoque dos Produtos</CardTitle>
              <CardDescription>
                Visualize o estoque atual e gerencie movimentações de inventário
              </CardDescription>
            </div>
            <div className="w-72">
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StockTable
            products={filteredProducts}
            onStockIn={handleStockIn}
            onStockOut={handleStockOut}
          />
        </CardContent>
      </Card>

      {/* Stock Movement Dialog */}
      <StockMovementDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={handleCloseDialog}
        type={dialogType}
      />
    </div>
  );
}

export default withAuth(StockPage, ['admin', 'manager']);
