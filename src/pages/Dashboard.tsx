import { 
  Package, 
  ArrowRightLeft, 
  AlertTriangle, 
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['hsl(220, 70%, 45%)', 'hsl(35, 90%, 50%)', 'hsl(142, 70%, 40%)', 'hsl(0, 72%, 51%)', 'hsl(200, 80%, 50%)'];

export default function Dashboard() {
  const { getDashboardStats, movements, products, alerts } = useInventoryContext();
  const stats = getDashboardStats();

  // Prepare movement data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const movementsByDay = last7Days.map(date => {
    const dayMovements = movements.filter(m => m.date === date);
    return {
      date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      entradas: dayMovements.filter(m => m.type === 'ENTRADA').length,
      saidas: dayMovements.filter(m => m.type === 'SAIDA').length,
    };
  });

  // Prepare movement type distribution
  const movementTypes = [
    { name: 'Entradas', value: movements.filter(m => m.type === 'ENTRADA').length },
    { name: 'Saídas', value: movements.filter(m => m.type === 'SAIDA').length },
    { name: 'Devoluções', value: movements.filter(m => m.type === 'DEVOLUCAO').length },
    { name: 'Avarias', value: movements.filter(m => m.type === 'AVARIA').length },
    { name: 'Perdas', value: movements.filter(m => m.type === 'PERDA').length },
  ].filter(t => t.value > 0);

  // Products with low stock
  const lowStockProducts = products.filter(p => p.currentStock < p.minStock);

  // Recent alerts
  const recentAlerts = alerts.slice(0, 5);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do estoque">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              itens cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Movimentações Hoje
            </CardTitle>
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.movementsToday}</div>
            <p className="text-xs text-muted-foreground">
              entradas e saídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Ativos
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockProducts} produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Endereços
            </CardTitle>
            <MapPin className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">
              localizações no armazém
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Movements Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimentações - Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 70%, 40%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Movement Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={movementTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {movementTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Todos os produtos estão com estoque adequado</span>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="font-mono text-sm font-medium">{product.code}</p>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">{product.currentStock}</p>
                      <p className="text-xs text-muted-foreground">mín: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-warning" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Nenhum alerta no momento</span>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`flex items-start gap-3 rounded-lg p-3 ${
                      alert.isRead ? 'bg-muted/30' : 'bg-warning/10 border border-warning/20'
                    }`}
                  >
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'OUT_OF_STOCK' ? 'text-destructive' : 'text-warning'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
