import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { Role } from './../src/common/enums/role.enum.js';
import { I18nExceptionFilter } from './../src/common/filters/i18n-exception.filter.js';
import { validationExceptionFactory } from './../src/common/validation-exception.factory.js';
import { User } from './../src/users/entities/user.entity.js';
import { UsersService } from './../src/users/users.service.js';

// Needs the dev Postgres from docker-compose (`npm run db:up`). Each run
// creates its own throwaway users and deletes them afterwards.
describe('App (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;

  const runId = randomUUID().slice(0, 8);
  const password = 'E2eTest-Password1';
  const managerEmail = `e2e-manager-${runId}@test.local`;
  const createdEmails = [managerEmail, `e2e-escalate-${runId}@test.local`];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Same global setup as main.ts, so responses match production.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    app.useGlobalFilters(new I18nExceptionFilter());
    await app.init();

    usersRepository = app.get(getRepositoryToken(User));
    await app.get(UsersService).create({
      email: managerEmail,
      password,
      firstName: 'E2E',
      lastName: 'Manager',
      role: Role.SALES_MANAGER,
    });
  });

  afterAll(async () => {
    if (usersRepository) {
      await usersRepository.delete(createdEmails.map((email) => ({ email })));
    }
    await app?.close();
  });

  it('GET / returns service info', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({ name: 'CRM backend', status: 'running' });
  });

  it('rejects protected routes without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer()).get('/analytics/sales').expect(401);
  });

  it('rejects a wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: managerEmail, password: 'wrong-password' })
      .expect(401);
  });

  describe('as a sales manager', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: managerEmail, password })
        .expect(200);
      token = res.body.accessToken;
    });

    it('can log in and read own profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.email).toBe(managerEmail);
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('cannot create an admin', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: createdEmails[1],
          password,
          firstName: 'Should',
          lastName: 'Fail',
          role: Role.ADMIN,
        })
        .expect(403);

      expect(await usersRepository.findOneBy({ email: createdEmails[1] })).toBeNull();
    });

    it('cannot manage API keys', () => {
      return request(app.getHttpServer())
        .get('/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('gets dashboard aggregates computed in SQL', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.deals.byStage).toHaveLength(6);
      expect(res.body.revenueByMonth).toHaveLength(6);
      expect(typeof res.body.clients.total).toBe('number');
      expect(typeof res.body.payments.totalPaid).toBe('number');
    });

    it('gets sales for one year by month', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/sales?period=month&year=2024')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.year).toBe(2024);
      expect(res.body.points).toHaveLength(12);
      expect(res.body.points[0]).toEqual({
        key: '2024-01',
        revenue: expect.any(Number),
        paymentsCount: expect.any(Number),
        newDealsCount: expect.any(Number),
        newDealsAmount: expect.any(Number),
      });
    });

    it('gets sales by year since 2020', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/sales?period=year')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const currentYear = new Date().getFullYear();
      expect(res.body.years[0]).toBe(2020);
      expect(res.body.years.at(-1)).toBe(currentYear);
      expect(res.body.points.map((p: { key: string }) => p.key)).toEqual(
        res.body.years.map(String),
      );
    });

    it('filters tasks by status and deals by stage on the server', async () => {
      const server = app.getHttpServer();
      const auth = { Authorization: `Bearer ${token}` };

      const done = await request(server).get('/tasks?status=done&limit=100').set(auth).expect(200);
      expect(done.body.data.every((task: { status: string }) => task.status === 'done')).toBe(true);

      const won = await request(server).get('/deals?stage=won&limit=5').set(auth).expect(200);
      expect(won.body.meta.limit).toBe(5);
      expect(won.body.data.every((deal: { stage: string }) => deal.stage === 'won')).toBe(true);

      await request(server).get('/tasks?status=bogus').set(auth).expect(400);
      await request(server).get('/deals?stage=bogus').set(auth).expect(400);
    });

    it('rejects years outside 2020..current', async () => {
      const server = app.getHttpServer();
      const auth = { Authorization: `Bearer ${token}` };
      await request(server).get('/analytics/sales?year=2019').set(auth).expect(400);
      await request(server)
        .get(`/analytics/sales?year=${new Date().getFullYear() + 1}`)
        .set(auth)
        .expect(400);
      await request(server).get('/analytics/sales?period=week').set(auth).expect(400);
    });

    it('loses access as soon as the account is deactivated', async () => {
      await usersRepository.update({ email: managerEmail }, { isActive: false });
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
