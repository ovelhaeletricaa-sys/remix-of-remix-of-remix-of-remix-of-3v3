import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { InventorySuggestion } from '@/types/inventory';
import { AlertTriangle, Clock, TrendingUp, MapPin } from 'lucide-react';

const REASON_CONFIG: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  CURVA_A: { label: 'Curva A - Contagem periódica', icon: TrendingUp, color: 'text-orange-500' },
  TEMPO_SEM_CONTAGEM: { label: 'Tempo sem contagem', icon: Clock, color: 'text-blue-500' },
  DIVERGENCIA_HISTORICA: { label: 'Divergência histórica', icon: AlertTriangle, color: 'text-red-500' },
  SETOR_CRITICO: { label: 'Setor crítico', icon: MapPin, color: 'text-purple-500' },
};

const PRIORITY_VARIANT: Record<string, 'destructive' | 'default' | 'secondary'> = {
  ALTA: 'destructive',
  MEDIA: 'default',
  BAIXA: 'secondary',
};

interface Props {
  onStartCount: (productIds: string[]) => void;
}

export function InventorySuggestions({ onStartCount }: Props) {
  const { getInventorySuggestions } = useInventoryContext();
  const suggestions = getInventorySuggestions();

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <TrendingUp className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium">Nenhuma sugestão de contagem no momento</p>
        <p className="text-xs mt-1">Todos os produtos estão em dia com as contagens</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{suggestions.length} sugestão(ões) de contagem</p>
        <Button
          size="sm"
          onClick={() => onStartCount(suggestions.filter(s => s.priority === 'ALTA').map(s => s.productId))}
          disabled={!suggestions.some(s => s.priority === 'ALTA')}
        >
          Contar todos críticos
        </Button>
      </div>
      {suggestions.map((s) => {
        const config = REASON_CONFIG[s.reason];
        const Icon = config.icon;
        return (
          <Card key={s.productId} className="border-border/50">
            <CardContent className="flex items-center gap-4 py-3 px-4">
              <Icon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{s.productCode}</span>
                  <Badge variant={PRIORITY_VARIANT[s.priority]} className="text-[10px] h-5">
                    {s.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.productDescription}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
                {s.lastCountDate && (
                  <p className="text-[10px] text-muted-foreground/60">
                    Última contagem: {new Date(s.lastCountDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => onStartCount([s.productId])}>
                Contar
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
