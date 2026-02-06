import { useState, useEffect, useCallback } from 'react';
import type { 
  Product, 
  WarehouseLocation, 
  Movement, 
  Alert, 
  Collaborator,
  DashboardStats,
  MovementFilter 
} from '@/types/inventory';
import { getStorageItem, setStorageItem, generateId, STORAGE_KEYS } from '@/lib/storage';
import { seedProducts, seedLocations, seedCollaborators, generateSeedMovements } from '@/lib/seedData';

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
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

    setAlerts(storedAlerts);
    setCurrentUser(storedUser);
    setIsLoading(false);
  }, []);

  // Generate alerts based on stock levels
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
    currentUser,
    isLoading,
    
    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    
    // Movement operations
    addMovement,
    getFilteredMovements,
    
    // Location operations
    addLocation,
    
    // Alert operations
    markAlertAsRead,
    clearAlert,
    
    // User operations
    setUser,
    
    // Stats
    getDashboardStats,
  };
}
