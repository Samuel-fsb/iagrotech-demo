// ============================================
// Mock — Dashboard Data
// Dados fictícios realistas para desenvolvimento
// ============================================

import type { DashboardData } from '../../types';

export const mockDashboardData: DashboardData = {
  financial: {
    revenue: 18750.00,
    expenses: 12340.00,
    result: 6410.00,
    profitMargin: 0.342,
  },

  financialChart: [
    { month: 'Mar', revenue: 12500, expenses: 9800, result: 2700 },
    { month: 'Abr', revenue: 15200, expenses: 11000, result: 4200 },
    { month: 'Mai', revenue: 8900, expenses: 10500, result: -1600 },
    { month: 'Jun', revenue: 22000, expenses: 13200, result: 8800 },
    { month: 'Jul', revenue: 16800, expenses: 11800, result: 5000 },
    { month: 'Ago', revenue: 18750, expenses: 12340, result: 6410 },
  ],

  productions: [
    {
      id: '1',
      culture: 'Milho',
      area: 3.5,
      status: 'Em Desenvolvimento',
      plantingDate: '2026-04-15',
      expectedHarvestDate: '2026-09-20',
      progress: 68,
    },
    {
      id: '2',
      culture: 'Feijão',
      area: 1.2,
      status: 'Plantada',
      plantingDate: '2026-07-10',
      expectedHarvestDate: '2026-10-15',
      progress: 25,
    },
    {
      id: '3',
      culture: 'Mandioca',
      area: 2.0,
      status: 'Pronta p/ Colheita',
      plantingDate: '2025-12-01',
      expectedHarvestDate: '2026-09-01',
      progress: 95,
    },
    {
      id: '4',
      culture: 'Hortaliças',
      area: 0.5,
      status: 'Em Desenvolvimento',
      plantingDate: '2026-06-20',
      expectedHarvestDate: '2026-09-15',
      progress: 55,
    },
  ],

  productionsCount: 4,

  stockAlerts: 3,

  upcomingActivities: [
    {
      id: '1',
      title: 'Adubação do milho',
      category: 'Adubação',
      date: '2026-08-28',
      status: 'pendente',
      priority: 'alta',
    },
    {
      id: '2',
      title: 'Irrigação das hortaliças',
      category: 'Irrigação',
      date: '2026-08-27',
      status: 'pendente',
      priority: 'media',
    },
    {
      id: '3',
      title: 'Colheita da mandioca',
      category: 'Colheita',
      date: '2026-09-01',
      status: 'pendente',
      priority: 'alta',
    },
    {
      id: '4',
      title: 'Aplicação defensivo — feijão',
      category: 'Aplicação',
      date: '2026-08-30',
      status: 'pendente',
      priority: 'media',
    },
    {
      id: '5',
      title: 'Vacinação do gado',
      category: 'Vacinação',
      date: '2026-09-05',
      status: 'pendente',
      priority: 'urgente',
    },
  ],

  alerts: [
    {
      id: '1',
      type: 'estoque',
      title: 'Estoque baixo de fertilizante',
      message: 'O estoque de NPK 10-10-10 está abaixo do mínimo (5 kg restantes).',
      priority: 'warning',
      read: false,
      createdAt: '2026-08-26T10:00:00',
    },
    {
      id: '2',
      type: 'producao',
      title: 'Colheita próxima — Mandioca',
      message: 'A plantação de mandioca está pronta para colheita. Previsão: 01/09/2026.',
      priority: 'info',
      read: false,
      createdAt: '2026-08-25T14:30:00',
    },
    {
      id: '3',
      type: 'calendario',
      title: 'Atividade atrasada',
      message: 'A inspeção do milho programada para 24/08 não foi concluída.',
      priority: 'critical',
      read: false,
      createdAt: '2026-08-25T08:00:00',
    },
    {
      id: '4',
      type: 'financeiro',
      title: 'Pagamento próximo',
      message: 'Parcela de R$ 850,00 referente a insumos vence em 3 dias.',
      priority: 'warning',
      read: true,
      createdAt: '2026-08-24T09:15:00',
    },
  ],
};
