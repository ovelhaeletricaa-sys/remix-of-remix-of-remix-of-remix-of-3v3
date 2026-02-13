// Types for Equipment Compositions / BOM (Bill of Materials)

export interface CompositionItem {
  productId: string;
  productCode: string;
  productDescription: string;
  quantity: number;
  unit: string;
}

export interface Composition {
  id: string;
  code: string;
  name: string;
  description?: string;
  items: CompositionItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Production exit types
export type ProductionExitType = 'INTEGRAL' | 'PARCIAL' | 'FRACIONADA';

export const PRODUCTION_EXIT_TYPES: { value: ProductionExitType; label: string; description: string }[] = [
  { value: 'INTEGRAL', label: 'Integral', description: 'Todos os itens da composição na quantidade total' },
  { value: 'PARCIAL', label: 'Parcial', description: 'Selecione quais itens sairão' },
  { value: 'FRACIONADA', label: 'Fracionada', description: 'Customize a quantidade de cada item' },
];

// Production order linked to composition movements
export interface ProductionOrder {
  id: string;
  compositionId: string;
  compositionCode: string;
  compositionName: string;
  projectCode: string;
  exitType: ProductionExitType;
  items: ProductionOrderItem[];
  status: 'ABERTA' | 'PARCIAL' | 'CONCLUIDA' | 'CANCELADA';
  collaborator: string;
  movementIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionOrderItem {
  productId: string;
  productCode: string;
  productDescription: string;
  requiredQty: number;
  deliveredQty: number;
  unit: string;
  selected: boolean;
}
