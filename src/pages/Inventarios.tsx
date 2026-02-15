import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { InventorySuggestions } from '@/components/inventory/InventorySuggestions';
import { InventoryCountDialog } from '@/components/inventory/InventoryCountDialog';
import {
  InventoryMethod,
  InventoryScope,
  INVENTORY_METHOD_LABELS,
  INVENTORY_SCOPE_LABELS,
  InventoryCount,
} from '@/types/inventory';
import { ClipboardCheck, Plus, Play, History, Lightbulb, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Inventarios() {
  const {
    products, locations, currentUser, collaborators,
    inventoryCounts, addInventoryCount,
  } = useInventoryContext();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('sugestoes');
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New count form
  const [form, setForm] = useState({
    name: '',
    method: '' as InventoryMethod | '',
    scope: '' as InventoryScope | '',
    sectorFilter: '',
    curveFilter: '' as 'A' | 'B' | 'C' | '',
    selectedProductIds: [] as string[],
    scheduledDate: '',
    observations: '',
  });

  const shelves = [...new Set(locations.map(l => l.shelf))].sort();

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.code} - ${p.description}`,
    keywords: [p.code, p.description],
  }));

  const handleCreateCount = () => {
    if (!form.name || !form.method || !form.scope) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (form.scope === 'SETOR' && !form.sectorFilter) {
      toast({ title: 'Selecione um setor', variant: 'destructive' });
      return;
    }
    if (form.scope === 'CURVA_ABC' && !form.curveFilter) {
      toast({ title: 'Selecione uma curva', variant: 'destructive' });
      return;
    }
    if (form.scope === 'PRODUTOS_ESPECIFICOS' && form.selectedProductIds.length === 0) {
      toast({ title: 'Selecione ao menos um produto', variant: 'destructive' });
      return;
    }

    const count = addInventoryCount({
      name: form.name,
      method: form.method as InventoryMethod,
      scope: form.scope as InventoryScope,
      sectorFilter: form.sectorFilter || undefined,
      curveFilter: (form.curveFilter as 'A' | 'B' | 'C') || undefined,
      selectedProductIds: form.selectedProductIds.length > 0 ? form.selectedProductIds : undefined,
      collaborator: currentUser || 'Sistema',
      scheduledDate: form.scheduledDate || undefined,
      observations: form.observations || undefined,
    });

    toast({ title: 'Contagem criada', description: `${count.code} - ${count.items.length} itens carregados` });
    setForm({ name: '', method: '', scope: '', sectorFilter: '', curveFilter: '', selectedProductIds: [], scheduledDate: '', observations: '' });
    setActiveTab('andamento');
  };

  const handleStartFromSuggestion = (productIds: string[]) => {
    setForm(prev => ({
      ...prev,
      scope: 'PRODUTOS_ESPECIFICOS',
      selectedProductIds: productIds,
      name: `Contagem sugerida - ${new Date().toLocaleDateString('pt-BR')}`,
    }));
    setActiveTab('nova');
  };

  const openCountDialog = (count: InventoryCount) => {
    setSelectedCount(count);
    setDialogOpen(true);
  };

  const activeCounts = inventoryCounts.filter(c => c.status === 'EM_ANDAMENTO' || c.status === 'PLANEJADO' || c.status === 'CONTAGEM_FINALIZADA');
  const historyCounts = inventoryCounts.filter(c => c.status === 'AJUSTADO' || c.status === 'CANCELADO');

  const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    PLANEJADO: 'outline',
    EM_ANDAMENTO: 'default',
    CONTAGEM_FINALIZADA: 'secondary',
    AJUSTADO: 'default',
    CANCELADO: 'destructive',
  };

  return (
    <AppLayout title="Inventários" subtitle="Contagens de estoque, sugestões automáticas e acompanhamento de divergências">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="sugestoes" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Sugestões</TabsTrigger>
            <TabsTrigger value="nova" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nova</TabsTrigger>
            <TabsTrigger value="andamento" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Em Andamento
              {activeCounts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 text-[10px] px-1">{activeCounts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5"><History className="h-3.5 w-3.5" />Histórico</TabsTrigger>
          </TabsList>

          {/* Tab Sugestões */}
          <TabsContent value="sugestoes">
            <Card>
              <CardHeader><CardTitle className="text-base">Sugestões Automáticas de Contagem</CardTitle></CardHeader>
              <CardContent>
                <InventorySuggestions onStartCount={handleStartFromSuggestion} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Nova Contagem */}
          <TabsContent value="nova">
            <Card>
              <CardHeader><CardTitle className="text-base">Criar Nova Contagem</CardTitle></CardHeader>
              <CardContent className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Contagem *</Label>
                    <Input
                      placeholder="Ex: Inventário mensal Curva A"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Programada (opcional)</Label>
                    <Input
                      type="date"
                      value={form.scheduledDate}
                      onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Método de Contagem *</Label>
                    <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v as InventoryMethod }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o método" /></SelectTrigger>
                      <SelectContent>
                        {INVENTORY_METHOD_LABELS.map(m => (
                          <SelectItem key={m.value} value={m.value}>
                            <div>
                              <span className="font-medium">{m.label}</span>
                              <p className="text-xs text-muted-foreground">{m.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Escopo *</Label>
                    <Select value={form.scope} onValueChange={v => setForm(f => ({ ...f, scope: v as InventoryScope, sectorFilter: '', curveFilter: '', selectedProductIds: [] }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o escopo" /></SelectTrigger>
                      <SelectContent>
                        {INVENTORY_SCOPE_LABELS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.scope === 'SETOR' && (
                  <div className="space-y-2">
                    <Label>Setor (Estante)</Label>
                    <Select value={form.sectorFilter} onValueChange={v => setForm(f => ({ ...f, sectorFilter: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione a estante" /></SelectTrigger>
                      <SelectContent>
                        {shelves.map(s => (
                          <SelectItem key={s} value={s}>Estante {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.scope === 'CURVA_ABC' && (
                  <div className="space-y-2">
                    <Label>Curva ABC</Label>
                    <Select value={form.curveFilter} onValueChange={v => setForm(f => ({ ...f, curveFilter: v as 'A' | 'B' | 'C' }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione a curva" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Curva A</SelectItem>
                        <SelectItem value="B">Curva B</SelectItem>
                        <SelectItem value="C">Curva C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.scope === 'PRODUTOS_ESPECIFICOS' && (
                  <div className="space-y-2">
                    <Label>Produtos ({form.selectedProductIds.length} selecionados)</Label>
                    <SearchableSelect
                      options={productOptions}
                      value=""
                      onValueChange={(v) => {
                        if (v && !form.selectedProductIds.includes(v)) {
                          setForm(f => ({ ...f, selectedProductIds: [...f.selectedProductIds, v] }));
                        }
                      }}
                      placeholder="Buscar e adicionar produto..."
                    />
                    {form.selectedProductIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {form.selectedProductIds.map(id => {
                          const p = products.find(pr => pr.id === id);
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive/20"
                              onClick={() => setForm(f => ({ ...f, selectedProductIds: f.selectedProductIds.filter(x => x !== id) }))}
                            >
                              {p?.code || id} ✕
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações sobre esta contagem..."
                    value={form.observations}
                    onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
                  />
                </div>

                <Button onClick={handleCreateCount} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Contagem
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Em Andamento */}
          <TabsContent value="andamento">
            <Card>
              <CardHeader><CardTitle className="text-base">Contagens Ativas</CardTitle></CardHeader>
              <CardContent>
                {activeCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma contagem em andamento</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCounts.map(c => (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openCountDialog(c)}>
                          <TableCell className="text-xs font-mono">{c.code}</TableCell>
                          <TableCell className="text-sm">{c.name}</TableCell>
                          <TableCell className="text-xs">{c.method.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-xs">
                            {c.items.filter(i => i.countedQty !== undefined).length}/{c.items.length}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[c.status]} className="text-[10px]">{c.status.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{c.collaborator}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico">
            <Card>
              <CardHeader><CardTitle className="text-base">Histórico de Contagens</CardTitle></CardHeader>
              <CardContent>
                {historyCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma contagem finalizada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead>Divergentes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyCounts.map(c => {
                        const divCount = c.items.filter(i => i.divergence && i.divergence !== 0).length;
                        return (
                          <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openCountDialog(c)}>
                            <TableCell className="text-xs font-mono">{c.code}</TableCell>
                            <TableCell className="text-sm">{c.name}</TableCell>
                            <TableCell className="text-xs">{c.method.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="text-xs">{c.items.length}</TableCell>
                            <TableCell className="text-xs">
                              {divCount > 0 ? (
                                <span className="text-destructive font-medium">{divCount}</span>
                              ) : (
                                <span className="text-primary font-medium">0</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_VARIANT[c.status]} className="text-[10px]">{c.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {c.completedAt ? new Date(c.completedAt).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedCount && (
        <InventoryCountDialog
          key={selectedCount.id + selectedCount.status}
          count={selectedCount}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedCount(null);
          }}
        />
      )}
    </AppLayout>
  );
}
