import { useState } from 'react';
import { Plus, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, RefreshCw, AlertOctagon, XCircle, Search, Repeat } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { MovementType, MovementPurpose } from '@/types/inventory';
import { MOVEMENT_PURPOSES } from '@/types/inventory';
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
  const { movements, products, locations, currentUser, addMovement } = useInventoryContext();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

    toast({
      title: 'Movimentação registrada',
      description: `${formData.type} de ${formData.quantity} ${selectedProduct.unit} - ${selectedProduct.code}`,
    });

    setIsDialogOpen(false);
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Movimentação</DialogTitle>
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
                          sublabel: `${loc.type} · ${loc.products.length} produto(s)`,
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
    </AppLayout>
  );
}
