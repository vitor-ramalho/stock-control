'use client';

import { useState } from 'react';
import { useSales, useSalesStats, exportSalesToCSV } from '@/hooks/use-sales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { SalesTable } from '@/components/sales/sales-table';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import { Sale } from '@/types';
import { 
  Receipt, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { withAuth } from '@/components/auth/with-auth';

type DateFilter = 'all' | 'today' | 'week' | 'month';

function SalesPage() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return {
          startDate: format(startOfDay(now), 'yyyy-MM-dd'),
          endDate: format(endOfDay(now), 'yyyy-MM-dd'),
        };
      case 'week':
        return {
          startDate: format(startOfWeek(now), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(now), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const { startDate, endDate } = getDateRange();
  const { data: salesData, isLoading, error } = useSales({ page, limit: 20, startDate, endDate });
  const { data: stats } = useSalesStats(startDate, endDate);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportSalesToCSV({ startDate, endDate });
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSaleId(sale.id);
  };

  if (isLoading && !salesData) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorState message="Falha ao carregar vendas. Por favor, tente novamente." />;
  }

  const sales = salesData?.data || [];
  const totalPages = salesData?.totalPages || 1;
  const totalSales = salesData?.total || 0;

  // Stats from API or fallback to calculated
  const totalRevenue = stats?.totalRevenue || sales.reduce((sum, s) => sum + Number(s.total), 0);
  const averageTicket = stats?.averageTicket || (totalSales > 0 ? totalRevenue / totalSales : 0);
  const totalItems = stats?.totalItems || sales.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          </div>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as transações de vendas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {dateFilter === 'all' ? 'Todo período' : `Este ${dateFilter === 'today' ? 'dia' : dateFilter === 'week' ? 'semana' : 'mês'}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas brutas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por transação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Total de unidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Histórico de Vendas</CardTitle>
              <CardDescription>
                Todas as transações concluídas e seus detalhes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateFilter} onValueChange={(value) => {
                setDateFilter(value as DateFilter);
                setPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo Período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || sales.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesTable sales={sales} onViewDetails={handleViewDetails} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages} • {totalSales} vendas no total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        saleId={selectedSaleId}
        open={!!selectedSaleId}
        onOpenChange={(open) => !open && setSelectedSaleId(null)}
      />
    </div>
  );
}

export default withAuth(SalesPage, ['admin', 'manager', 'cashier']);
