// ============================================
// Tipos de Estoque
// ============================================

export type InventoryCategory =
  | 'sementes'
  | 'fertilizantes'
  | 'defensivos'
  | 'racao'
  | 'medicamentos'
  | 'ferramentas'
  | 'pecas'
  | 'combustivel'
  | 'outros';

export type InventoryStatus = 'normal' | 'estoque_baixo' | 'esgotado';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minimumStock: number;
  location?: string;
  expirationDate?: string;
  notes?: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  sementes: 'Sementes',
  fertilizantes: 'Fertilizantes',
  defensivos: 'Defensivos',
  racao: 'Ração',
  medicamentos: 'Medicamentos',
  ferramentas: 'Ferramentas',
  pecas: 'Peças',
  combustivel: 'Combustível',
  outros: 'Outros',
};
