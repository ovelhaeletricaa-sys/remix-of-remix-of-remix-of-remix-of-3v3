import { useMemo } from 'react';
import type { Product, Movement, ABCAnalysis, CollaboratorKPI, PurposeAnalysis, LocationHeatData } from '@/types/inventory';

export function useAnalytics(products: Product[], movements: Movement[]) {
  
  // ABC Curve Analysis
  const abcAnalysis = useMemo((): ABCAnalysis[] => {
    const productTotals = new Map<string, { product: Product; totalQuantity: number; totalMovements: number }>();
    
    for (const m of movements) {
      const product = products.find(p => p.id === m.productId);
      if (!product) continue;
      
      const existing = productTotals.get(m.productId);
      if (existing) {
        existing.totalQuantity += m.quantity;
        existing.totalMovements += 1;
      } else {
        productTotals.set(m.productId, { product, totalQuantity: m.quantity, totalMovements: 1 });
      }
    }

    const totalQuantity = Array.from(productTotals.values()).reduce((s, v) => s + v.totalQuantity, 0);
    
    const sorted = Array.from(productTotals.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    let cumulative = 0;
    return sorted.map(item => {
      const percentage = totalQuantity > 0 ? (item.totalQuantity / totalQuantity) * 100 : 0;
      cumulative += percentage;
      
      let curve: 'A' | 'B' | 'C';
      if (cumulative <= 80) curve = 'A';
      else if (cumulative <= 95) curve = 'B';
      else curve = 'C';

      return {
        product: item.product,
        totalQuantity: item.totalQuantity,
        totalMovements: item.totalMovements,
        percentage,
        cumulativePercentage: cumulative,
        curve,
      };
    });
  }, [products, movements]);

  // Collaborator KPIs
  const collaboratorKPIs = useMemo((): CollaboratorKPI[] => {
    const kpis = new Map<string, CollaboratorKPI>();
    
    for (const m of movements) {
      const existing = kpis.get(m.collaborator) || {
        name: m.collaborator,
        totalMovements: 0,
        totalQuantity: 0,
        entradas: 0,
        saidas: 0,
        devolucoes: 0,
        avarias: 0,
        perdas: 0,
        percentage: 0,
      };

      existing.totalMovements += 1;
      existing.totalQuantity += m.quantity;
      if (m.type === 'ENTRADA') existing.entradas++;
      else if (m.type === 'SAIDA') existing.saidas++;
      else if (m.type === 'DEVOLUCAO') existing.devolucoes++;
      else if (m.type === 'AVARIA') existing.avarias++;
      else if (m.type === 'PERDA') existing.perdas++;

      kpis.set(m.collaborator, existing);
    }

    const total = movements.length;
    return Array.from(kpis.values())
      .map(k => ({ ...k, percentage: total > 0 ? (k.totalMovements / total) * 100 : 0 }))
      .sort((a, b) => b.totalMovements - a.totalMovements);
  }, [movements]);

  // Purpose/Project Analysis
  const purposeAnalysis = useMemo((): PurposeAnalysis[] => {
    const analysis = new Map<string, PurposeAnalysis>();
    
    for (const m of movements) {
      const key = m.projectCode || m.purpose;
      const existing = analysis.get(key) || {
        purpose: m.purpose,
        projectCode: m.projectCode,
        totalMovements: 0,
        totalQuantity: 0,
        percentage: 0,
        products: [],
      };

      existing.totalMovements += 1;
      existing.totalQuantity += m.quantity;
      if (!existing.products.includes(m.productCode)) {
        existing.products.push(m.productCode);
      }

      analysis.set(key, existing);
    }

    const total = movements.length;
    return Array.from(analysis.values())
      .map(a => ({ ...a, percentage: total > 0 ? (a.totalMovements / total) * 100 : 0 }))
      .sort((a, b) => b.totalMovements - a.totalMovements);
  }, [movements]);

  // Location Heat Map Data
  const locationHeatData = useMemo((): LocationHeatData[] => {
    const heatMap = new Map<string, LocationHeatData>();
    
    for (const m of movements) {
      const locationKey = m.origin || 'UNKNOWN';
      const existing = heatMap.get(locationKey);
      
      if (existing) {
        existing.movementCount += 1;
        existing.totalQuantity += m.quantity;
      } else {
        // Parse shelf and rack from location string (e.g., "STNT03-PRAT01")
        const parts = locationKey.split('-');
        const shelf = parts[0]?.replace('STNT', '') || '?';
        const rack = parts[1]?.replace('PRAT', '') || '?';
        
        heatMap.set(locationKey, {
          shelf,
          rack,
          type: '', // Will be enriched if needed
          movementCount: 1,
          totalQuantity: m.quantity,
          intensity: 0,
        });
      }
    }

    const maxCount = Math.max(...Array.from(heatMap.values()).map(h => h.movementCount), 1);
    
    return Array.from(heatMap.values())
      .map(h => ({ ...h, intensity: (h.movementCount / maxCount) * 100 }))
      .sort((a, b) => b.movementCount - a.movementCount);
  }, [movements]);

  return {
    abcAnalysis,
    collaboratorKPIs,
    purposeAnalysis,
    locationHeatData,
  };
}
