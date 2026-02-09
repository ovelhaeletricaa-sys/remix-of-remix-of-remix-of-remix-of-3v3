// Seed data based on the 3V3 Tecnologia spreadsheet analysis
import type { Product, WarehouseLocation, Movement, Collaborator, Project } from '@/types/inventory';
import { generateId } from './storage';

// Real collaborators from the analysis
export const seedCollaborators: Collaborator[] = [
  { id: generateId(), name: 'BRUNO', role: 'ALMOXARIFE', isActive: true },
  { id: generateId(), name: 'RAFAEL', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'ELDER', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'GABRIEL', role: 'SUPERVISOR', isActive: true },
  { id: generateId(), name: 'ALLAN', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'MARCELO', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'IZAIAS', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'ROBERTO', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'ANDERSON', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'EDUARDO', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'MARCOS', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'WERICK', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'MICHEL', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'REGIS', role: 'OPERADOR', isActive: true },
  { id: generateId(), name: 'GUSTAVO', role: 'OPERADOR', isActive: true },
];

// Projects/finalities from the analysis
export const seedProjects: Project[] = [
  { id: generateId(), code: 'PRD01733', name: 'Estrutura de Alumínio Dir Nutri', status: 'ATIVO' },
  { id: generateId(), code: '0000001318', name: 'Quadro Para Inversor 5cv-40Cv - if20 30hp', status: 'ATIVO' },
  { id: generateId(), code: '0000000726', name: 'Dir - Nobreak', status: 'ATIVO' },
  { id: generateId(), code: 'PRD01179', name: 'Placa Painel Solar 3v3 20w Cabo 5M', status: 'ATIVO' },
  { id: generateId(), code: '0000000727', name: 'Dir - Painel Solar', status: 'ATIVO' },
  { id: generateId(), code: 'USO_SERVICO', name: 'Uso em Serviço', status: 'ATIVO' },
  { id: generateId(), code: 'VENDA_DIRETA', name: 'Venda Direta', status: 'ATIVO' },
];

// Real warehouse locations based on STNT01-30, PRAT01-06, AER/PCKN
function generateLocations(): WarehouseLocation[] {
  const locations: WarehouseLocation[] = [];
  const categoryByShelf: Record<number, string> = {
    1: "EPI's",
    2: "EPI's",
    3: 'Material de Uso e Consumo',
    4: 'Embalagens',
    5: 'Embalagens',
    6: 'Ferramentas e Equipamentos',
    7: 'Ferramentas e Equipamentos',
    8: 'Adesivos',
    9: 'Peças Feitas a Lazer',
    10: 'Peças Feitas a Lazer',
    11: 'Peças Feitas na Router',
    12: 'Peças Feitas na Router',
    13: 'Peças Feitas no Torno',
    14: 'Peças Feitas no Torno',
    15: 'Ferragens e Fixações',
    16: 'Ferragens e Fixações',
    17: 'Ferragens e Fixações',
    18: 'Fios e Cabos Elétricos',
    19: 'Fios e Cabos Elétricos',
    20: 'Fitas Adesivas',
    21: 'Material de Uso e Consumo',
    22: 'Material de Uso e Consumo',
    23: 'Material de Uso e Consumo',
    24: 'Material de Uso e Consumo',
    25: 'Material de Uso e Consumo',
    26: 'Material de Uso e Consumo',
    27: 'N/D',
    28: 'N/D',
    29: 'N/D',
    30: 'N/D',
  };

  for (let estante = 1; estante <= 30; estante++) {
    const shelfNum = String(estante).padStart(2, '0');
    const racks = ['01', '02', '03', '04', '05', '06'];
    if (estante <= 10) racks.push('02B'); // Some shelves have sub-bins

    for (const rack of racks) {
      // Prateleiras 1-3 = PICKING, 4-6 = AEREO (based on typical warehouse layout)
      const rackNum = parseInt(rack);
      const type = rackNum <= 3 || rack === '02B' ? 'PICKING' : 'AEREO';
      const category = categoryByShelf[estante] || 'N/D';

      locations.push({
        id: generateId(),
        shelf: shelfNum,
        rack: rack,
        type: type as 'AEREO' | 'PICKING',
        description: `STNT${shelfNum} - PRAT${rack} - ${type === 'AEREO' ? 'AER' : 'PCKN'}`,
        productTypes: category,
        products: [],
      });
    }
  }

  // Special areas
  locations.push({
    id: generateId(),
    shelf: '100',
    rack: '01',
    type: 'PICKING',
    description: 'STNT100 - Área de Recebimento/Inspeção',
    productTypes: 'Recebimento',
    products: [],
  });
  locations.push({
    id: generateId(),
    shelf: '300',
    rack: '01',
    type: 'PICKING',
    description: 'STNT300 - Área de Expedição',
    productTypes: 'Expedição',
    products: [],
  });

  return locations;
}

