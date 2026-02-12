import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Upload } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ImportDialog } from '@/components/ImportDialog';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Product, ProductCategory } from '@/types/inventory';
import { PRODUCT_CATEGORIES } from '@/types/inventory';

const UNIT_OPTIONS = [
  { value: 'UN', label: 'UN (Unidade)' },
  { value: 'M', label: 'M (Metro)' },
  { value: 'KG', label: 'KG (Quilo)' },
  { value: 'L', label: 'L (Litro)' },
  { value: 'CX', label: 'CX (Caixa)' },
  { value: 'M2', label: 'M² (Metro²)' },
  { value: 'PCT', label: 'PCT (Pacote)' },
];

export default function Produtos() {
  const { products, locations, addProduct, updateProduct, deleteProduct, importProducts } = useInventoryContext();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: 'OUTROS' as ProductCategory,
    unit: 'UN',
    minStock: 10,
    currentStock: 0,
    stockOmie: 0,
    location: '',
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: 'all', label: 'Todas as categorias' },
    ...PRODUCT_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label })),
  ];

  const categoryFormOptions = PRODUCT_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }));

  const locationOptions = locations.map(loc => ({
    value: `STNT${loc.shelf}-PRAT${loc.rack}`,
    label: `STNT${loc.shelf}-PRAT${loc.rack}`,
    sublabel: loc.type === 'AEREO' ? 'Aéreo' : 'Picking',
  }));

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        description: product.description,
        category: product.category,
        unit: product.unit,
        minStock: product.minStock,
        currentStock: product.currentStock,
        stockOmie: product.stockOmie,
        location: product.location,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '',
        description: '',
        category: 'OUTROS',
        unit: 'UN',
        minStock: 10,
        currentStock: 0,
        stockOmie: 0,
        location: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };

  const getCategoryLabel = (cat: ProductCategory) => {
    return PRODUCT_CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  return (
    <AppLayout title="Produtos" subtitle="Gerenciamento de produtos do estoque">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cadastro de Produtos ({products.length} itens)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Planilha
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={e => setFormData(f => ({ ...f, code: e.target.value }))}
                        placeholder="PRD00001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unidade</Label>
                      <SearchableSelect
                        options={UNIT_OPTIONS}
                        value={formData.unit}
                        onValueChange={value => setFormData(f => ({ ...f, unit: value }))}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar unidade..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Descrição do produto"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <SearchableSelect
                        options={categoryFormOptions}
                        value={formData.category}
                        onValueChange={(value) => setFormData(f => ({ ...f, category: value as ProductCategory }))}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar categoria..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Localização</Label>
                      <SearchableSelect
                        options={locationOptions}
                        value={formData.location}
                        onValueChange={value => setFormData(f => ({ ...f, location: value }))}
                        placeholder="Selecione o endereço"
                        searchPlaceholder="Buscar endereço..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Est. Físico</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        min="0"
                        value={formData.currentStock}
                        onChange={e => setFormData(f => ({ ...f, currentStock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Est. Mínimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        min="0"
                        value={formData.minStock}
                        onChange={e => setFormData(f => ({ ...f, minStock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockOmie">Qtd OMIE</Label>
                      <Input
                        id="stockOmie"
                        type="number"
                        min="0"
                        value={formData.stockOmie}
                        onChange={e => setFormData(f => ({ ...f, stockOmie: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Salvar' : 'Cadastrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
          <ImportDialog
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
            existingProducts={products}
            onImport={importProducts}
          />
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-56">
              <SearchableSelect
                options={categoryOptions}
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                placeholder="Categoria"
                searchPlaceholder="Buscar categoria..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">Local</TableHead>
                  <TableHead className="text-center font-semibold">ABC</TableHead>
                  <TableHead className="text-right font-semibold">Físico</TableHead>
                  <TableHead className="text-right font-semibold">Mínimo</TableHead>
                  <TableHead className="text-right font-semibold">OMIE</TableHead>
                  <TableHead className="text-center font-semibold">Divergência</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const divergence = product.currentStock - product.stockOmie;
                    const hasDivergence = divergence !== 0;
                    const percentDiv = product.stockOmie > 0 ? Math.abs(divergence / product.stockOmie * 100) : 0;
                    return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono font-medium">{product.code}</TableCell>
                      <TableCell>{product.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{getCategoryLabel(product.category)}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.location}</TableCell>
                      <TableCell className="text-center">
                        {product.curvaABC && (
                          <Badge variant={product.curvaABC === 'A' ? 'default' : product.curvaABC === 'B' ? 'secondary' : 'outline'} className="text-xs">
                            {product.curvaABC}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.currentStock < product.minStock && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <span className={product.currentStock < product.minStock ? 'font-bold text-warning' : ''}>
                            {product.currentStock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.minStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {product.stockOmie}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasDivergence ? (
                          <Badge variant={percentDiv > 20 ? 'destructive' : 'secondary'} className="text-xs font-mono">
                            {divergence > 0 ? '+' : ''}{divergence} ({percentDiv.toFixed(0)}%)
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {filteredProducts.length} produto(s) encontrado(s)
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
