// ============================================
// Tipos de Criações
// ============================================

export interface Livestock {
  id: string;
  type: string;
  breed?: string;
  quantity: number;
  date: string;
  feeding?: string;
  vaccination?: string;
  weighing?: string;
  production?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
