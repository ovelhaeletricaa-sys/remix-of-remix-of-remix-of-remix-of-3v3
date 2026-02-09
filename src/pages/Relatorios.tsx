import { useState } from 'react';
import { BarChart3, TrendingUp, Users, MapPin, Target, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = [
  'hsl(220, 70%, 45%)', 'hsl(35, 90%, 50%)', 'hsl(142, 70%, 40%)',
  'hsl(0, 72%, 51%)', 'hsl(200, 80%, 50%)', 'hsl(280, 65%, 55%)',
  'hsl(160, 60%, 45%)', 'hsl(45, 85%, 55%)',
];

const ABC_COLORS = { A: 'hsl(142, 70%, 40%)', B: 'hsl(35, 90%, 50%)', C: 'hsl(220, 70%, 45%)' };

export default function Relatorios() {
  const { movements, products, collaborators } = useInventoryContext();
  const { abcAnalysis, collaboratorKPIs, purposeAnalysis, locationHeatData } = useAnalytics(products, movements);

  const exportToCSV = () => {
    const headers = ['Data', 'Hora', 'Tipo', 'Código', 'Produto', 'Qtd', 'Origem', 'Destino', 'Finalidade', 'Projeto', 'Colaborador'];
    const rows = movements.map(m => [
      m.date, m.time, m.type, m.productCode, m.productDescription,
      m.quantity, m.origin, m.destination, m.purpose, m.projectCode || '', m.collaborator,
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ABC chart data
  const abcChartData = abcAnalysis.slice(0, 20).map(item => ({
    name: item.product.code,
    quantidade: item.totalQuantity,
    acumulado: item.cumulativePercentage,
    curve: item.curve,
  }));

  // ABC summary
  const abcSummary = {
    A: abcAnalysis.filter(a => a.curve === 'A'),
    B: abcAnalysis.filter(a => a.curve === 'B'),
    C: abcAnalysis.filter(a => a.curve === 'C'),
  };

  // Collaborator chart data
  const collabChartData = collaboratorKPIs.map(k => ({
    name: k.name,
    movimentacoes: k.totalMovements,
    quantidade: k.totalQuantity,
  }));

  // Purpose pie data
  const purposeChartData = purposeAnalysis.map(p => ({
    name: p.projectCode || p.purpose,
    value: p.totalMovements,
  }));

  return (
    <AppLayout title="Relatórios & Análises" subtitle="Curva ABC, KPIs e análise de utilização">
      <div className="mb-4 flex justify-end">
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Tabs defaultValue="abc">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="abc" className="gap-1.5">
            <Target className="h-4 w-4" />
            Curva ABC
          </TabsTrigger>
          <TabsTrigger value="collaborators" className="gap-1.5">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="purposes" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Finalidades
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            Mapa de Calor
          </TabsTrigger>
        </TabsList>

        {/* ABC CURVE */}
        <TabsContent value="abc">
          <div className="space-y-6">
            {/* ABC Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {(['A', 'B', 'C'] as const).map(curve => (
                <Card key={curve}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>Classe {curve}</span>
                      <Badge style={{ backgroundColor: ABC_COLORS[curve] }} className="text-white text-lg px-3">
                        {curve}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{abcSummary[curve].length}</div>
                    <p className="text-sm text-muted-foreground">
                      produtos ({abcSummary[curve].length > 0
                        ? `${abcSummary[curve].reduce((s, a) => s + a.percentage, 0).toFixed(1)}% do volume`
                        : '0%'})
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {curve === 'A' && '~80% da movimentação'}
                      {curve === 'B' && '~15% da movimentação'}
                      {curve === 'C' && '~5% da movimentação'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ABC Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Curva ABC - Top 20 Produtos</CardTitle>
                <CardDescription>Quantidade movimentada por produto com percentual acumulado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={abcChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={60} />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                        {abcChartData.map((entry, index) => (
                          <Cell key={index} fill={ABC_COLORS[entry.curve as 'A' | 'B' | 'C']} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ABC Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento da Curva ABC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Classe</TableHead>
                        <TableHead className="text-right">Qtd Total</TableHead>
                        <TableHead className="text-right">Movim.</TableHead>
                        <TableHead className="text-right">% Individual</TableHead>
                        <TableHead className="text-right">% Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abcAnalysis.slice(0, 30).map((item, i) => (
                        <TableRow key={item.product.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono font-medium">{item.product.code}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.product.description}</TableCell>
                          <TableCell className="text-center">
                            <Badge style={{ backgroundColor: ABC_COLORS[item.curve] }} className="text-white">
                              {item.curve}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.totalQuantity}</TableCell>
                          <TableCell className="text-right">{item.totalMovements}</TableCell>
                          <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-right font-medium">{item.cumulativePercentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* COLLABORATORS KPI */}
        <TabsContent value="collaborators">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Colaborador</CardTitle>
                <CardDescription>KPIs operacionais individuais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collabChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="movimentacoes" name="Movimentações" fill="hsl(220, 70%, 45%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Colaborador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Devoluções</TableHead>
                        <TableHead className="text-right">Avarias</TableHead>
                        <TableHead className="text-right">Perdas</TableHead>
                        <TableHead className="text-right">Qtd Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collaboratorKPIs.map(kpi => (
                        <TableRow key={kpi.name}>
                          <TableCell className="font-medium">{kpi.name}</TableCell>
                          <TableCell className="text-right font-bold">{kpi.totalMovements}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={kpi.percentage > 35 ? 'destructive' : 'secondary'}>
                              {kpi.percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-success">{kpi.entradas}</TableCell>
                          <TableCell className="text-right text-destructive">{kpi.saidas}</TableCell>
                          <TableCell className="text-right">{kpi.devolucoes}</TableCell>
                          <TableCell className="text-right text-warning">{kpi.avarias}</TableCell>
                          <TableCell className="text-right text-destructive">{kpi.perdas}</TableCell>
                          <TableCell className="text-right font-medium">{kpi.totalQuantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {collaboratorKPIs.some(k => k.percentage > 35) && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <p className="text-sm font-medium text-warning">⚠️ Concentração de Operador Detectada</p>
                    <p className="text-sm text-muted-foreground">
                      Um colaborador concentra mais de 35% das operações. Considere balancear a carga de trabalho.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PURPOSES / PROJECTS */}
        <TabsContent value="purposes">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Finalidade/Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={purposeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`}
                        >
                          {purposeChartData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento por Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {purposeAnalysis.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                        <div>
                          <p className="font-medium text-sm">
                            {item.projectCode || item.purpose}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.products.length} produto(s) · {item.totalQuantity} un. total
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{item.totalMovements}</p>
                          <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* HEAT MAP */}
        <TabsContent value="heatmap">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Calor - Utilização de Endereços</CardTitle>
                <CardDescription>Áreas mais acessadas do armazém baseado em movimentações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {locationHeatData.slice(0, 25).map((loc, i) => {
                    const intensity = loc.intensity;
                    const bgColor = intensity > 70
                      ? 'bg-destructive/80 text-destructive-foreground'
                      : intensity > 40
                        ? 'bg-warning/60 text-warning-foreground'
                        : intensity > 15
                          ? 'bg-primary/30 text-foreground'
                          : 'bg-muted text-muted-foreground';

                    return (
                      <div
                        key={i}
                        className={`rounded-lg p-3 text-center transition-all ${bgColor}`}
                      >
                        <p className="font-mono text-sm font-bold">
                          STNT{loc.shelf}
                        </p>
                        <p className="text-xs">PRAT{loc.rack}</p>
                        <p className="mt-1 text-lg font-bold">{loc.movementCount}</p>
                        <p className="text-xs">mov.</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Intensidade:</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 rounded bg-muted" /> Baixa
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 rounded bg-primary/30" /> Média
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 rounded bg-warning/60" /> Alta
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 rounded bg-destructive/80" /> Crítica
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking de Endereços</CardTitle>
                <CardDescription>Endereços ordenados por volume de movimentação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead className="text-right">Movimentações</TableHead>
                        <TableHead className="text-right">Qtd Total</TableHead>
                        <TableHead className="text-right">Intensidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationHeatData.slice(0, 15).map((loc, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono font-medium">
                            STNT{loc.shelf}-PRAT{loc.rack}
                          </TableCell>
                          <TableCell className="text-right">{loc.movementCount}</TableCell>
                          <TableCell className="text-right">{loc.totalQuantity}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-16 rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-primary"
                                  style={{ width: `${loc.intensity}%` }}
                                />
                              </div>
                              <span className="text-xs">{loc.intensity.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
