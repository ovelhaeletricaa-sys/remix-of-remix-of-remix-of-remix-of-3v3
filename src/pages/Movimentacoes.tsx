import { useState } from 'react';
import { Plus, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertOctagon, XCircle, Search, Repeat, Pencil, Trash2, Boxes } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { MovementType, MovementPurpose } from '@/types/inventory';
import { MOVEMENT_PURPOSES } from '@/types/inventory';
import type { ProductionExitType, ProductionOrderItem } from '@/types/composition';
import { PRODUCTION_EXIT_TYPES } from '@/types/composition';
import { useToast } from '@/hooks/use-toast';

const MOVEMENT_TYPES: { value: MovementType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'ENTRADA', label: 'Entrada', icon: <ArrowUpCircle className="h-4 w-4" />, color: 'bg-success text-success-foreground' },
  { value: 'SAIDA', label: 'Saída', icon: <ArrowDownCircle className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'DEVOLUCAO', label: 'Devolução', icon: <RefreshCw className="h-4 w-4" />, color: 'bg-info text-info-foreground' },
  { value: 'TROCA', label: 'Troca', icon: <Repeat className="h-4 w-4" />, color: 'bg-primary text-primary-foreground' },
  { value: 'AVARIA', label: 'Avaria', icon: <AlertOctagon className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
  { value: 'PERDA', label: 'Perda', icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
];

export default function Movimentacoes() {
  const { movements, products, locations, currentUser, compositions, addMovement, updateMovement, deleteMovement, addProductionOrder } = useInventoryContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    productId: '',
    type: 'SAIDA' as MovementType,
    quantity: 1,
    destination: '',
    purpose: 'SERVICO' as MovementPurpose,
    projectCode: '',
    equipmentCode: '',
    observations: '',
  });

  // Production composition state
  const [selectedCompositionId, setSelectedCompositionId] = useState('');
  const [exitType, setExitType] = useState<ProductionExitType>('INTEGRAL');
  const [productionItems, setProductionItems] = useState<ProductionOrderItem[]>([]);
  const [productionProjectCode, setProductionProjectCode] = useState('');
  const [productionObservations, setProductionObservations] = useState('');

  const filteredMovements = movements.filter(m => {
    const matchesSearch = 
      m.productCode.toLowerCase().includes(search.toLowerCase()) ||
      m.productDescription.toLowerCase().includes(search.toLowerCase()) ||
      m.collaborator.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const selectedProduct = products.find(p => p.id === formData.productId);

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.code} - ${p.description}`,
    sublabel: `Estoque: ${p.currentStock} ${p.unit} · ${p.location}`,
    keywords: [p.code, p.description, p.code.replace(/[^a-zA-Z0-9]/g, '')],
  }));

  const purposeOptions = MOVEMENT_PURPOSES.map(p => ({
    value: p.value,
    label: p.label,
  }));

  const typeFilterOptions = [
    { value: 'all', label: 'Todos os tipos' },
    ...MOVEMENT_TYPES.map(t => ({ value: t.value, label: t.label })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (['SAIDA', 'AVARIA', 'PERDA'].includes(formData.type)) {
      if (formData.quantity > selectedProduct.currentStock) {
        toast({
          title: 'Saldo insuficiente',
          description: `Estoque disponível: ${selectedProduct.currentStock} ${selectedProduct.unit}. Quantidade solicitada: ${formData.quantity}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (formData.quantity <= 0) {
      toast({
        title: 'Quantidade inválida',
        description: 'A quantidade deve ser maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const now = new Date();
    const resolvedAddress = formData.destination === '__sem_endereco__'
      ? 'SEM ENDEREÇO'
      : formData.destination === 'EXTERNO'
        ? 'EXTERNO'
        : locations.find(l => l.id === formData.destination)?.description || formData.destination;

    if (editingMovement) {
      updateMovement(editingMovement, {
        type: formData.type,
        quantity: formData.quantity,
        purpose: formData.purpose,
        projectCode: formData.projectCode || undefined,
        equipmentCode: formData.equipmentCode || undefined,
        observations: formData.observations || undefined,
      });
      toast({ title: 'Movimentação atualizada', description: `${formData.type} - ${selectedProduct.code}` });
    } else {
      addMovement({
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        productId: selectedProduct.id,
        productCode: selectedProduct.code,
        productDescription: selectedProduct.description,
        type: formData.type,
        quantity: formData.quantity,
        origin: formData.type === 'ENTRADA' ? 'EXTERNO' : resolvedAddress,
        destination: formData.type === 'ENTRADA' ? resolvedAddress : formData.destination ? resolvedAddress : 'N/A',
        purpose: formData.purpose,
        projectCode: formData.projectCode || undefined,
        equipmentCode: formData.equipmentCode || undefined,
        collaborator: currentUser || 'Sistema',
        observations: formData.observations || undefined,
      });
      toast({ title: 'Movimentação registrada', description: `${formData.type} de ${formData.quantity} ${selectedProduct.unit} - ${selectedProduct.code}` });
    }

    setIsDialogOpen(false);
    setEditingMovement(null);
    setFormData({
      productId: '',
      type: 'SAIDA',
      quantity: 1,
      destination: '',
      purpose: 'SERVICO',
      projectCode: '',
      equipmentCode: '',
      observations: '',
    });
  };

  const handleEdit = (movement: typeof movements[0]) => {
    setEditingMovement(movement.id);
    setFormData({
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      destination: '',
      purpose: movement.purpose,
      projectCode: movement.projectCode || '',
      equipmentCode: movement.equipmentCode || '',
      observations: movement.observations || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMovement(id);
    toast({ title: 'Movimentação excluída', description: 'O estoque foi ajustado automaticamente.' });
  };

  // Composition options for production
  const activeCompositions = compositions.filter(c => c.isActive);
  const compositionOptions = activeCompositions.map(c => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
    sublabel: `${c.items.length} itens`,
  }));

  const handleSelectComposition = (compId: string) => {
    setSelectedCompositionId(compId);
    const comp = compositions.find(c => c.id === compId);
    if (!comp) return;
    setProductionItems(comp.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productCode: item.productCode,
        productDescription: item.productDescription,
        requiredQty: item.quantity,
        deliveredQty: item.quantity,
        unit: item.unit,
        selected: true,
      };
    }));
  };

  const handleProductionSubmit = () => {
    const comp = compositions.find(c => c.id === selectedCompositionId);
    if (!comp) return;

    const itemsToProcess = exitType === 'INTEGRAL'
      ? productionItems
      : productionItems.filter(i => i.selected);

    if (itemsToProcess.length === 0) {
      toast({ title: 'Selecione ao menos um item', variant: 'destructive' });
      return;
    }

    // Validate stock
    for (const item of itemsToProcess) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) continue;
      const qty = exitType === 'FRACIONADA' ? item.deliveredQty : item.requiredQty;
      if (qty > prod.currentStock) {
        toast({
          title: 'Saldo insuficiente',
          description: `${item.productCode}: estoque ${prod.currentStock}, solicitado ${qty}`,
          variant: 'destructive',
        });
        return;
      }
    }

    const now = new Date();
    const movementIds: string[] = [];

    for (const item of itemsToProcess) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) continue;
      const qty = exitType === 'FRACIONADA' ? item.deliveredQty : item.requiredQty;
      
      const mov = addMovement({
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        productId: prod.id,
        productCode: prod.code,
        productDescription: prod.description,
        type: 'SAIDA',
        quantity: qty,
        origin: prod.location || 'SEM ENDEREÇO',
        destination: 'PRODUÇÃO',
        purpose: 'PRODUCAO',
        projectCode: productionProjectCode || undefined,
        equipmentCode: comp.code,
        collaborator: currentUser || 'Sistema',
        observations: productionObservations || `Composição: ${comp.code} - ${comp.name} (${exitType})`,
      });
      movementIds.push(mov.id);
    }

    // Create production order for traceability
    addProductionOrder({
      compositionId: comp.id,
      compositionCode: comp.code,
      compositionName: comp.name,
      projectCode: productionProjectCode,
      exitType,
      items: itemsToProcess.map(i => ({
        ...i,
        deliveredQty: exitType === 'FRACIONADA' ? i.deliveredQty : i.requiredQty,
      })),
      status: exitType === 'INTEGRAL' ? 'CONCLUIDA' : itemsToProcess.length < comp.items.length ? 'PARCIAL' : 'CONCLUIDA',
      collaborator: currentUser || 'Sistema',
      movementIds,
    });

    toast({
      title: 'Saída para produção registrada',
      description: `${itemsToProcess.length} itens da composição ${comp.code} baixados do estoque.`,
    });

    setIsProductionDialogOpen(false);
    setSelectedCompositionId('');
    setExitType('INTEGRAL');
    setProductionItems([]);
    setProductionProjectCode('');
    setProductionObservations('');
  };

  const getTypeInfo = (type: MovementType) => MOVEMENT_TYPES.find(t => t.value === type);

  return (
    <AppLayout title="Movimentações" subtitle="Registro de entradas, saídas e outras movimentações">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Histórico de Movimentações
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsProductionDialogOpen(true)} disabled={activeCompositions.length === 0}>
                <Boxes className="mr-2 h-4 w-4" />
                Saída Produção
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingMovement ? 'Editar Movimentação' : 'Registrar Movimentação'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Movement Type Selector */}
                  <div className="space-y-2">
                    <Label>Tipo de Movimentação</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {MOVEMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, type: type.value }))}
                          className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                            formData.type === type.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {type.icon}
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="product">Produto</Label>
                    <SearchableSelect
                      options={productOptions}
                      value={formData.productId}
                      onValueChange={value => setFormData(f => ({ ...f, productId: value }))}
                      placeholder="Selecione o produto"
                      searchPlaceholder="Buscar por código ou descrição..."
                      emptyMessage="Nenhum produto encontrado."
                    />
                    {selectedProduct && (
                      <div className="rounded bg-muted/50 p-2 text-sm">
                        <p className="text-muted-foreground">
                          Estoque: <span className={`font-medium ${selectedProduct.currentStock < selectedProduct.minStock ? 'text-warning' : 'text-foreground'}`}>
                            {selectedProduct.currentStock} {selectedProduct.unit}
                          </span>
                          {' · '}Local: <span className="font-mono">{selectedProduct.location}</span>
                        </p>
                        {['SAIDA', 'AVARIA', 'PERDA'].includes(formData.type) && formData.quantity > selectedProduct.currentStock && (
                          <p className="mt-1 text-xs font-medium text-destructive">
                            ⚠ Quantidade excede o estoque disponível!
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity and Purpose */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={e => setFormData(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Finalidade</Label>
                      <SearchableSelect
                        options={purposeOptions}
                        value={formData.purpose}
                        onValueChange={(value) => setFormData(f => ({ ...f, purpose: value as MovementPurpose }))}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar finalidade..."
                      />
                    </div>
                  </div>

                  {/* Project Code (for production) */}
                  {formData.purpose === 'PRODUCAO' && (
                    <div className="space-y-2">
                      <Label htmlFor="projectCode">Código do Projeto/Equipamento</Label>
                      <Input
                        id="projectCode"
                        value={formData.projectCode}
                        onChange={e => setFormData(f => ({ ...f, projectCode: e.target.value }))}
                        placeholder="Ex: PRD01733, 0000000726"
                      />
                    </div>
                  )}

                  {/* Origin/Destination Address */}
                  <div className="space-y-2">
                    <Label>
                      {formData.type === 'ENTRADA' ? 'Destino (endereço)' : 'Endereço de origem'}
                    </Label>
                    {(() => {
                      // Build address options based on selected product
                      const normalizeAddr = (s: string) => s.replace(/[\s\-]+/g, '').toUpperCase();
                      const productLocations = selectedProduct
                        ? locations.filter(loc => 
                            loc.products.includes(selectedProduct.id) || 
                            normalizeAddr(loc.description).includes(normalizeAddr(selectedProduct.location))
                          )
                        : [];
                      
                      const addressOptions = [
                        ...productLocations.map(loc => ({
                          value: loc.id,
                          label: loc.description,
                          sublabel: `${loc.type} · Estoque: ${selectedProduct!.currentStock} ${selectedProduct!.unit}`,
                        })),
                        ...(selectedProduct && productLocations.length === 0
                          ? [{ value: '__sem_endereco__', label: 'Sem endereço (produto não endereçado)', sublabel: 'Produto ainda não alocado em nenhum endereço' }]
                          : []),
                        { value: 'EXTERNO', label: 'Externo', sublabel: 'Origem/destino externo ao armazém' },
                      ];

                      return (
                        <SearchableSelect
                          options={addressOptions}
                          value={formData.destination}
                          onValueChange={value => setFormData(f => ({ ...f, destination: value }))}
                          placeholder={selectedProduct ? 'Selecione o endereço' : 'Selecione um produto primeiro'}
                          searchPlaceholder="Buscar endereço..."
                          emptyMessage="Nenhum endereço encontrado."
                          disabled={!selectedProduct}
                        />
                      );
                    })()}
                    {formData.destination === '__sem_endereco__' && (
                      <p className="text-xs text-warning">
                        ⚠ Este produto ainda não possui endereçamento. Realize o endereçamento no módulo Armazém.
                      </p>
                    )}
                  </div>

                  {/* Observations */}
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={e => setFormData(f => ({ ...f, observations: e.target.value }))}
                      placeholder="Nº pedido, NF, motivo..."
                      rows={2}
                    />
                  </div>

                  {/* Current User Info */}
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="text-muted-foreground">
                      Registrado por: <span className="font-medium text-foreground">{currentUser || 'Sistema'}</span>
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={!formData.productId}>
                      Registrar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou colaborador..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <SearchableSelect
                options={typeFilterOptions}
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="Tipo"
                searchPlaceholder="Buscar tipo..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Data/Hora</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Produto</TableHead>
                  <TableHead className="text-right font-semibold">Qtd</TableHead>
                  <TableHead className="font-semibold">Finalidade</TableHead>
                  <TableHead className="font-semibold">Projeto</TableHead>
                  <TableHead className="font-semibold">Colaborador</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Nenhuma movimentação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.slice(0, 50).map((movement) => {
                    const typeInfo = getTypeInfo(movement.type);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{new Date(movement.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm text-muted-foreground">{movement.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${typeInfo?.color}`}>
                            {typeInfo?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono font-medium">{movement.productCode}</p>
                            <p className="max-w-[200px] truncate text-sm text-muted-foreground">{movement.productDescription}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {movement.quantity}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{movement.purpose}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {movement.projectCode || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {movement.collaborator}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(movement)}>
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
                                    <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação irá reverter o impacto no estoque ({movement.type === 'ENTRADA' || movement.type === 'DEVOLUCAO' ? '-' : '+'}{movement.quantity} {products.find(p => p.id === movement.productId)?.unit || 'UN'} de {movement.productCode}).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(movement.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Exibindo {Math.min(filteredMovements.length, 50)} de {filteredMovements.length} movimentação(ões)
          </p>
        </CardContent>
      </Card>

      {/* Production Composition Dialog */}
      <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Saída para Produção - Composição
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Composition Selection */}
            <div className="space-y-2">
              <Label>Composição</Label>
              <SearchableSelect
                options={compositionOptions}
                value={selectedCompositionId}
                onValueChange={handleSelectComposition}
                placeholder="Selecione a composição..."
                searchPlaceholder="Buscar composição..."
                emptyMessage="Nenhuma composição ativa."
              />
            </div>

            {/* Project Code */}
            <div className="space-y-2">
              <Label>Código do Projeto</Label>
              <Input
                value={productionProjectCode}
                onChange={e => setProductionProjectCode(e.target.value)}
                placeholder="Ex: PRD01733, 0000000726"
              />
            </div>

            {/* Exit Type */}
            {selectedCompositionId && (
              <div className="space-y-2">
                <Label>Tipo de Saída</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUCTION_EXIT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setExitType(t.value);
                        if (t.value === 'INTEGRAL') {
                          setProductionItems(prev => prev.map(i => ({ ...i, selected: true })));
                        }
                      }}
                      className={`rounded-lg border p-3 text-left text-sm transition-all ${
                        exitType === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <p className="font-medium">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items Table */}
            {productionItems.length > 0 && (
              <div className="space-y-2">
                <Label>Itens ({productionItems.filter(i => i.selected).length}/{productionItems.length} selecionados)</Label>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {exitType !== 'INTEGRAL' && <TableHead className="w-10"></TableHead>}
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Necessário</TableHead>
                        {exitType === 'FRACIONADA' && <TableHead className="text-right">Qtd Saída</TableHead>}
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionItems.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId);
                        const stock = prod?.currentStock ?? 0;
                        const qtyNeeded = exitType === 'FRACIONADA' ? item.deliveredQty : item.requiredQty;
                        const sufficient = stock >= qtyNeeded;
                        return (
                          <TableRow key={item.productId} className={!item.selected && exitType !== 'INTEGRAL' ? 'opacity-40' : ''}>
                            {exitType !== 'INTEGRAL' && (
                              <TableCell>
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={(checked) => {
                                    setProductionItems(prev => prev.map((i, j) =>
                                      j === idx ? { ...i, selected: !!checked } : i
                                    ));
                                  }}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <p className="font-mono text-xs">{item.productCode}</p>
                              <p className="max-w-[200px] truncate text-xs text-muted-foreground">{item.productDescription}</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">{item.requiredQty} {item.unit}</TableCell>
                            {exitType === 'FRACIONADA' && (
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="1"
                                  max={stock}
                                  value={item.deliveredQty}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 1;
                                    setProductionItems(prev => prev.map((i, j) =>
                                      j === idx ? { ...i, deliveredQty: val } : i
                                    ));
                                  }}
                                  className="h-8 w-20 ml-auto text-right"
                                />
                              </TableCell>
                            )}
                            <TableCell className={`text-right font-medium ${sufficient ? 'text-success' : 'text-destructive'}`}>
                              {stock} {item.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              {sufficient ? (
                                <Badge className="bg-success text-success-foreground">OK</Badge>
                              ) : (
                                <Badge variant="destructive">Insuficiente</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Observations */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={productionObservations}
                onChange={e => setProductionObservations(e.target.value)}
                rows={2}
                placeholder="Nº pedido, NF, motivo..."
              />
            </div>

            {/* User Info */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Registrado por: <span className="font-medium text-foreground">{currentUser || 'Sistema'}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsProductionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleProductionSubmit}
                disabled={!selectedCompositionId || productionItems.filter(i => i.selected).length === 0}
              >
                Confirmar Saída
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
