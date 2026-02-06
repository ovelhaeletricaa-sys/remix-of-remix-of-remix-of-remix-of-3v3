import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Alertas() {
  const { alerts, markAlertAsRead, clearAlert } = useInventoryContext();

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const readAlerts = alerts.filter(a => a.isRead);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'DAMAGE':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'LOSS':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive">Sem Estoque</Badge>;
      case 'LOW_STOCK':
        return <Badge className="bg-warning text-warning-foreground">Estoque Baixo</Badge>;
      case 'DAMAGE':
        return <Badge className="bg-warning text-warning-foreground">Avaria</Badge>;
      case 'LOSS':
        return <Badge variant="destructive">Perda</Badge>;
      default:
        return <Badge variant="secondary">Alerta</Badge>;
    }
  };

  return (
    <AppLayout title="Alertas" subtitle="Notificações e avisos do sistema">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Bell className="h-4 w-4" />
                Total de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Não Lidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{unreadAlerts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                Lidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{readAlerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Unread Alerts */}
        {unreadAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas Não Lidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unreadAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 rounded-lg border border-warning/20 bg-warning/5 p-4"
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {getAlertBadge(alert.type)}
                        <span className="font-mono text-sm text-muted-foreground">
                          {alert.productCode}
                        </span>
                      </div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAlertAsRead(alert.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Marcar como lido
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => clearAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Read Alerts */}
        {readAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5" />
                Alertas Lidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 rounded-lg bg-muted/30 p-4"
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {getAlertBadge(alert.type)}
                        <span className="font-mono text-sm text-muted-foreground">
                          {alert.productCode}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{alert.message}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => clearAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-success" />
              <h3 className="mt-4 text-lg font-semibold">Tudo em ordem!</h3>
              <p className="text-muted-foreground">Não há alertas no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
