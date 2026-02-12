import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductCategory } from '@/types/inventory';
import { PRODUCT_CATEGORIES } from '@/types/inventory';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProducts: Product[];
  onImport: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

interface ParsedRow {
  code: string;
  description: string;
  category: ProductCategory;
  unit: string;
  minStock: number;
  currentStock: number;
  stockOmie: number;
  location: string;
  status: 'new' | 'update' | 'error';
  error?: string;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

const CATEGORY_KEYWORDS: Record<string, ProductCategory> = {
  'epi': 'EPI',
  'consumo': 'MATERIAL_USO_CONSUMO',
  'material': 'MATERIAL_USO_CONSUMO',
  'embalag': 'EMBALAGENS',
  'ferramenta': 'FERRAMENTAS',
  'equipamento': 'FERRAMENTAS',
  'adesivo': 'ADESIVOS',
  'lazer': 'PECAS_LAZER',
  'laser': 'PECAS_LAZER',
  'router': 'PECAS_ROUTER',
  'torno': 'PECAS_TORNO',
  'ferragem': 'FERRAGENS_FIXACOES',
  'fixaç': 'FERRAGENS_FIXACOES',
  'parafuso': 'FERRAGENS_FIXACOES',
  'porca': 'FERRAGENS_FIXACOES',
  'arruela': 'FERRAGENS_FIXACOES',
  'fio': 'FIOS_CABOS',
  'cabo': 'FIOS_CABOS',
  'fita': 'FITAS_ADESIVAS',
  'eletric': 'ELETRICA',
  'sensor': 'SENSORES',
  'motor': 'MOTORES',
};

function inferCategory(description: string, rawCategory?: string): ProductCategory {
  const text = (rawCategory || description || '').toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (text.includes(keyword)) return category;
  }
  return 'OUTROS';
}

function inferUnit(raw?: string): string {
  if (!raw) return 'UN';
  const u = raw.trim().toUpperCase();
  const map: Record<string, string> = {
    'UNIDADE': 'UN', 'UND': 'UN', 'UN': 'UN', 'PÇ': 'UN', 'PC': 'UN', 'PCS': 'UN',
    'METRO': 'M', 'MT': 'M', 'M': 'M', 'ML': 'M',
    'QUILO': 'KG', 'KG': 'KG',
    'LITRO': 'L', 'LT': 'L', 'L': 'L',
    'CAIXA': 'CX', 'CX': 'CX',
    'PACOTE': 'PCT', 'PCT': 'PCT', 'PAC': 'PCT',
    'ROLO': 'UN', 'RL': 'UN',
    'PAR': 'UN', 'PR': 'UN',
    'METRO²': 'M2', 'M2': 'M2', 'M²': 'M2',
  };
  return map[u] || 'UN';
}

