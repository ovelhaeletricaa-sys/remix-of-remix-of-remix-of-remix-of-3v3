import { useState } from 'react';
import { MapPin, Plus, Package, Layers } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WarehouseLocation } from '@/types/inventory';

export default function Armazem() {
  const { locations, products, addLocation } = useInventoryContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [formData, setFormData] = useState({
    shelf: '',
    rack: '',
    type: 'PICKING' as 'AEREO' | 'PICKING',
    description: '',
  });

  // Group locations by shelf
  const shelves = [...new Set(locations.map(l => l.shelf))].sort();

  // Get products for a location
  const getProductsForLocation = (location: WarehouseLocation) => {
    const locationCode = `${location.shelf}-${location.rack}`;
    return products.filter(p => p.location === locationCode);
  };

  const filteredLocations = selectedShelf === 'all' 
    ? locations 
    : locations.filter(l => l.shelf === selectedShelf);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation({
      ...formData,
      description: `Estante ${formData.shelf} - Prateleira ${formData.rack} (${formData.type === 'AEREO' ? 'Aéreo' : 'Picking'})`,
      products: [],
    });
    setIsDialogOpen(false);
    setFormData({
      shelf: '',
      rack: '',
      type: 'PICKING',
      description: '',
    });
  };

  return (
    <AppLayout title="Mapa do Armazém" subtitle="Estrutura de endereçamento e localização">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedShelf} onValueChange={setSelectedShelf}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Estantes</SelectItem>
                {shelves.map(shelf => (
                  <SelectItem key={shelf} value={shelf}>Estante {shelf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Endereço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Endereço</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shelf">Estante</Label>
                    <Input
                      id="shelf"
                      value={formData.shelf}
                      onChange={e => setFormData(f => ({ ...f, shelf: e.target.value.toUpperCase() }))}
                      placeholder="A, B, C..."
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rack">Prateleira</Label>
                    <Input
                      id="rack"
                      value={formData.rack}
                      onChange={e => setFormData(f => ({ ...f, rack: e.target.value }))}
                      placeholder="1, 2, 3..."
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Armazenagem</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'AEREO' | 'PICKING') => setFormData(f => ({ ...f, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AEREO">Aéreo (altura)</SelectItem>
                      <SelectItem value="PICKING">Picking (acesso fácil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Cadastrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs by storage type */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="PICKING">Picking</TabsTrigger>
            <TabsTrigger value="AEREO">Aéreo</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <LocationGrid locations={filteredLocations} getProducts={getProductsForLocation} />
          </TabsContent>
          <TabsContent value="PICKING" className="mt-4">
            <LocationGrid 
              locations={filteredLocations.filter(l => l.type === 'PICKING')} 
              getProducts={getProductsForLocation} 
            />
          </TabsContent>
          <TabsContent value="AEREO" className="mt-4">
            <LocationGrid 
              locations={filteredLocations.filter(l => l.type === 'AEREO')} 
              getProducts={getProductsForLocation} 
            />
          </TabsContent>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Total de Endereços
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{locations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="h-4 w-4" />
                Estantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{shelves.length}</div>
              <p className="text-sm text-muted-foreground">
                {shelves.join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="h-4 w-4" />
                Produtos Alocados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

interface LocationGridProps {
  locations: WarehouseLocation[];
  getProducts: (location: WarehouseLocation) => import('@/types/inventory').Product[];
}

function LocationGrid({ locations, getProducts }: LocationGridProps) {
  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Nenhum endereço encontrado</p>
      </div>
    );
  }

  // Group by shelf
  const grouped = locations.reduce((acc, loc) => {
    if (!acc[loc.shelf]) acc[loc.shelf] = [];
    acc[loc.shelf].push(loc);
    return acc;
  }, {} as Record<string, WarehouseLocation[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort().map(([shelf, locs]) => (
        <div key={shelf}>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {shelf}
            </div>
            Estante {shelf}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {locs.sort((a, b) => a.rack.localeCompare(b.rack)).map((location) => {
              const locationProducts = getProducts(location);
              return (
                <Card key={location.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-mono text-lg">
                        {location.shelf}-{location.rack}
                      </CardTitle>
                      <Badge variant={location.type === 'AEREO' ? 'secondary' : 'default'}>
                        {location.type === 'AEREO' ? 'Aéreo' : 'Picking'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {locationProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Vazio</p>
                    ) : (
                      <div className="space-y-1">
                        {locationProducts.slice(0, 3).map((product) => (
                          <div key={product.id} className="flex items-center justify-between text-sm">
                            <span className="truncate font-mono text-muted-foreground">
                              {product.code}
                            </span>
                            <span className="font-medium">{product.currentStock}</span>
                          </div>
                        ))}
                        {locationProducts.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{locationProducts.length - 3} produto(s)
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
