// ============================================
// Tipos de Plantações
// ============================================

export type PlantationStatus =
  | 'planejada'
  | 'plantada'
  | 'em_desenvolvimento'
  | 'pronta_colheita'
  | 'colhida'
  | 'finalizada';

export interface Plantation {
  id: string;
  culture: string;
  variety?: string;
  plantedArea: number;
  plantingDate: string;
  expectedHarvestDate?: string;
  status: PlantationStatus;
  estimatedProduction?: number;
  actualProduction?: number;
  seedQuantity?: number;
  inputs?: string;
  fertilization?: string;
  applications?: string;
  costs?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const PLANTATION_STATUS_LABELS: Record<PlantationStatus, string> = {
  planejada: 'Planejada',
  plantada: 'Plantada',
  em_desenvolvimento: 'Em Desenvolvimento',
  pronta_colheita: 'Pronta p/ Colheita',
  colhida: 'Colhida',
  finalizada: 'Finalizada',
};
