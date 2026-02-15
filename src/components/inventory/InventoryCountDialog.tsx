import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryContext } from '@/contexts/InventoryContext';
import { InventoryCount, InventoryCountItem } from '@/types/inventory';
import { AlertTriangle, Check, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  count: InventoryCount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryCountDialog({ count, open, onOpenChange }: Props) {
  const { updateInventoryCount, finalizeInventoryCount, applyInventoryAdjustments, cancelInventoryCount, startInventoryCount } = useInventoryContext();
  const { toast } = useToast();
  const [localItems, setLocalItems] = useState<InventoryCountItem[]>(count.items);
  const [isSecondCount, setIsSecondCount] = useState(false);

  const isBlind = count.method === 'CONTAGEM_CEGA' || count.method === 'RASTREABILIDADE_COMPLETA';
  const isDupla = count.method === 'DUPLA_CONFERENCIA';
  const isFinalized = count.status === 'CONTAGEM_FINALIZADA';
  const isAdjusted = count.status === 'AJUSTADO';
  const isActive = count.status === 'EM_ANDAMENTO' || count.status === 'PLANEJADO';

  const handleQtyChange = (idx: number, value: string) => {
    const qty = value === '' ? undefined : Number(value);
    setLocalItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      if (isDupla && isSecondCount) {
        return { ...item, secondCountQty: qty, status: qty !== undefined ? 'CONTADO' : 'PENDENTE' };
      }
      return { ...item, countedQty: qty, status: qty !== undefined ? 'CONTADO' : 'PENDENTE' };
    }));
  };

  const handleCauseChange = (idx: number, value: string) => {
    setLocalItems(prev => prev.map((item, i) => i === idx ? { ...item, causeAnalysis: value } : item));
  };

  const handleSave = () => {
    updateInventoryCount(count.id, { items: localItems });
    toast({ title: 'Contagem salva' });
  };

  const handleStart = () => {
    startInventoryCount(count.id);
    toast({ title: 'Contagem iniciada' });
  };

  const handleFinalize = () => {
    updateInventoryCount(count.id, { items: localItems });
    finalizeInventoryCount(count.id);
    toast({ title: 'Contagem finalizada', description: 'Verifique as divergências e aplique os ajustes se necessário.' });
    onOpenChange(false);
  };

  const handleApplyAdjustments = () => {
    applyInventoryAdjustments(count.id);
    toast({ title: 'Ajustes aplicados', description: 'O estoque foi atualizado com base na contagem.' });
    onOpenChange(false);
  };

  const handleCancel = () => {
    cancelInventoryCount(count.id);
    toast({ title: 'Contagem cancelada' });
    onOpenChange(false);
  };

  const countedCount = localItems.filter(i => i.countedQty !== undefined).length;
  const divergentCount = count.items.filter(i => i.status === 'DIVERGENTE').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{count.code} - {count.name}</span>
            <Badge variant={isFinalized ? 'default' : isAdjusted ? 'secondary' : 'outline'}>
              {count.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Método: {count.method.replace(/_/g, ' ')}</span>
            <span>Itens: {localItems.length}</span>
            <span>Contados: {countedCount}/{localItems.length}</span>
            {isFinalized && <span className="text-destructive font-medium">Divergentes: {divergentCount}</span>}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isDupla && isActive && (
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant={!isSecondCount ? 'default' : 'outline'} onClick={() => setIsSecondCount(false)}>
                1ª Contagem
              </Button>
              <Button size="sm" variant={isSecondCount ? 'default' : 'outline'} onClick={() => setIsSecondCount(true)}>
                2ª Contagem
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Descrição</TableHead>
                {(!isBlind || isFinalized || isAdjusted) && <TableHead className="w-[90px] text-right">Esperado</TableHead>}
                {(!isBlind || isFinalized || isAdjusted) && <TableHead className="w-[90px] text-right">OMIE</TableHead>}
                <TableHead className="w-[100px] text-right">
                  {isDupla && isSecondCount ? '2ª Contagem' : 'Qtd Contada'}
                </TableHead>
                {isDupla && (isFinalized || isAdjusted) && <TableHead className="w-[90px] text-right">2ª Cont.</TableHead>}
                {(isFinalized || isAdjusted) && <TableHead className="w-[90px] text-right">Divergência</TableHead>}
                {count.method === 'RASTREABILIDADE_COMPLETA' && (isFinalized || isAdjusted) && (
                  <TableHead className="w-[160px]">Causa</TableHead>
                )}
                <TableHead className="w-[60px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localItems.map((item, idx) => {
                const showItem = isFinalized || isAdjusted ? count.items[idx] : item;
                return (
                  <TableRow key={item.productId} className={showItem?.status === 'DIVERGENTE' ? 'bg-destructive/5' : ''}>
                    <TableCell className="text-xs font-mono">{item.productCode}</TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{item.productDescription}</TableCell>
                    {(!isBlind || isFinalized || isAdjusted) && (
                      <TableCell className="text-right text-xs">{item.expectedQty}</TableCell>
                    )}
                    {(!isBlind || isFinalized || isAdjusted) && (
                      <TableCell className="text-right text-xs text-muted-foreground">{item.expectedQtyOmie}</TableCell>
                    )}
                    <TableCell className="text-right">
                      {isActive ? (
                        <Input
                          type="number"
                          min={0}
                          className="h-7 w-20 text-xs text-right ml-auto"
                          value={isDupla && isSecondCount ? (item.secondCountQty ?? '') : (item.countedQty ?? '')}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                        />
                      ) : (
                        <span className="text-xs">{item.countedQty ?? '-'}</span>
                      )}
                    </TableCell>
                    {isDupla && (isFinalized || isAdjusted) && (
                      <TableCell className="text-right text-xs">{showItem?.secondCountQty ?? '-'}</TableCell>
                    )}
                    {(isFinalized || isAdjusted) && (
                      <TableCell className="text-right">
                        {showItem?.divergence !== undefined && showItem.divergence !== 0 ? (
                          <span className={`text-xs font-medium ${showItem.divergence > 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {showItem.divergence > 0 ? '+' : ''}{showItem.divergence} ({showItem.divergencePercent?.toFixed(1)}%)
                          </span>
                        ) : (
                          <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />
                        )}
                      </TableCell>
                    )}
                    {count.method === 'RASTREABILIDADE_COMPLETA' && (isFinalized || isAdjusted) && (
                      <TableCell>
                        {showItem?.status === 'DIVERGENTE' && !isAdjusted ? (
                          <Textarea
                            className="h-7 text-xs min-h-0 resize-none"
                            placeholder="Causa..."
                            value={item.causeAnalysis || ''}
                            onChange={(e) => handleCauseChange(idx, e.target.value)}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{showItem?.causeAnalysis || '-'}</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant={
                          showItem?.status === 'DIVERGENTE' ? 'destructive' :
                          showItem?.status === 'AJUSTADO' ? 'default' :
                          showItem?.status === 'CONTADO' ? 'secondary' : 'outline'
                        }
                        className="text-[10px] h-5"
                      >
                        {showItem?.status || item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex-row gap-2 justify-between sm:justify-between">
          <div className="flex gap-2">
            {count.status === 'PLANEJADO' && (
              <Button onClick={handleStart}>Iniciar Contagem</Button>
            )}
            {isActive && count.status === 'EM_ANDAMENTO' && (
              <>
                <Button variant="outline" onClick={handleSave}>Salvar Progresso</Button>
                <Button onClick={handleFinalize} disabled={countedCount === 0}>Finalizar Contagem</Button>
              </>
            )}
            {isFinalized && (
              <Button onClick={handleApplyAdjustments} disabled={divergentCount === 0}>
                Aplicar Ajustes ({divergentCount})
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {(isActive || count.status === 'PLANEJADO') && (
              <Button variant="destructive" size="sm" onClick={handleCancel}>Cancelar</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
