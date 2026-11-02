// ============================================
// Tipos do Dashboard
// ============================================

export interface FinancialSummary {
  revenue: number;
  expenses: number;
  result: number;
  profitMargin: number;
}

export interface FinancialChartData {
  month: string;
  revenue: number;
  expenses: number;
  result: number;
}

export interface ActiveProduction {
  id: string;
  culture: string;
  area: number;
  status: string;
  plantingDate: string;
  expectedHarvestDate: string;
  progress?: number;
}

export interface UpcomingActivity {
  id: string;
  title: string;
  category: string;
  date: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'atrasada';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
}

export interface DashboardAlert {
  id: string;
  type: 'estoque' | 'financeiro' | 'producao' | 'calendario' | 'sistema';
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: string;
}

export interface DashboardData {
  financial: FinancialSummary;
  financialChart: FinancialChartData[];
  productions: ActiveProduction[];
  productionsCount: number;
  stockAlerts: number;
  upcomingActivities: UpcomingActivity[];
  alerts: DashboardAlert[];
}
