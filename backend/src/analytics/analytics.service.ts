import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity.js';
import { DealStage, DEAL_STAGE_ORDER } from '../common/enums/deal-stage.enum.js';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { Deal } from '../deals/entities/deal.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { Task } from '../tasks/entities/task.entity.js';

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

// node-postgres returns COUNT(...) as a bigint string and SUM(numeric) as
// a numeric string (or null on an empty set) — normalize both to numbers.
function num(value: string | number | null | undefined): number {
  return value === null || value === undefined ? 0 : Number(value);
}

/**
 * Every figure here is computed by Postgres (COUNT / SUM / GROUP BY) —
 * the dashboard used to load all clients, deals, tasks and payments into
 * memory and filter them in JavaScript, which got slower with every row.
 * Now the cost is a handful of aggregate queries regardless of data size.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Deal)
    private readonly dealsRepository: Repository<Deal>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  async getDashboard() {
    const months = lastNMonthKeys(6);

    const [
      clientsTotal,
      stageRows,
      taskCounts,
      upcomingTasks,
      paymentTotals,
      byMethodRows,
      revenueRows,
      topClientRows,
      managerRows,
    ] = await Promise.all([
      this.clientsRepository.count(),
      this.dealsByStage(),
      this.taskCounts(),
      this.upcomingTasks(),
      this.paymentTotals(),
      this.paidByMethod(),
      this.revenueByMonth(`${months[0]}-01`),
      this.topClients(),
      this.managerPerformance(),
    ]);

    // --- deals by stage ---
    const stageMap = new Map(stageRows.map((r) => [r.stage, r]));
    const byStage = DEAL_STAGE_ORDER.map((stage) => ({
      stage,
      count: num(stageMap.get(stage)?.count),
      amount: num(stageMap.get(stage)?.amount),
    }));

    const won = byStage.find((s) => s.stage === DealStage.WON)!;
    const lost = byStage.find((s) => s.stage === DealStage.LOST)!;
    const active = byStage.filter(
      (s) => s.stage !== DealStage.WON && s.stage !== DealStage.LOST,
    );
    const totalCount = byStage.reduce((sum, s) => sum + s.count, 0);
    const activeCount = active.reduce((sum, s) => sum + s.count, 0);
    const activeAmount = active.reduce((sum, s) => sum + s.amount, 0);
    const closedCount = won.count + lost.count;
    const conversionRate =
      closedCount === 0 ? 0 : Math.round((won.count / closedCount) * 1000) / 10;

    // --- revenue by month (last 6 months, paid payments by paidAt) ---
    const revenueMap = new Map(revenueRows.map((r) => [r.month, num(r.amount)]));
    const revenueByMonth = months.map((month) => ({
      month,
      amount: revenueMap.get(month) ?? 0,
    }));

    return {
      clients: { total: clientsTotal },
      deals: {
        totalCount,
        byStage,
        wonAmount: won.amount,
        wonCount: won.count,
        lostCount: lost.count,
        activeAmount,
        activeCount,
        conversionRate,
      },
      tasks: {
        total: num(taskCounts?.total),
        pending: num(taskCounts?.pending),
        done: num(taskCounts?.done),
        overdue: num(taskCounts?.overdue),
        upcoming: upcomingTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          client: t.client
            ? { id: t.client.id, firstName: t.client.firstName, lastName: t.client.lastName }
            : null,
        })),
      },
      payments: {
        totalPaid: num(paymentTotals?.paid),
        totalPending: num(paymentTotals?.pending),
        byMethod: byMethodRows.map((r) => ({ method: r.method, amount: num(r.amount) })),
      },
      revenueByMonth,
      topClients: topClientRows.map((r) => ({
        clientId: r.clientId,
        firstName: r.firstName,
        lastName: r.lastName,
        salonName: r.salonName,
        amount: num(r.amount),
      })),
      managerPerformance: managerRows.map((r) => ({
        managerId: r.managerId,
        firstName: r.firstName,
        lastName: r.lastName,
        dealsWon: num(r.dealsWon),
        revenue: num(r.revenue),
      })),
    };
  }

  private dealsByStage() {
    return this.dealsRepository
      .createQueryBuilder('d')
      .select('d.stage', 'stage')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(d.amount), 0)', 'amount')
      .groupBy('d.stage')
      .getRawMany<{ stage: DealStage; count: string; amount: string }>();
  }

  private taskCounts() {
    return this.tasksRepository
      .createQueryBuilder('t')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE t.status = :pending)', 'pending')
      .addSelect('COUNT(*) FILTER (WHERE t.status = :done)', 'done')
      .addSelect(
        'COUNT(*) FILTER (WHERE t.status = :pending AND t.dueDate < :today)',
        'overdue',
      )
      .setParameters({
        pending: TaskStatus.PENDING,
        done: TaskStatus.DONE,
        today: todayStr(),
      })
      .getRawOne<{ total: string; pending: string; done: string; overdue: string }>();
  }

  // Top 5 pending tasks by soonest due date (undated ones last). Served
  // by the (status, dueDate) index on tasks.
  private upcomingTasks() {
    return this.tasksRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.client', 'c')
      .where('t.status = :pending', { pending: TaskStatus.PENDING })
      .orderBy('t.dueDate', 'ASC', 'NULLS LAST')
      .limit(5)
      .getMany();
  }

  private paymentTotals() {
    return this.paymentsRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount) FILTER (WHERE p.status = :paid), 0)', 'paid')
      .addSelect(
        'COALESCE(SUM(p.amount) FILTER (WHERE p.status = :pending), 0)',
        'pending',
      )
      .setParameters({ paid: PaymentStatus.PAID, pending: PaymentStatus.PENDING })
      .getRawOne<{ paid: string; pending: string }>();
  }

  private paidByMethod() {
    return this.paymentsRepository
      .createQueryBuilder('p')
      .select('p.method', 'method')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.status = :paid', { paid: PaymentStatus.PAID })
      .groupBy('p.method')
      .getRawMany<{ method: string; amount: string }>();
  }

  private revenueByMonth(fromDate: string) {
    return this.paymentsRepository
      .createQueryBuilder('p')
      .select(`to_char(p.paidAt, 'YYYY-MM')`, 'month')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.status = :paid', { paid: PaymentStatus.PAID })
      .andWhere('p.paidAt >= :fromDate', { fromDate })
      .groupBy('month')
      .getRawMany<{ month: string; amount: string }>();
  }

  private topClients() {
    return this.paymentsRepository
      .createQueryBuilder('p')
      .innerJoin('p.deal', 'd')
      .innerJoin('d.client', 'c')
      .select('c.id', 'clientId')
      .addSelect('c.firstName', 'firstName')
      .addSelect('c.lastName', 'lastName')
      .addSelect('c.salonName', 'salonName')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.status = :paid', { paid: PaymentStatus.PAID })
      .groupBy('c.id')
      .orderBy('amount', 'DESC')
      .limit(5)
      .getRawMany<{
        clientId: string;
        firstName: string;
        lastName: string;
        salonName: string | null;
        amount: string;
      }>();
  }

  private managerPerformance() {
    return this.dealsRepository
      .createQueryBuilder('d')
      .innerJoin('d.assignedTo', 'u')
      .select('u.id', 'managerId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('COUNT(*)', 'dealsWon')
      .addSelect('SUM(d.amount)', 'revenue')
      .where('d.stage = :won', { won: DealStage.WON })
      .groupBy('u.id')
      .orderBy('revenue', 'DESC')
      .getRawMany<{
        managerId: string;
        firstName: string;
        lastName: string;
        dealsWon: string;
        revenue: string;
      }>();
  }
}
