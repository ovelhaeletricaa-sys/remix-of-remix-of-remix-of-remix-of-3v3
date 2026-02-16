import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, GripVertical, Eye } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Alert, AlertKanbanStatus } from '@/types/inventory';
import { ALERT_KANBAN_COLUMNS } from '@/types/inventory';

const COLUMN_STYLES: Record<AlertKanbanStatus, { bg: string; border: string; headerBg: string }> = {
  NOVO: { bg: 'bg-info/5', border: 'border-info/20', headerBg: 'bg-info/10' },
  EM_ANALISE: { bg: 'bg-warning/5', border: 'border-warning/20', headerBg: 'bg-warning/10' },
  ACAO_NECESSARIA: { bg: 'bg-destructive/5', border: 'border-destructive/20', headerBg: 'bg-destructive/10' },
  AGUARDANDO: { bg: 'bg-muted/30', border: 'border-border', headerBg: 'bg-muted/50' },
  RESOLVIDO: { bg: 'bg-success/5', border: 'border-success/20', headerBg: 'bg-success/10' },
};

export default function Alertas() {
  const { alerts, markAlertAsRead, clearAlert, updateAlertStatus } = useInventoryContext();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'LOW_STOCK': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'DAMAGE': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'LOSS': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'OMIE_DIVERGENCE': return <AlertTriangle className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK': return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Sem Estoque</Badge>;
      case 'LOW_STOCK': return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Estoque Baixo</Badge>;
      case 'DAMAGE': return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Avaria</Badge>;
      case 'LOSS': return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Perda</Badge>;
      case 'OMIE_DIVERGENCE': return <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Diverg. OMIE</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Alerta</Badge>;
    }
  };

  const handleDragStart = (e: React.DragEvent, alertId: string) => {
    setDraggedId(alertId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: AlertKanbanStatus) => {
    e.preventDefault();
    if (draggedId) {
      updateAlertStatus(draggedId, targetStatus);
      if (targetStatus === 'RESOLVIDO') {
        markAlertAsRead(draggedId);
      }
    }
    setDraggedId(null);
  };

  const handleMoveAlert = (alertId: string, targetStatus: AlertKanbanStatus) => {
    updateAlertStatus(alertId, targetStatus);
    if (targetStatus === 'RESOLVIDO') {
      markAlertAsRead(alertId);
    }
  };

  const columnCounts = ALERT_KANBAN_COLUMNS.map(col => ({
    ...col,
    count: alerts.filter(a => (a.kanbanStatus || 'NOVO') === col.value).length,
  }));

  return (
    <AppLayout title="Alertas" subtitle="Gestão visual de alertas e notificações">
      <div className="space-y-4">
        {/* Summary Row */}
        <div className="grid gap-3 md:grid-cols-5">
          {columnCounts.map(col => (
            <Card key={col.value} className="p-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                <span className="text-lg font-bold">{col.count}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-success" />
              <h3 className="mt-4 text-lg font-semibold">Tudo em ordem!</h3>
              <p className="text-muted-foreground">Não há alertas no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-5">
            {ALERT_KANBAN_COLUMNS.map(col => {
              const style = COLUMN_STYLES[col.value];
              const columnAlerts = alerts.filter(a => (a.kanbanStatus || 'NOVO') === col.value);

              return (
                <div
                  key={col.value}
                  className={`rounded-lg border ${style.border} ${style.bg} min-h-[400px] flex flex-col`}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.value)}
                >
                  {/* Column Header */}
                  <div className={`rounded-t-lg px-3 py-2.5 ${style.headerBg}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                        {col.label}
                      </span>
                      <Badge variant="secondary" className="h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px]">
                        {columnAlerts.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Column Body */}
                  <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                      {columnAlerts.map(alert => (
                        <div
                          key={alert.id}
                          draggable
                          onDragStart={e => handleDragStart(e, alert.id)}
                          className={`group cursor-grab rounded-md border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                            draggedId === alert.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="mb-2 flex items-start gap-2">
                            <GripVertical className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                            {getAlertIcon(alert.type)}
                            <div className="flex-1 min-w-0">
                              {getAlertBadge(alert.type)}
                            </div>
                          </div>
                          <p className="text-xs font-medium leading-snug line-clamp-2">{alert.message}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-mono text-[10px] text-muted-foreground">{alert.productCode}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(alert.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>

                          {/* Quick actions */}
                          <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {col.value !== 'RESOLVIDO' && (
                              <>
                                {col.value === 'NOVO' && (
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleMoveAlert(alert.id, 'EM_ANALISE')}>
                                    Analisar
                                  </Button>
                                )}
                                {col.value === 'EM_ANALISE' && (
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleMoveAlert(alert.id, 'ACAO_NECESSARIA')}>
                                    Ação
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-success" onClick={() => handleMoveAlert(alert.id, 'RESOLVIDO')}>
                                  Resolver
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => clearAlert(alert.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
