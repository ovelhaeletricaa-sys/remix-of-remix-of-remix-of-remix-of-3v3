import { useState, useEffect, useCallback } from 'react';
import type { 
  Product, 
  WarehouseLocation, 
  Movement, 
  Alert, 
  Collaborator,
  DashboardStats,
  MovementFilter,
  StorageStructure,
  WarehouseAlert,
  WarehouseAlertType,
} from '@/types/inventory';
import type { Composition, ProductionOrder } from '@/types/composition';
import { getStorageItem, setStorageItem, generateId, STORAGE_KEYS } from '@/lib/storage';
import { seedProducts, seedLocations, seedCollaborators, generateSeedMovements } from '@/lib/seedData';
import { seedCompositions } from '@/lib/seedCompositions';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [storageStructures, setStorageStructures] = useState<StorageStructure[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data from localStorage or seed data
  useEffect(() => {
    const storedProducts = getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const storedLocations = getStorageItem<WarehouseLocation[]>(STORAGE_KEYS.LOCATIONS, []);
    const storedMovements = getStorageItem<Movement[]>(STORAGE_KEYS.MOVEMENTS, []);
    const storedAlerts = getStorageItem<Alert[]>(STORAGE_KEYS.ALERTS, []);
    const storedCollaborators = getStorageItem<Collaborator[]>(STORAGE_KEYS.COLLABORATORS, []);
    const storedUser = getStorageItem<string>(STORAGE_KEYS.CURRENT_USER, '');

    // If no data exists, seed with initial data
    if (storedProducts.length === 0) {
      setProducts(seedProducts);
      setStorageItem(STORAGE_KEYS.PRODUCTS, seedProducts);
    } else {
      setProducts(storedProducts);
    }

    if (storedLocations.length === 0) {
      setLocations(seedLocations);
      setStorageItem(STORAGE_KEYS.LOCATIONS, seedLocations);
    } else {
      setLocations(storedLocations);
    }

    if (storedCollaborators.length === 0) {
      setCollaborators(seedCollaborators);
      setStorageItem(STORAGE_KEYS.COLLABORATORS, seedCollaborators);
    } else {
      setCollaborators(storedCollaborators);
    }

    if (storedMovements.length === 0) {
      const seedMovements = generateSeedMovements(
        storedProducts.length > 0 ? storedProducts : seedProducts,
        storedCollaborators.length > 0 ? storedCollaborators : seedCollaborators
      );
      setMovements(seedMovements);
      setStorageItem(STORAGE_KEYS.MOVEMENTS, seedMovements);
    } else {
      setMovements(storedMovements);
    }

    const storedStructures = getStorageItem<StorageStructure[]>(STORAGE_KEYS.STORAGE_STRUCTURES, []);
    setStorageStructures(storedStructures);

    const storedCompositions = getStorageItem<Composition[]>(STORAGE_KEYS.COMPOSITIONS, []);
    if (storedCompositions.length === 0) {
      setCompositions(seedCompositions);
      setStorageItem(STORAGE_KEYS.COMPOSITIONS, seedCompositions);
    } else {
      setCompositions(storedCompositions);
    }

    const storedOrders = getStorageItem<ProductionOrder[]>(STORAGE_KEYS.PRODUCTION_ORDERS, []);
    setProductionOrders(storedOrders);

    setAlerts(storedAlerts);
    setCurrentUser(storedUser);
    setIsLoading(false);
  }, []);

  // Generate alerts based on stock levels and OMIE divergences
  useEffect(() => {
    if (products.length === 0) return;

    const newAlerts: Alert[] = [];
    products.forEach(product => {
      if (product.currentStock === 0) {
        newAlerts.push({
          id: generateId(),
          productId: product.id,
          productCode: product.code,
          productDescription: product.description,
          type: 'OUT_OF_STOCK',
          message: `Produto ${product.code} está sem estoque!`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } else if (product.currentStock < product.minStock) {
        newAlerts.push({
          id: generateId(),
          productId: product.id,
          productCode: product.code,
          productDescription: product.description,
          type: 'LOW_STOCK',
          message: `Produto ${product.code} está abaixo do estoque mínimo (${product.currentStock}/${product.minStock})`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      // OMIE divergence alert (>20% difference)
      const omieStock = product.stockOmie ?? 0;
      if (omieStock > 0) {
        const diff = Math.abs(product.currentStock - omieStock);
        const percentDiff = (diff / omieStock) * 100;
        if (percentDiff > 20) {
          newAlerts.push({
            id: generateId(),
            productId: product.id,
            productCode: product.code,
            productDescription: product.description,
            type: 'OMIE_DIVERGENCE',
            message: `Divergência OMIE no produto ${product.code}: Físico ${product.currentStock} vs OMIE ${omieStock} (${percentDiff.toFixed(0)}%)`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.productId + a.type));
        const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.productId + a.type));
        const updated = [...uniqueNewAlerts, ...prev];
        setStorageItem(STORAGE_KEYS.ALERTS, updated);
        return updated;
      });
    }
  }, [products]);

  // Product operations
  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => {
      const updated = [...prev, newProduct];
      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
    return newProduct;
  }, []);

  const importProducts = useCallback((items: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    setProducts(prev => {
      const existingMap = new Map(prev.map(p => [p.code.toUpperCase(), p]));
      const now = new Date().toISOString();
      const updated = [...prev];

      for (const item of items) {
        const key = item.code.toUpperCase();
        const existing = existingMap.get(key);
        if (existing) {
          const idx = updated.findIndex(p => p.id === existing.id);
          if (idx !== -1) {
            updated[idx] = { ...existing, ...item, id: existing.id, createdAt: existing.createdAt, updatedAt: now };
          }
        } else {
          const newProduct: Product = { ...item, id: generateId(), createdAt: now, updatedAt: now };
          updated.push(newProduct);
          existingMap.set(key, newProduct);
        }
      }

      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
  }, []);

  // Movement operations
  const addMovement = useCallback((movement: Omit<Movement, 'id' | 'createdAt'>) => {
    const newMovement: Movement = {
      ...movement,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setMovements(prev => {
      const updated = [newMovement, ...prev];
      setStorageItem(STORAGE_KEYS.MOVEMENTS, updated);
      return updated;
    });

    // Update product stock based on movement type
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === movement.productId) {
          let newStock = p.currentStock;
          if (movement.type === 'ENTRADA' || movement.type === 'DEVOLUCAO') {
            newStock += movement.quantity;
          } else if (movement.type === 'SAIDA' || movement.type === 'AVARIA' || movement.type === 'PERDA') {
            newStock = Math.max(0, newStock - movement.quantity);
          }
          return { ...p, currentStock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    return newMovement;
  }, []);

  const updateMovement = useCallback((id: string, updates: Partial<Movement>) => {
    setMovements(prev => {
      const old = prev.find(m => m.id === id);
      if (!old) return prev;

      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      setStorageItem(STORAGE_KEYS.MOVEMENTS, updated);

      // Reverse old stock impact and apply new
      if (updates.quantity !== undefined || updates.type !== undefined) {
        const oldQty = old.quantity;
        const oldType = old.type;
        const newQty = updates.quantity ?? oldQty;
        const newType = updates.type ?? oldType;

        setProducts(prev => {
          return prev.map(p => {
            if (p.id === old.productId) {
              let stock = p.currentStock;
              // Reverse old
              if (['ENTRADA', 'DEVOLUCAO'].includes(oldType)) stock -= oldQty;
              else if (['SAIDA', 'AVARIA', 'PERDA'].includes(oldType)) stock += oldQty;
              // Apply new
              if (['ENTRADA', 'DEVOLUCAO'].includes(newType)) stock += newQty;
              else if (['SAIDA', 'AVARIA', 'PERDA'].includes(newType)) stock -= newQty;
              const result = { ...p, currentStock: Math.max(0, stock), updatedAt: new Date().toISOString() };
              return result;
            }
            return p;
          });
        });
      }

      return updated;
    });
  }, []);

  const deleteMovement = useCallback((id: string) => {
    setMovements(prev => {
      const movement = prev.find(m => m.id === id);
      if (!movement) return prev;

      // Reverse stock impact
      setProducts(prevProducts => {
        const updated = prevProducts.map(p => {
          if (p.id === movement.productId) {
            let stock = p.currentStock;
            if (['ENTRADA', 'DEVOLUCAO'].includes(movement.type)) stock -= movement.quantity;
            else if (['SAIDA', 'AVARIA', 'PERDA'].includes(movement.type)) stock += movement.quantity;
            return { ...p, currentStock: Math.max(0, stock), updatedAt: new Date().toISOString() };
          }
          return p;
        });
        setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
        return updated;
      });

      const updated = prev.filter(m => m.id !== id);
      setStorageItem(STORAGE_KEYS.MOVEMENTS, updated);
      return updated;
    });
  }, []);

  const getFilteredMovements = useCallback((filter: MovementFilter) => {
    return movements.filter(m => {
      if (filter.startDate && m.date < filter.startDate) return false;
      if (filter.endDate && m.date > filter.endDate) return false;
      if (filter.type && m.type !== filter.type) return false;
      if (filter.productId && m.productId !== filter.productId) return false;
      if (filter.collaborator && m.collaborator !== filter.collaborator) return false;
      if (filter.purpose && m.purpose !== filter.purpose) return false;
      return true;
    });
  }, [movements]);

  // Location operations
  const addLocation = useCallback((location: Omit<WarehouseLocation, 'id'>) => {
    const newLocation: WarehouseLocation = {
      ...location,
      id: generateId(),
    };
    setLocations(prev => {
      const updated = [...prev, newLocation];
      setStorageItem(STORAGE_KEYS.LOCATIONS, updated);
      return updated;
    });
    return newLocation;
  }, []);

  const updateLocation = useCallback((id: string, updates: Partial<WarehouseLocation>) => {
    setLocations(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, ...updates } : l);
      setStorageItem(STORAGE_KEYS.LOCATIONS, updated);
      return updated;
    });
  }, []);

  const deleteLocation = useCallback((id: string) => {
    setLocations(prev => {
      const updated = prev.filter(l => l.id !== id);
      setStorageItem(STORAGE_KEYS.LOCATIONS, updated);
      return updated;
    });
  }, []);

  const assignProductToLocation = useCallback((productId: string, locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;
    const locationCode = `STNT${location.shelf}-PRAT${location.rack}`;
    
    // Update product location
    setProducts(prev => {
      const updated = prev.map(p => 
        p.id === productId ? { ...p, location: locationCode, updatedAt: new Date().toISOString() } : p
      );
      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });

    // Add product to location's products array
    if (!location.products.includes(productId)) {
      setLocations(prev => {
        const updated = prev.map(l => 
          l.id === locationId ? { ...l, products: [...l.products, productId] } : l
        );
        setStorageItem(STORAGE_KEYS.LOCATIONS, updated);
        return updated;
      });
    }
  }, [locations]);

  const removeProductFromLocation = useCallback((productId: string, locationId: string) => {
    setLocations(prev => {
      const updated = prev.map(l => 
        l.id === locationId ? { ...l, products: l.products.filter(p => p !== productId) } : l
      );
      setStorageItem(STORAGE_KEYS.LOCATIONS, updated);
      return updated;
    });
    // Clear product location
    setProducts(prev => {
      const updated = prev.map(p => 
        p.id === productId ? { ...p, location: '', updatedAt: new Date().toISOString() } : p
      );
      setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
      return updated;
    });
  }, []);

  // Storage structure operations
  const addStorageStructure = useCallback((structure: Omit<StorageStructure, 'id' | 'createdAt'>) => {
    const newStructure: StorageStructure = {
      ...structure,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setStorageStructures(prev => {
      const updated = [...prev, newStructure];
      setStorageItem(STORAGE_KEYS.STORAGE_STRUCTURES, updated);
      return updated;
    });
    return newStructure;
  }, []);

  const updateStorageStructure = useCallback((id: string, updates: Partial<StorageStructure>) => {
    setStorageStructures(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      setStorageItem(STORAGE_KEYS.STORAGE_STRUCTURES, updated);
      return updated;
    });
  }, []);

  const deleteStorageStructure = useCallback((id: string) => {
    setStorageStructures(prev => {
      const updated = prev.filter(s => s.id !== id);
      setStorageItem(STORAGE_KEYS.STORAGE_STRUCTURES, updated);
      return updated;
    });
  }, []);

  const generateLocationsFromStructure = useCallback((structure: StorageStructure) => {
    const newLocations: Omit<WarehouseLocation, 'id'>[] = [];
    for (let s = structure.shelfStart; s <= structure.shelfEnd; s++) {
      const shelfNum = String(s).padStart(2, '0');
      const rackCount = structure.racksPerShelf;
      const labels = structure.rackLabels || Array.from({ length: rackCount }, (_, i) => String(i + 1).padStart(2, '0'));
      
      for (const rack of labels) {
        const rackNum = parseInt(rack);
        let type = structure.defaultType;
        if (structure.typeRule === 'LOWER_PICKING_UPPER_AEREO' && structure.pickingCutoff) {
          type = rackNum <= structure.pickingCutoff ? 'PICKING' : 'AEREO';
        }
        
        // Skip if location already exists
        const exists = locations.some(l => l.shelf === shelfNum && l.rack === rack);
        if (exists) continue;

        newLocations.push({
          shelf: shelfNum,
          rack,
          type,
          description: `${structure.shelfPrefix}${shelfNum} - PRAT${rack} - ${type === 'AEREO' ? 'AER' : 'PCKN'}`,
          products: [],
          capacity: structure.defaultCapacity,
          allowedCategories: structure.defaultCategories,
        });
      }
    }
    
    // Batch add all locations
    setLocations(prev => {
      const created = newLocations.map(l => ({ ...l, id: generateId() }));
      const updated = [...prev, ...created];
      setStorageItem(STORAGE_KEYS.LOCATIONS, updated);
      return updated;
    });
    
    return newLocations.length;
  }, [locations]);

  // Warehouse alerts computation
  const getWarehouseAlerts = useCallback((): WarehouseAlert[] => {
    const waAlerts: WarehouseAlert[] = [];
    
    // 1. Products without address
    products.forEach(p => {
      if (!p.location || p.location.trim() === '') {
        waAlerts.push({
          id: generateId(),
          type: 'UNADDRESSED',
          productId: p.id,
          productCode: p.code,
          message: `Produto ${p.code} - ${p.description} não possui endereço no armazém`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    // 2. Locations with capacity exceeded
    locations.forEach(loc => {
      if (loc.capacity && loc.capacity > 0) {
        const locationCode = `STNT${loc.shelf}-PRAT${loc.rack}`;
        const productsInLocation = products.filter(p => p.location === locationCode);
        if (productsInLocation.length > loc.capacity) {
          waAlerts.push({
            id: generateId(),
            type: 'CAPACITY_EXCEEDED',
            locationId: loc.id,
            locationDescription: loc.description,
            message: `${loc.description} excedeu capacidade: ${productsInLocation.length}/${loc.capacity} produtos`,
            details: productsInLocation.map(p => p.code).join(', '),
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    // 3. Same product in multiple locations
    const productLocations = new Map<string, string[]>();
    products.forEach(p => {
      if (p.location) {
        const existing = productLocations.get(p.id) || [];
        existing.push(p.location);
        productLocations.set(p.id, existing);
      }
    });
    // Also check location.products arrays for cross-references
    locations.forEach(loc => {
      const locationCode = `STNT${loc.shelf}-PRAT${loc.rack}`;
      loc.products.forEach(pid => {
        const prod = products.find(p => p.id === pid);
        if (prod && prod.location && prod.location !== locationCode) {
          waAlerts.push({
            id: generateId(),
            type: 'MULTI_LOCATION',
            productId: prod.id,
            productCode: prod.code,
            message: `Produto ${prod.code} está em múltiplos endereços: ${prod.location} e ${locationCode}`,
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    return waAlerts;
  }, [products, locations]);

  // Smart addressing suggestions
  const getSuggestedLocation = useCallback((productId: string): WarehouseLocation[] => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    // Find locations that match the product's category
    const suggestions: { location: WarehouseLocation; score: number }[] = [];

    locations.forEach(loc => {
      let score = 0;
      const locationCode = `STNT${loc.shelf}-PRAT${loc.rack}`;
      const productsInLoc = products.filter(p => p.location === locationCode);

      // 1. Category match via allowedCategories
      if (loc.allowedCategories?.includes(product.category)) score += 30;

      // 2. Same category products already in this location
      const sameCatCount = productsInLoc.filter(p => p.category === product.category).length;
      if (sameCatCount > 0) score += 20 + Math.min(sameCatCount * 5, 15);

      // 3. ProductTypes text match
      if (loc.productTypes) {
        const catLabel = product.category.toLowerCase().replace(/_/g, ' ');
        if (loc.productTypes.toLowerCase().includes(catLabel)) score += 15;
      }

      // 4. Has capacity available
      if (loc.capacity && productsInLoc.length >= loc.capacity) score -= 50;

      // 5. Empty location bonus (prefer filling empty spots)
      if (productsInLoc.length === 0) score += 5;

      // 6. Same shelf as similar products
      const sameCatInShelf = products.filter(p => p.category === product.category && p.location?.startsWith(`STNT${loc.shelf}`));
      if (sameCatInShelf.length > 0) score += 10;

      if (score > 0) {
        suggestions.push({ location: loc, score });
      }
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.location);
  }, [products, locations]);

  // Composition operations
  const addComposition = useCallback((comp: Omit<Composition, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newComp: Composition = { ...comp, id: generateId(), createdAt: now, updatedAt: now };
    setCompositions(prev => {
      const updated = [...prev, newComp];
      setStorageItem(STORAGE_KEYS.COMPOSITIONS, updated);
      return updated;
    });
    return newComp;
  }, []);

  const updateComposition = useCallback((id: string, updates: Partial<Composition>) => {
    setCompositions(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
      setStorageItem(STORAGE_KEYS.COMPOSITIONS, updated);
      return updated;
    });
  }, []);

  const deleteComposition = useCallback((id: string) => {
    setCompositions(prev => {
      const updated = prev.filter(c => c.id !== id);
      setStorageItem(STORAGE_KEYS.COMPOSITIONS, updated);
      return updated;
    });
  }, []);

  const importCompositions = useCallback((comps: Omit<Composition, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    setCompositions(prev => {
      const existingCodes = new Set(prev.map(c => c.code.toUpperCase()));
      const newComps = comps
        .filter(c => !existingCodes.has(c.code.toUpperCase()))
        .map(c => ({ ...c, id: generateId(), createdAt: now, updatedAt: now } as Composition));
      const updated = [...prev, ...newComps];
      setStorageItem(STORAGE_KEYS.COMPOSITIONS, updated);
      return updated;
    });
  }, []);

  // Production order operations
  const addProductionOrder = useCallback((order: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newOrder: ProductionOrder = { ...order, id: generateId(), createdAt: now, updatedAt: now };
    setProductionOrders(prev => {
      const updated = [newOrder, ...prev];
      setStorageItem(STORAGE_KEYS.PRODUCTION_ORDERS, updated);
      return updated;
    });
    return newOrder;
  }, []);

  const updateProductionOrder = useCallback((id: string, updates: Partial<ProductionOrder>) => {
    setProductionOrders(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o);
      setStorageItem(STORAGE_KEYS.PRODUCTION_ORDERS, updated);
      return updated;
    });
  }, []);

  const cancelProductionOrder = useCallback((id: string) => {
    const order = productionOrders.find(o => o.id === id);
    if (!order || order.status === 'CANCELADA') return;

    const now = new Date();
    const returnMovementIds: string[] = [];

    // Reverse each linked movement
    for (const movId of order.movementIds) {
      const mov = movements.find(m => m.id === movId);
      if (!mov) continue;

      // Increment stock back
      setProducts(prev => {
        const updated = prev.map(p => {
          if (p.id === mov.productId) {
            return { ...p, currentStock: p.currentStock + mov.quantity, updatedAt: now.toISOString() };
          }
          return p;
        });
        setStorageItem(STORAGE_KEYS.PRODUCTS, updated);
        return updated;
      });

      // Create return movement
      const returnMov: Movement = {
        id: generateId(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        productId: mov.productId,
        productCode: mov.productCode,
        productDescription: mov.productDescription,
        type: 'DEVOLUCAO',
        quantity: mov.quantity,
        origin: 'PRODUÇÃO',
        destination: mov.origin,
        purpose: 'PRODUCAO',
        projectCode: mov.projectCode,
        equipmentCode: mov.equipmentCode,
        collaborator: currentUser || 'Sistema',
        observations: `Devolução automática - Cancelamento da OP ${order.compositionCode} (${order.projectCode || 'sem projeto'})`,
        createdAt: now.toISOString(),
      };
      returnMovementIds.push(returnMov.id);

      setMovements(prev => {
        const updated = [returnMov, ...prev];
        setStorageItem(STORAGE_KEYS.MOVEMENTS, updated);
        return updated;
      });
    }

    // Update the order status
    setProductionOrders(prev => {
      const updated = prev.map(o => o.id === id ? {
        ...o,
        status: 'CANCELADA' as const,
        productionStatus: 'CANCELADA' as const,
        updatedAt: now.toISOString(),
      } : o);
      setStorageItem(STORAGE_KEYS.PRODUCTION_ORDERS, updated);
      return updated;
    });
  }, [productionOrders, movements, currentUser]);

  // Alert operations
  const markAlertAsRead = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isRead: true } : a);
      setStorageItem(STORAGE_KEYS.ALERTS, updated);
      return updated;
    });
  }, []);

  const clearAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      setStorageItem(STORAGE_KEYS.ALERTS, updated);
      return updated;
    });
  }, []);

  // User operations
  const setUser = useCallback((name: string) => {
    setCurrentUser(name);
    setStorageItem(STORAGE_KEYS.CURRENT_USER, name);
  }, []);

  // Dashboard stats
  const getDashboardStats = useCallback((): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      totalProducts: products.length,
      totalLocations: locations.length,
      movementsToday: movements.filter(m => m.date === today).length,
      activeAlerts: alerts.filter(a => !a.isRead).length,
      lowStockProducts: products.filter(p => p.currentStock < p.minStock).length,
      damagesThisMonth: movements.filter(m => m.type === 'AVARIA' && m.date.startsWith(thisMonth)).length,
      lossesThisMonth: movements.filter(m => m.type === 'PERDA' && m.date.startsWith(thisMonth)).length,
    };
  }, [products, locations, movements, alerts]);

  return {
    // Data
    products,
    locations,
    movements,
    alerts,
    collaborators,
    storageStructures,
    compositions,
    productionOrders,
    currentUser,
    isLoading,
    
    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    
    // Movement operations
    addMovement,
    updateMovement,
    deleteMovement,
    getFilteredMovements,
    
    // Location operations
    addLocation,
    updateLocation,
    deleteLocation,
    assignProductToLocation,
    removeProductFromLocation,
    
    // Storage structure operations
    addStorageStructure,
    updateStorageStructure,
    deleteStorageStructure,
    generateLocationsFromStructure,
    
    // Composition operations
    addComposition,
    updateComposition,
    deleteComposition,
    importCompositions,
    
    // Production order operations
    addProductionOrder,
    updateProductionOrder,
    cancelProductionOrder,
    
    // Warehouse intelligence
    getWarehouseAlerts,
    getSuggestedLocation,
    
    // Alert operations
    markAlertAsRead,
    clearAlert,
    
    // User operations
    setUser,
    
    // Stats
    getDashboardStats,
  };
}
