import { Injectable } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service.js';
import { DealStage, DEAL_STAGE_ORDER } from '../common/enums/deal-stage.enum.js';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { DealsService } from '../deals/deals.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { TasksService } from '../tasks/tasks.service.js';

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // 'YYYY-MM-DD' -> 'YYYY-MM'
}

function lastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly dealsService: DealsService,
    private readonly tasksService: TasksService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getDashboard() {
    const [clients, deals, tasks, payments] = await Promise.all([
      this.clientsService.findAll(),
      this.dealsService.findAll(),
      this.tasksService.findAll(),
      this.paymentsService.findAll(),
    ]);

    // --- deals by stage ---
    const byStage = DEAL_STAGE_ORDER.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        amount: stageDeals.reduce((sum, d) => sum + d.amount, 0),
      };
    });

    const wonDeals = deals.filter((d) => d.stage === DealStage.WON);
    const lostDeals = deals.filter((d) => d.stage === DealStage.LOST);
    const activeDeals = deals.filter(
      (d) => d.stage !== DealStage.WON && d.stage !== DealStage.LOST,
    );
    const wonAmount = wonDeals.reduce((sum, d) => sum + d.amount, 0);
    const activeAmount = activeDeals.reduce((sum, d) => sum + d.amount, 0);
    const closedCount = wonDeals.length + lostDeals.length;
    const conversionRate =
      closedCount === 0 ? 0 : Math.round((wonDeals.length / closedCount) * 1000) / 10;

    // --- tasks ---
    const today = todayStr();
    const overdueCount = tasks.filter(
      (t) => t.status === TaskStatus.PENDING && !!t.dueDate && t.dueDate < today,
    ).length;
    const pendingCount = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const doneCount = tasks.filter((t) => t.status === TaskStatus.DONE).length;

    // --- payments ---
    const paidPayments = payments.filter((p) => p.status === PaymentStatus.PAID);
    const pendingPayments = payments.filter((p) => p.status === PaymentStatus.PENDING);
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const byMethodMap = new Map<string, number>();
    for (const p of paidPayments) {
      byMethodMap.set(p.method, (byMethodMap.get(p.method) ?? 0) + p.amount);
    }
    const byMethod = Array.from(byMethodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
    }));

    // --- revenue by month (last 6 months, paid payments by paidAt) ---
    const months = lastNMonthKeys(6);
    const revenueMap = new Map<string, number>(months.map((m) => [m, 0]));
    for (const p of paidPayments) {
      if (!p.paidAt) continue;
      const key = monthKey(p.paidAt);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) ?? 0) + p.amount);
      }
    }
    const revenueByMonth = months.map((month) => ({ month, amount: revenueMap.get(month) ?? 0 }));

    // --- top clients by paid revenue ---
    const clientRevenue = new Map<
      string,
      { firstName: string; lastName: string; salonName: string | null; amount: number }
    >();
    for (const p of paidPayments) {
      const client = p.deal.client;
      const existing = clientRevenue.get(client.id);
      if (existing) {
        existing.amount += p.amount;
      } else {
        clientRevenue.set(client.id, {
          firstName: client.firstName,
          lastName: client.lastName,
          salonName: client.salonName,
          amount: p.amount,
        });
      }
    }
    const topClients = Array.from(clientRevenue.entries())
      .map(([clientId, v]) => ({ clientId, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // --- manager performance (won deals) ---
    const managerStats = new Map<
      string,
      { firstName: string; lastName: string; dealsWon: number; revenue: number }
    >();
    for (const d of wonDeals) {
      if (!d.assignedTo) continue;
      const existing = managerStats.get(d.assignedTo.id);
      if (existing) {
        existing.dealsWon += 1;
        existing.revenue += d.amount;
      } else {
        managerStats.set(d.assignedTo.id, {
          firstName: d.assignedTo.firstName,
          lastName: d.assignedTo.lastName,
          dealsWon: 1,
          revenue: d.amount,
        });
      }
    }
    const managerPerformance = Array.from(managerStats.entries())
      .map(([managerId, v]) => ({ managerId, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      clients: { total: clients.length },
      deals: {
        totalCount: deals.length,
        byStage,
        wonAmount,
        wonCount: wonDeals.length,
        lostCount: lostDeals.length,
        activeAmount,
        activeCount: activeDeals.length,
        conversionRate,
      },
      tasks: {
        total: tasks.length,
        pending: pendingCount,
        done: doneCount,
        overdue: overdueCount,
      },
      payments: {
        totalPaid,
        totalPending,
        byMethod,
      },
      revenueByMonth,
      topClients,
      managerPerformance,
    };
  }
}
