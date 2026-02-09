// Core types for the inventory system - 3V3 Tecnologia

export interface Product {
  id: string;
  code: string;
  description: string;
  category: ProductCategory;
  unit: string;
  minStock: number;
  currentStock: number;
  location: string;
  curvaABC?: 'A' | 'B' | 'C';
  createdAt: string;
  updatedAt: string;
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
}

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

export interface Alert {
  id: string;
  productId: string;
  productCode: string;
  productDescription: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DAMAGE' | 'LOSS';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: CollaboratorRole;
  isActive: boolean;
}

export type CollaboratorRole = 'OPERADOR' | 'SUPERVISOR' | 'GERENTE' | 'ALMOXARIFE';

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
