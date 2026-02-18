import { useState } from 'react';
import { Plus, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertOctagon, XCircle, Search, Repeat, Pencil, Trash2, Boxes, MapPin, Eye, Settings2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import type { ProductionExitType, ProductionOrderItem, ProductionStatus, ProductionOrder } from '@/types/composition';
import { PRODUCTION_EXIT_TYPES, PRODUCTION_STATUSES } from '@/types/composition';
import { useToast } from '@/hooks/use-toast';

const MOVEMENT_TYPES: { value: MovementType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'ENTRADA', label: 'Entrada', icon: <ArrowUpCircle className="h-4 w-4" />, color: 'bg-success text-success-foreground' },
  { value: 'SAIDA', label: 'Saída', icon: <ArrowDownCircle className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'DEVOLUCAO', label: 'Devolução', icon: <RefreshCw className="h-4 w-4" />, color: 'bg-info text-info-foreground' },
  { value: 'TROCA', label: 'Troca', icon: <Repeat className="h-4 w-4" />, color: 'bg-primary text-primary-foreground' },
  { value: 'AVARIA', label: 'Avaria', icon: <AlertOctagon className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
  { value: 'PERDA', label: 'Perda', icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
];

const STATUS_COLORS: Record<ProductionStatus, string> = {
  INCOMPLETA: 'bg-warning text-warning-foreground',
  CONCLUIDA: 'bg-success text-success-foreground',
  ESTOCADA: 'bg-info text-info-foreground',
  CANCELADA: 'bg-destructive text-destructive-foreground',
};

const STATUS_LABELS: Record<ProductionStatus, string> = {
  INCOMPLETA: 'Incompleta',
  CONCLUIDA: 'Concluída',
  ESTOCADA: 'Estocada',
  CANCELADA: 'Cancelada',
};

export default function Movimentacoes() {
  const { movements, products, locations, currentUser, compositions, productionOrders, addMovement, updateMovement, deleteMovement, addProductionOrder, updateProductionOrder, cancelProductionOrder } = useInventoryContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('historico');
  
  // Production orders tab state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

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
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>('INCOMPLETA');

  const isProductionExit = formData.type === 'SAIDA' && formData.purpose === 'PRODUCAO';

  // Build a set of movement IDs that belong to production orders
  const productionMovementIds = new Map<string, ProductionOrder>();
  productionOrders.forEach(order => {
    order.movementIds.forEach(mId => productionMovementIds.set(mId, order));
  });

  const filteredMovements = movements.filter(m => {
    const matchesSearch = 
      m.productCode.toLowerCase().includes(search.toLowerCase()) ||
      m.productDescription.toLowerCase().includes(search.toLowerCase()) ||
      m.collaborator.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredOrders = productionOrders.filter(o => {
    const matchesSearch =
      o.compositionCode.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.compositionName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.projectCode.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.collaborator.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
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

  const orderStatusFilterOptions = [
    { value: 'all', label: 'Todos os status' },
    ...PRODUCTION_STATUSES.map(s => ({ value: s.value, label: s.label })),
  ];

  const activeCompositions = compositions.filter(c => c.isActive);
  const compositionOptions = activeCompositions.map(c => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
    sublabel: `${c.items.length} itens`,
  }));

  const compositionProjectOptions = compositions.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.name}`,
    sublabel: `${c.items.length} itens${!c.isActive ? ' · Inativa' : ''}`,
    keywords: [c.code, c.name],
  }));

  const handleSelectComposition = (compId: string) => {
    setSelectedCompositionId(compId);
    const comp = compositions.find(c => c.id === compId);
    if (!comp) return;
    // Auto-fill projectCode with composition code
    setFormData(f => ({ ...f, projectCode: comp.code }));
    setProductionItems(comp.items.map(item => ({
      productId: item.productId,
      productCode: item.productCode,
      productDescription: item.productDescription,
      requiredQty: item.quantity * formData.quantity,
      deliveredQty: item.quantity * formData.quantity,
      unit: item.unit,
      selected: true,
    })));
  };

  const handleCompositionQtyChange = (qty: number) => {
    setFormData(f => ({ ...f, quantity: qty }));
    const comp = compositions.find(c => c.id === selectedCompositionId);
    if (!comp) return;
    setProductionItems(prev => prev.map((item, idx) => {
      const baseQty = comp.items[idx]?.quantity || item.requiredQty;
      return {
        ...item,
        requiredQty: baseQty * qty,
        deliveredQty: exitType === 'FRACIONADA' ? item.deliveredQty : baseQty * qty,
      };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isProductionExit) {
      handleProductionSubmit();
      return;
    }

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
      toast({ title: 'Quantidade inválida', description: 'A quantidade deve ser maior que zero.', variant: 'destructive' });
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

    closeAndResetDialog();
  };

  const handleProductionSubmit = () => {
    const comp = compositions.find(c => c.id === selectedCompositionId);
    if (!comp) {
      toast({ title: 'Selecione uma composição', variant: 'destructive' });
      return;
    }

    const itemsToProcess = exitType === 'INTEGRAL'
      ? productionItems
      : productionItems.filter(i => i.selected);

    if (itemsToProcess.length === 0) {
      toast({ title: 'Selecione ao menos um item', variant: 'destructive' });
      return;
    }

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
        projectCode: formData.projectCode || undefined,
        equipmentCode: comp.code,
        collaborator: currentUser || 'Sistema',
        observations: formData.observations || `Composição: ${comp.code} - ${comp.name} (${exitType})`,
      });
      movementIds.push(mov.id);
    }

    addProductionOrder({
      compositionId: comp.id,
      compositionCode: comp.code,
      compositionName: comp.name,
      projectCode: formData.projectCode,
      exitType,
      items: itemsToProcess.map(i => ({
        ...i,
        deliveredQty: exitType === 'FRACIONADA' ? i.deliveredQty : i.requiredQty,
      })),
      status: productionStatus,
      productionStatus,
      collaborator: currentUser || 'Sistema',
      movementIds,
      compositionQty: formData.quantity,
    });

    toast({
      title: 'Saída para produção registrada',
      description: `${itemsToProcess.length} itens da composição ${comp.code} (x${formData.quantity}) baixados do estoque.`,
    });

    closeAndResetDialog();
  };

  const closeAndResetDialog = () => {
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
    setSelectedCompositionId('');
    setExitType('INTEGRAL');
    setProductionItems([]);
    setProductionStatus('INCOMPLETA');
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

  const handleUpdateOrderStatus = (order: ProductionOrder, newStatus: ProductionStatus) => {
    if (order.status === 'CANCELADA') return;

    if (newStatus === 'CANCELADA') {
      cancelProductionOrder(order.id);
      toast({ title: 'Produção cancelada', description: `Os itens da OP ${order.compositionCode} foram devolvidos ao estoque.` });
    } else {
      updateProductionOrder(order.id, { status: newStatus, productionStatus: newStatus });
      toast({ title: 'Status atualizado', description: `OP ${order.compositionCode} → ${STATUS_LABELS[newStatus]}` });
    }
    setSelectedOrder(null);
    setIsOrderDetailOpen(false);
  };

  const openOrderDetail = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const getTypeInfo = (type: MovementType) => MOVEMENT_TYPES.find(t => t.value === type);

  return (
    <AppLayout title="Movimentações" subtitle="Registro de entradas, saídas e outras movimentações">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="historico" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Histórico de Movimentações
            </TabsTrigger>
            <TabsTrigger value="ordens" className="gap-2">
              <Boxes className="h-4 w-4" />
              Ordens de Produção
              {productionOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{productionOrders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeAndResetDialog(); else setIsDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className={isProductionExit ? "max-w-2xl max-h-[90vh] overflow-y-auto" : "max-w-lg"}>
              <DialogHeader>
                <DialogTitle>
                  {editingMovement ? 'Editar Movimentação' : isProductionExit ? 'Saída para Produção' : 'Registrar Movimentação'}
                </DialogTitle>
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

                {/* Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="purpose">Finalidade</Label>
                  <SearchableSelect
                    options={purposeOptions}
                    value={formData.purpose}
                    onValueChange={(value) => {
                      setFormData(f => ({ ...f, purpose: value as MovementPurpose }));
                      if (value !== 'PRODUCAO') {
                        setSelectedCompositionId('');
                        setProductionItems([]);
                        setExitType('INTEGRAL');
                        setProductionStatus('INCOMPLETA');
                      }
                    }}
                    placeholder="Selecione"
                    searchPlaceholder="Buscar finalidade..."
                  />
                </div>

                {/* === PRODUCTION EXIT FIELDS === */}
                {isProductionExit ? (
                  <>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Qtd de Composições</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={e => handleCompositionQtyChange(parseInt(e.target.value) || 1)}
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">Quantas composições serão produzidas</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Código do Projeto (Composição)</Label>
                        <SearchableSelect
                          options={compositionProjectOptions}
                          value={formData.projectCode}
                          onValueChange={(value) => setFormData(f => ({ ...f, projectCode: value }))}
                          placeholder="Selecione a composição/projeto..."
                          searchPlaceholder="Buscar por código ou nome..."
                          emptyMessage="Nenhuma composição encontrada."
                        />
                      </div>
                    </div>

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

                    {productionItems.length > 0 && (
                      <div className="space-y-2">
                        <Label>Itens ({productionItems.filter(i => i.selected).length}/{productionItems.length} selecionados)</Label>
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {exitType !== 'INTEGRAL' && <TableHead className="w-10"></TableHead>}
                                <TableHead>Produto</TableHead>
                                <TableHead>Localização</TableHead>
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
                                const location = prod?.location || 'Sem endereço';
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
                                      <p className="max-w-[160px] truncate text-xs text-muted-foreground">{item.productDescription}</p>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-mono text-xs">{location}</span>
                                      </div>
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

                    {/* Production Status */}
                    <div className="space-y-2">
                      <Label>Status da Produção</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PRODUCTION_STATUSES.map(s => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setProductionStatus(s.value)}
                            className={`rounded-lg border p-3 text-left text-sm transition-all ${
                              productionStatus === s.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <p className="font-medium">{s.label}</p>
                            <p className="text-[11px] text-muted-foreground">{s.description}</p>
                          </button>
                        ))}
                      </div>
                      {productionStatus === 'CANCELADA' && (
                        <p className="text-xs text-warning">⚠ Ao cancelar, os itens retornarão automaticamente ao estoque.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* === STANDARD MOVEMENT FIELDS === */}
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
                      <Label>Código do Projeto (Composição)</Label>
                      <SearchableSelect
                        options={compositionProjectOptions}
                        value={formData.projectCode}
                        onValueChange={(value) => setFormData(f => ({ ...f, projectCode: value }))}
                        placeholder="Selecione a composição/projeto..."
                        searchPlaceholder="Buscar por código ou nome..."
                        emptyMessage="Nenhuma composição encontrada."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {formData.type === 'ENTRADA' ? 'Destino (endereço)' : 'Endereço de origem'}
                      </Label>
                      {(() => {
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
                  </>
                )}

                {/* Observations (shared) */}
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

                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">
                    Registrado por: <span className="font-medium text-foreground">{currentUser || 'Sistema'}</span>
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeAndResetDialog}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isProductionExit 
                      ? !selectedCompositionId || productionItems.filter(i => i.selected).length === 0 
                      : !formData.productId
                    }
                  >
                    {isProductionExit ? 'Confirmar Saída' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ==================== TAB: HISTÓRICO ==================== */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Histórico de Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        const linkedOrder = productionMovementIds.get(movement.id);
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
                                {linkedOrder && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                                          onClick={() => {
                                            openOrderDetail(linkedOrder);
                                          }}
                                        >
                                          <Boxes className="h-3 w-3" />
                                          OP: {linkedOrder.compositionCode}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Ordem de Produção: {linkedOrder.compositionCode} - {linkedOrder.compositionName}</p>
                                        <p>Status: {STATUS_LABELS[linkedOrder.status]}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
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
        </TabsContent>

        {/* ==================== TAB: ORDENS DE PRODUÇÃO ==================== */}
        <TabsContent value="ordens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Ordens de Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por composição, projeto ou colaborador..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <SearchableSelect
                    options={orderStatusFilterOptions}
                    value={orderStatusFilter}
                    onValueChange={setOrderStatusFilter}
                    placeholder="Status"
                    searchPlaceholder="Buscar status..."
                  />
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Composição</TableHead>
                      <TableHead className="font-semibold">Projeto</TableHead>
                      <TableHead className="font-semibold">Tipo Saída</TableHead>
                      <TableHead className="text-right font-semibold">Qtd</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Colaborador</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Nenhuma ordem de produção encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <p className="font-mono font-medium">{order.compositionCode}</p>
                              <p className="max-w-[200px] truncate text-sm text-muted-foreground">{order.compositionName}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{order.projectCode || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.exitType}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">x{order.compositionQty}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[order.status]}>
                              {STATUS_LABELS[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{order.collaborator}</TableCell>
                          <TableCell>
                            <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openOrderDetail(order)}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver detalhes</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {filteredOrders.length} ordem(ns) de produção
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOG: DETALHES DA ORDEM ==================== */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Boxes className="h-5 w-5" />
                  Ordem de Produção — {selectedOrder.compositionCode}
                  <Badge className={STATUS_COLORS[selectedOrder.status]}>{STATUS_LABELS[selectedOrder.status]}</Badge>
                </DialogTitle>
              </DialogHeader>

              {/* General Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Composição</p>
                  <p className="font-medium">{selectedOrder.compositionCode} - {selectedOrder.compositionName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projeto</p>
                  <p className="font-medium">{selectedOrder.projectCode || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo de Saída</p>
                  <p className="font-medium">{selectedOrder.exitType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Qtd Composições</p>
                  <p className="font-medium">x{selectedOrder.compositionQty}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Colaborador</p>
                  <p className="font-medium">{selectedOrder.collaborator}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Itens Processados</Label>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd Solicitada</TableHead>
                        <TableHead className="text-right">Qtd Entregue</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <p className="font-mono text-xs">{item.productCode}</p>
                            <p className="text-xs text-muted-foreground">{item.productDescription}</p>
                          </TableCell>
                          <TableCell className="text-right">{item.requiredQty} {item.unit}</TableCell>
                          <TableCell className="text-right">{item.deliveredQty} {item.unit}</TableCell>
                          <TableCell className="text-center">
                            {item.selected ? (
                              <Badge className="bg-success text-success-foreground">Processado</Badge>
                            ) : (
                              <Badge variant="outline">Não selecionado</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Linked Movements */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Movimentações Vinculadas ({selectedOrder.movementIds.length})</Label>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.movementIds.map(mId => {
                        const mov = movements.find(m => m.id === mId);
                        if (!mov) return null;
                        const typeInfo = getTypeInfo(mov.type);
                        return (
                          <TableRow key={mId}>
                            <TableCell>
                              <p className="font-mono text-xs">{mov.productCode}</p>
                            </TableCell>
                            <TableCell>
                              <Badge className={typeInfo?.color}>{typeInfo?.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{mov.quantity}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{mov.origin}</TableCell>
                            <TableCell className="text-xs">{new Date(mov.date).toLocaleDateString('pt-BR')} {mov.time}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Status Change */}
              {selectedOrder.status !== 'CANCELADA' && (
                <div className="space-y-3 rounded-lg border p-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Alterar Status
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCTION_STATUSES.filter(s => s.value !== selectedOrder.status && s.value !== 'CANCELADA').map(s => (
                      <Button
                        key={s.value}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => handleUpdateOrderStatus(selectedOrder, s.value)}
                      >
                        <Badge className={`${STATUS_COLORS[s.value]} mr-2`}>{s.label}</Badge>
                        <span className="text-xs text-muted-foreground">{s.description}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Cancel with confirmation */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Cancelar Produção (devolver itens ao estoque)
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Ordem de Produção?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá devolver automaticamente todos os itens ao estoque, criando movimentações de devolução. 
                          Esta ação não pode ser desfeita.
                          <br /><br />
                          <strong>Itens que serão devolvidos:</strong>
                          <ul className="mt-2 list-disc pl-4">
                            {selectedOrder.items.filter(i => i.selected).map(i => (
                              <li key={i.productId}>{i.productCode}: {i.deliveredQty} {i.unit}</li>
                            ))}
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter Produção</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleUpdateOrderStatus(selectedOrder, 'CANCELADA')}
                        >
                          Confirmar Cancelamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {selectedOrder.status === 'CANCELADA' && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <p className="font-medium">⚠ Esta ordem foi cancelada</p>
                  <p className="text-muted-foreground">Os itens foram devolvidos ao estoque automaticamente. Este status é final e não pode ser revertido.</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
