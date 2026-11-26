import { request } from '../../shared/api/http';
import type { DealStage } from '../deals/api';
import type { PaymentMethod } from '../payments/api';

export interface DealStageStat {
  stage: DealStage;
  count: number;
  amount: number;
}

export type SalesPeriod = 'month' | 'year';

export interface SalesParams {
  period: SalesPeriod;
  year?: number;
}

// Одна точка діаграми продажів: місяць ('YYYY-MM') або рік ('YYYY').
// revenue — оплачені платежі за датою оплати; newDeals* — угоди за
// датою створення.
export interface SalesPoint {
  key: string;
  revenue: number;
  paymentsCount: number;
  newDealsCount: number;
  newDealsAmount: number;
}

export interface SalesReport {
  period: SalesPeriod;
  year: number | null;
  years: number[]; // усі доступні роки, від 2020 до поточного
  points: SalesPoint[];
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
    // Топ-5 активних задач за терміном виконання — рахується на
    // бекенді з УСІХ задач (AnalyticsService.getDashboard), а не з
    // capped useAllTasks(), звідки раніше брав ці ж 5 рядків
    // DashboardPage (дивись коментар там).
    upcoming: {
      id: string;
      title: string;
      dueDate: string | null;
      client: { id: string; firstName: string; lastName: string } | null;
    }[];
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

// Ключ кешу для useAnalyticsDashboard() — фіксований, без параметрів,
// бо тут нема пагінації чи фільтрів (дивись коментар про фабрику
// ключів у features/clients/api.ts).
export const analyticsKeys = {
  dashboard: ['analytics', 'dashboard'] as const,
  sales: (params: SalesParams) => ['analytics', 'sales', params.period, params.year ?? null] as const,
};

export const analyticsApi = {
  getDashboard: (token: string) => request<AnalyticsDashboard>('/analytics/dashboard', { token }),

  getSales: (token: string, params: SalesParams) => {
    const query = new URLSearchParams({ period: params.period });
    if (params.year !== undefined) query.set('year', String(params.year));
    return request<SalesReport>(`/analytics/sales?${query}`, { token });
  },
};
