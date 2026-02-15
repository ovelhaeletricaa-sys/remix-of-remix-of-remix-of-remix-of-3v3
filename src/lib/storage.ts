// Local storage utilities for persistence

const STORAGE_KEYS = {
  PRODUCTS: 'inventory_products',
  LOCATIONS: 'inventory_locations',
  MOVEMENTS: 'inventory_movements',
  ALERTS: 'inventory_alerts',
  COLLABORATORS: 'inventory_collaborators',
  CURRENT_USER: 'inventory_current_user',
  STORAGE_STRUCTURES: 'inventory_storage_structures',
  COMPOSITIONS: 'inventory_compositions',
  PRODUCTION_ORDERS: 'inventory_production_orders',
  INVENTORY_COUNTS: 'inventory_counts',
} as const;

export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export { STORAGE_KEYS };
