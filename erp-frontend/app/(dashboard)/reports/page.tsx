'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { withAuth } from '@/components/auth/with-auth';
import { useCashReport, useSalesReport, useStockReport } from '@/hooks/use-reports';
import { useProducts } from '@/hooks/use-products';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';

type ReportMode = 'sales' | 'stock' | 'cash';

function ReportsPage() {
  const [mode, setMode] = useState<ReportMode>('sales');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [cashDate, setCashDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState<string>('all');

  const salesQuery = useSalesReport({
    start: start || undefined,
    end: end || undefined,
  });

  const stockQuery = useStockReport({
    productId: productId === 'all' ? undefined : productId,
    start: start || undefined,
    end: end || undefined,
    limit: 100,
  });

  const cashQuery = useCashReport(cashDate);
  const productsQuery = useProducts();

  const isLoading = useMemo(() => {
    if (mode === 'sales') return salesQuery.isLoading;
    if (mode === 'stock') return stockQuery.isLoading;
    return cashQuery.isLoading;
  }, [cashQuery.isLoading, mode, salesQuery.isLoading, stockQuery.isLoading]);

  const hasError = useMemo(() => {
    if (mode === 'sales') return !!salesQuery.error;
    if (mode === 'stock') return !!stockQuery.error;
    return !!cashQuery.error;
  }, [cashQuery.error, mode, salesQuery.error, stockQuery.error]);

  const handleClearFilters = () => {
    setStart('');
    setEnd('');
    setProductId('all');
    setCashDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (isLoading) return <PageLoading />;
  if (hasError) return <ErrorState message="Falha ao carregar relatórios." />;

  const sales = salesQuery.data;
  const stock = stockQuery.data;
  const cash = cashQuery.data;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        </div>
        <p className="text-muted-foreground">
          Acompanhe resultados de vendas, estoque e caixa com filtros por período
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione o tipo de relatório e ajuste os filtros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Relatório</label>
              <Select value={mode} onValueChange={(value) => setMode(value as ReportMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="stock">Movimentações de Estoque</SelectItem>
                  <SelectItem value="cash">Caixa Diário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode !== 'cash' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </>
            )}

            {mode === 'stock' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto (opcional)</label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os produtos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    {(productsQuery.data || []).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearFilters}>Limpar Filtros</Button>
          </div>
        </CardContent>
      </Card>

      {mode === 'sales' && sales && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total de Vendas</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{sales.summary.totalSales}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Receita</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(sales.summary.totalRevenue)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Ticket Médio</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(sales.summary.averageTicket)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Itens Vendidos</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{sales.summary.totalItems}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
              <CardDescription>Últimas vendas no período filtrado</CardDescription>
            </CardHeader>
            <CardContent>
              {sales.data.length === 0 ? (
                <EmptyState title="Sem vendas no período" description="Ajuste os filtros para visualizar resultados." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.data.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell>{new Date(sale.createdAt).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{sale.paymentMethod || '-'}</TableCell>
                        <TableCell>{formatCurrency(Number(sale.total))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {mode === 'stock' && stock && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total de Movimentos</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{stock.summary.totalMovements}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Entradas</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{stock.summary.totalIn}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Saídas</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{stock.summary.totalOut}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Saldo Líquido</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{stock.summary.netMovement}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimentações</CardTitle>
              <CardDescription>Registro de entradas e saídas de estoque</CardDescription>
            </CardHeader>
            <CardContent>
              {stock.data.length === 0 ? (
                <EmptyState title="Sem movimentações" description="Nenhuma movimentação para os filtros selecionados." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stock.data.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.createdAt).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{movement.product?.name || '-'}</TableCell>
                        <TableCell>{movement.type === 'in' ? 'Entrada' : 'Saída'}</TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>{movement.origin}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {mode === 'cash' && cash && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Caixas Abertos</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{cash.summary.totalRegisters}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total de Entradas</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(cash.summary.totalIn)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total de Saídas</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(cash.summary.totalOut)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Saldo Líquido</CardDescription></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(cash.summary.netBalance)}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lançamentos Financeiros</CardTitle>
              <CardDescription>Entradas e saídas do caixa na data selecionada</CardDescription>
            </CardHeader>
            <CardContent>
              {cash.entries.length === 0 ? (
                <EmptyState title="Sem lançamentos no dia" description="Nenhum lançamento encontrado para a data selecionada." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cash.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.createdAt).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{entry.type === 'in' ? 'Entrada' : 'Saída'}</TableCell>
                        <TableCell>{entry.category}</TableCell>
                        <TableCell>{entry.description || '-'}</TableCell>
                        <TableCell>{formatCurrency(Number(entry.value))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default withAuth(ReportsPage, ['admin', 'manager']);