export const seedLocations = generateLocations();

// Real products based on the analysis (sample from 2641 SKUs)
export const seedProducts: Product[] = [
  { id: generateId(), code: 'PRD00174', description: 'Registro Esfera PVC 25mm', category: 'MATERIAL_USO_CONSUMO', unit: 'UN', minStock: 10, currentStock: 45, location: 'STNT03-PRAT01', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00189', description: 'Filtro Modular 10"', category: 'MATERIAL_USO_CONSUMO', unit: 'UN', minStock: 5, currentStock: 12, location: 'STNT03-PRAT02', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00502', description: 'Porca Sx Galv Aço C5.8 MA 8mm', category: 'FERRAGENS_FIXACOES', unit: 'UN', minStock: 50, currentStock: 250, location: 'STNT15-PRAT01', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD01733', description: 'Estrutura de Alumínio Dir Nutri', category: 'PECAS_LAZER', unit: 'UN', minStock: 2, currentStock: 8, location: 'STNT09-PRAT01', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD01179', description: 'Placa Painel Solar 3v3 20w Cabo 5M', category: 'ELETRICA', unit: 'UN', minStock: 5, currentStock: 15, location: 'STNT18-PRAT01', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: '0000000726', description: 'Dir - Nobreak', category: 'ELETRICA', unit: 'UN', minStock: 3, currentStock: 10, location: 'STNT18-PRAT02', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: '0000001318', description: 'Quadro Para Inversor 5cv-40Cv if20 30hp', category: 'ELETRICA', unit: 'UN', minStock: 2, currentStock: 6, location: 'STNT18-PRAT03', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: '0000000727', description: 'Dir - Painel Solar', category: 'ELETRICA', unit: 'UN', minStock: 3, currentStock: 8, location: 'STNT18-PRAT04', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // EPI
  { id: generateId(), code: 'PRD00045', description: 'Luva de Segurança Látex Tam M', category: 'EPI', unit: 'UN', minStock: 20, currentStock: 50, location: 'STNT01-PRAT01', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00046', description: 'Óculos de Proteção Ampla Visão', category: 'EPI', unit: 'UN', minStock: 10, currentStock: 25, location: 'STNT01-PRAT02', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00047', description: 'Protetor Auricular Plug', category: 'EPI', unit: 'UN', minStock: 30, currentStock: 15, location: 'STNT01-PRAT03', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00048', description: 'Capacete de Segurança Branco', category: 'EPI', unit: 'UN', minStock: 5, currentStock: 3, location: 'STNT02-PRAT01', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Ferragens
  { id: generateId(), code: 'PRD00120', description: 'Parafuso Allen M6x20 Inox', category: 'FERRAGENS_FIXACOES', unit: 'UN', minStock: 100, currentStock: 380, location: 'STNT15-PRAT02', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00121', description: 'Arruela Lisa M8 Inox', category: 'FERRAGENS_FIXACOES', unit: 'UN', minStock: 100, currentStock: 520, location: 'STNT15-PRAT03', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00122', description: 'Rebite Pop 4x10 Alumínio', category: 'FERRAGENS_FIXACOES', unit: 'UN', minStock: 200, currentStock: 180, location: 'STNT16-PRAT01', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Ferramentas
  { id: generateId(), code: 'PRD00200', description: 'Chave Combinada 13mm', category: 'FERRAMENTAS', unit: 'UN', minStock: 3, currentStock: 8, location: 'STNT06-PRAT01', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00201', description: 'Alicate de Bico Longo 6"', category: 'FERRAMENTAS', unit: 'UN', minStock: 3, currentStock: 5, location: 'STNT06-PRAT02', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00202', description: 'Serra Copo Bimetal 32mm', category: 'FERRAMENTAS', unit: 'UN', minStock: 2, currentStock: 4, location: 'STNT07-PRAT01', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Fios e Cabos
  { id: generateId(), code: 'PRD00300', description: 'Fio Flexível 2.5mm² Preto', category: 'FIOS_CABOS', unit: 'M', minStock: 100, currentStock: 350, location: 'STNT18-PRAT05', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00301', description: 'Cabo PP 3x1.5mm²', category: 'FIOS_CABOS', unit: 'M', minStock: 50, currentStock: 120, location: 'STNT19-PRAT01', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00302', description: 'Fio Flexível 1.5mm² Vermelho', category: 'FIOS_CABOS', unit: 'M', minStock: 100, currentStock: 80, location: 'STNT19-PRAT02', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Fitas
  { id: generateId(), code: 'PRD00400', description: 'Fita Isolante Preta 19mm x 10m', category: 'FITAS_ADESIVAS', unit: 'UN', minStock: 15, currentStock: 40, location: 'STNT20-PRAT01', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00401', description: 'Fita Silver Tape 48mm x 5m', category: 'FITAS_ADESIVAS', unit: 'UN', minStock: 10, currentStock: 22, location: 'STNT20-PRAT02', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Embalagens
  { id: generateId(), code: 'PRD00500', description: 'Caixa Papelão 40x30x20cm', category: 'EMBALAGENS', unit: 'UN', minStock: 20, currentStock: 60, location: 'STNT04-PRAT01', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00501', description: 'Filme Stretch 50cm x 300m', category: 'EMBALAGENS', unit: 'UN', minStock: 5, currentStock: 12, location: 'STNT05-PRAT01', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Adesivos
  { id: generateId(), code: 'PRD00600', description: 'Cola Instantânea Super Bonder 20g', category: 'ADESIVOS', unit: 'UN', minStock: 10, currentStock: 18, location: 'STNT08-PRAT01', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00601', description: 'Silicone Acético Transparente 280ml', category: 'ADESIVOS', unit: 'UN', minStock: 8, currentStock: 6, location: 'STNT08-PRAT02', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Peças
  { id: generateId(), code: 'PRD00700', description: 'Chapa Alumínio 1mm 1000x500', category: 'PECAS_LAZER', unit: 'UN', minStock: 5, currentStock: 12, location: 'STNT09-PRAT02', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00701', description: 'Perfil Alumínio U 25x25mm 6m', category: 'PECAS_ROUTER', unit: 'UN', minStock: 5, currentStock: 14, location: 'STNT11-PRAT01', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00702', description: 'Bucha de Nylon 3/8"', category: 'PECAS_TORNO', unit: 'UN', minStock: 20, currentStock: 45, location: 'STNT13-PRAT01', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Sensores e Motores  
  { id: generateId(), code: 'PRD00800', description: 'Sensor Indutivo M12 NPN 4mm', category: 'SENSORES', unit: 'UN', minStock: 5, currentStock: 2, location: 'STNT19-PRAT05', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00801', description: 'Motor WEG W22 1CV 4P 220/380V', category: 'MOTORES', unit: 'UN', minStock: 2, currentStock: 3, location: 'STNT19-PRAT06', curvaABC: 'C', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Material de Uso e Consumo
  { id: generateId(), code: 'PRD00900', description: 'Disco de Corte 7" x 1/8" x 7/8"', category: 'MATERIAL_USO_CONSUMO', unit: 'UN', minStock: 20, currentStock: 35, location: 'STNT03-PRAT03', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00901', description: 'Disco Flap 7" Grão 60', category: 'MATERIAL_USO_CONSUMO', unit: 'UN', minStock: 15, currentStock: 28, location: 'STNT03-PRAT04', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00902', description: 'Eletrodo 6013 2.5mm Kg', category: 'MATERIAL_USO_CONSUMO', unit: 'KG', minStock: 10, currentStock: 25, location: 'STNT21-PRAT01', curvaABC: 'A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), code: 'PRD00903', description: 'Arame MIG 0.8mm 5Kg', category: 'MATERIAL_USO_CONSUMO', unit: 'KG', minStock: 5, currentStock: 12, location: 'STNT21-PRAT02', curvaABC: 'B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Generate realistic movements based on analysis patterns
export function generateSeedMovements(products: Product[], collaborators: Collaborator[]): Movement[] {
  const movements: Movement[] = [];
  const activeCollaborators = ['BRUNO', 'RAFAEL', 'ELDER', 'GUSTAVO'];
  const projectCodes = ['PRD01733', '0000001318', '0000000726', 'PRD01179', 'USO_SERVICO', 'VENDA_DIRETA'];
  
  // Weighted collaborator distribution (matching real data)
  const collaboratorWeights = [
    { name: 'BRUNO', weight: 38 },
    { name: 'RAFAEL', weight: 35 },
    { name: 'ELDER', weight: 26 },
    { name: 'GUSTAVO', weight: 1 },
  ];

  // Weighted project distribution
  const projectWeights = [
    { code: '0000000726', purpose: 'PRODUCAO' as const, weight: 28 },
    { code: 'PRD01733', purpose: 'PRODUCAO' as const, weight: 26 },
    { code: '0000001318', purpose: 'PRODUCAO' as const, weight: 25 },
    { code: 'PRD01179', purpose: 'PRODUCAO' as const, weight: 15 },
    { code: 'USO_SERVICO', purpose: 'SERVICO' as const, weight: 5 },
    { code: 'VENDA_DIRETA', purpose: 'VENDA' as const, weight: 1 },
  ];

  function weightedRandom<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * totalWeight;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }

  // Generate ~136 movements over the last 30 days (matching real data volume)
  for (let i = 0; i < 136; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const collab = weightedRandom(collaboratorWeights);
    const project = weightedRandom(projectWeights);
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    // Movement types: mostly SAIDA (matching real data where 100% was SAIDA)
    // But add some variety for realism
    const typeRoll = Math.random();
    let type: Movement['type'];
    if (typeRoll < 0.55) type = 'SAIDA';
    else if (typeRoll < 0.75) type = 'ENTRADA';
    else if (typeRoll < 0.85) type = 'DEVOLUCAO';
    else if (typeRoll < 0.90) type = 'TROCA';
    else if (typeRoll < 0.95) type = 'AVARIA';
    else type = 'PERDA';

    // Quantity distribution: median ~7, range 2-188
    let quantity: number;
    const qRoll = Math.random();
    if (qRoll < 0.50) quantity = Math.floor(Math.random() * 9) + 2; // 2-10
    else if (qRoll < 0.85) quantity = Math.floor(Math.random() * 20) + 11; // 11-30
    else if (qRoll < 0.95) quantity = Math.floor(Math.random() * 70) + 31; // 31-100
    else quantity = Math.floor(Math.random() * 88) + 101; // 101-188

    const hour = 7 + Math.floor(Math.random() * 10); // 07:00 - 16:00
    const minute = Math.floor(Math.random() * 60);

    movements.push({
      id: generateId(),
      date: date.toISOString().split('T')[0],
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      productId: product.id,
      productCode: product.code,
      productDescription: product.description,
      type,
      quantity,
      origin: product.location,
      destination: type === 'ENTRADA' ? product.location : 'EXTERNO',
      purpose: project.purpose,
      projectCode: project.code,
      collaborator: collab.name,
      createdAt: date.toISOString(),
    });
  }
  
  return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
