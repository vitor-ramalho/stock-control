'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { DollarSign, Package, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [salesResult, cashResult, productsResult] = await Promise.allSettled([
        api.get('/sales', { params: { page: 1, limit: 100, startDate: today, endDate: today } }),
        api.get('/cash/current'),
        api.get('/products'),
      ]);

      const salesData =
        salesResult.status === 'fulfilled'
          ? salesResult.value.data
          : { data: [], total: 0 };

      const productsData =
        productsResult.status === 'fulfilled' ? productsResult.value.data : [];

      const todaySalesList = Array.isArray(salesData?.data)
        ? salesData.data
        : Array.isArray(salesData)
          ? salesData
          : [];

      const todaySalesTotal = todaySalesList.reduce(
        (sum: number, sale: { total?: number | string }) =>
          sum + Number(sale.total || 0),
        0,
      );

      const lowStockProducts = (Array.isArray(productsData) ? productsData : []).filter(
        (product: { quantity?: number; isActive?: boolean }) =>
          (product.quantity || 0) <= 5 && product.isActive,
      );

      return {
        todaySales: {
          count: typeof salesData?.total === 'number' ? salesData.total : todaySalesList.length,
          total: todaySalesTotal,
        },
        openCashRegister:
          cashResult.status === 'fulfilled' ? cashResult.value.data : null,
        lowStockProducts,
      };
    },
  });

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorState message="Falha ao carregar o painel" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel</h1>
        <p className="text-muted-foreground">Visão geral do seu sistema ERP</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas de Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaySales?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              R$ {stats?.todaySales?.total?.toFixed(2) || '0,00'} em receita
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Caixa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats?.openCashRegister ? (
              <>
                <div className="text-2xl font-bold">
                  R$ {Number(stats.openCashRegister.balance || 0).toFixed(2)}
                </div>
                <Badge variant="outline" className="text-green-600">Aberto</Badge>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">R$ 0,00</div>
                <Badge variant="secondary">Fechado</Badge>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lowStockProducts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Produtos precisam de atenção</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/pos">
              <Button className="w-full" size="lg">Abrir PDV</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full" size="lg">Produtos</Button>
            </Link>
            <Link href="/cash">
              <Button variant="outline" className="w-full" size="lg">Caixa</Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full" size="lg">Relatórios</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
