// Core types for the inventory system - 3V3 Tecnologia

export interface Product {
  id: string;
  code: string;
  description: string;
  category: ProductCategory;
  unit: string;
  minStock: number;
  currentStock: number;
  stockOmie: number;
  location: string;
  curvaABC?: 'A' | 'B' | 'C';
  createdAt: string;
  updatedAt: string;
}

// Divergence types for multiple quantity analysis
export type StockDivergenceType = 'FISICO_ABAIXO_MINIMO' | 'FISICO_OMIE_DIVERGENTE' | 'OMIE_ABAIXO_MINIMO' | 'SEM_DIVERGENCIA';

export interface StockDivergence {
  product: Product;
  type: StockDivergenceType;
  diffFisicoOmie: number;        // currentStock - stockOmie
  diffFisicoMinimo: number;      // currentStock - minStock
  diffOmieMinimo: number;        // stockOmie - minStock
  percentDivergence: number;     // % diff between fisico and omie
}

export type ProductCategory =
  | 'EPI'
  | 'MATERIAL_USO_CONSUMO'
  | 'EMBALAGENS'
  | 'FERRAMENTAS'
  | 'ADESIVOS'
  | 'PECAS_LAZER'
  | 'PECAS_ROUTER'
  | 'PECAS_TORNO'
  | 'FERRAGENS_FIXACOES'
  | 'FIOS_CABOS'
  | 'FITAS_ADESIVAS'
  | 'ELETRICA'
  | 'SENSORES'
  | 'MOTORES'
  | 'OUTROS';

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'EPI', label: "EPI's" },
  { value: 'MATERIAL_USO_CONSUMO', label: 'Material de Uso e Consumo' },
  { value: 'EMBALAGENS', label: 'Embalagens' },
  { value: 'FERRAMENTAS', label: 'Ferramentas e Equipamentos' },
  { value: 'ADESIVOS', label: 'Adesivos' },
  { value: 'PECAS_LAZER', label: 'Peças Feitas a Lazer' },
  { value: 'PECAS_ROUTER', label: 'Peças Feitas na Router' },
  { value: 'PECAS_TORNO', label: 'Peças Feitas no Torno' },
  { value: 'FERRAGENS_FIXACOES', label: 'Ferragens e Fixações' },
  { value: 'FIOS_CABOS', label: 'Fios e Cabos Elétricos' },
  { value: 'FITAS_ADESIVAS', label: 'Fitas Adesivas' },
  { value: 'ELETRICA', label: 'Elétrica' },
  { value: 'SENSORES', label: 'Sensores' },
  { value: 'MOTORES', label: 'Motores' },
  { value: 'OUTROS', label: 'Outros' },
];

export interface WarehouseLocation {
  id: string;
  shelf: string;      // Estante (01 a 30)
  rack: string;       // Prateleira (01 a 06, 02B)
  type: 'AEREO' | 'PICKING';
  description: string;
  productTypes?: string; // Tipos de produtos armazenados
  products: string[];
  capacity?: number;     // Max products this location can hold
  allowedCategories?: ProductCategory[]; // Categories allowed in this location
}

// Storage structure template
export interface StorageStructure {
  id: string;
  name: string;
  shelfPrefix: string;    // e.g. "STNT"
  shelfStart: number;
  shelfEnd: number;
  racksPerShelf: number;
  rackLabels?: string[];  // Custom labels like ["01", "02", "02B", "03"]
  defaultType: 'AEREO' | 'PICKING';
  typeRule?: 'ALL_SAME' | 'LOWER_PICKING_UPPER_AEREO'; // How to assign types
  pickingCutoff?: number; // Racks <= this are PICKING
  defaultCapacity?: number;
  defaultCategories?: ProductCategory[];
  createdAt: string;
}

// Warehouse alert types
export type WarehouseAlertType = 'UNADDRESSED' | 'CAPACITY_EXCEEDED' | 'MULTI_LOCATION' | 'EMPTY_LOCATION';

export interface WarehouseAlert {
  id: string;
  type: WarehouseAlertType;
  productId?: string;
  productCode?: string;
  locationId?: string;
  locationDescription?: string;
  message: string;
  details?: string;
  createdAt: string;
}

