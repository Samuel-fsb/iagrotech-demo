// ============================================
// Hook — useDashboard
// ============================================

import { useCallback, useEffect, useState } from 'react';
import type { DashboardData } from '../types';
import { dashboardService } from '../services/dashboard.service';

interface UseDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(userId?: string): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const dashboardData = await dashboardService.getDashboard(userId);
      setData(dashboardData);
    } catch {
      setError('Não foi possível carregar os dados do dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
