import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  AlertTriangle, CheckCircle2, Plus, Trash2, FlaskConical, Download, ShoppingCart, Package, TrendingDown, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimulationEntry {
  compositionId: string;
  quantity: number;
}

interface ProjectedItem {
  productId: string;
  productCode: string;
  productDescription: string;
  unit: string;
  currentStock: number;
  minStock: number;
  totalRequired: number;
  afterProduction: number;
  shortage: number; // positive = falta
  belowMin: boolean;
  purchaseSuggestion: number; // qty to buy to reach minStock
}

export default function Simulacao() {
  const { compositions, products } = useInventoryContext();
  const { toast } = useToast();
  const [entries, setEntries] = useState<SimulationEntry[]>([]);
  const [addingCompId, setAddingCompId] = useState('');
  const [addingQty, setAddingQty] = useState(1);

  const activeCompositions = compositions.filter(c => c.isActive);

  const compositionOptions = activeCompositions.map(c => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
    sublabel: `${c.items.length} itens`,
    keywords: [c.code, c.name],
  }));

  const handleAddEntry = () => {
    if (!addingCompId || addingQty <= 0) return;
    if (entries.some(e => e.compositionId === addingCompId)) {
      // Update quantity instead
      setEntries(prev => prev.map(e =>
        e.compositionId === addingCompId ? { ...e, quantity: e.quantity + addingQty } : e
      ));
    } else {
      setEntries(prev => [...prev, { compositionId: addingCompId, quantity: addingQty }]);
    }
    setAddingCompId('');
    setAddingQty(1);
  };

  const handleRemoveEntry = (compId: string) => {
    setEntries(prev => prev.filter(e => e.compositionId !== compId));
  };

  const handleUpdateQty = (compId: string, qty: number) => {
    setEntries(prev => prev.map(e => e.compositionId === compId ? { ...e, quantity: Math.max(1, qty) } : e));
  };

  // Core simulation logic
  const projectedItems = useMemo((): ProjectedItem[] => {
    if (entries.length === 0) return [];

    const demandMap = new Map<string, number>();

    for (const entry of entries) {
      const comp = compositions.find(c => c.id === entry.compositionId);
      if (!comp) continue;
      for (const item of comp.items) {
        const current = demandMap.get(item.productId) || 0;
        demandMap.set(item.productId, current + item.quantity * entry.quantity);
      }
    }

    const result: ProjectedItem[] = [];
    for (const [productId, totalRequired] of demandMap) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;
      const afterProduction = product.currentStock - totalRequired;
      const shortage = afterProduction < 0 ? Math.abs(afterProduction) : 0;
      const belowMin = afterProduction < product.minStock;
      const purchaseSuggestion = belowMin
        ? Math.max(0, product.minStock - afterProduction)
        : 0;

      result.push({
        productId,
        productCode: product.code,
        productDescription: product.description,
        unit: product.unit,
        currentStock: product.currentStock,
        minStock: product.minStock,
        totalRequired,
        afterProduction,
        shortage,
        belowMin,
        purchaseSuggestion,
      });
    }

    // Sort: shortages first, then below min, then rest
    result.sort((a, b) => {
      if (a.shortage > 0 && b.shortage === 0) return -1;
      if (a.shortage === 0 && b.shortage > 0) return 1;
      if (a.belowMin && !b.belowMin) return -1;
      if (!a.belowMin && b.belowMin) return 1;
      return b.totalRequired - a.totalRequired;
    });

    return result;
  }, [entries, compositions, products]);

  const shortageItems = projectedItems.filter(i => i.shortage > 0);
  const belowMinItems = projectedItems.filter(i => i.belowMin && i.shortage === 0);
  const okItems = projectedItems.filter(i => !i.belowMin && i.shortage === 0);
  const purchaseItems = projectedItems.filter(i => i.purchaseSuggestion > 0);

  const handleExportPurchase = () => {
    if (purchaseItems.length === 0) {
      toast({ title: 'Nenhuma sugestão de compra', description: 'Todos os itens estão com estoque suficiente.', variant: 'destructive' });
      return;
    }

    const headers = ['Código', 'Descrição', 'Unidade', 'Estoque Atual', 'Necessário', 'Após Produção', 'Qtd Compra Sugerida'];
    const rows = purchaseItems.map(i => [
      i.productCode,
      i.productDescription,
      i.unit,
      String(i.currentStock),
      String(i.totalRequired),
      String(i.afterProduction),
      String(i.purchaseSuggestion),
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sugestao-compras-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado com sucesso!' });
  };

  return (
    <AppLayout title="Simulação de Produção" subtitle="Projeção de consumo e análise de riscos para produção">
      <div className="space-y-6">
        {/* Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Selecionar Composições
            </CardTitle>
            <CardDescription>
              Adicione composições e quantidades para simular o impacto no estoque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={compositionOptions}
                  value={addingCompId}
                  onValueChange={setAddingCompId}
                  placeholder="Selecionar composição..."
                  searchPlaceholder="Buscar composição..."
                  emptyMessage="Nenhuma composição ativa encontrada."
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  value={addingQty}
                  onChange={e => setAddingQty(parseInt(e.target.value) || 1)}
                  placeholder="Qtd"
                />
              </div>
              <Button onClick={handleAddEntry} disabled={!addingCompId}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>

            {entries.length > 0 && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Composição</TableHead>
                      <TableHead className="w-28 text-right">Quantidade</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(entry => {
                      const comp = compositions.find(c => c.id === entry.compositionId);
                      return (
                        <TableRow key={entry.compositionId}>
                          <TableCell>
                            <span className="font-mono text-xs">{comp?.code}</span>
                            <span className="ml-2 text-sm">{comp?.name}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={entry.quantity}
                              onChange={e => handleUpdateQty(entry.compositionId, parseInt(e.target.value) || 1)}
                              className="h-8 w-20 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveEntry(entry.compositionId)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {projectedItems.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{projectedItems.length}</p>
                    <p className="text-xs text-muted-foreground">Itens envolvidos</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={shortageItems.length > 0 ? 'border-destructive' : ''}>
                <CardContent className="flex items-center gap-3 p-4">
                  <X className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{shortageItems.length}</p>
                    <p className="text-xs text-muted-foreground">Faltas de material</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={belowMinItems.length > 0 ? 'border-warning' : ''}>
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{belowMinItems.length}</p>
                    <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{okItems.length}</p>
                    <p className="text-xs text-muted-foreground">Disponíveis</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projection Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Projeção de Consumo
                  </CardTitle>
                  {purchaseItems.length > 0 && (
                    <Button variant="outline" onClick={handleExportPurchase}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Sugestão de Compras
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Estoque Atual</TableHead>
                        <TableHead className="text-right">Necessário</TableHead>
                        <TableHead className="text-right">Após Produção</TableHead>
                        <TableHead className="text-right">Est. Mínimo</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Compra Sugerida</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectedItems.map(item => (
                        <TableRow key={item.productId} className={item.shortage > 0 ? 'bg-destructive/5' : item.belowMin ? 'bg-warning/5' : ''}>
                          <TableCell className="font-mono text-xs">{item.productCode}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{item.productDescription}</TableCell>
                          <TableCell className="text-right font-medium">{item.currentStock}</TableCell>
                          <TableCell className="text-right font-medium">{item.totalRequired}</TableCell>
                          <TableCell className={`text-right font-bold ${item.afterProduction < 0 ? 'text-destructive' : item.belowMin ? 'text-warning' : 'text-success'}`}>
                            {item.afterProduction}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.minStock}</TableCell>
                          <TableCell className="text-center">
                            {item.shortage > 0 ? (
                              <Badge variant="destructive" className="gap-1">
                                <X className="h-3 w-3" /> Falta {item.shortage}
                              </Badge>
                            ) : item.belowMin ? (
                              <Badge variant="outline" className="gap-1 border-warning text-warning">
                                <AlertTriangle className="h-3 w-3" /> Abaixo mín.
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 border-success text-success">
                                <CheckCircle2 className="h-3 w-3" /> OK
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.purchaseSuggestion > 0 ? (
                              <span className="flex items-center justify-end gap-1 font-medium text-primary">
                                <ShoppingCart className="h-3.5 w-3.5" />
                                {item.purchaseSuggestion} {item.unit}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {entries.length > 0 && projectedItems.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="mb-2 h-10 w-10" />
              <p>As composições selecionadas não possuem itens cadastrados.</p>
            </CardContent>
          </Card>
        )}

        {entries.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FlaskConical className="mb-2 h-10 w-10" />
              <p>Selecione composições acima para iniciar a simulação</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
