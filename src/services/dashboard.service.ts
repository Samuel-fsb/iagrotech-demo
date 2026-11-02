// Dashboard Service

import type { DashboardData } from '../types';
import { DEMO_MODE } from '../config/demo';
import { getDemoDashboard } from './demo/demo.store';
import { api } from './api';

export const dashboardService = {
  async getDashboard(_userId: string): Promise<DashboardData> {
    if (DEMO_MODE) return getDemoDashboard();

    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },
};
