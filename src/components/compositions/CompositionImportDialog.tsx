import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, Download, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/inventory';
import type { Composition, CompositionItem } from '@/types/composition';

interface CompositionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCompositions: Composition[];
  products: Product[];
  onImport: (compositions: Omit<Composition, 'id' | 'createdAt' | 'updatedAt'>[], updateExisting: boolean) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

interface ParsedComposition {
  code: string;
  name: string;
  items: {
    code: string;
    description: string;
    quantity: number;
    unit: string;
    productId?: string;
    found: boolean;
  }[];
  status: 'new' | 'update';
}

interface ColumnMapping {
  productCode: string;
  productName: string;
  itemCode: string;
  itemName: string;
  itemQty: string;
  itemUnit: string;
}

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  productCode: 'Código do Produto Acabado *',
  productName: 'Descrição do Produto Acabado *',
  itemCode: 'Código do Item/Insumo *',
  itemName: 'Descrição do Item/Insumo *',
  itemQty: 'Quantidade do Item',
  itemUnit: 'Unidade do Item',
};

function autoDetectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { productCode: '', productName: '', itemCode: '', itemName: '', itemQty: '', itemUnit: '' };

  for (const col of headers) {
    const norm = col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Product (finished good) columns
    if (/cod(igo)?.*prod(uto)?/.test(norm) && !norm.includes('item') && !mapping.productCode) {
      mapping.productCode = col;
    } else if (/desc(ri(cao|cão)?)?.*prod(uto)?/.test(norm) && !norm.includes('item') && !mapping.productName) {
      mapping.productName = col;
    }
    // Item/component columns  
    else if (/cod(igo)?.*item|cod(igo)?.*insumo|cod(igo)?.*componente/.test(norm) && !mapping.itemCode) {
      mapping.itemCode = col;
    } else if (/desc(ri(cao|cão)?)?.*item|desc(ri(cao|cão)?)?.*insumo/.test(norm) && !mapping.itemName) {
      mapping.itemName = col;
    }
    // Quantity
    else if (/quantidade.*item|qtd.*item|quantidade/.test(norm) && !mapping.itemQty) {
      mapping.itemQty = col;
    }
    // Unit
    else if (/unidade.*item|un.*item/.test(norm) && !mapping.itemUnit) {
      mapping.itemUnit = col;
    }
  }

  return mapping;
}

function inferUnit(raw?: string): string {
  if (!raw) return 'UN';
  const u = raw.trim().toUpperCase();
  const map: Record<string, string> = {
    'UNIDADE': 'UN', 'UND': 'UN', 'UN': 'UN', 'PÇ': 'UN', 'PC': 'UN',
    'METRO': 'M', 'MT': 'M', 'M': 'M',
    'QUILO': 'KG', 'KG': 'KG',
    'LITRO': 'L', 'LT': 'L', 'L': 'L',
    'CAIXA': 'CX', 'CX': 'CX',
    'PACOTE': 'PCT', 'PCT': 'PCT',
  };
  return map[u] || 'UN';
}

