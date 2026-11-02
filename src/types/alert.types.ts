// ============================================
// Tipos de Alertas
// ============================================

export type AlertType = 'estoque' | 'financeiro' | 'producao' | 'calendario' | 'sistema' | 'ia';
export type AlertPriority = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  read: boolean;
  createdAt: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
}
