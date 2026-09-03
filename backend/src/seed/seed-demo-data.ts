/**
 * Resets the dev database to a clean, realistic demo dataset — sales
 * managers, beauty-salon clients, deals across every pipeline stage,
 * follow-up tasks, and payments. Safe to re-run: it wipes any existing
 * clients/deals/tasks/payments and non-admin users first, so it always
 * ends up in the same state rather than piling up duplicates.
 *
 * Usage: npm run seed:demo --workspace=backend
 * Requires an admin account to already exist (see seed:admin).
 */
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { DealsService } from '../deals/deals.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { DealStage } from '../common/enums/deal-stage.enum.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { PaymentMethod } from '../common/enums/payment-method.enum.js';
import { PaymentStatus } from '../common/enums/payment-status.enum.js';

function daysFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const usersService = app.get(UsersService);
  const clientsService = app.get(ClientsService);
  const dealsService = app.get(DealsService);
  const tasksService = app.get(TasksService);
  const paymentsService = app.get(PaymentsService);
  const dataSource = app.get<DataSource>(getDataSourceToken());

  const admin = await usersService.findByEmail(
    process.env.SEED_ADMIN_EMAIL ?? 'admin@beautycrm.local',
  );
  if (!admin) {
    // eslint-disable-next-line no-console
    console.error('Адмін не знайдений — спочатку запусти `npm run seed:admin`.');
    await app.close();
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('Очищую попередні тестові дані…');
  // FK-safe order: children before parents. TRUNCATE ... CASCADE would
  // also work, but explicit DELETE keeps this readable and doesn't
  // depend on every FK actually being set up with a cascade.
  await dataSource.query('DELETE FROM payments');
  await dataSource.query('DELETE FROM tasks');
  await dataSource.query('DELETE FROM deals');
  await dataSource.query('DELETE FROM clients');
  // role::text avoids "operator does not exist: role_enum = text" — a
  // parameterized query's placeholder defaults to the text type, and
  // Postgres won't implicitly cast an enum column to compare against it.
  await dataSource.query('DELETE FROM users WHERE role::text != $1', [Role.ADMIN]);

  // eslint-disable-next-line no-console
  console.log('Створюю менеджерів з продажу…');
  const managerSeeds = [
    { email: 'olena.kovalchuk@beautycrm.local', firstName: 'Олена', lastName: 'Ковальчук' },
    { email: 'maria.bondarenko@beautycrm.local', firstName: 'Марія', lastName: 'Бондаренко' },
  ];
  const managers = [];
  for (const m of managerSeeds) {
    const user = await usersService.create({
      email: m.email,
      password: 'Manager123!',
      firstName: m.firstName,
      lastName: m.lastName,
      role: Role.SALES_MANAGER,
    });
    managers.push(user);
  }
  const [olena, maria] = managers;
  const owners = [admin.id, olena.id, maria.id];
  const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

  // eslint-disable-next-line no-console
  console.log('Створюю клієнтів…');
  const clientSeeds = [
    {
      firstName: 'Ольга',
      lastName: 'Іванова',
      phone: '+380501234567',
      email: 'olga@beautystudio.ua',
      salonName: 'Beauty Studio Ольга',
      position: 'Власниця',
      address: 'м. Київ, вул. Хрещатик, 22',
      notes: 'Постійна клієнтка, цікавиться апаратною косметологією.',
    },
    {
      firstName: 'Наталя',
      lastName: 'Петренко',
      phone: '+380631234567',
      email: 'natalia@salon-test.ua',
      salonName: 'Elegance Beauty Bar',
      position: 'Адміністратор',
      address: 'м. Одеса, вул. Дерибасівська, 10',
      notes: 'Цікавиться косметикою для нігтьового сервісу.',
    },
    {
      firstName: 'Марина',
      lastName: 'Ковальчук',
      phone: '+380671112233',
      email: 'marina@glamourhouse.ua',
      salonName: 'Glamour House',
      position: 'Власниця',
      address: 'м. Львів, пр. Свободи, 5',
      notes: 'Планує відкриття другої точки, потрібне повне обладнання.',
    },
    {
      firstName: 'Тетяна',
      lastName: 'Сидоренко',
      phone: '+380442223344',
      email: 'tetiana@skincarepro.ua',
      salonName: 'SkinCare Pro',
      position: 'Менеджер',
      address: 'м. Харків, вул. Сумська, 45',
      notes: 'Замовляє косметику щомісяця, гарний платник.',
    },
    {
      firstName: 'Ірина',
      lastName: 'Мельник',
      phone: '+380973334455',
      email: 'iryna@nailartstudio.ua',
      salonName: 'Nail Art Studio',
      position: 'Майстер',
      address: 'м. Дніпро, пр. Яворницького, 60',
      notes: null,
    },
    {
      firstName: 'Христина',
      lastName: 'Романюк',
      phone: '+380504445566',
      email: 'khrystyna@wellnessbeauty.ua',
      salonName: 'Wellness & Beauty',
      position: 'Власниця',
      address: 'м. Івано-Франківськ, вул. Незалежності, 12',
      notes: 'Цікавиться SPA-обладнанням преміум-класу.',
    },
    {
      firstName: 'Юлія',
      lastName: 'Ткаченко',
      phone: '+380635556677',
      email: 'yulia@perfectlook.ua',
      salonName: 'Perfect Look',
      position: 'Адміністратор',
      address: 'м. Вінниця, вул. Соборна, 30',
      notes: 'Новий контакт з виставки Beauty Expo.',
    },
  ];

  const clients = [];
  for (let i = 0; i < clientSeeds.length; i++) {
    const seed = clientSeeds[i];
    const owner = pick(owners, i);
    const client = await clientsService.create(
      {
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        email: seed.email,
        salonName: seed.salonName,
        position: seed.position,
        address: seed.address,
        notes: seed.notes ?? undefined,
        assignedToId: owner,
      },
      admin.id,
    );
    clients.push(client);
  }
  const [olga, natalia, marina, tetiana, iryna, khrystyna, yulia] = clients;

  // eslint-disable-next-line no-console
  console.log('Створюю угоди…');
  const dealSeeds = [
    { title: 'Апарат для лазерної епіляції', amount: 145000, stage: DealStage.WON, client: olga },
    { title: 'Косметика для нігтьового сервісу — оптова партія', amount: 23500, stage: DealStage.WON, client: natalia },
    { title: 'Комплект обладнання для другої точки', amount: 320000, stage: DealStage.NEGOTIATION, client: marina },
    { title: 'Щомісячне поповнення косметики', amount: 18700, stage: DealStage.PROPOSAL, client: tetiana },
    { title: 'LED-лампа та інструменти для манікюру', amount: 15400, stage: DealStage.CONTACTED, client: iryna },
    { title: 'SPA-капсула преміум-класу', amount: 480000, stage: DealStage.NEW, client: khrystyna },
    { title: 'Стартовий набір для нового салону', amount: 89000, stage: DealStage.NEW, client: yulia },
    { title: 'Апарат для мезотерапії', amount: 210000, stage: DealStage.LOST, client: marina },
    { title: 'Косметика для обличчя — пробна партія', amount: 9800, stage: DealStage.WON, client: tetiana },
  ];

  const deals = [];
  for (let i = 0; i < dealSeeds.length; i++) {
    const seed = dealSeeds[i];
    const owner = pick(owners, i + 1);
    const deal = await dealsService.create(
      {
        title: seed.title,
        amount: seed.amount,
        stage: seed.stage,
        clientId: seed.client.id,
        assignedToId: owner,
      },
      admin.id,
    );
    deals.push(deal);
  }
  const [
    laserDeal,
    nailCosmeticsDeal,
    secondLocationDeal,
    monthlyRestockDeal,
    ledLampDeal,
    spaCapsuleDeal,
    starterKitDeal,
    mesoDeal,
    faceCosmeticsDeal,
  ] = deals;

  // eslint-disable-next-line no-console
  console.log('Створюю задачі…');
  const taskSeeds = [
    {
      title: 'Зателефонувати щодо комерційної пропозиції',
      description: 'Уточнити, чи розглянули умови оплати частинами.',
      dueDate: daysFromToday(-2),
      status: TaskStatus.PENDING,
      client: tetiana,
      deal: monthlyRestockDeal,
    },
    {
      title: 'Надіслати каталог нового обладнання',
      description: null,
      dueDate: daysFromToday(-1),
      status: TaskStatus.PENDING,
      client: khrystyna,
      deal: spaCapsuleDeal,
    },
    {
      title: 'Провести демонстрацію апарату для лазерної епіляції',
      description: 'Взяти демо-апарат зі складу.',
      dueDate: daysFromToday(1),
      status: TaskStatus.PENDING,
      client: olga,
      deal: laserDeal,
    },
    {
      title: 'Узгодити фінальні умови поставки',
      description: 'Обговорити терміни монтажу обладнання.',
      dueDate: daysFromToday(3),
      status: TaskStatus.PENDING,
      client: marina,
      deal: secondLocationDeal,
    },
    {
      title: 'Підготувати рахунок на оплату',
      description: null,
      dueDate: daysFromToday(2),
      status: TaskStatus.PENDING,
      client: yulia,
      deal: starterKitDeal,
    },
    {
      title: 'Нагадати про подовження контракту на косметику',
      description: null,
      dueDate: daysFromToday(7),
      status: TaskStatus.PENDING,
      client: null,
      deal: null,
    },
    {
      title: 'Оновити базу контактів після виставки Beauty Expo',
      description: 'Внести нові контакти в CRM.',
      dueDate: daysFromToday(5),
      status: TaskStatus.PENDING,
      client: null,
      deal: null,
    },
    {
      title: 'Підтвердити отримання оплати',
      description: null,
      dueDate: daysFromToday(-5),
      status: TaskStatus.DONE,
      client: natalia,
      deal: nailCosmeticsDeal,
    },
    {
      title: 'Надіслати подяку за покупку',
      description: null,
      dueDate: daysFromToday(-3),
      status: TaskStatus.DONE,
      client: olga,
      deal: laserDeal,
    },
    {
      title: "Зв'язатися щодо повторного замовлення нігтьової косметики",
      description: null,
      dueDate: daysFromToday(-4),
      status: TaskStatus.DONE,
      client: iryna,
      deal: ledLampDeal,
    },
  ];

  for (let i = 0; i < taskSeeds.length; i++) {
    const seed = taskSeeds[i];
    const owner = pick(owners, i);
    const task = await tasksService.create(
      {
        title: seed.title,
        description: seed.description ?? undefined,
        dueDate: seed.dueDate,
        clientId: seed.client?.id,
        dealId: seed.deal?.id,
        assignedToId: owner,
      },
      admin.id,
    );
    if (seed.status === TaskStatus.DONE) {
      await tasksService.update(task.id, { status: TaskStatus.DONE });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Створюю платежі…');
  const paymentSeeds = [
    {
      deal: laserDeal,
      amount: 145000,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PAID,
      paidAt: daysFromToday(-10),
    },
    {
      deal: nailCosmeticsDeal,
      amount: 23500,
      method: PaymentMethod.CARD,
      status: PaymentStatus.PAID,
      paidAt: daysFromToday(-6),
    },
    {
      deal: faceCosmeticsDeal,
      amount: 9800,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      paidAt: daysFromToday(-15),
    },
    {
      deal: secondLocationDeal,
      amount: 160000,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PAID,
      paidAt: daysFromToday(-2),
      notes: 'Передоплата 50% за договором.',
    },
    {
      deal: secondLocationDeal,
      amount: 160000,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      notes: 'Друга частина оплати — після монтажу.',
    },
    {
      deal: monthlyRestockDeal,
      amount: 18700,
      method: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
    },
    {
      deal: starterKitDeal,
      amount: 89000,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
    },
    {
      deal: mesoDeal,
      amount: 50000,
      method: PaymentMethod.CARD,
      status: PaymentStatus.CANCELLED,
      notes: 'Клієнт відмовився від угоди.',
    },
  ];

  for (const seed of paymentSeeds) {
    await paymentsService.create(
      {
        dealId: seed.deal.id,
        amount: seed.amount,
        method: seed.method,
        status: seed.status,
        paidAt: seed.paidAt,
        notes: seed.notes,
      },
      admin.id,
    );
  }

  // eslint-disable-next-line no-console
  console.log('Готово!');
  // eslint-disable-next-line no-console
  console.log(`Менеджери: ${managerSeeds.map((m) => m.email).join(', ')} / пароль Manager123!`);
  // eslint-disable-next-line no-console
  console.log(
    `Створено: ${clients.length} клієнтів, ${deals.length} угод, ${taskSeeds.length} задач, ${paymentSeeds.length} платежів.`,
  );

  await app.close();
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Не вдалося заповнити демо-дані:', error);
  process.exit(1);
});