export function CompositionImportDialog({ open, onOpenChange, existingCompositions, products, onImport }: CompositionImportDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ productCode: '', productName: '', itemCode: '', itemName: '', itemQty: '', itemUnit: '' });
  const [parsedCompositions, setParsedCompositions] = useState<ParsedComposition[]>([]);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState({ added: 0, updated: 0, totalItems: 0 });

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRawData([]);
    setFileName('');
    setMapping({ productCode: '', productName: '', itemCode: '', itemName: '', itemQty: '', itemUnit: '' });
    setParsedCompositions([]);
    setExpandedCodes(new Set());
    setProgress(0);
    setImportResult({ added: 0, updated: 0, totalItems: 0 });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Código do Produto': 'PROD-001', 'Descrição do Produto': 'Mesa Industrial', 'Código do Item': 'INS-001', 'Descrição do Item': 'Parafuso M6', 'Quantidade do Item': 12, 'Unidade do Item': 'UN' },
      { 'Código do Produto': 'PROD-001', 'Descrição do Produto': 'Mesa Industrial', 'Código do Item': 'INS-002', 'Descrição do Item': 'Chapa de Aço 2mm', 'Quantidade do Item': 2, 'Unidade do Item': 'M2' },
      { 'Código do Produto': 'PROD-002', 'Descrição do Produto': 'Painel Elétrico', 'Código do Item': 'INS-003', 'Descrição do Item': 'Disjuntor 20A', 'Quantidade do Item': 4, 'Unidade do Item': 'UN' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 18 }, { wch: 25 }, { wch: 18 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo BOM');
    XLSX.writeFile(wb, 'modelo-importacao-composicoes.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

        if (json.length === 0) {
          toast({ title: 'Planilha vazia', description: 'A planilha não contém dados.', variant: 'destructive' });
          return;
        }

        const cols = Object.keys(json[0]);
        setHeaders(cols);
        setRawData(json);
        setMapping(autoDetectColumns(cols));
        setStep('mapping');
      } catch {
        toast({ title: 'Erro ao ler arquivo', description: 'Formato não suportado. Use .xlsx, .xls ou .csv.', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleProcessMapping = () => {
    if (!mapping.productCode || !mapping.productName || !mapping.itemCode || !mapping.itemName) {
      toast({ title: 'Mapeamento incompleto', description: 'Código e Descrição do Produto Acabado e do Item são obrigatórios.', variant: 'destructive' });
      return;
    }

    const existingCodes = new Set(existingCompositions.map(c => c.code.toUpperCase()));
    const productsByCode = new Map(products.map(p => [p.code.toUpperCase(), p]));

    // Group rows by product code
    const groups = new Map<string, ParsedComposition>();

    for (const row of rawData) {
      const prodCode = String(row[mapping.productCode] || '').trim();
      const prodName = String(row[mapping.productName] || '').trim();
      const itemCode = String(row[mapping.itemCode] || '').trim();
      const itemName = String(row[mapping.itemName] || '').trim();

      if (!prodCode || !itemCode) continue;

      const key = prodCode.toUpperCase();
      if (!groups.has(key)) {
        groups.set(key, {
          code: prodCode,
          name: prodName || prodCode,
          items: [],
          status: existingCodes.has(key) ? 'update' : 'new',
        });
      }

      const group = groups.get(key)!;
      // Update name if we get a non-empty one
      if (prodName && group.name === group.code) group.name = prodName;

      const rawQty = mapping.itemQty ? String(row[mapping.itemQty] || '1') : '1';
      const qty = parseFloat(rawQty.replace(',', '.')) || 1;
      const rawUnit = mapping.itemUnit ? String(row[mapping.itemUnit] || '') : '';

      const matchedProduct = productsByCode.get(itemCode.toUpperCase());

      group.items.push({
        code: itemCode,
        description: itemName || (matchedProduct?.description ?? itemCode),
        quantity: qty,
        unit: matchedProduct?.unit || inferUnit(rawUnit),
        productId: matchedProduct?.id,
        found: !!matchedProduct,
      });
    }

    const result = Array.from(groups.values());
    if (result.length === 0) {
      toast({ title: 'Nenhuma composição detectada', description: 'Verifique o mapeamento de colunas.', variant: 'destructive' });
      return;
    }

    setParsedCompositions(result);
    setStep('preview');
  };

  const handleImport = () => {
    setStep('importing');
    const comps = parsedCompositions;
    let added = 0, updated = 0, totalItems = 0;

    const toImport: Omit<Composition, 'id' | 'createdAt' | 'updatedAt'>[] = comps.map((comp, i) => {
      if (comp.status === 'new') added++; else updated++;
      totalItems += comp.items.length;
      setTimeout(() => setProgress(Math.round(((i + 1) / comps.length) * 100)), i * 10);

      const items: CompositionItem[] = comp.items.map(item => ({
        productId: item.productId || `unregistered_${item.code}`,
        productCode: item.code,
        productDescription: item.description,
        quantity: item.quantity,
        unit: item.unit,
      }));

      return {
        code: comp.code,
        name: comp.name,
        description: '',
        items,
        isActive: true,
      };
    });

    setTimeout(() => {
      onImport(toImport, true);
      setImportResult({ added, updated, totalItems });
      setProgress(100);
      setStep('done');
    }, Math.min(comps.length * 10 + 200, 2000));
  };

  const toggleExpand = (code: string) => {
    setExpandedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const newCount = parsedCompositions.filter(c => c.status === 'new').length;
  const updateCount = parsedCompositions.filter(c => c.status === 'update').length;
  const totalItems = parsedCompositions.reduce((s, c) => s + c.items.length, 0);
  const unregisteredItems = parsedCompositions.reduce((s, c) => s + c.items.filter(i => !i.found).length, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Composições (BOM) da Planilha
          </DialogTitle>
        </DialogHeader>

        {/* Upload */}
        {step === 'upload' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-muted p-6">
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">Selecione a planilha de estrutura de produtos</p>
              <p className="text-sm text-muted-foreground">O sistema agrupa automaticamente os itens por Produto Acabado</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            <div className="flex gap-3">
              <Button size="lg" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Escolher Arquivo
              </Button>
              <Button size="lg" variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Baixar Modelo
              </Button>
            </div>
          </div>
        )}

        {/* Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm"><span className="font-medium">{fileName}</span> — {rawData.length} linhas encontradas</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Mapeie as colunas da planilha. Campos com * são obrigatórios. O sistema agrupará automaticamente as linhas pelo Código do Produto Acabado.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map(field => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{FIELD_LABELS[field]}</Label>
                  <Select
                    value={mapping[field] || '_none'}
                    onValueChange={v => setMapping(m => ({ ...m, [field]: v === '_none' ? '' : v }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Não mapear" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Não mapear —</SelectItem>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button onClick={handleProcessMapping}>Processar</Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">{newCount} novas</Badge>
              <Badge variant="secondary">{updateCount} atualizações</Badge>
              <Badge variant="outline">{totalItems} itens total</Badge>
              {unregisteredItems > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {unregisteredItems} itens sem cadastro
                </Badge>
              )}
            </div>

            <ScrollArea className="h-[350px] rounded-lg border">
              <div className="p-2 space-y-1">
                {parsedCompositions.map(comp => {
                  const expanded = expandedCodes.has(comp.code);
                  const unregCount = comp.items.filter(i => !i.found).length;
                  return (
                    <div key={comp.code} className="border rounded-lg">
                      <button
                        className="flex w-full items-center gap-2 p-3 text-left text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpand(comp.code)}
                      >
                        {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <span className="font-mono font-medium">{comp.code}</span>
                        <span className="truncate flex-1 text-muted-foreground">{comp.name}</span>
                        <Badge variant="outline" className="text-xs">{comp.items.length} itens</Badge>
                        {unregCount > 0 && (
                          <Badge variant="destructive" className="text-xs">{unregCount} s/ cadastro</Badge>
                        )}
                        {comp.status === 'new'
                          ? <Badge className="text-xs">Nova</Badge>
                          : <Badge variant="secondary" className="text-xs">Atualizar</Badge>
                        }
                      </button>
                      {expanded && (
                        <div className="border-t px-3 pb-2">
                          <table className="w-full text-xs mt-1">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="py-1 text-left font-medium">Código</th>
                                <th className="py-1 text-left font-medium">Descrição</th>
                                <th className="py-1 text-right font-medium">Qtd</th>
                                <th className="py-1 text-center font-medium">Un</th>
                                <th className="py-1 text-center font-medium">Cadastro</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comp.items.map((item, idx) => (
                                <tr key={idx} className={!item.found ? 'text-destructive' : ''}>
                                  <td className="py-1 font-mono">{item.code}</td>
                                  <td className="py-1 max-w-[200px] truncate">{item.description}</td>
                                  <td className="py-1 text-right">{item.quantity}</td>
                                  <td className="py-1 text-center">{item.unit}</td>
                                  <td className="py-1 text-center">
                                    {item.found
                                      ? <Check className="h-3 w-3 text-success inline" />
                                      : <AlertTriangle className="h-3 w-3 text-destructive inline" />
                                    }
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {unregisteredItems > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Itens sem cadastro serão importados com os dados da planilha. Você pode cadastrá-los depois em Produtos.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
              <Button onClick={handleImport} disabled={parsedCompositions.length === 0}>
                <Check className="mr-2 h-4 w-4" />
                Importar {parsedCompositions.length} composição(ões)
              </Button>
            </div>
          </div>
        )}

        {/* Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <FileSpreadsheet className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-lg font-medium">Importando composições...</p>
            <Progress value={progress} className="w-full max-w-sm" />
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Importação concluída!</p>
            <div className="flex gap-3">
              {importResult.added > 0 && <Badge>{importResult.added} novas</Badge>}
              {importResult.updated > 0 && <Badge variant="secondary">{importResult.updated} atualizadas</Badge>}
              <Badge variant="outline">{importResult.totalItems} itens processados</Badge>
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
