import { request } from '../../shared/api/http';
import type { DealStage } from '../deals/api';
import type { PaymentMethod } from '../payments/api';

export interface DealStageStat {
  stage: DealStage;
  count: number;
  amount: number;
}

export interface AnalyticsDashboard {
  clients: { total: number };
  deals: {
    totalCount: number;
    byStage: DealStageStat[];
    wonAmount: number;
    wonCount: number;
    lostCount: number;
    activeAmount: number;
    activeCount: number;
    conversionRate: number;
  };
  tasks: {
    total: number;
    pending: number;
    done: number;
    overdue: number;
  };
  payments: {
    totalPaid: number;
    totalPending: number;
    byMethod: { method: PaymentMethod; amount: number }[];
  };
  revenueByMonth: { month: string; amount: number }[];
  topClients: {
    clientId: string;
    firstName: string;
    lastName: string;
    salonName: string | null;
    amount: number;
  }[];
  managerPerformance: {
    managerId: string;
    firstName: string;
    lastName: string;
    dealsWon: number;
    revenue: number;
  }[];
}

export const analyticsKeys = {
  dashboard: ['analytics', 'dashboard'] as const,
};

export const analyticsApi = {
  getDashboard: (token: string) => request<AnalyticsDashboard>('/analytics/dashboard', { token }),
};
