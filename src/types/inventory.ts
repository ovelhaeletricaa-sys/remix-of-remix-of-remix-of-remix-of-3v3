// Core types for the inventory system

export interface Product {
  id: string;
  code: string;
  description: string;
  category: string;
  unit: string;
  minStock: number;
  currentStock: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  shelf: string;      // Estante (A, B, C...)
  rack: string;       // Prateleira (1, 2, 3...)
  type: 'AEREO' | 'PICKING';
  description: string;
  products: string[]; // Product IDs
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
  role: string;
  isActive: boolean;
}

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