export const WAREHOUSE_ALERT_LABELS: Record<WarehouseAlertType, string> = {
  UNADDRESSED: 'Produto sem endereço',
  CAPACITY_EXCEEDED: 'Capacidade excedida',
  MULTI_LOCATION: 'Múltiplos endereços',
  EMPTY_LOCATION: 'Endereço vazio',
};

export interface Movement {
  id: string;
  date: string;
  time: string;
  productId: string;
  productCode: string;
  productDescription: string;
  type: MovementType;
  quantity: number;
  origin: string;
  destination: string;
  purpose: MovementPurpose;
  projectCode?: string;  // Código do projeto/finalidade específica
  equipmentCode?: string;
  collaborator: string;
  observations?: string;
  createdAt: string;
}

export type MovementType = 
  | 'ENTRADA' 
  | 'SAIDA' 
  | 'DEVOLUCAO' 
  | 'TROCA' 
  | 'AVARIA' 
  | 'PERDA';

export type MovementPurpose = 
  | 'SERVICO' 
  | 'PRODUCAO' 
  | 'VENDA' 
  | 'TRANSFERENCIA'
  | 'AJUSTE';

export const MOVEMENT_PURPOSES: { value: MovementPurpose; label: string }[] = [
  { value: 'SERVICO', label: 'Uso em Serviço' },
  { value: 'PRODUCAO', label: 'Produção' },
  { value: 'VENDA', label: 'Venda Direta' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'AJUSTE', label: 'Ajuste de Estoque' },
];

export interface Project {
  id: string;
  code: string;
  name: string;
  status: 'ATIVO' | 'CONCLUIDO' | 'CANCELADO';
}

export type AlertKanbanStatus = 'NOVO' | 'EM_ANALISE' | 'ACAO_NECESSARIA' | 'AGUARDANDO' | 'RESOLVIDO';

export const ALERT_KANBAN_COLUMNS: { value: AlertKanbanStatus; label: string; color: string }[] = [
  { value: 'NOVO', label: 'Novos', color: 'text-info' },
  { value: 'EM_ANALISE', label: 'Em Análise', color: 'text-warning' },
  { value: 'ACAO_NECESSARIA', label: 'Ação Necessária', color: 'text-destructive' },
  { value: 'AGUARDANDO', label: 'Aguardando Terceiros', color: 'text-muted-foreground' },
  { value: 'RESOLVIDO', label: 'Resolvidos', color: 'text-success' },
];

export interface Alert {
  id: string;
  productId: string;
  productCode: string;
  productDescription: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DAMAGE' | 'LOSS' | 'OMIE_DIVERGENCE';
  message: string;
  isRead: boolean;
  kanbanStatus: AlertKanbanStatus;
  createdAt: string;
}

export type CollaboratorBlockReason = 
  | 'FERIAS'
  | 'ATESTADO_MEDICO'
  | 'AFASTAMENTO'
  | 'DEMISSAO'
  | 'LICENCA'
  | 'OUTROS';

export const COLLABORATOR_BLOCK_REASONS: { value: CollaboratorBlockReason; label: string }[] = [
  { value: 'FERIAS', label: 'Férias' },
  { value: 'ATESTADO_MEDICO', label: 'Atestado Médico' },
  { value: 'AFASTAMENTO', label: 'Afastamento' },
  { value: 'DEMISSAO', label: 'Demissão' },
  { value: 'LICENCA', label: 'Licença' },
  { value: 'OUTROS', label: 'Outros' },
];

