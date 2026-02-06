import { useState } from 'react';
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MovementType, MovementPurpose } from '@/types/inventory';

export default function Relatorios() {
  const { movements, products, getFilteredMovements, collaborators } = useInventoryContext();
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' as string,
    collaborator: 'all' as string,
    purpose: 'all' as string,
  });

  const filteredMovements = getFilteredMovements({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    type: filters.type !== 'all' ? filters.type as MovementType : undefined,
    collaborator: filters.collaborator !== 'all' ? filters.collaborator : undefined,
    purpose: filters.purpose !== 'all' ? filters.purpose as MovementPurpose : undefined,
  });

  // Group movements by collaborator
  const movementsByCollaborator = movements.reduce((acc, m) => {
    if (!acc[m.collaborator]) {
      acc[m.collaborator] = { total: 0, entradas: 0, saidas: 0 };
    }
    acc[m.collaborator].total++;
    if (m.type === 'ENTRADA') acc[m.collaborator].entradas++;
    if (m.type === 'SAIDA') acc[m.collaborator].saidas++;
    return acc;
  }, {} as Record<string, { total: number; entradas: number; saidas: number }>);

  // Group movements by purpose
  const movementsByPurpose = movements.reduce((acc, m) => {
    if (!acc[m.purpose]) acc[m.purpose] = 0;
    acc[m.purpose]++;
    return acc;
  }, {} as Record<string, number>);

  // Top products by movement count
  const productMovementCounts = movements.reduce((acc, m) => {
    if (!acc[m.productCode]) {
      acc[m.productCode] = { code: m.productCode, description: m.productDescription, count: 0 };
    }
    acc[m.productCode].count++;
    return acc;
  }, {} as Record<string, { code: string; description: string; count: number }>);

  const topProducts = Object.values(productMovementCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const exportToCSV = () => {
    const headers = ['Data', 'Hora', 'Tipo', 'Código', 'Produto', 'Qtd', 'Origem', 'Destino', 'Finalidade', 'Colaborador'];
    const rows = filteredMovements.map(m => [
      m.date,
      m.time,
      m.type,
      m.productCode,
      m.productDescription,
      m.quantity,
      m.origin,
      m.destination,
      m.purpose,
      m.collaborator,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <AppLayout title="Relatórios" subtitle="Análises e exportação de dados">
      <Tabs defaultValue="movements">
        <TabsList className="mb-6">
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="collaborators">Por Colaborador</TabsTrigger>
          <TabsTrigger value="products">Por Produto</TabsTrigger>
          <TabsTrigger value="purposes">Por Finalidade</TabsTrigger>
        </TabsList>

        {/* Movements Report */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5" />
                    Relatório de Movimentações
                  </CardTitle>
                  <CardDescription>
                    {filteredMovements.length} movimentação(ões) encontrada(s)
                  </CardDescription>
                </div>
                <Button onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 grid gap-4 rounded-lg bg-muted/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data Início
                  </Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data Fim
                  </Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filters.type} onValueChange={v => setFilters(f => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SAIDA">Saída</SelectItem>
                      <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                      <SelectItem value="TROCA">Troca</SelectItem>
                      <SelectItem value="AVARIA">Avaria</SelectItem>
                      <SelectItem value="PERDA">Perda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select value={filters.collaborator} onValueChange={v => setFilters(f => ({ ...f, collaborator: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {collaborators.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Finalidade</Label>
                  <Select value={filters.purpose} onValueChange={v => setFilters(f => ({ ...f, purpose: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="SERVICO">Serviço</SelectItem>
                      <SelectItem value="PRODUCAO">Produção</SelectItem>
                      <SelectItem value="VENDA">Venda</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      <SelectItem value="AJUSTE">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Finalidade</TableHead>
                      <TableHead>Colaborador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.slice(0, 100).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          {new Date(m.date).toLocaleDateString('pt-BR')} {m.time}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{m.productCode}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                        <TableCell>{m.purpose}</TableCell>
                        <TableCell className="text-muted-foreground">{m.collaborator}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collaborators Report */}
        <TabsContent value="collaborators">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações por Colaborador</CardTitle>
              <CardDescription>Resumo das atividades de cada colaborador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Saídas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(movementsByCollaborator)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([name, stats]) => (
                        <TableRow key={name}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-right">{stats.total}</TableCell>
                          <TableCell className="text-right text-success">{stats.entradas}</TableCell>
                          <TableCell className="text-right text-destructive">{stats.saidas}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Report */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Movimentados</CardTitle>
              <CardDescription>Produtos com maior número de movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Movimentações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, index) => (
                      <TableRow key={product.code}>
                        <TableCell className="font-bold text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono font-medium">{product.code}</TableCell>
                        <TableCell>{product.description}</TableCell>
                        <TableCell className="text-right font-bold">{product.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purposes Report */}
        <TabsContent value="purposes">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações por Finalidade</CardTitle>
              <CardDescription>Distribuição das movimentações por tipo de uso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(movementsByPurpose)
                  .sort((a, b) => b[1] - a[1])
                  .map(([purpose, count]) => (
                    <Card key={purpose}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{purpose}</p>
                            <p className="text-3xl font-bold">{count}</p>
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <FileBarChart className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {((count / movements.length) * 100).toFixed(1)}% do total
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
