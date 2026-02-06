// Seed data based on the spreadsheet structure
import type { Product, WarehouseLocation, Movement, Collaborator } from '@/types/inventory';
import { generateId } from './storage';

export const seedLocations: WarehouseLocation[] = [
  // Estante A
  { id: generateId(), shelf: 'A', rack: '1', type: 'AEREO', description: 'Estante A - Prateleira 1 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'A', rack: '2', type: 'AEREO', description: 'Estante A - Prateleira 2 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'A', rack: '3', type: 'PICKING', description: 'Estante A - Prateleira 3 (Picking)', products: [] },
  { id: generateId(), shelf: 'A', rack: '4', type: 'PICKING', description: 'Estante A - Prateleira 4 (Picking)', products: [] },
  // Estante B
  { id: generateId(), shelf: 'B', rack: '1', type: 'AEREO', description: 'Estante B - Prateleira 1 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'B', rack: '2', type: 'AEREO', description: 'Estante B - Prateleira 2 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'B', rack: '3', type: 'PICKING', description: 'Estante B - Prateleira 3 (Picking)', products: [] },
  { id: generateId(), shelf: 'B', rack: '4', type: 'PICKING', description: 'Estante B - Prateleira 4 (Picking)', products: [] },
  // Estante C
  { id: generateId(), shelf: 'C', rack: '1', type: 'AEREO', description: 'Estante C - Prateleira 1 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'C', rack: '2', type: 'AEREO', description: 'Estante C - Prateleira 2 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'C', rack: '3', type: 'PICKING', description: 'Estante C - Prateleira 3 (Picking)', products: [] },
  { id: generateId(), shelf: 'C', rack: '4', type: 'PICKING', description: 'Estante C - Prateleira 4 (Picking)', products: [] },
  // Estante D
  { id: generateId(), shelf: 'D', rack: '1', type: 'AEREO', description: 'Estante D - Prateleira 1 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'D', rack: '2', type: 'PICKING', description: 'Estante D - Prateleira 2 (Picking)', products: [] },
  // Estante E
  { id: generateId(), shelf: 'E', rack: '1', type: 'AEREO', description: 'Estante E - Prateleira 1 (Aéreo)', products: [] },
  { id: generateId(), shelf: 'E', rack: '2', type: 'PICKING', description: 'Estante E - Prateleira 2 (Picking)', products: [] },
];

export const seedProducts: Product[] = [
  {
    id: generateId(),
    code: 'CABO-001',
    description: 'Cabo de Força 3 pinos 1.5m',
    category: 'CABOS',
    unit: 'UN',
    minStock: 10,
    currentStock: 45,
    location: 'A-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'CONEC-002',
    description: 'Conector RJ45 Cat6',
    category: 'CONECTORES',
    unit: 'UN',
    minStock: 50,
    currentStock: 120,
    location: 'A-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'FERR-003',
    description: 'Chave de Fenda Phillips #2',
    category: 'FERRAMENTAS',
    unit: 'UN',
    minStock: 5,
    currentStock: 12,
    location: 'B-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'PARAF-004',
    description: 'Parafuso M4x10 Inox',
    category: 'FIXADORES',
    unit: 'UN',
    minStock: 100,
    currentStock: 350,
    location: 'B-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'DISP-005',
    description: 'Disjuntor Bipolar 20A',
    category: 'ELÉTRICA',
    unit: 'UN',
    minStock: 8,
    currentStock: 5,
    location: 'C-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'RELE-006',
    description: 'Relé 24V 10A',
    category: 'ELÉTRICA',
    unit: 'UN',
    minStock: 15,
    currentStock: 8,
    location: 'C-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'FITA-007',
    description: 'Fita Isolante Preta 19mm',
    category: 'CONSUMÍVEIS',
    unit: 'UN',
    minStock: 20,
    currentStock: 35,
    location: 'A-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'SOLD-008',
    description: 'Estanho para Solda 1mm',
    category: 'CONSUMÍVEIS',
    unit: 'M',
    minStock: 50,
    currentStock: 120,
    location: 'D-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'MOTOR-009',
    description: 'Motor DC 12V 500RPM',
    category: 'MOTORES',
    unit: 'UN',
    minStock: 3,
    currentStock: 7,
    location: 'E-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    code: 'SENS-010',
    description: 'Sensor Indutivo NPN',
    category: 'SENSORES',
    unit: 'UN',
    minStock: 5,
    currentStock: 2,
    location: 'E-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const seedCollaborators: Collaborator[] = [
  { id: generateId(), name: 'João Silva', role: 'Almoxarife', isActive: true },
  { id: generateId(), name: 'Maria Santos', role: 'Técnico', isActive: true },
  { id: generateId(), name: 'Pedro Costa', role: 'Supervisor', isActive: true },
];

export function generateSeedMovements(products: Product[], collaborators: Collaborator[]): Movement[] {
  const movements: Movement[] = [];
  const types: Array<Movement['type']> = ['ENTRADA', 'SAIDA', 'DEVOLUCAO'];
  const purposes: Array<Movement['purpose']> = ['SERVICO', 'PRODUCAO', 'VENDA'];
  
  // Generate some sample movements from the last 30 days
  for (let i = 0; i < 25; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const collaborator = collaborators[Math.floor(Math.random() * collaborators.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    movements.push({
      id: generateId(),
      date: date.toISOString().split('T')[0],
      time: `${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      productId: product.id,
      productCode: product.code,
      productDescription: product.description,
      type: types[Math.floor(Math.random() * types.length)],
      quantity: Math.floor(Math.random() * 10) + 1,
      origin: product.location,
      destination: i % 3 === 0 ? 'EXTERNO' : product.location,
      purpose: purposes[Math.floor(Math.random() * purposes.length)],
      collaborator: collaborator.name,
      createdAt: date.toISOString(),
    });
  }
  
  return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
