import { useState } from 'react';
import { Plus, Boxes, Search, Pencil, Trash2, Upload, FileSpreadsheet, Package, CheckCircle2, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { CompositionImportDialog } from '@/components/compositions/CompositionImportDialog';
import type { Composition, CompositionItem } from '@/types/composition';

export default function Composicoes() {
  const { compositions, products, addComposition, updateComposition, deleteComposition, importCompositions } = useInventoryContext();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formItems, setFormItems] = useState<CompositionItem[]>([]);
  const [addingProductId, setAddingProductId] = useState('');
  const [addingQty, setAddingQty] = useState(1);

  const filtered = compositions.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const viewingComp = viewingId ? compositions.find(c => c.id === viewingId) : null;

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.code} - ${p.description}`,
    sublabel: `Estoque: ${p.currentStock} ${p.unit}`,
    keywords: [p.code, p.description],
  }));

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormItems([]);
    setEditingId(null);
    setAddingProductId('');
    setAddingQty(1);
  };

  const openNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (comp: Composition) => {
    setEditingId(comp.id);
    setFormCode(comp.code);
    setFormName(comp.name);
    setFormDescription(comp.description || '');
    setFormItems([...comp.items]);
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === addingProductId);
    if (!product || addingQty <= 0) return;
    if (formItems.some(i => i.productId === product.id)) {
      toast({ title: 'Produto já adicionado', variant: 'destructive' });
      return;
    }
    setFormItems(prev => [...prev, {
      productId: product.id,
      productCode: product.code,
      productDescription: product.description,
      quantity: addingQty,
      unit: product.unit,
    }]);
    setAddingProductId('');
    setAddingQty(1);
  };

  const handleRemoveItem = (productId: string) => {
    setFormItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleUpdateItemQty = (productId: string, qty: number) => {
    setFormItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName || formItems.length === 0) {
      toast({ title: 'Preencha todos os campos obrigatórios e adicione pelo menos 1 item', variant: 'destructive' });
      return;
    }

    if (editingId) {
      updateComposition(editingId, {
        code: formCode,
        name: formName,
        description: formDescription,
        items: formItems,
      });
      toast({ title: 'Composição atualizada' });
    } else {
      addComposition({
        code: formCode,
        name: formName,
        description: formDescription,
        items: formItems,
        isActive: true,
      });
      toast({ title: 'Composição criada' });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteComposition(id);
    toast({ title: 'Composição excluída' });
  };

  const handleToggleActive = (comp: Composition) => {
    updateComposition(comp.id, { isActive: !comp.isActive });
    toast({ title: comp.isActive ? 'Composição desativada' : 'Composição ativada' });
  };

  // Import handled by CompositionImportDialog

  return (
    <AppLayout title="Composições" subtitle="Gestão de composições de equipamentos (BOM)">
      {/* View detail dialog */}
      <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingComp?.code} - {viewingComp?.name}</DialogTitle>
          </DialogHeader>
          {viewingComp && (
            <div className="space-y-4">
              {viewingComp.description && (
                <p className="text-sm text-muted-foreground">{viewingComp.description}</p>
              )}
              <div>
                <p className="mb-2 text-sm font-semibold">Itens da composição ({viewingComp.items.length})</p>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead>Un</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingComp.items.map(item => {
                        const prod = products.find(p => p.id === item.productId);
                        const stock = prod?.currentStock ?? 0;
                        const sufficient = stock >= item.quantity;
                        return (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <p className="font-mono text-xs">{item.productCode}</p>
                              <p className="max-w-[180px] truncate text-xs text-muted-foreground">{item.productDescription}</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.unit}</TableCell>
                            <TableCell className={`text-right font-medium ${sufficient ? 'text-success' : 'text-destructive'}`}>
                              {stock}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Composições de Equipamentos
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />Importar
              </Button>
              <Button onClick={openNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Composição
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="text-center font-semibold">Itens</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhuma composição encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(comp => (
                    <TableRow key={comp.id} className="cursor-pointer" onClick={() => setViewingId(comp.id)}>
                      <TableCell className="font-mono font-medium">{comp.code}</TableCell>
                      <TableCell>
                        <p className="font-medium">{comp.name}</p>
                        {comp.description && <p className="max-w-[250px] truncate text-xs text-muted-foreground">{comp.description}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{comp.items.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={comp.isActive ? 'default' : 'outline'}
                          className={comp.isActive ? 'bg-success text-success-foreground' : ''}
                        >
                          {comp.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(comp)}>
                                  {comp.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{comp.isActive ? 'Desativar' : 'Ativar'}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(comp)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir composição?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    A composição {comp.code} - {comp.name} será excluída permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(comp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Composição' : 'Nova Composição'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="COMP001" required />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Kit Painel Solar" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} placeholder="Descrição da composição..." />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Itens da Composição *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    options={productOptions}
                    value={addingProductId}
                    onValueChange={setAddingProductId}
                    placeholder="Adicionar produto..."
                    searchPlaceholder="Buscar produto..."
                    emptyMessage="Nenhum produto encontrado."
                  />
                </div>
                <Input
                  type="number"
                  min="1"
                  value={addingQty}
                  onChange={e => setAddingQty(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <Button type="button" variant="outline" onClick={handleAddItem} disabled={!addingProductId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formItems.length > 0 && (
                <div className="rounded-lg border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-24 text-right">Qtd</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formItems.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <p className="font-mono text-xs">{item.productCode}</p>
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">{item.productDescription}</p>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItemQty(item.productId, parseInt(e.target.value) || 1)}
                              className="h-8 w-20 text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveItem(item.productId)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {formItems.length === 0 && (
                <p className="text-xs text-muted-foreground">Adicione pelo menos um produto à composição.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={formItems.length === 0}>
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CompositionImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingCompositions={compositions}
        products={products}
        onImport={(comps, updateExisting) => {
          importCompositions(comps, updateExisting);
          toast({ title: `${comps.length} composição(ões) importada(s)` });
        }}
      />
    </AppLayout>
  );
}
