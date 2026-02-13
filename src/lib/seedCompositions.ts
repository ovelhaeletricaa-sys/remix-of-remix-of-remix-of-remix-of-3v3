import type { Composition } from '@/types/composition';
import { generateId } from './storage';

// Sample compositions based on 3V3 equipment manufacturing
export const seedCompositions: Composition[] = [
  {
    id: generateId(),
    code: 'COMP001',
    name: 'Kit Painel Solar 20W',
    description: 'Composição para montagem de painel solar 3V3 20W com cabo 5M',
    items: [],  // Will be filled dynamically with product IDs at runtime
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'COMP002',
    name: 'Kit Quadro Inversor 30HP',
    description: 'Composição para montagem do quadro inversor 5cv-40Cv IF20 30HP',
    items: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'COMP003',
    name: 'Kit Estrutura Alumínio Dir Nutri',
    description: 'Composição para estrutura de alumínio linha Dir Nutri',
    items: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