export interface Collaborator {
  id: string;
  name: string;
  role: CollaboratorRole;
  isActive: boolean;
  isBlocked?: boolean;
  blockReason?: CollaboratorBlockReason;
  blockReasonCustom?: string;
  blockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CollaboratorRole = 'OPERADOR' | 'SUPERVISOR' | 'GERENTE' | 'ALMOXARIFE' | 'ANALISTA_ESTOQUE';

export interface DashboardStats {
  totalProducts: number;
  totalLocations: number;
  movementsToday: number;
  activeAlerts: number;
  lowStockProducts: number;
  damagesThisMonth: number;
  lossesThisMonth: number;
}

export interface MovementFilter {
  startDate?: string;
  endDate?: string;
  type?: MovementType;
  productId?: string;
  collaborator?: string;
  purpose?: MovementPurpose;
}

// Analytics types
export interface ABCAnalysis {
  product: Product;
  totalQuantity: number;
  totalMovements: number;
  percentage: number;
  cumulativePercentage: number;
  curve: 'A' | 'B' | 'C';
}

export interface CollaboratorKPI {
  name: string;
  totalMovements: number;
  totalQuantity: number;
  entradas: number;
  saidas: number;
  devolucoes: number;
  avarias: number;
  perdas: number;
  percentage: number;
}

export interface PurposeAnalysis {
  purpose: string;
  projectCode?: string;
  totalMovements: number;
  totalQuantity: number;
  percentage: number;
  products: string[];
}

export interface LocationHeatData {
  shelf: string;
  rack: string;
  type: string;
  movementCount: number;
  totalQuantity: number;
  intensity: number; // 0-100
}

// ========== INVENTORY COUNT TYPES ==========

export type InventoryMethod = 'CONTAGEM_RAPIDA' | 'CONTAGEM_CEGA' | 'DUPLA_CONFERENCIA' | 'RASTREABILIDADE_COMPLETA';
export type InventoryCountStatus = 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONTAGEM_FINALIZADA' | 'AJUSTADO' | 'CANCELADO';
export type InventoryScope = 'GERAL' | 'SETOR' | 'CURVA_ABC' | 'PRODUTOS_ESPECIFICOS';
export type InventoryCountItemStatus = 'PENDENTE' | 'CONTADO' | 'DIVERGENTE' | 'AJUSTADO';
export type InventorySuggestionReason = 'CURVA_A' | 'TEMPO_SEM_CONTAGEM' | 'DIVERGENCIA_HISTORICA' | 'SETOR_CRITICO';
export type InventorySuggestionPriority = 'ALTA' | 'MEDIA' | 'BAIXA';

export const INVENTORY_METHOD_LABELS: { value: InventoryMethod; label: string; description: string }[] = [
  { value: 'CONTAGEM_RAPIDA', label: 'Contagem Rápida', description: 'Operador vê quantidade atual e ajusta' },
  { value: 'CONTAGEM_CEGA', label: 'Contagem Cega', description: 'Operador não vê quantidade, conta "no escuro"' },
  { value: 'DUPLA_CONFERENCIA', label: 'Dupla Conferência', description: 'Duas contagens independentes para comparação' },
  { value: 'RASTREABILIDADE_COMPLETA', label: 'Rastreabilidade Completa', description: 'Contagem cega + análise de causa + log completo' },
];

export const INVENTORY_SCOPE_LABELS: { value: InventoryScope; label: string }[] = [
  { value: 'GERAL', label: 'Geral (todos os produtos)' },
  { value: 'SETOR', label: 'Por Setor (estante)' },
  { value: 'CURVA_ABC', label: 'Por Curva ABC' },
  { value: 'PRODUTOS_ESPECIFICOS', label: 'Produtos Específicos' },
];

export interface InventoryCountItem {
  productId: string;
  productCode: string;
  productDescription: string;
  expectedQty: number;
  expectedQtyOmie: number;
  countedQty?: number;
  secondCountQty?: number;
  divergence?: number;
  divergencePercent?: number;
  adjustmentApplied: boolean;
  causeAnalysis?: string;
  status: InventoryCountItemStatus;
}

export interface InventoryCount {
  id: string;
  code: string;
  name: string;
  method: InventoryMethod;
  status: InventoryCountStatus;
  scope: InventoryScope;
  sectorFilter?: string;
  curveFilter?: 'A' | 'B' | 'C';
  selectedProductIds?: string[];
  items: InventoryCountItem[];
  collaborator: string;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySuggestion {
  productId: string;
  productCode: string;
  productDescription: string;
  reason: InventorySuggestionReason;
  priority: InventorySuggestionPriority;
  lastCountDate?: string;
  divergenceHistory: number;
}
