// ============================================
// Tipos de Calendário
// ============================================

export type EventCategory =
  | 'plantio'
  | 'irrigacao'
  | 'adubacao'
  | 'aplicacao'
  | 'inspecao'
  | 'colheita'
  | 'venda'
  | 'manutencao'
  | 'vacinacao'
  | 'outros';

export type EventPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type EventStatus = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada' | 'cancelada';

export interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time?: string;
  priority: EventPriority;
  status: EventStatus;
  notes?: string;
  plantationId?: string;
  livestockId?: string;
  createdAt: string;
  updatedAt: string;
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  plantio: 'Plantio',
  irrigacao: 'Irrigação',
  adubacao: 'Adubação',
  aplicacao: 'Aplicação',
  inspecao: 'Inspeção',
  colheita: 'Colheita',
  venda: 'Venda',
  manutencao: 'Manutenção',
  vacinacao: 'Vacinação',
  outros: 'Outros',
};