export function ImportDialog({ open, onOpenChange, existingProducts, onImport }: ImportDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState({ added: 0, updated: 0, errors: 0 });

  // Column mapping
  const [mapping, setMapping] = useState<Record<string, string>>({
    code: '',
    description: '',
    category: '',
    unit: '',
    minStock: '',
    currentStock: '',
    stockOmie: '',
    location: '',
  });

  const FIELD_LABELS: Record<string, string> = {
    code: 'Código do Produto *',
    description: 'Descrição *',
    category: 'Categoria',
    unit: 'Unidade',
    minStock: 'Estoque Mínimo',
    currentStock: 'Estoque Atual',
    stockOmie: 'Estoque OMIE',
    location: 'Localização',
  };

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRawData([]);
    setFileName('');
    setParsedRows([]);
    setProgress(0);
    setMapping({ code: '', description: '', category: '', unit: '', minStock: '', currentStock: '', stockOmie: '', location: '' });
    setImportResult({ added: 0, updated: 0, errors: 0 });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Código': 'EX-001',
        'Descrição': 'Exemplo de produto',
        'Categoria': 'EPI',
        'Unidade': 'UN',
        'Estoque Mínimo': 10,
        'Estoque Atual': 25,
        'Estoque OMIE': 25,
        'Localização': 'A1-P1',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo-importacao-produtos.xlsx');
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
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

        if (json.length === 0) {
          toast({ title: 'Planilha vazia', description: 'A planilha não contém dados.', variant: 'destructive' });
          return;
        }

        const cols = Object.keys(json[0]);
        setHeaders(cols);
        setRawData(json);

        // Auto-map columns by guessing
        const autoMap: Record<string, string> = { code: '', description: '', category: '', unit: '', minStock: '', currentStock: '', stockOmie: '', location: '' };
        for (const col of cols) {
          const lower = col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (/codigo|code|cod|sku/.test(lower) && !autoMap.code) autoMap.code = col;
          else if (/descri|nome|produto|item/.test(lower) && !autoMap.description) autoMap.description = col;
          else if (/categ|tipo|grupo|class/.test(lower) && !autoMap.category) autoMap.category = col;
          else if (/unid|un\b|medida/.test(lower) && !autoMap.unit) autoMap.unit = col;
          else if (/min|segur/.test(lower) && !autoMap.minStock) autoMap.minStock = col;
          else if (/atual|saldo|estoque|qtd|quant|stock/.test(lower) && !autoMap.currentStock) autoMap.currentStock = col;
          else if (/omie|externo|erp|sistema/.test(lower) && !autoMap.stockOmie) autoMap.stockOmie = col;
          else if (/local|enderec|estante|prat/.test(lower) && !autoMap.location) autoMap.location = col;
        }
        setMapping(autoMap);
        setStep('mapping');
      } catch {
        toast({ title: 'Erro ao ler arquivo', description: 'Formato não suportado. Use .xlsx ou .xls.', variant: 'destructive' });
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleProcessMapping = () => {
    if (!mapping.code || !mapping.description) {
      toast({ title: 'Mapeamento incompleto', description: 'Código e Descrição são obrigatórios.', variant: 'destructive' });
      return;
    }

    const existingCodes = new Set(existingProducts.map(p => p.code.toUpperCase()));
    const rows: ParsedRow[] = rawData.map(row => {
      const code = String(row[mapping.code] || '').trim().toUpperCase();
      const description = String(row[mapping.description] || '').trim();

      if (!code || !description) {
        return { code, description, category: 'OUTROS' as ProductCategory, unit: 'UN', minStock: 0, currentStock: 0, stockOmie: 0, location: '', status: 'error' as const, error: 'Código ou descrição vazio' };
      }

      return {
        code,
        description,
        category: inferCategory(description, mapping.category ? String(row[mapping.category]) : undefined),
        unit: inferUnit(mapping.unit ? String(row[mapping.unit]) : undefined),
        minStock: mapping.minStock ? (parseInt(String(row[mapping.minStock])) || 0) : 5,
        currentStock: mapping.currentStock ? (parseInt(String(row[mapping.currentStock])) || 0) : 0,
        stockOmie: mapping.stockOmie ? (parseInt(String(row[mapping.stockOmie])) || 0) : 0,
        location: mapping.location ? String(row[mapping.location] || '').trim() : '',
        status: existingCodes.has(code) ? 'update' as const : 'new' as const,
      };
    }).filter(r => r.code || r.description); // Remove completely empty rows

    setParsedRows(rows);
    setStep('preview');
  };

  const handleImport = () => {
    setStep('importing');
    const validRows = parsedRows.filter(r => r.status !== 'error');
    let added = 0;
    let updated = 0;

    const productsToImport: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = validRows.map((row, i) => {
      if (row.status === 'new') added++;
      else updated++;

      // Simulate progress
      setTimeout(() => setProgress(Math.round(((i + 1) / validRows.length) * 100)), i * 10);

      return {
        code: row.code,
        description: row.description,
        category: row.category,
        unit: row.unit,
        minStock: row.minStock,
        currentStock: row.currentStock,
        stockOmie: row.stockOmie,
        location: row.location,
      };
    });

    // Execute import
    setTimeout(() => {
      onImport(productsToImport);
      setImportResult({ added, updated, errors: parsedRows.filter(r => r.status === 'error').length });
      setProgress(100);
      setStep('done');
    }, Math.min(validRows.length * 10 + 200, 2000));
  };

  const newCount = parsedRows.filter(r => r.status === 'new').length;
  const updateCount = parsedRows.filter(r => r.status === 'update').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Produtos da Planilha
          </DialogTitle>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-muted p-6">
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">Selecione uma planilha Excel</p>
              <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls, .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            <div className="flex gap-3">
              <Button size="lg" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Escolher Arquivo
              </Button>
              <Button size="lg" variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar Modelo
              </Button>
            </div>
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm"><span className="font-medium">{fileName}</span> — {rawData.length} linhas encontradas</p>
            </div>
            <p className="text-sm text-muted-foreground">Mapeie as colunas da planilha para os campos do sistema. Campos com * são obrigatórios.</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(FIELD_LABELS).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select value={mapping[field] || '_none'} onValueChange={v => setMapping(m => ({ ...m, [field]: v === '_none' ? '' : v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Não mapear" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Não mapear —</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
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

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="default">{newCount} novos</Badge>
              <Badge variant="secondary">{updateCount} atualizações</Badge>
              {errorCount > 0 && <Badge variant="destructive">{errorCount} erros</Badge>}
            </div>
            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="p-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">Status</th>
                      <th className="p-2">Código</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">Categoria</th>
                      <th className="p-2 text-right">Físico</th>
                      <th className="p-2 text-right">OMIE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 100).map((row, i) => (
                      <tr key={i} className={`border-b ${row.status === 'error' ? 'bg-destructive/5' : ''}`}>
                        <td className="p-2">
                          {row.status === 'new' && <Badge className="text-xs">Novo</Badge>}
                          {row.status === 'update' && <Badge variant="secondary" className="text-xs">Atualizar</Badge>}
                          {row.status === 'error' && (
                            <Badge variant="destructive" className="text-xs" title={row.error}>
                              <X className="mr-1 h-3 w-3" /> Erro
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 font-mono">{row.code}</td>
                        <td className="max-w-[200px] truncate p-2">{row.description}</td>
                        <td className="p-2 text-xs">{PRODUCT_CATEGORIES.find(c => c.value === row.category)?.label || row.category}</td>
                        <td className="p-2 text-right">{row.currentStock}</td>
                        <td className="p-2 text-right">{row.stockOmie}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 100 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">... e mais {parsedRows.length - 100} itens</p>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
              <Button onClick={handleImport} disabled={newCount + updateCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                Importar {newCount + updateCount} produto(s)
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <FileSpreadsheet className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-lg font-medium">Importando produtos...</p>
            <Progress value={progress} className="w-full max-w-sm" />
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Importação concluída!</p>
            <div className="flex gap-3">
              {importResult.added > 0 && <Badge>{importResult.added} adicionados</Badge>}
              {importResult.updated > 0 && <Badge variant="secondary">{importResult.updated} atualizados</Badge>}
              {importResult.errors > 0 && <Badge variant="destructive">{importResult.errors} erros</Badge>}
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
