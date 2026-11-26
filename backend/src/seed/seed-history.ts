/**
 * Adds several years of sales history (deals + paid payments, Jan 2020 up
 * to today) on top of the demo dataset, so the dashboard's sales chart has
 * something meaningful to show per month and per year.
 *
 * The numbers are synthetic but shaped like a beauty-equipment supplier:
 *   - steady growth year over year;
 *   - peaks before 8 March and before New Year, a dip in summer;
 *   - spring 2020 lockdown, when salons were closed.
 * A fixed PRNG seed makes every run produce exactly the same data.
 *
 * Safe to re-run: every row it creates carries HISTORY_MARKER in `notes`,
 * and those rows are deleted first. `seed:demo` wipes all deals, so run
 * this after it.
 *
 * Usage: npm run seed:history --workspace=backend
 */
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { SALES_START_YEAR } from '../analytics/dto/sales-query.dto.js';
import { Client } from '../clients/entities/client.entity.js';
import { DealStage } from '../common/enums/deal-stage.enum.js';
import { PaymentMethod } from '../common/enums/payment-method.enum.js';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { Deal } from '../deals/entities/deal.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';
import { User } from '../users/entities/user.entity.js';

const HISTORY_MARKER = '[demo-history]';

// mulberry32 — tiny deterministic PRNG, so the history is reproducible.
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20200101);
const between = (min: number, max: number) => min + random() * (max - min);
const pickOne = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

// Jan…Dec: 8 March and New Year peaks, summer dip.
const SEASONALITY = [0.8, 1.05, 1.4, 1.1, 1.0, 0.85, 0.7, 0.75, 1.05, 1.15, 1.3, 1.5];

const CATALOG: { title: string; min: number; max: number }[] = [
  { title: 'Апарат для лазерної епіляції', min: 120000, max: 260000 },
  { title: 'Апарат для мікрострумової терапії', min: 45000, max: 90000 },
  { title: 'RF-ліфтинг апарат', min: 70000, max: 160000 },
  { title: 'Косметологічне крісло', min: 25000, max: 60000 },
  { title: 'Апарат для мезотерапії', min: 55000, max: 120000 },
  { title: 'Професійна косметика для обличчя — партія', min: 8000, max: 35000 },
  { title: 'Сироватки та пілінги — поповнення складу', min: 6000, max: 22000 },
  { title: 'Витратні матеріали для манікюру', min: 4000, max: 15000 },
  { title: 'LED-лампи та інструменти', min: 9000, max: 28000 },
];

const METHODS = [PaymentMethod.BANK_TRANSFER, PaymentMethod.BANK_TRANSFER, PaymentMethod.CARD, PaymentMethod.CASH];
const OPEN_STAGES = [DealStage.NEW, DealStage.CONTACTED, DealStage.PROPOSAL, DealStage.NEGOTIATION];

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const dataSource = app.get<DataSource>(getDataSourceToken());

  const clients = await dataSource.getRepository(Client).find();
  const users = await dataSource.getRepository(User).find({ where: { isActive: true } });
  const admin = users.find((u) => u.role === Role.ADMIN);
  const managers = users.filter((u) => u.role === Role.SALES_MANAGER);
  if (clients.length === 0 || !admin) {
    // eslint-disable-next-line no-console
    console.error('Немає клієнтів або адміна — спочатку запусти `npm run seed:admin` і `npm run seed:demo`.');
    await app.close();
    process.exit(1);
  }
  const owners = managers.length > 0 ? managers : [admin];

  // eslint-disable-next-line no-console
  console.log('Прибираю попередню історію…');
  await dataSource.query('DELETE FROM payments WHERE notes = $1', [HISTORY_MARKER]);
  await dataSource.query('DELETE FROM deals WHERE notes = $1', [HISTORY_MARKER]);

  const today = new Date();
  let dealsCreated = 0;
  let paymentsCreated = 0;

  await dataSource.transaction(async (manager) => {
    const dealRepo = manager.getRepository(Deal);
    const paymentRepo = manager.getRepository(Payment);

    for (let year = SALES_START_YEAR; year <= today.getFullYear(); year++) {
      const growth = 1.18 ** (year - SALES_START_YEAR);
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        if (monthStart > today) break;

        const lockdown = year === 2020 && (month === 3 || month === 4) ? 0.3 : 1;
        const demand = SEASONALITY[month] * lockdown;
        const wonCount = Math.max(1, Math.round(between(2.5, 4.5) * demand * growth ** 0.6));
        const otherCount = Math.round(wonCount * between(0.4, 0.8));
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lastDay = year === today.getFullYear() && month === today.getMonth() ? today.getDate() : daysInMonth;

        for (let i = 0; i < wonCount + otherCount; i++) {
          const isWon = i < wonCount;
          const product = pickOne(CATALOG);
          const amount = Math.round((between(product.min, product.max) * growth ** 0.4) / 100) * 100;
          const day = 1 + Math.floor(random() * lastDay);
          const eventDate = new Date(year, month, day, 10 + Math.floor(random() * 8));

          // A won deal was opened some days before it was paid; other
          // deals are dated by when they were opened.
          const createdAt = isWon
            ? new Date(eventDate.getTime() - between(5, 40) * 86_400_000)
            : eventDate;
          const monthsAgo = (today.getFullYear() - year) * 12 + (today.getMonth() - month);
          const stage = isWon ? DealStage.WON : monthsAgo <= 2 ? pickOne(OPEN_STAGES) : DealStage.LOST;

          const deal = await dealRepo.save(
            dealRepo.create({
              title: product.title,
              amount,
              stage,
              clientId: pickOne(clients).id,
              assignedToId: pickOne(owners).id,
              createdById: admin.id,
              notes: HISTORY_MARKER,
            }),
          );
          // @CreateDateColumn always stamps "now" on insert — backdate it.
          await manager.query('UPDATE deals SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2', [
            createdAt,
            deal.id,
          ]);
          dealsCreated++;

          if (isWon) {
            const payment = await paymentRepo.save(
              paymentRepo.create({
                dealId: deal.id,
                amount,
                method: pickOne(METHODS),
                status: PaymentStatus.PAID,
                paidAt: isoDate(eventDate),
                createdById: admin.id,
                notes: HISTORY_MARKER,
              }),
            );
            await manager.query('UPDATE payments SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2', [
              eventDate,
              payment.id,
            ]);
            paymentsCreated++;
          }
        }
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log(
    `Готово: ${dealsCreated} угод і ${paymentsCreated} оплат за ${SALES_START_YEAR}–${today.getFullYear()}.`,
  );
  await app.close();
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Не вдалося створити історію продажів:', error);
  process.exit(1);
});
